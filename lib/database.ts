export interface Database {
  public: {
    Tables: {
      skills: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          icon: string
          icon_type: string
          icon_color: string  
          level: number
          current_xp: number
          xp_to_next_level: number
          tags: string[]
          character_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          icon?: string
          icon_type?: string
          icon_color?: string  
          level?: number
          current_xp?: number
          xp_to_next_level?: number
          tags?: string[]
          character_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          icon?: string
          icon_type?: string
          icon_color?: string    
          level?: number
          current_xp?: number
          xp_to_next_level?: number
          tags?: string[]
          character_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}