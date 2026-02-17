export type TaskStatus = 'backlog' | 'in_progress' | 'completed' | 'paused'
export type TaskDifficulty = 'easy' | 'normal' | 'hard' | 'expert'
export type TaskPriority = 'critical' | 'high' | 'mid' | 'low'

export interface IconData {
  type: 'emoji' | 'icon' | 'image'
  value: string
  color?: string
}

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