import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { 
  IconData, 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR  
} from '@/lib/types/icon'
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
  icon?: IconData
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