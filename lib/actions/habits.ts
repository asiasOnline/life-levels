import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR  
 } from '@/lib/types/icon'
import {
  Habit,
  HabitWithRelations,
  CreateHabitInput,
  UpdateHabitInput,
  ArchiveHabitInput,
  HabitCustomRecurrenceConfig,
  toHabit,
} from '@/lib/types/habits'
import {
  calculateHabitRewards,
  calculateHabitEnergyCost,
  calculateHabitResilienceAward,
} from '@/lib/utils/habits'
import type { SkillSummary } from '@/lib/types/skills'
import type { CharacterSummary } from '@/lib/types/character'

// =============================================
// INTERNAL DATABASE TYPES
// =============================================

type HabitRow    = Database['public']['Tables']['habits']['Row']
type HabitInsert = Database['public']['Tables']['habits']['Insert']
type HabitUpdate = Database['public']['Tables']['habits']['Update']

// Raw shape returned by Supabase when junction joins are included.
// Not exported — components always receive the clean HabitWithRelations shape.
type HabitRowWithRelations = HabitRow & {
  habit_skills: {
    skills: { 
      id: string; 
      title: string; 
      icon: unknown; 
      level: number 
    } | null
  }[]
  habit_characters: {
    characters: {
      id: string
      title: string
      icon: unknown
      color_theme: string
    } | null
  }[]
  habit_goals: { 
    goal_id: string 
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

const HABIT_WITH_RELATIONS_SELECT = `
  *,
  habit_skills(
    skills(id, title, icon, level)
  ),
  habit_characters(
    characters(id, title, icon, color_theme)
  ),
  habit_goals(goal_id)
` as const

// ==============================================
// MAPPER
// Converts a raw Supabase join row → clean HabitWithRelations.
// Strips nulls from junction rows caused by deleted related records.
// ==============================================

function mapRowToHabitWithRelations(row: HabitRowWithRelations): HabitWithRelations {
  const base = toHabit(row)

  const skills = (row.habit_skills ?? [])
    .filter((hs) => hs.skills !== null)
    .map((hs) => hs.skills as SkillSummary)

  const characters = (row.habit_characters ?? [])
    .filter((hc) => hc.characters !== null)
    .map((hc) => hc.characters as unknown as CharacterSummary)

  const goal_ids = (row.habit_goals ?? []).map((hg) => hg.goal_id)

  return {
    ...base,
    skills,
    characters,
    goal_ids: goal_ids.length > 0 ? goal_ids : undefined,
  }
}

// ====================================================
// JUNCTION TABLE HELPERS
// All junction writes use the delete-then-insert pattern — no diffing,
// safe because junction rows carry no data beyond the foreign keys.
// =====================================================

async function syncHabitSkills(
  supabase: ReturnType<typeof createClient>,
  habitId: string,
  skillIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('habit_skills')
    .delete()
    .eq('habit_id', habitId)

  if (deleteError) throw new Error(`Failed to clear habit skills: ${deleteError.message}`)
  if (skillIds.length === 0) return

  const rows = skillIds.map((skill_id) => ({ habit_id: habitId, skill_id }))
  const { error: insertError } = await supabase.from('habit_skills').insert(rows)
  if (insertError) throw new Error(`Failed to link skills: ${insertError.message}`)
}

async function syncHabitCharacters(
  supabase: ReturnType<typeof createClient>,
  habitId: string,
  characterIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('habit_characters')
    .delete()
    .eq('habit_id', habitId)

  if (deleteError) throw new Error(`Failed to clear habit characters: ${deleteError.message}`)
  if (characterIds.length === 0) return

  const rows = characterIds.map((character_id) => ({ habit_id: habitId, character_id }))
  const { error: insertError } = await supabase.from('habit_characters').insert(rows)
  if (insertError) throw new Error(`Failed to link characters: ${insertError.message}`)
}

async function syncHabitGoals(
  supabase: ReturnType<typeof createClient>,
  habitId: string,
  goalIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('habit_goals')
    .delete()
    .eq('habit_id', habitId)

  if (deleteError) throw new Error(`Failed to clear habit goals: ${deleteError.message}`)
  if (goalIds.length === 0) return

  const rows = goalIds.map((goal_id) => ({ habit_id: habitId, goal_id }))
  const { error: insertError } = await supabase.from('habit_goals').insert(rows)
  if (insertError) throw new Error(`Failed to link goals: ${insertError.message}`)
}


// =======================================
// DATABASE FUNCTIONS
// =======================================
/**
 * FETCH ALL HABITS
 * Fetches all habits for the authenticated user with linked Skills and Characters hydrated. Active habits are returned first, then paused, then archived.
 */
export async function fetchHabits(): Promise<ActionResult<HabitWithRelations[]>> {
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
      .from('habits')
      .select(HABIT_WITH_RELATIONS_SELECT)
      .eq('user_id', user.id)
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) return { 
      success: false, 
      error: error.message 
    }

    const habits = (data as HabitRowWithRelations[]).map(mapRowToHabitWithRelations)
    return { 
      success: true, 
      data: habits }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error fetching habits'
    return { success: false, error: message }
  }
}

