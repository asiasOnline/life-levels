export type TaskStatus = 'backlog' | 'in_progress' | 'completed' | 'paused'
export type TaskDifficulty = 'easy' | 'normal' | 'hard' | 'expert'
export type TaskPriority = 'critical' | 'high' | 'mid' | 'low'

export interface IconData {
  type: 'emoji' | 'fontawesome' | 'image'
  value: string
  color?: string
}

export interface CharacterAvatarData {
  archetype_id: string
  skin_tone: string
  clothing_color: string | null // null = clothing inherits character's color theme
}

export interface Database {
  public: {
    Tables: {
      characters: {
        Row: {
          id: string
          user_id: string
          icon: IconData
          title: string
          color_theme: string
          description: string | null
          avatar: CharacterAvatarData | null
          level: number
          current_xp: number
          xp_to_next_level: number
          total_xp: number
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          icon?: IconData
          title: string
          color_theme: string
          description?: string | null
          avatar?: CharacterAvatarData | null
          level?: number
          current_xp?: number
          xp_to_next_level?: number
          total_xp?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          icon?: IconData
          title?: string
          color_theme?: string
          description?: string | null
          avatar?: CharacterAvatarData | null
          level?: number
          current_xp?: number
          xp_to_next_level?: number
          total_xp?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      skill_characters: {
        Row: {
          id: string
          skill_id: string
          character_id: string
          created_at: string
        }
        Insert: {
          id?: string
          skill_id: string
          character_id: string
          created_at?: string
        }
        Update: {
          id?: string
          skill_id?: string
          character_id?: string
          created_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          icon: IconData
          level: number
          current_xp: number
          xp_to_next_level: number
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          icon: IconData
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
          icon: IconData
          level?: number
          current_xp?: number
          xp_to_next_level?: number
          tags?: string[]
          character_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          icon: IconData
          status: TaskStatus
          difficulty: TaskDifficulty
          priority: TaskPriority
          start_date: string | null
          due_date: string | null
          completed_at: string | null
          gold_reward: number
          use_custom_xp: boolean
          custom_character_xp: number | null
          custom_skill_xp: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          icon?: IconData
          status?: TaskStatus
          difficulty?: TaskDifficulty
          priority: TaskPriority
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          gold_reward?: number
          use_custom_xp?: boolean
          custom_character_xp?: number | null
          custom_skill_xp?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          icon?: IconData
          status?: TaskStatus
          difficulty?: TaskDifficulty
          priority: TaskPriority
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          gold_reward?: number
          use_custom_xp?: boolean
          custom_character_xp?: number | null
          custom_skill_xp?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      task_skills: {
        Row: {
          id: string
          task_id: string
          skill_id: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          skill_id: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          skill_id?: string
          created_at?: string
        }
      }
      task_characters: {
        Row: {
          id: string
          task_id: string
          character_id: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          character_id: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          character_id?: string
          created_at?: string
        }
      }
      task_goals: {
        Row: {
          id: string
          task_id: string
          goal_id: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          goal_id: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          goal_id?: string
          created_at?: string
        }
      }
    }
  }
}