import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { 
  IconType, 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR  
} from '@/lib/types/icon'

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
  icon_type: IconType
  icon_color?: string
  color_theme: string
}

// =======================================
// DATABASE FUNCTIONS
// =======================================

/** -------------------------------------
 * Fetch all skills for the current user
 * --------------------------------------
 */