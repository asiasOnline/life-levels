"use server"

import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { 
  IconType, 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR 
} from '@/lib/types/icon'
import { calculateXPForLevel } from '@/lib/utils/character'
import { CharacterAvatarData } from '@/lib/types/character'

// =======================================
// DATABASE & INPUT TYPE
// =======================================

type CharacterRow = Database['public']['Tables']['characters']['Row']
type CharacterInsert = Database['public']['Tables']['characters']['Insert']
type CharacterUpdate = Database['public']['Tables']['characters']['Update']

export interface CreateCharacterInput {
  title: string
  description?: string
  icon?: string
  icon_type?: IconType
  icon_color?: string
  color_theme: string
  avatar?: CharacterAvatarData | null 
}

// =======================================
// DATABASE FUNCTIONS
// =======================================

/** -------------------------------------
 * Fetch all characters for the current user
 * --------------------------------------
 */
export async function fetchCharacters(): Promise<CharacterRow[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching characters:', error)
    throw error
  }

  return data || []
}

/** -------------------------------------
 * Fetch active (non-archived) characters
 * --------------------------------------
 */
export async function fetchActiveCharacters(): Promise<CharacterRow[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching active characters:', error)
    throw error
  }

  return data || []
}

/** -------------------------------------
 * Create a new character
 * --------------------------------------
 */
export async function createCharacter(input: CreateCharacterInput): Promise<CharacterRow> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const characterData: CharacterInsert = {
    user_id: user.id,
    title: input.title,
    color_theme: input.color_theme,
    icon: {
      type: input.icon_type || DEFAULT_ICON_TYPE,
      value: input.icon || DEFAULT_ICON,
      color: input.icon_color || DEFAULT_ICON_COLOR,
    },
    description: input.description || null,
    avatar: (input.avatar ?? null) as unknown as CharacterInsert['avatar'],
    level: 1,
    current_xp: 0,
    xp_to_next_level: calculateXPForLevel(1),
    total_xp: 0,
    is_archived: false,
  }

  const { data, error } = await supabase
    .from('characters')
    .insert(characterData)
    .select()
    .single()

  if (error) {
    console.error('Error creating character:', error)
    throw error
  }

  return data
}

/** -------------------------------------
 * Update an existing character
 * --------------------------------------
 */
export async function updateCharacter(
  id: string,
  updates: Partial<CreateCharacterInput>
): Promise<CharacterRow> {
  const supabase = createClient()

  const characterUpdate: CharacterUpdate = {
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.color_theme !== undefined && { color_theme: updates.color_theme }),
    ...(updates.icon !== undefined && {
      icon: {
        type: updates.icon_type || DEFAULT_ICON_TYPE,
        value: updates.icon || DEFAULT_ICON,
        color: updates.icon_color,
      },
    }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.avatar !== undefined && { avatar: updates.avatar as unknown as CharacterUpdate['avatar'] }),
  }

  const { data, error } = await supabase
    .from('characters')
    .update(characterUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating character:', error)
    throw error
  }

  return data
}

/** -------------------------------------
 * Archive a character (soft delete)
 * --------------------------------------
 */
export async function archiveCharacter(id: string): Promise<CharacterRow> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('characters')
    .update({ is_archived: true })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error archiving character:', error)
    throw error
  }

  return data
}

/** -------------------------------------
 * Reactivate an archived character
 * --------------------------------------
 */
export async function reactivateCharacter(id: string): Promise<CharacterRow> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('characters')
    .update({ is_archived: false })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error reactivating character:', error)
    throw error
  }

  return data
}

/** -------------------------------------
 * Delete a character (permanent)
 * Only permitted when no active connections exist — enforced at DB level
 * --------------------------------------
 */
export async function deleteCharacter(id: string): Promise<void> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error deleting character:', error)
    throw error
  }

  if (!data || data.length === 0) {
    console.error('Delete character: no rows deleted (RLS may be blocking deletion for id:', id, ')')
    throw new Error('Character could not be deleted.')
  }
}

/** -------------------------------------
 * Add XP to a character
 * Returns the updated row and whether a level-up occurred
 * --------------------------------------
 */
export async function addXPToCharacter(
  id: string,
  xpGained: number
): Promise<{ character: CharacterRow; leveledUp: boolean; newLevel: number }> {
  const supabase = createClient()

  const { data: character, error: fetchError } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !character) throw fetchError || new Error('Character not found')

  let newCurrentXP = character.current_xp + xpGained
  let newLevel = character.level
  const previousLevel = character.level

  while (newCurrentXP >= character.xp_to_next_level) {
    newCurrentXP -= character.xp_to_next_level
    newLevel++
  }

  const { data, error } = await supabase
    .from('characters')
    .update({
      level: newLevel,
      current_xp: newCurrentXP,
      xp_to_next_level: calculateXPForLevel(newLevel),
      total_xp: character.total_xp + xpGained,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error adding XP to character:', error)
    throw error
  }

  return {
    character: data,
    leveledUp: newLevel > previousLevel,
    newLevel,
  }
}