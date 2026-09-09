import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import {
  DEFAULT_ICON,
  DEFAULT_ICON_TYPE,
  DEFAULT_ICON_COLOR
} from '@/lib/types/icon'
import {
  Goal,
  GoalWithRelations,
  CreateGoalInput,
  UpdateGoalInput,
  toGoal,
} from '@/lib/types/goals'
import { calculateGoalRewards } from '@/lib/utils/goals'
import type { SkillSummary } from '@/lib/types/skills'
import type { CharacterSummary } from '@/lib/types/character'

// =============================================
// INTERNAL DATABASE TYPES
// =============================================

type GoalRow    = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalUpdate = Database['public']['Tables']['goals']['Update']

// Raw shape returned by Supabase when junction joins are included.
// Not exported — components always receive the clean GoalWithRelations shape.
type GoalRowWithRelations = GoalRow & {
  goal_skills: {
    skills: {
      id: string;
      title: string;
      icon: unknown;
      level: number
    } | null
  }[]
  goal_characters: {
    characters: {
      id: string
      title: string
      icon: unknown
      color_theme: string
    } | null
  }[]
}

// ===========================================
// RESULT TYPE
// ===========================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ===========================================
// SELECT STRINGS
// Centralised so every fetch function stays in sync if the schema changes.
// ===========================================

const GOAL_WITH_RELATIONS_SELECT = `
  *,
  goal_skills(
    skills(id, title, icon, level)
  ),
  goal_characters(
    characters(id, title, icon, color_theme)
  )
` as const

// ==============================================
// MAPPER
// Converts a raw Supabase join row → clean GoalWithRelations.
// Strips nulls from junction rows caused by deleted related records.
// ==============================================

function mapRowToGoalWithRelations(row: GoalRowWithRelations): GoalWithRelations {
  const base = toGoal(row)

  const skills = (row.goal_skills ?? [])
    .filter((gs) => gs.skills !== null)
    .map((gs) => gs.skills as SkillSummary)

  const characters = (row.goal_characters ?? [])
    .filter((gc) => gc.characters !== null)
    .map((gc) => gc.characters as unknown as CharacterSummary)

  return {
    ...base,
    skills,
    characters,
  }
}

// ====================================================
// JUNCTION TABLE HELPERS
// All junction writes use the delete-then-insert pattern — no diffing,
// safe because junction rows carry no data beyond the foreign keys.
// goal_skills / goal_characters carry user_id directly (unlike the habit_*
// and task_* junctions), so it must be passed in on every insert.
// =====================================================

async function syncGoalSkills(
  supabase: ReturnType<typeof createClient>,
  user_id: string,
  goal_id: string,
  skill_ids: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('goal_skills')
    .delete()
    .eq('goal_id', goal_id)

  if (deleteError) throw new Error(`Failed to clear goal skills: ${deleteError.message}`)
  if (skill_ids.length === 0) return

  const rows = skill_ids.map((skill_id) => ({ goal_id, skill_id, user_id }))
  const { error: insertError } = await supabase
    .from('goal_skills')
    .insert(rows)
  if (insertError) throw new Error(`Failed to link skills: ${insertError.message}`)
}

async function syncGoalCharacters(
  supabase: ReturnType<typeof createClient>,
  user_id: string,
  goal_id: string,
  character_ids: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('goal_characters')
    .delete()
    .eq('goal_id', goal_id)

  if (deleteError) throw new Error(`Failed to clear goal characters: ${deleteError.message}`)
  if (character_ids.length === 0) return

  const rows = character_ids.map((character_id) => ({ goal_id, character_id, user_id }))
  const { error: insertError } = await supabase
    .from('goal_characters')
    .insert(rows)
  if (insertError) throw new Error(`Failed to link characters: ${insertError.message}`)
}

// =======================================
// DATABASE FUNCTIONS
// =======================================

// =======================================
// FETCH ALL GOALS
// =======================================
/**
 * Fetches all goals for the authenticated user with linked Skills and
 * Characters hydrated.
 */
