import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { Json } from '@/lib/database.types'
import { 
  IconData, 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR 
} from '@/lib/types/icon'
import {
  Character,
  CharacterWithRelations,
  CreateCharacterInput,
  UpdateCharacterInput
} from '../types/character'
import { calculateXPForLevel } from '@/lib/utils/character'
import { CharacterAvatarData } from '@/lib/types/character'
import { SkillSummary } from '../types/skills'

// =======================================
//  INTERNAL DATABASE TYPES
// =======================================

type CharacterRow = Database['public']['Tables']['characters']['Row']
type CharacterInsert = Database['public']['Tables']['characters']['Insert']
type CharacterUpdate = Database['public']['Tables']['characters']['Update']

type HabitStatus = Database["public"]["Enums"]["habit_status"]
type TypeStatus = Database["public"]["Enums"]["task_status"]
type GoalStatus = Database["public"]["Enums"]["goal_status"]

// Raw shape returned by Supabase for the grid/list view (includes links with skills only).
// Not exported — components always receive the clean Character shape.
type CharacterRowWithSkills = CharacterRow & {
  skill_characters: {
    skills: {
      id: string
      title: string 
      icon: unknown
      level: number
    } | null
  }[]
}

// Raw shape returned by Supabase for the detail view (all relations).
// Extends the character shape — fetchSkillById uses this.
type CharacterRowWithRelations = CharacterRowWithSkills & {
  habit_characters: {
    habits: {
      id: string
      title: string 
      icon: Json 
      status: HabitStatus
    } | null
  }[]
  task_characters: {
    tasks: {
      id: string
      title: string 
      icon: Json
      status: TypeStatus
    } | null
  }[]
  goal_characters: {
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
const CHARACTER_WITH_SKILLS_SELECT = `
  *,
  skill_characters(
    skills(id, title, icon)
  )
` as const

const CHARACTER_WITH_RELATIONS_SELECT = `
  *,
  skill_characters(
    skills(id, title, icon)
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
 * Maps a raw Supabase row (characters join only) to a clean Character.
 * Used by fetchCharacters for the grid/list view.
 */
function mapRowToCharacter(row: CharacterRowWithSkills): Character {
  const skills: SkillSummary[] = (row.skill_characters ?? [])
    .filter((sc) => sc.skills !== null)
    .map((sc) => ({
      id: sc.skills!.id,
      title: sc.skills!.title,
      icon: sc.skills!.icon as unknown as IconData,
      level: sc.skills!.level,
    }))

  return {
    id:               row.id,
    title:            row.title,
    color_theme:      row.color_theme,
    icon:             row.icon as unknown as IconData,
    description:      row.description ?? undefined,
    avatar:           (row.avatar as unknown as CharacterAvatarData) ?? null,
    level:            row.level ?? 1,
    current_xp:       row.current_xp ?? 0,
    xp_to_next_level: row.xp_to_next_level ?? 0,
    total_xp:         row.total_xp ?? 0,
    is_archived:      row.is_archived ?? false,
    skills:           skills.length > 0 ? skills : undefined,
    created_at:       row.created_at ? new Date(row.created_at) : new Date(),
    updated_at:       row.updated_at ? new Date(row.updated_at) : new Date(),
  }
}

// ==============================================
// CHARACTER RELATION MAPPER
// ==============================================
/**
 * Maps a raw Supabase row (all relations) → CharacterWithRelations.
 * Used by fetchCharacterById and as the return shape for all write operations, so the Character detail modal always receives fully hydrated data.
 */
function mapRowToCharacterWithRelations(
  row: CharacterRowWithRelations
): CharacterWithRelations {
  const base = mapRowToCharacter(row)
 
  const habits = (row.habit_characters ?? [])
    .filter((hc) => hc.habits !== null)
    .map((hc) => ({
      id:     hc.habits!.id,
      title:  hc.habits!.title,
      icon:   hc.habits!.icon as unknown as IconData,
      status: hc.habits!.status,
    }))
 
  const tasks = (row.task_characters ?? [])
    .filter((tc) => tc.tasks !== null)
    .map((tc) => ({
      id:     tc.tasks!.id,
      title:  tc.tasks!.title,
      icon:   tc.tasks!.icon as unknown as IconData,
      status: tc.tasks!.status,
    }))
 
  const goals = (row.goal_characters ?? [])
    .filter((gc) => gc.goals !== null)
    .map((gc) => ({
      id:     gc.goals!.id,
      title:  gc.goals!.title,
      icon:   gc.goals!.icon as unknown as IconData,
      status: gc.goals!.status,
    }))
 
  return { 
    ...base, 
    habits, 
    tasks, 
    goals 
  }
}

// =======================================
// JUNCTION TABLE HELPER
// Delete-then-insert — safe because skill_characters rows carry no
// extra data beyond the two foreign keys.
// =======================================
async function syncCharacterSkills(
  supabase: ReturnType<typeof createClient>,
  character_id: string,
  skill_ids: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('skill_characters')
    .delete()
    .eq('character_id', character_id)
 
  if (deleteError) {
    console.error(`Failed to clear skill links for character ${character_id}:`, deleteError)
    throw deleteError
  }
 
  if (skill_ids.length === 0) return
 
  const rows = skill_ids.map((skill_id) => ({ character_id, skill_id }))
  const { error: insertError } = await supabase
    .from('skill_characters')
    .insert(rows)
 
  if (insertError) {
    console.error(`Failed to link skills for character ${character_id}:`, insertError)
    throw insertError
  }
}

// =======================================
// DATABASE FUNCTIONS
// =======================================
// =======================================
// FETCH ALL CHARACTERS (GRID/LIST VIEW)
// =======================================
/** -------------------------------------
 * Fetch all characters for the authenticated user with linked Skills hydrated. 
 * --------------------------------------
 */
export async function fetchCharacters(): Promise<ActionResult<Character[]>> {
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
    .from('characters')
    .select(CHARACTER_WITH_SKILLS_SELECT)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return {
    success: false,
    error: error.message
  }

  const characters = (data as CharacterRowWithSkills[]).map(mapRowToCharacter)
  return {
    success: true,
    data: characters
  }
  } catch (error) {
    console.error('Error fetching characters:', error)
    return {
      success: false,
      error: 'Failed to fetch characters'
    }
  }
}

// =======================================
// FETCH ALL ACTIVE CHARACTERS
// =======================================
/**
 * Fetches non-archived characters only.
 * Used when populating character selectors in Task, Habit, and Goal creation forms.
 */
export async function fetchActiveCharacters(): Promise<ActionResult<Character[]>> {
  try {
    const supabase = createClient()
 
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
 
    if (authError || !user) return { success: false, error: 'Not authenticated' }
 
    const { data, error } = await supabase
      .from('characters')
      .select(CHARACTER_WITH_SKILLS_SELECT)
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
 
    if (error) return { success: false, error: error.message }
 
    return {
      success: true,
      data: (data as CharacterRowWithSkills[]).map(mapRowToCharacter),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error fetching active characters'
    return { success: false, error: message }
  }
}

// =======================================
// FETCH A SINGLE CHARACTER BY ID (DETAIL VIEW)
// =======================================
/** -------------------------------------
 * Returns a single character by ID with all relations hydrated (skills, habits, tasks, goals). Used by the Character detail page and as the return path after all write operations.
 * --------------------------------------
 */
export async function fetchCharacterById(
  id: string
): Promise<ActionResult<CharacterWithRelations>> {
  try {
    const supabase = createClient()
 
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
 
    if (authError || !user) return { success: false, error: 'Not authenticated' }
 
    const { data, error } = await supabase
      .from('characters')
      .select(CHARACTER_WITH_RELATIONS_SELECT)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
 
    if (error) return { success: false, error: error.message }
    if (!data)  return { success: false, error: 'Character not found' }
 
    return {
      success: true,
      data: mapRowToCharacterWithRelations(data as CharacterRowWithRelations),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error fetching character'
    return { success: false, error: message }
  }
}

// =======================================
// CREATE A NEW CHARACTER
// =======================================
/**
 * Inserts the character row then syncs skill links if provided.
 * Returns the newly created character with all relations hydrated.
 */
export async function createCharacter(
  input: CreateCharacterInput
): Promise<ActionResult<CharacterWithRelations>> {
  try {
    const supabase = createClient()
 
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
 
    if (authError || !user) return { success: false, error: 'Not authenticated' }
 
    const characterData: CharacterInsert = {
      user_id:     user.id,
      title:       input.title,
      color_theme: input.color_theme,
      icon: {
        type:  input.icon?.type  ?? DEFAULT_ICON_TYPE,
        value: input.icon?.value ?? DEFAULT_ICON,
        color: input.icon?.color ?? DEFAULT_ICON_COLOR,
      },
      description:      input.description ?? null,
      avatar:           (input.avatar ?? null) as unknown as CharacterInsert['avatar'],
      level:            1,
      current_xp:       0,
      xp_to_next_level: calculateXPForLevel(1),
      total_xp:         0,
      is_archived:      false,
    }
 
    const { data, error } = await supabase
      .from('characters')
      .insert(characterData)
      .select()
      .single()
 
    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('unique_character_title_per_user')) {
          return { success: false, error: 'You already have a character with that title.' }
        }
        if (error.message.includes('unique_color_theme_per_user')) {
          return { success: false, error: 'You already have a character using that color.' }
        }
      }
      return { success: false, error: error.message }
    }
 
    if (input.skill_ids && input.skill_ids.length > 0) {
      await syncCharacterSkills(supabase, data.id, input.skill_ids)
    }
 
    const result = await fetchCharacterById(data.id)
    if (!result.success) return result
 
    return { success: true, data: result.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error creating character'
    return { success: false, error: message }
  }
}

// =======================================
// UPDATE AN EXISTING SKILL
// =======================================
/**
 * Applies partial field updates and replaces skill links if skill_ids is provided.
 * Passing an empty skill_ids array clears all links; omitting it leaves them unchanged. Returns the updated character with all relations hydrated.
 */
export async function updateCharacter(
  input: UpdateCharacterInput
): Promise<ActionResult<CharacterWithRelations>> {
  try {
    const supabase = createClient()
 
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
 
    if (authError || !user) return { success: false, error: 'Not authenticated' }
 
    const characterUpdate: CharacterUpdate = {}
 
    if (input.title       !== undefined) characterUpdate.title       = input.title
    if (input.color_theme !== undefined) characterUpdate.color_theme = input.color_theme
    if (input.description !== undefined) characterUpdate.description = input.description
    if (input.is_archived !== undefined) characterUpdate.is_archived = input.is_archived
    if (input.avatar      !== undefined) {
      characterUpdate.avatar = input.avatar as unknown as CharacterUpdate['avatar']
    }
    if (input.icon !== undefined) {
      characterUpdate.icon = {
        type:  input.icon.type  ?? DEFAULT_ICON_TYPE,
        value: input.icon.value ?? DEFAULT_ICON,
        color: input.icon.color ?? DEFAULT_ICON_COLOR,
      }
    }
 
    if (Object.keys(characterUpdate).length > 0) {
      const { error } = await supabase
        .from('characters')
        .update(characterUpdate)
        .eq('id', input.id)
        .eq('user_id', user.id)
 
      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('unique_character_title_per_user')) {
            return { success: false, error: 'You already have a character with that title.' }
          }
          if (error.message.includes('unique_color_theme_per_user')) {
            return { success: false, error: 'You already have a character using that color.' }
          }
        }
        return { success: false, error: error.message }
      }
    }
 
    // Replace skill links only if caller explicitly passed skill_ids
    if (input.skill_ids !== undefined) {
      await syncCharacterSkills(supabase, input.id, input.skill_ids)
    }
 
    const result = await fetchCharacterById(input.id)
    if (!result.success) return result
 
    return { success: true, data: result.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error updating character'
    return { success: false, error: message }
  }
}

/** -------------------------------------
 * ARCHIVE A CHARACTER (SOFT DELETE)
 * --------------------------------------
 */
/**
 * Soft-deactivates a character. All data and connections are preserved.
 * The DB guard trigger prevents archiving the user's last active character.
 */
export async function archiveCharacter(
  id: string
): Promise<ActionResult<CharacterWithRelations>> {
  return updateCharacter({ id, is_archived: true })
}

/** -------------------------------------
 * REACTIVATE A CHARACTER
 * --------------------------------------
 */
export async function activateCharacter(
  id: string
): Promise<ActionResult<CharacterWithRelations>> {
  return updateCharacter({ id, is_archived: false })
}


// =======================================
// DELETE CHARACTER
// =======================================
/**
 * Permanently removes the character. Junction rows are removed automatically
 * by ON DELETE CASCADE. The DB guard trigger blocks deletion of the user's
 * last active character. Caller is responsible for ensuring no active
 * Habits, Tasks, or Goals remain linked before calling.
 */
export async function deleteCharacter(
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
      .from('characters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
 
    if (error) return { success: false, error: error.message }
 
    return { success: true, data: { id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error deleting character'
    return { success: false, error: message }
  }
}

// =======================================
// ADD XP TO A CHARACTER
// =======================================
/**
 * Handles level-ups correctly including multi-level jumps in a single XP grant.
 * Each iteration recalculates the threshold for the new level — this prevents
 * the stale-threshold bug where all iterations use the originally fetched value.
 * Returns the updated character with all relations hydrated.
 */
export async function addXPToCharacter(
  id: string,
  xpGained: number
): Promise<ActionResult<CharacterWithRelations & { leveledUp: boolean; newLevel: number }>> {
  try {
    const supabase = createClient()
 
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
 
    if (authError || !user) return { success: false, error: 'Not authenticated' }
 
    const { data: character, error: fetchError } = await supabase
      .from('characters')
      .select('level, current_xp, total_xp')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
 
    if (fetchError || !character) {
      return { success: false, error: fetchError?.message ?? 'Character not found' }
    }
 
    let newXP    = character.current_xp + xpGained
    let newLevel = character.level
    const previousLevel = character.level
 
    // Recalculate threshold per iteration so multi-level-ups use the correct
    // XP requirement for each successive level.
    while (newXP >= calculateXPForLevel(newLevel)) {
      newXP -= calculateXPForLevel(newLevel)
      newLevel++
    }
 
    const { error: updateError } = await supabase
      .from('characters')
      .update({
        level:            newLevel,
        current_xp:       newXP,
        xp_to_next_level: calculateXPForLevel(newLevel),
        total_xp:         character.total_xp + xpGained,
      })
      .eq('id', id)
      .eq('user_id', user.id)
 
    if (updateError) return { success: false, error: updateError.message }
 
    const result = await fetchCharacterById(id)
    if (!result.success) return result
 
    return {
      success: true,
      data: {
        ...result.data,
        leveledUp: newLevel > previousLevel,
        newLevel,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error adding XP to character'
    return { success: false, error: message }
  }
}