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
  CreateSkillInput,
  UpdateSkillInput
} from '../types/skills'
import { CharacterSkillLink } from '../types/character'

// =======================================
//  INTERNAL DATABASE TYPES
// =======================================
type SkillRow = Database['public']['Tables']['skills']['Row']
type SkillInsert = Database['public']['Tables']['skills']['Insert']
type SkillUpdate = Database['public']['Tables']['skills']['Update']

type HabitStatus = Database["public"]["Enums"]["habit_status"]
type TypeStatus = Database["public"]["Enums"]["task_status"]
type GoalStatus = Database["public"]["Enums"]["goal_status"]

// Raw shape returned by Supabase for the list view (characters only).
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
type SkillWithRelations = SkillRowWithCharacters & {
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
// Converts a raw Supabase join row → clean Skill shape.
// Strips nulls from junction rows caused by deleted related records.
// Works for both SkillRowWithCharacters and SkillRowWithRelations since
// the character mapping is identical — the extra relation arrays on
// SkillRowWithRelations are available on the returned Skill via future
// extension of the Skill type if a SkillWithRelations type is added.
// ==============================================
function mapRowToSkill(row: SkillRowWithCharacters): Skill {
  const characters: CharacterSkillLink[] = (row.skill_characters ?? [])
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
 * Fetch all skills for the current user to their main Skill page this includes any linked characters
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

  if (error) {
    console.error('Error fetching skills:', error)
    throw error
  }

  const skills = (data as SkillRowWithCharacters[]).map(mapRowToSkill)
  return {
    success: true,
    data: skills
  }
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unexpected error fetching skills'
  return {
    success: false,
    error: message
  }
}

// =======================================
// FETCH A SINGLE SKILL
// =======================================
/**
 * Returns a single skill by ID with all relations hydrated (characters, habits, tasks, goals).
 * Used by the Skill detail page and as the return path after all write operations.
 */
export async function fetchSkillById(
  id: string
): Promise<ActionResult<Skill>> {
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
 
    return { success: true, data: mapRowToSkill(data as SkillWithRelations) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error fetching skill'
    return { success: false, error: message }
  }
}

// =======================================
// CREATE A NEW SKILL
// =======================================
/**-------------------------------------
 * Create a new skill
 * -------------------------------------
 */
export async function createSkill(input: CreateSkillInput): Promise<SkillRow> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const skillData: SkillInsert = {
    user_id: user.id,
    title: input.title,
    description: input.description || null,
    icon: {
      type: input.icon.type || DEFAULT_ICON_TYPE,
      value: input.icon.value || DEFAULT_ICON,
      color: input.icon.color || DEFAULT_ICON_COLOR,
    },
    tags: input.tags || [],
    level: 1,
    current_xp: 0,
    xp_to_next_level: calculateXPForLevel(1),
  }

  const { data, error } = await supabase
    .from('skills')
    .insert(skillData)
    .select()
    .single()

  if (error) {
    console.error('Error creating skill:', error)
    throw error
  }

  if (input.character_ids && input.character_ids.length > 0) {
    const links = input.character_ids.map((character_id) => ({
      skill_id: data.id,
      character_id,
    }))
    const { error: linkError } = await supabase.from('skill_characters').insert(links)
    if (linkError) {
      console.error('Error linking characters to skill:', linkError)
      throw linkError
    }
  }

  return data
}

/**-------------------------------------
 * Update an existing skill
 * -------------------------------------
 */
export async function updateSkill(id: string, updates: Partial<CreateSkillInput>): Promise<SkillRow> {
  const supabase = createClient()

  const skillUpdate: SkillUpdate = {
    title: updates.title,
    description: updates.description,
    tags: updates.tags,
  }

  if (updates.icon !== undefined) {
    skillUpdate.icon = {
      type: updates.icon.type || DEFAULT_ICON_TYPE,
      value: updates.icon.value || DEFAULT_ICON,
      color: updates.icon.color || DEFAULT_ICON_COLOR,
    }
  }

  const { data, error } = await supabase
    .from('skills')
    .update(skillUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating skill:', error)
    throw error
  }

  return data
}

/**-------------------------------------
 * Delete a skill
 * -------------------------------------
 */
export async function deleteSkill(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting skill:', error)
    throw error
  }
}

/**-------------------------------------
 * Add XP to a skill
 * -------------------------------------
 */
export async function addXPToSkill(id: string, xpGained: number): Promise<SkillRow> {
  const supabase = createClient()

  // Fetch current skill
  const { data: skill, error: fetchError } = await supabase
    .from('skills')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !skill) throw fetchError || new Error('Skill not found')

  // Calculate new XP and level
  let newCurrentXP = skill.current_xp + xpGained
  let newLevel = skill.level

  // Level up if enough XP
  while (newCurrentXP >= skill.xp_to_next_level) {
    newCurrentXP -= skill.xp_to_next_level
    newLevel++
  }

  const newXPToNextLevel = calculateXPForLevel(newLevel)

  // Update skill
  const { data, error } = await supabase
    .from('skills')
    .update({
      level: newLevel,
      current_xp: newCurrentXP,
      xp_to_next_level: newXPToNextLevel,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error adding XP to skill:', error)
    throw error
  }

  return data
}