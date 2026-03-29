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
  SkillCharacterLink,
  CreateSkillInput,
  UpdateSkillInput
} from '../types/skills'

// =======================================
//  INTERNAL DATABASE TYPES
// =======================================
type SkillRow = Database['public']['Tables']['skills']['Row']
type SkillInsert = Database['public']['Tables']['skills']['Insert']
type SkillUpdate = Database['public']['Tables']['skills']['Update']

type HabitStatus = Database["public"]["Enums"]["habit_status"]
type TypeStatus = Database["public"]["Enums"]["task_status"]
type GoalStatus = Database["public"]["Enums"]["goal_status"]

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

// =======================================
// DATABASE FUNCTIONS
// =======================================
// =================================================
// FETCH ALL SKILLS
// =================================================
/** -------------------------------------
 * Fetch all skills for the current user including any linked characters
 * --------------------------------------
 */
export async function fetchSkills(): Promise<Skill[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('skills')
    .select(`
      *,
      skill_characters (
        characters (
          id,
          title,
          icon,
          color_theme
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching skills:', error)
    throw error
  }

  return (data || []).map((row: SkillRowWithCharacters): Skill => ({
    id: row.id,
    title: row.title,
    icon: row.icon as unknown as IconData,
    description: row.description ?? undefined,
    tags: row.tags ?? undefined,
    level: row.level ?? 1,
    current_xp: row.current_xp ?? 0,
    xp_to_next_level: row.xp_to_next_level ?? 0,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
    characters: row.skill_characters
      .map((sc) => sc.characters)
      .filter((sc): sc is NonNullable<typeof sc> => sc !== null)
      .map((sc) => ({
        id: sc.id,
        title: sc.title,
        icon: sc.icon as unknown as IconData,
        color_theme: sc.color_theme,
      })),
  }))
}

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