/**
 * FETCH A SINGLE HABIT
 * Returns a single habit by ID with all relations hydrated.
 */
export async function fetchHabitById(
  id: string
): Promise<ActionResult<HabitWithRelations>> {
  try {
    const supabase = createClient()

    const { 
      data: { user }, 
      error: authError 
    } = await supabase.auth.getUser()
    
    if (authError || !user) 
        return { 
        success: false, 
        error: 'Not authenticated' 
      }

    const { data, error } = await supabase
      .from('habits')
      .select(HABIT_WITH_RELATIONS_SELECT)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'Habit not found' }

    return { 
      success: true, 
      data: mapRowToHabitWithRelations(data as HabitRowWithRelations) 
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error fetching habit'
    return { success: false, error: message }
  }
}

/**
 * CREATE A NEW HABIT
 * Creates a new habit and links it to the provided skills, characters,
 * and optionally goals. Rewards default to algorithm output when
 * use_custom_xp is false or omitted.
 *
 * Validation enforced here (in addition to DB constraints):
 * - At least 1 and at most 3 skill IDs
 * - At least 1 character ID
 */
export async function createHabit(
  input: CreateHabitInput
): Promise<ActionResult<HabitWithRelations>> {
  try {
    const supabase = createClient()

    const { 
      data: { user }, 
      error: authError 
    } = await supabase.auth.getUser()
    
    if (authError || !user) return { success: false, error: 'Not authenticated' }

    // ── Application-layer guards ──────────────────────────────────────────
    if (!input.skill_ids || input.skill_ids.length === 0) {
      return { 
        success: false, 
        error: 'At least one skill must be assigned.' }
    }
    if (input.skill_ids.length > 3) {
      return { 
        success: false, 
        error: 'A habit cannot be assigned to more than 3 skills.' }
    }
    if (!input.character_ids || input.character_ids.length === 0) {
      return { 
        success: false, 
        error: 'At least one character must be assigned.' }
    }

    // ── Reward defaults ───────────────────────────────────────────────────
    // When use_custom_xp is false, calculate via the algorithm so the DB row
    // always has concrete reward values rather than nulls.
    const useCustom = input.use_custom_xp ?? false
    let characterXp = input.character_xp ?? 0
    let skillXp     = input.skill_xp ?? 0
    let goldReward  = input.gold_reward ?? 0

    if (!useCustom) {
      const rewards = calculateHabitRewards(
        input.recurrence,
        input.time_consumption,
        input.skill_ids.length,
        input.recurrence === 'custom' ? input.custom_recurrence_config : undefined
      )
      characterXp = rewards.character_xp
      // Store the per-skill amount (pool ÷ count) so completeHabit can award
      // each skill directly without re-running the split.
      skillXp    = Math.floor(rewards.skill_xp / input.skill_ids.length)
      goldReward = rewards.gold
    }

    // ── Build the insert row ───────────────────
    const habitInsert: HabitInsert = {
      user_id:                  user.id,
      title:                    input.title,
      description:              input.description ?? null,
      icon: {
            type:               input.icon_type || DEFAULT_ICON_TYPE,
            value:              input.icon || DEFAULT_ICON,
            color:              input.icon_color || DEFAULT_ICON_COLOR,
          },
      status:                   'active',
      recurrence:               input.recurrence,
      x_per_week_count:         input.x_per_week_count ?? null,
      x_per_week_days:          input.x_per_week_days ?? null,
      weekly_day:               input.weekly_day ?? null,
      monthly_day:              input.monthly_day ?? null,
      custom_recurrence_config: (input.custom_recurrence_config ?? null) as unknown as HabitInsert['custom_recurrence_config'],
      time_consumption:         input.time_consumption,
      completion_time:          input.completion_time ?? null,
      use_custom_xp:            useCustom,
      use_custom_gold:          useCustom,
      gold_reward:              goldReward,
      character_xp:             characterXp,
      skill_xp:                 skillXp,
    }

    const { data: habit, error: insertError } = await supabase
      .from('habits')
      .insert(habitInsert)
      .select()
      .single()

    if (insertError || !habit) {
      return { 
        success: false, 
        error: insertError?.message ?? 'Failed to create new habit' }
    }

    // ── Junction table writes ─────────────────────────────────────────────
    await syncHabitSkills(supabase, habit.id, input.skill_ids)
    await syncHabitCharacters(supabase, habit.id, input.character_ids)
    if (input.goal_ids && input.goal_ids.length > 0) {
      await syncHabitGoals(supabase, habit.id, input.goal_ids)
    }

    const result = await fetchHabitById(habit.id)
    if (!result.success) return result

    return { success: true, data: result.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error creating habit'
    return { success: false, error: message }
  }
}

/**
 * UPDATE HABIT
 * Updates habit fields and/or replaces junction table links.
 * Only fields present on UpdateHabitInput are written — omitted fields are left unchanged. Junction tables use full-replacement delete-then-insert when the corresponding _ids array is provided; omitting an _ids array leaves those links untouched.
 * If recurrence or time_consumption changes and use_custom_xp is false,
 * reward values are recalculated automatically.
 */
export async function updateHabit(
  input: UpdateHabitInput
): Promise<ActionResult<HabitWithRelations>> {
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

    // ── Fetch the current row to fill in any missing algorithm inputs ─────
    const { data: existing, error: fetchError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', input.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: fetchError?.message ?? 'Habit not found' }
    }

    // ── Skill count for reward recalc ─────────────────────────────────────
    let currentSkillCount = 1

    if (input.skill_ids) {
      if (input.skill_ids.length === 0) {
        return { 
          success: false, 
          error: 'At least one skill must be assigned.' }
      }
      if (input.skill_ids.length > 3) {
        return { 
          success: false, 
          error: 'A habit cannot be assigned to more than 3 skills.' }
      }
      currentSkillCount = input.skill_ids.length
    } else {
      const { count } = await supabase
        .from('habit_skills')
        .select('*', { count: 'exact', head: true })
        .eq('habit_id', input.id)
      currentSkillCount = count ?? 1
    }

    if (input.character_ids !== undefined && input.character_ids.length === 0) {
      return { 
        success: false, 
        error: 'At least one character must be assigned.' }
    }

    // ── Build the update payload ──────────────────────────────────────────
    const habitUpdate: HabitUpdate = {}

    if (input.title                    !== undefined) habitUpdate.title                    = input.title
    if (input.description              !== undefined) habitUpdate.description              = input.description ?? null
    if (input.icon                     !== undefined) habitUpdate.icon                     = input.icon as unknown as HabitUpdate['icon']
    if (input.recurrence               !== undefined) habitUpdate.recurrence               = input.recurrence
    if (input.x_per_week_count         !== undefined) habitUpdate.x_per_week_count         = input.x_per_week_count ?? null
    if (input.x_per_week_days          !== undefined) habitUpdate.x_per_week_days          = input.x_per_week_days ?? null
    if (input.weekly_day               !== undefined) habitUpdate.weekly_day               = input.weekly_day ?? null
    if (input.monthly_day              !== undefined) habitUpdate.monthly_day              = input.monthly_day ?? null
    if (input.custom_recurrence_config !== undefined) habitUpdate.custom_recurrence_config = (input.custom_recurrence_config ?? null) as unknown as HabitUpdate['custom_recurrence_config']
    if (input.time_consumption         !== undefined) habitUpdate.time_consumption         = input.time_consumption
    if (input.completion_time          !== undefined) habitUpdate.completion_time          = input.completion_time ?? null
    if (input.use_custom_xp            !== undefined) habitUpdate.use_custom_xp            = input.use_custom_xp

    // ── Recalculate rewards if reward-affecting fields changed ────────────
    const effectiveUseCustom = input.use_custom_xp ?? existing.use_custom_xp
    const rewardAffectingChanged =
      input.recurrence       !== undefined ||
      input.time_consumption !== undefined ||
      input.use_custom_xp    !== undefined

    if (rewardAffectingChanged && !effectiveUseCustom) {
      const rewards = calculateHabitRewards(
        input.recurrence       ?? existing.recurrence,
        input.time_consumption ?? existing.time_consumption,
        currentSkillCount,
        (input.custom_recurrence_config ?? existing.custom_recurrence_config) as HabitCustomRecurrenceConfig | undefined
      )
      habitUpdate.gold_reward  = rewards.gold
      habitUpdate.character_xp = rewards.character_xp
      habitUpdate.skill_xp     = Math.floor(rewards.skill_xp / currentSkillCount)
    }

    // Honour explicit custom reward overrides regardless of recalc
    if (input.gold_reward         !== undefined) habitUpdate.gold_reward         = input.gold_reward
    if (input.character_xp !== undefined) habitUpdate.character_xp = input.character_xp ?? undefined
    if (input.skill_xp     !== undefined) habitUpdate.skill_xp     = input.skill_xp ?? undefined

    // ── Write the habit row if there is anything to update ────────────────
    if (Object.keys(habitUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('habits')
        .update(habitUpdate)
        .eq('id', input.id)
        .eq('user_id', user.id)

      if (updateError) return { success: false, error: updateError.message }
    }

    // ── Sync junction tables (only when caller passed new IDs) ────────────
    if (input.skill_ids     !== undefined) await syncHabitSkills(supabase, input.id, input.skill_ids)
    if (input.character_ids !== undefined) await syncHabitCharacters(supabase, input.id, input.character_ids)
    if (input.goal_ids      !== undefined) await syncHabitGoals(supabase, input.id, input.goal_ids)

    const result = await fetchHabitById(input.id)
    if (!result.success) return result

    return { success: true, data: result.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error updating habit'
    return { success: false, error: message }
  }
}

// =============================================================================
// ARCHIVE / PAUSE
// Separate from updateHabit because status transitions have side-effects:
// timestamp writes and consistency window freezing.
// Reactivation: call updateHabit({ id, status: 'active' }).
// =============================================================================

export async function setHabitStatus(
  input: ArchiveHabitInput
): Promise<ActionResult<Habit>> {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Not authenticated' }

    const now = new Date().toISOString()

    const habitUpdate: HabitUpdate = {
      status:      input.status,
      paused_at:   input.status === 'paused'   ? now : null,
      archived_at: input.status === 'archived' ? now : null,
    }

    const { data, error } = await supabase
      .from('habits')
      .update(habitUpdate)
      .eq('id', input.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      return { success: false, error: error?.message ?? 'Failed to update habit status' }
    }

    return { success: true, data: toHabit(data) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error updating habit status'
    return { success: false, error: message }
  }
}

// =============================================================================
// DELETE
// =============================================================================

/**
 * Permanently deletes a habit. Junction rows are removed automatically by
 * ON DELETE CASCADE. Gold and XP already awarded are retained by the user.
 *
 * Per the PRD, Archive should be the primary action surfaced in the UI;
 * Delete should be secondary and require explicit confirmation.
 */
export async function deleteHabit(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    return { success: true, data: { id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error deleting habit'
    return { success: false, error: message }
  }
}

// =============================================================================
// COMPLETE
// =============================================================================

/**
 * Records a single habit completion and applies all stat effects:
 * Energy deduction (or Resilience if already at 0), Gold award,
 * Character XP, and Skill XP.
 *
 * Reward amounts are read from the habit row directly — they are always
 * populated as concrete integers at creation and on every recurrence /
 * time_consumption change, so no recalculation is needed here.
 *
 * NOTE: addXPToCharacter and addXPToSkill calls are stubbed below.
 * Uncomment once you have confirmed the import chain does not create
 * a circular dependency in your build.
 */
export async function completeHabit(
  habitId: string
): Promise<ActionResult<{
  gold_awarded:         number
  character_xp_awarded: number
  skill_xp_per_skill:   number
  energy_cost:          number
  resilience_awarded:   number
}>> {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Not authenticated' }

    // ── Load habit + linked IDs ───────────────────────────────────────────
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select(`
        *,
        habit_skills(skill_id),
        habit_characters(character_id)
      `)
      .eq('id', habitId)
      .eq('user_id', user.id)
      .single()

    if (habitError || !habit) {
      return { success: false, error: habitError?.message ?? 'Habit not found' }
    }

    if (habit.status !== 'active') {
      return { success: false, error: 'Only active habits can be completed.' }
    }

    const skillIds     = (habit.habit_skills     as { skill_id: string     }[]).map((r) => r.skill_id)
    const characterIds = (habit.habit_characters as { character_id: string }[]).map((r) => r.character_id)

    // Reward values are stored on the row — use them directly.
    const characterXp = habit.custom_character_xp ?? 0
    const skillXpEach = habit.custom_skill_xp     ?? 0  // already per-skill amount
    const goldReward  = habit.gold_reward          ?? 0

    // ── Energy / Resilience ───────────────────────────────────────────────
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('energy_current')
      .eq('user_id', user.id)
      .single()

    if (statsError || !stats) {
      return { success: false, error: 'Could not read user stats' }
    }

    const energyCost = calculateHabitEnergyCost(
      habit.recurrence,
      habit.time_consumption,
      habit.custom_recurrence_config as HabitCustomRecurrenceConfig | undefined
    )

    let energyDeducted    = 0
    let resilienceAwarded = 0

    if (stats.energy_current <= 0) {
      // Already at 0 — award Resilience instead of deducting
      resilienceAwarded = calculateHabitResilienceAward(habit.time_consumption)
      await supabase
        .from('user_stats')
        .update({ resilience: supabase.rpc('increment_resilience', { amount: resilienceAwarded }) })
        .eq('user_id', user.id)
    } else {
      energyDeducted  = Math.min(energyCost, stats.energy_current)
      const newEnergy = Math.max(0, stats.energy_current - energyCost)

      await supabase
        .from('user_stats')
        .update({ energy_current: newEnergy })
        .eq('user_id', user.id)

      // Deduction crossed zero — surplus earns Resilience
      if (stats.energy_current < energyCost) {
        resilienceAwarded = calculateHabitResilienceAward(habit.time_consumption)
        await supabase
          .from('user_stats')
          .update({ resilience: supabase.rpc('increment_resilience', { amount: resilienceAwarded }) })
          .eq('user_id', user.id)
      }
    }

    // ── Gold ──────────────────────────────────────────────────────────────
    if (goldReward > 0) {
      await supabase.rpc('increment_gold', { user_id_input: user.id, amount: goldReward })
    }

    // ── Character XP ──────────────────────────────────────────────────────
    // Awarded in full to every linked Character (no split).
    // Uncomment once addXPToCharacter import is confirmed non-circular:
    //
    // import { addXPToCharacter } from '@/lib/actions/characters'
    // for (const characterId of characterIds) {
    //   await addXPToCharacter(characterId, characterXp)
    // }

    // ── Skill XP ──────────────────────────────────────────────────────────
    // skillXpEach is already the per-skill amount (divided at create/update).
    // Uncomment once addXPToSkill import is confirmed non-circular:
    //
    // import { addXPToSkill } from '@/lib/actions/skills'
    // for (const skillId of skillIds) {
    //   await addXPToSkill(skillId, skillXpEach)
    // }

    return {
      success: true,
      data: {
        gold_awarded:         goldReward,
        character_xp_awarded: characterXp,
        skill_xp_per_skill:   skillXpEach,
        energy_cost:          energyDeducted,
        resilience_awarded:   resilienceAwarded,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error completing habit'
    return { success: false, error: message }
  }
}