export async function fetchGoals(): Promise<ActionResult<GoalWithRelations[]>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) return {
      success: false,
      error: 'Not authenticated'
    }

    const { data, error } = await supabase
      .from('goals')
      .select(GOAL_WITH_RELATIONS_SELECT)
      .eq('user_id', user.id)
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) return {
      success: false,
      error: error.message
    }

    const goals = (data as GoalRowWithRelations[]).map(mapRowToGoalWithRelations)
    return {
      success: true,
      data: goals
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error fetching goals'
    return { success: false, error: message }
  }
}

// =======================================
// FETCH A SINGLE GOAL
// =======================================
/**
 * Returns a single goal by ID with all relations hydrated.
 */
export async function fetchGoalById(
  id: string
): Promise<ActionResult<GoalWithRelations>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) return {
      success: false,
      error: 'Not authenticated'
    }

    const { data, error } = await supabase
      .from('goals')
      .select(GOAL_WITH_RELATIONS_SELECT)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'Goal not found' }

    return {
      success: true,
      data: mapRowToGoalWithRelations(data as GoalRowWithRelations)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error fetching goal'
    return { success: false, error: message }
  }
}

// =======================================
// CREATE A NEW GOAL
// =======================================
/**
 * Creates a new goal and links it to the provided skills and characters.
 * Rewards default to algorithm output when use_custom_xp is false or omitted.
 *
 * Validation enforced here:
 * - At least 1 and at most 3 skill IDs
 * - At least 1 and at most 3 character IDs
 */
export async function createGoal(
  input: CreateGoalInput
): Promise<ActionResult<GoalWithRelations>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) return {
      success: false,
      error: 'Not authenticated'
    }

    // ── Application-layer guards ──────────────────────────────────────────
    const skillIds = input.skill_ids ?? []
    const characterIds = input.character_ids ?? []

    if (skillIds.length > 3) {
      return {
        success: false,
        error: 'A goal cannot be assigned to more than 3 skills.' }
    }
    if (characterIds.length > 3) {
      return {
        success: false,
        error: 'A goal cannot be assigned to more than 3 characters.' }
    }

    // ── Reward defaults ───────────────────────────────────────────────────
    const useCustom = input.use_custom_xp ?? false
    let characterXp = input.character_xp ?? 0
    let skillXp     = input.skill_xp ?? 0
    let goldReward  = input.gold_reward ?? 0

    if (!useCustom) {
      const rewards = calculateGoalRewards(input.difficulty, skillIds.length)
      characterXp = rewards.character_xp
      skillXp     = rewards.skill_xp
      goldReward  = rewards.gold
    }

    // ── Build the insert row ───────────────────
    const goalInsert: GoalInsert = {
      user_id:      user.id,
      title:        input.title,
      description:  input.description ?? null,
      icon: {
            type:   input.icon_type || DEFAULT_ICON_TYPE,
            value:  input.icon || DEFAULT_ICON,
            color:  input.icon_color || DEFAULT_ICON_COLOR,
          },
      status:       'backlog',
      difficulty:   input.difficulty,
      start_date:   input.start_date ?? null,
      due_date:     input.due_date ?? null,
      use_custom_xp:   useCustom,
      use_custom_gold: useCustom,
      gold_reward:  goldReward,
      character_xp: characterXp,
      skill_xp:     skillXp,
    }

    const { data: goal, error: insertError } = await supabase
      .from('goals')
      .insert(goalInsert)
      .select()
      .single()

    if (insertError || !goal) {
      return {
        success: false,
        error: insertError?.message ?? 'Failed to create new goal' }
    }

    // ── Junction table writes ─────────────────────────────────────────────
    try {
      await syncGoalSkills(supabase, user.id, goal.id, skillIds)
      await syncGoalCharacters(supabase, user.id, goal.id, characterIds)
    } catch (linkError) {
      // Rollback: delete the goal if linking fails
      await supabase.from('goals').delete().eq('id', goal.id)
      throw linkError
    }

    const result = await fetchGoalById(goal.id)
    if (!result.success) return result

    return { success: true, data: result.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error creating goal'
    return { success: false, error: message }
  }
}

// =======================================
// UPDATE A GOAL
// =======================================
/**
 * Updates goal fields and/or replaces junction table links.
 * Only fields present on UpdateGoalInput are written — omitted fields are
 * left unchanged. Junction tables use full-replacement delete-then-insert
 * when the corresponding _ids array is provided; omitting an _ids array
 * leaves those links untouched.
 */
