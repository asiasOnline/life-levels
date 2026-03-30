import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types' 
import { Json } from '@/lib/database.types'
import { calculateXPForLevel } from '@/lib/utils/skills'
import { 
  IconData,
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR 
} from '@/lib/types/icon'
import { 
  Skill,
  SkillWithRelations,
  CreateSkillInput,
  UpdateSkillInput
} from '../types/skills'
import { CharacterSummaryWithLevel } from '../types/character'

// =======================================
//  INTERNAL DATABASE TYPES
// =======================================
type SkillRow = Database['public']['Tables']['skills']['Row']
type SkillInsert = Database['public']['Tables']['skills']['Insert']
type SkillUpdate = Database['public']['Tables']['skills']['Update']

type HabitStatus = Database["public"]["Enums"]["habit_status"]
type TypeStatus = Database["public"]["Enums"]["task_status"]
type GoalStatus = Database["public"]["Enums"]["goal_status"]

// Raw shape returned by Supabase for the grid/list view (includes links with characters only).
// Not exported — components always receive the clean Skill shape.
type SkillRowWithCharacters = SkillRow & {
  skill_characters: {
    characters: {
      id: string
      title: string 
      icon: unknown
      color_theme: string 
    } | null
  }[]
}

// Raw shape returned by Supabase for the detail view (all relations).
// Extends the character shape — fetchSkillById uses this.
type SkillRowWithRelations = SkillRowWithCharacters & {
  habit_skills: {
    habits: {
      id: string
      title: string 
      icon: Json 
      status: HabitStatus
    } | null
  }[]
  task_skills: {
    tasks: {
      id: string
      title: string 
      icon: Json
      status: TypeStatus
    } | null
  }[]
  goal_skills: {
    goals: {
      id: string 
      title: string 
      icon: Json 
      status: GoalStatus
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
const SKILL_WITH_CHARACTERS_SELECT = `
  *,
  skill_characters(
    characters(id, title, icon, color_theme)
  )
` as const

const SKILL_WITH_RELATIONS_SELECT = `
  *,
  skill_characters(
    characters(id, title, icon, color_theme)
  ),
  habit_skills(
    habits(id, title, icon, status)
  ),
  task_skills(
    tasks(id, title, icon, status)
  ),
  goal_skills(
    goals(id, title, icon, status)
  )
` as const

 
// ==============================================
// MAPPER
// ==============================================
// ==============================================
// SKILL & CHARACTER MAPPER
// ==============================================
/**
 * Maps a raw Supabase row (characters join only) to a clean Skill.
 * Used by fetchSkills for the grid/list view.
 */
function mapRowToSkill(row: SkillRowWithCharacters): Skill {
  const characters: CharacterSummaryWithLevel[] = (row.skill_characters ?? [])
    .filter((sc) => sc.characters !== null)
    .map((sc) => ({
      id: sc.characters!.id,
      title: sc.characters!.title,
      icon: sc.characters!.icon as unknown as IconData,
      color_theme: sc.characters!.color_theme,
    }))
 
  return {
    id: row.id,
    title: row.title,
    icon: row.icon as unknown as IconData,
    description: row.description ?? undefined,
    tags: (row.tags as string[]) ?? [],
    level: row.level ?? 1,
    current_xp: row.current_xp ?? 0,
    xp_to_next_level: row.xp_to_next_level ?? 0,
    characters: characters.length > 0 ? characters : undefined,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

// ==============================================
// SKILL RELATION MAPPER
// ==============================================
/**
 * Maps a raw Supabase row (all relations) → SkillWithRelations.
 * Used by fetchSkillById and as the return shape for all write operations, so the Skill detail modal always receives fully hydrated data.
 */
function mapRowToSkillWithRelations(row: SkillRowWithRelations): SkillWithRelations {
  const base = mapRowToSkill(row)
 
  const habits = (row.habit_skills ?? [])
    .filter((hs) => hs.habits !== null)
    .map((hs) => ({
      id: hs.habits!.id,
      title: hs.habits!.title,
      icon: hs.habits!.icon as unknown as IconData,
      status: hs.habits!.status,
    }))
 
  const tasks = (row.task_skills ?? [])
    .filter((ts) => ts.tasks !== null)
    .map((ts) => ({
      id: ts.tasks!.id,
      title: ts.tasks!.title,
      icon: ts.tasks!.icon as unknown as IconData,
      status: ts.tasks!.status,
    }))
 
  const goals = (row.goal_skills ?? [])
    .filter((gs) => gs.goals !== null)
    .map((gs) => ({
      id: gs.goals!.id,
      title: gs.goals!.title,
      icon: gs.goals!.icon as unknown as IconData,
      status: gs.goals!.status,
    }))
 
  return {
    ...base,
    habits,
    tasks,
    goals,
  }
}

// ====================================================
// JUNCTION TABLE HELPERS
// All junction writes use the delete-then-insert pattern — no diffing, safe because junction rows carry no data beyond the foreign keys.
// =====================================================
async function syncSkillCharacters(
  supabase: ReturnType<typeof createClient>,
  skill_id: string,
  character_ids: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('skill_characters')
    .delete()
    .eq('skill_id', skill_id)
 
  if (deleteError) {
    console.error(`Failed to clear skill characters for skill ${skill_id}:`, deleteError)
    throw deleteError
  }
 
  if (character_ids.length === 0) return
 
  const rows = character_ids.map((character_id) => ({ skill_id, character_id }))
  const { error: insertError } = await supabase
    .from('skill_characters')
    .insert(rows)
 
  if (insertError) {
    console.error(`Failed to link characters for skill ${skill_id}:`, insertError)
    throw insertError
  }
}

// =======================================
// DATABASE FUNCTIONS
// =======================================
// =======================================
// FETCH ALL SKILLS
// =======================================
/** -------------------------------------
 * Fetch all skills for the authenticated user with linked Characters hydrated. 
 * --------------------------------------
 */
export async function fetchSkills(): Promise<ActionResult<Skill[]>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return {
      success: false,
      error: 'Not authenticated'
    }

    const { data, error } = await supabase
    .from('skills')
    .select(SKILL_WITH_CHARACTERS_SELECT)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return {
    success: false,
    error: error.message
  }
  
  const skills = (data as SkillRowWithCharacters[]).map(mapRowToSkill)
  return {
    success: true,
    data: skills
  }
} catch (err) {
    const message = err instanceof Error ? 
                    err.message : 'Unexpected error fetching skills'
    return {
      success: false,
      error: message
    }
  }
}

// =======================================
// FETCH A SINGLE SKILL
// =======================================
/**
 * Returns a single skill by ID with all relations hydrated (characters, habits, tasks, goals). Used by the Skill detail page and as the return path after all write operations.
 */
export async function fetchSkillById(
  id: string
): Promise<ActionResult<SkillWithRelations>> {
  try {
    const supabase = createClient()
 
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
 
    if (authError || !user) return { 
      success: false, 
      error: 'Not authenticated' 
    }
 
    const { data, error } = await supabase
      .from('skills')
      .select(SKILL_WITH_RELATIONS_SELECT)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
 
    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'Skill not found' }
 
    return { 
      success: true, 
      data: mapRowToSkillWithRelations(data as SkillRowWithRelations) 
    }
  } catch (err) {
    const message = err instanceof Error ? 
                    err.message : 'Unexpected error fetching skill'
    return { 
      success: false, 
      error: message 
    }
  }
}

// =======================================
// CREATE A NEW SKILL
// =======================================
/**-------------------------------------
 * Inserts the skill row then syncs character links if provided.
 * Starting level is capped at 5; XP always begins at 0.
 * Returns the newly created skill with all relations hydrated.
 * -------------------------------------
 */
export async function createSkill(
  input: CreateSkillInput
): Promise<ActionResult<SkillWithRelations>> {
  try {
  const supabase = createClient()
  
  const { 
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return {
    success: false,
    error: 'Not authenticated'
  }

  const initialSkillLevel = Math.min(input.starting_level ?? 1, 5)

  const skillData: SkillInsert = {
    user_id: user.id,
    title: input.title,
    description: input.description ?? null,
    icon: {
      type: input.icon.type || DEFAULT_ICON_TYPE,
      value: input.icon.value || DEFAULT_ICON,
      color: input.icon.color || DEFAULT_ICON_COLOR,
    },
    tags: input.tags ?? [],
    level: initialSkillLevel,
    current_xp: 0,
    xp_to_next_level: calculateXPForLevel(initialSkillLevel),
  }

  const { data, error } = await supabase
    .from('skills')
    .insert(skillData)
    .select()
    .single()

  if (error) {
      if (error.code === '23505' && error.message.includes('skills_user_id_title_key')) {
        return { 
          success: false, 
          error: 'A skill with that title already exists.' 
        }
      }
      return { 
        success: false, 
        error: error.message 
      }
    }

  if (input.character_ids && input.character_ids.length > 0) {
      await syncSkillCharacters(supabase, data.id, input.character_ids)
    }

  const result = await fetchSkillById(data.id)
    if (!result.success) return result

    return { 
      success: true, 
      data: result.data 
    } 
  } catch (err) {
    const message = err instanceof Error ? 
                    err.message : 'Unexpected error creating skill'
    return {
      success: false,
      error: message
    }
  }
}

// =======================================
// UPDATE AN EXISTING SKILL
// =======================================
/**-------------------------------------
 * Applies partial field updates and replaces character links if character_ids is provided. Passing an empty character_ids array clears all links; omitting it leaves them unchanged. Returns the updated skill with all relations hydrated.
 * -------------------------------------
 */
export async function updateSkill(
  input: UpdateSkillInput
): Promise<ActionResult<SkillWithRelations>> {
  try {
    const supabase = createClient()
 
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
 
    if (authError || !user) return { success: false, error: 'Not authenticated' }
 
    // Build the update payload — only include fields that were explicitly passed
    const skillUpdate: SkillUpdate = {}
 
    if (input.title       !== undefined) skillUpdate.title       = input.title
    if (input.description !== undefined) skillUpdate.description = input.description
    if (input.tags        !== undefined) skillUpdate.tags        = input.tags
    if (input.icon        !== undefined) skillUpdate.icon        = input.icon as unknown as SkillUpdate['icon']
 
    if (Object.keys(skillUpdate).length > 0) {
      const { error } = await supabase
        .from('skills')
        .update(skillUpdate)
        .eq('id', input.id)
        .eq('user_id', user.id)
 
      if (error) {
        if (error.code === '23505' && error.message.includes('skills_user_id_title_key')) {
          return { success: false, error: 'You already have a skill with that title.' }
        }
        return { success: false, error: error.message }
      }
    }
 
    // Replace character links only if caller explicitly passed character_ids
    if (input.character_ids !== undefined) {
      await syncSkillCharacters(supabase, input.id, input.character_ids)
    }
 
    const result = await fetchSkillById(input.id)
    if (!result.success) return result
 
    return { success: true, data: result.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error updating skill'
    return { success: false, error: message }
  }
}

// =======================================
// DELETE SKILL
// =======================================
/**-------------------------------------
 * Permanently removes the skill. Junction rows are removed automatically by
 * ON DELETE CASCADE. The caller is responsible for ensuring the skill has no
 * active connections before calling (enforced in the UI per the PRD).
 * Gold already awarded from this skill levelling up is retained by the user.
 * -------------------------------------
 */
export async function deleteSkill(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = createClient()
 
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
 
    if (authError || !user) return { success: false, error: 'Not authenticated' }
 
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
 
    if (error) return { success: false, error: error.message }
 
    return { success: true, data: { id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error deleting skill'
    return { success: false, error: message }
  }
}

// =======================================
// ADD XP TO SKILL
// =======================================
/**-------------------------------------
 * Handles level-ups correctly including multi-level jumps in a single XP grant.
 * Each iteration recalculates the threshold for the new level — this prevents
 * the stale-threshold bug where all iterations used the originally fetched value.
 * -------------------------------------
 */
export async function addXPToSkill(
  id: string,
  xpGained: number
): Promise<ActionResult<SkillWithRelations>> {
  try {
    const supabase = createClient()
 
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
 
    if (authError || !user) return { success: false, error: 'Not authenticated' }
 
    const { data: skill, error: fetchError } = await supabase
      .from('skills')
      .select('level, current_xp')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
 
    if (fetchError || !skill) {
      return { success: false, error: fetchError?.message ?? 'Skill not found' }
    }
 
    let newXP    = skill.current_xp + xpGained
    let newLevel = skill.level
 
    // Recalculate the threshold on every iteration so multi-level-ups use
    // the correct XP requirement for each successive level.
    while (newXP >= calculateXPForLevel(newLevel)) {
      newXP -= calculateXPForLevel(newLevel)
      newLevel++
    }
 
    const { error: updateError } = await supabase
      .from('skills')
      .update({
        level:            newLevel,
        current_xp:       newXP,
        xp_to_next_level: calculateXPForLevel(newLevel),
      })
      .eq('id', id)
      .eq('user_id', user.id)
 
    if (updateError) return { success: false, error: updateError.message }
 
    const result = await fetchSkillById(id)
    if (!result.success) return result
 
    return { success: true, data: result.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error adding XP to skill'
    return { success: false, error: message }
  }
}