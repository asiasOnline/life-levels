import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types' 
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
// DATABASE TYPES
// =======================================
type SkillRow = Database['public']['Tables']['skills']['Row']
type SkillInsert = Database['public']['Tables']['skills']['Insert']
type SkillUpdate = Database['public']['Tables']['skills']['Update']

type SkillRowWithCharacters = SkillRow & {
  skill_characters: {
    characters: {
      id: string
      title: string 
      color_theme: string 
      icon: IconData
    } | null
  }[]
}

type SkillRowWithLinks = SkillRowWithCharacters & {
  task_skills: {
    id: string
    title: string 
    status: string
    icon: IconData
  }
}

// =======================================
// DATABASE FUNCTIONS
// =======================================
/** -------------------------------------
 * Fetch all skills for the current user
 * --------------------------------------
 */
export async function fetchSkills(): Promise<SkillRow[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching skills:', error)
    throw error
  }

  return data || []
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
      type: input.icon_type || DEFAULT_ICON_TYPE,
      value: input.icon || DEFAULT_ICON,
      color: input.icon_color || DEFAULT_ICON_COLOR,
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

  if (updates.icon !== undefined || updates.icon_type !== undefined) {
    skillUpdate.icon = {
      type: updates.icon_type || DEFAULT_ICON_TYPE,
      value: updates.icon || DEFAULT_ICON,
      color: updates.icon_color,
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