export async function updateGoal(
  input: UpdateGoalInput
): Promise<ActionResult<GoalWithRelations>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) return {
      success: false,
      error: 'Not authenticated'
    }

    const { data: existing, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', input.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return {
        success: false,
        error: fetchError?.message ?? 'Goal not found' }
    }

    // ── Skill count for reward recalc ─────────────────────────────────────
    let currentSkillCount = 1

    if (input.skill_ids !== undefined) {
      if (input.skill_ids.length > 3) {
        return {
          success: false,
          error: 'A goal cannot be assigned to more than 3 skills.' }
      }
      currentSkillCount = input.skill_ids.length
    } else {
      const { count } = await supabase
        .from('goal_skills')
        .select('*', { count: 'exact', head: true })
        .eq('goal_id', input.id)
      currentSkillCount = count ?? 1
    }

    if (input.character_ids !== undefined) {
      if (input.character_ids.length > 3) {
        return {
          success: false,
          error: 'A goal cannot be assigned to more than 3 characters.' }
      }
    }

    // ── Build the update payload ───────────────
    const goalUpdate: GoalUpdate = {}

    if (input.title       !== undefined) goalUpdate.title       = input.title
    if (input.description !== undefined) goalUpdate.description = input.description ?? null
    if (input.icon        !== undefined) goalUpdate.icon        = input.icon as unknown as GoalUpdate['icon']
    if (input.status      !== undefined) goalUpdate.status      = input.status
    if (input.difficulty  !== undefined) goalUpdate.difficulty  = input.difficulty
    if (input.start_date  !== undefined) goalUpdate.start_date  = input.start_date
    if (input.due_date    !== undefined) goalUpdate.due_date    = input.due_date
    if (input.use_custom_xp !== undefined) goalUpdate.use_custom_xp = input.use_custom_xp

    // ── Recalculate rewards if reward-affecting fields changed ────────────
    const effectiveUseCustom = input.use_custom_xp ?? existing.use_custom_xp
    const rewardAffectingChanged =
      input.difficulty    !== undefined ||
      input.use_custom_xp !== undefined

    if (rewardAffectingChanged && !effectiveUseCustom) {
      const rewards = calculateGoalRewards(
        input.difficulty ?? (existing.difficulty as Goal['difficulty']),
        currentSkillCount
      )
      goalUpdate.gold_reward  = rewards.gold
      goalUpdate.character_xp = rewards.character_xp
      goalUpdate.skill_xp     = rewards.skill_xp
    }

    // Honour explicit custom reward overrides regardless of recalc
    if (input.gold_reward  !== undefined) goalUpdate.gold_reward  = input.gold_reward
    if (input.character_xp !== undefined) goalUpdate.character_xp = input.character_xp ?? undefined
    if (input.skill_xp     !== undefined) goalUpdate.skill_xp     = input.skill_xp ?? undefined

    // ── Write the goal row if there is anything to update ────────────────
    if (Object.keys(goalUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('goals')
        .update(goalUpdate)
        .eq('id', input.id)
        .eq('user_id', user.id)

      if (updateError) return {
        success: false,
        error: updateError.message }
    }

    // ── Sync junction tables (only when caller passed new IDs) ────────────
    if (input.skill_ids     !== undefined) await syncGoalSkills(supabase, user.id, input.id, input.skill_ids)
    if (input.character_ids !== undefined) await syncGoalCharacters(supabase, user.id, input.id, input.character_ids)

    const result = await fetchGoalById(input.id)
    if (!result.success) return result

    return { success: true, data: result.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error updating goal'
    return { success: false, error: message }
  }
}

// ===========================================
// DELETE
// ===========================================
/**
 * Permanently deletes a goal. Junction rows are removed automatically by
 * ON DELETE CASCADE.
 */
export async function deleteGoal(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) return {
      success: false,
      error: 'Not authenticated'
    }

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return {
      success: false,
      error: error.message
    }

    return {
      success: true,
      data: { id }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error deleting goal'
    return { success: false, error: message }
  }
}
