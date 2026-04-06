export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      characters: {
        Row: {
          avatar: Json | null
          color_theme: string
          created_at: string
          current_xp: number
          description: string | null
          icon: Json
          id: string
          is_archived: boolean
          level: number
          skin_tone: string
          title: string
          total_xp: number
          updated_at: string
          user_id: string
          xp_to_next_level: number
        }
        Insert: {
          avatar?: Json | null
          color_theme: string
          created_at?: string
          current_xp?: number
          description?: string | null
          icon?: Json
          id?: string
          is_archived?: boolean
          level?: number
          skin_tone?: string
          title: string
          total_xp?: number
          updated_at?: string
          user_id: string
          xp_to_next_level?: number
        }
        Update: {
          avatar?: Json | null
          color_theme?: string
          created_at?: string
          current_xp?: number
          description?: string | null
          icon?: Json
          id?: string
          is_archived?: boolean
          level?: number
          skin_tone?: string
          title?: string
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp_to_next_level?: number
        }
        Relationships: []
      }
      goal_characters: {
        Row: {
          character_id: string
          created_at: string
          goal_id: string
          id: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          goal_id: string
          id?: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          goal_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_characters_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_skills: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          skill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          skill_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_skills_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          character_xp: number
          completed_at: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["goal_difficulty"]
          due_date: string | null
          goal_type: Database["public"]["Enums"]["goal_type"] | null
          goal_type_config: Json | null
          gold_reward: number
          icon: Json
          id: string
          overdue_notification_sent: boolean
          skill_xp: number
          start_date: string | null
          status: Database["public"]["Enums"]["goal_status"]
          title: string
          updated_at: string
          use_custom_gold: boolean
          use_custom_xp: boolean
          user_id: string
        }
        Insert: {
          character_xp: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["goal_difficulty"]
          due_date?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"] | null
          goal_type_config?: Json | null
          gold_reward?: number
          icon?: Json
          id?: string
          overdue_notification_sent?: boolean
          skill_xp: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          title: string
          updated_at?: string
          use_custom_gold?: boolean
          use_custom_xp?: boolean
          user_id: string
        }
        Update: {
          character_xp?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["goal_difficulty"]
          due_date?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"] | null
          goal_type_config?: Json | null
          gold_reward?: number
          icon?: Json
          id?: string
          overdue_notification_sent?: boolean
          skill_xp?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          title?: string
          updated_at?: string
          use_custom_gold?: boolean
          use_custom_xp?: boolean
          user_id?: string
        }
        Relationships: []
      }
      habit_characters: {
        Row: {
          character_id: string
          created_at: string
          habit_id: string
          id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          habit_id: string
          id?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          habit_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_characters_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_goals: {
        Row: {
          created_at: string
          goal_id: string
          habit_id: string
          id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          habit_id: string
          id?: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          habit_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_goals_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_skills: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          skill_id: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          skill_id: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_skills_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived_at: string | null
          character_xp: number
          completion_time:
            | Database["public"]["Enums"]["habit_completion_time"]
            | null
          created_at: string
          custom_recurrence_config: Json | null
          description: string | null
          gold_reward: number
          icon: Json
          id: string
          monthly_day: number | null
          paused_at: string | null
          recurrence: Database["public"]["Enums"]["habit_recurrence"]
          skill_xp: number
          status: Database["public"]["Enums"]["habit_status"]
          time_consumption: number
          title: string
          updated_at: string
          use_custom_gold: boolean
          use_custom_xp: boolean
          user_id: string
          weekly_day: number | null
          x_per_week_count: number | null
          x_per_week_days: number[] | null
        }
        Insert: {
          archived_at?: string | null
          character_xp: number
          completion_time?:
            | Database["public"]["Enums"]["habit_completion_time"]
            | null
          created_at?: string
          custom_recurrence_config?: Json | null
          description?: string | null
          gold_reward?: number
          icon?: Json
          id?: string
          monthly_day?: number | null
          paused_at?: string | null
          recurrence: Database["public"]["Enums"]["habit_recurrence"]
          skill_xp: number
          status?: Database["public"]["Enums"]["habit_status"]
          time_consumption: number
          title: string
          updated_at?: string
          use_custom_gold: boolean
          use_custom_xp?: boolean
          user_id: string
          weekly_day?: number | null
          x_per_week_count?: number | null
          x_per_week_days?: number[] | null
        }
        Update: {
          archived_at?: string | null
          character_xp?: number
          completion_time?:
            | Database["public"]["Enums"]["habit_completion_time"]
            | null
          created_at?: string
          custom_recurrence_config?: Json | null
          description?: string | null
          gold_reward?: number
          icon?: Json
          id?: string
          monthly_day?: number | null
          paused_at?: string | null
          recurrence?: Database["public"]["Enums"]["habit_recurrence"]
          skill_xp?: number
          status?: Database["public"]["Enums"]["habit_status"]
          time_consumption?: number
          title?: string
          updated_at?: string
          use_custom_gold?: boolean
          use_custom_xp?: boolean
          user_id?: string
          weekly_day?: number | null
          x_per_week_count?: number | null
          x_per_week_days?: number[] | null
        }
        Relationships: []
      }
      login_history: {
        Row: {
          comeback_triggered: boolean
          created_at: string
          days_missed: number
          id: string
          login_date: string
          momentum_after: number
          momentum_before: number
          momentum_decayed: number
          momentum_gained: number
          resilience_awarded: number
          user_id: string
        }
        Insert: {
          comeback_triggered?: boolean
          created_at?: string
          days_missed?: number
          id?: string
          login_date: string
          momentum_after?: number
          momentum_before?: number
          momentum_decayed?: number
          momentum_gained?: number
          resilience_awarded?: number
          user_id: string
        }
        Update: {
          comeback_triggered?: boolean
          created_at?: string
          days_missed?: number
          id?: string
          login_date?: string
          momentum_after?: number
          momentum_before?: number
          momentum_decayed?: number
          momentum_gained?: number
          resilience_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_characters: {
        Row: {
          character_id: string
          created_at: string
          id: string
          skill_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          skill_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_characters_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string | null
          current_xp: number | null
          description: string | null
          icon: Json | null
          id: string
          level: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          xp_to_next_level: number | null
        }
        Insert: {
          created_at?: string | null
          current_xp?: number | null
          description?: string | null
          icon?: Json | null
          id?: string
          level?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          xp_to_next_level?: number | null
        }
        Update: {
          created_at?: string | null
          current_xp?: number | null
          description?: string | null
          icon?: Json | null
          id?: string
          level?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          xp_to_next_level?: number | null
        }
        Relationships: []
      }
      task_characters: {
        Row: {
          character_id: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_task_characters_character_id"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_characters_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_goals: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_task_goals_goal_id"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_goals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_skills: {
        Row: {
          created_at: string
          id: string
          skill_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skill_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skill_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_skills_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          character_xp: number
          completed_at: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["task_difficulty"]
          due_date: string | null
          gold_reward: number
          icon: Json
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          skill_xp: number
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          use_custom_gold: boolean
          use_custom_xp: boolean
          user_id: string
        }
        Insert: {
          character_xp: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_date?: string | null
          gold_reward?: number
          icon?: Json
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          skill_xp: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          use_custom_gold?: boolean
          use_custom_xp?: boolean
          user_id: string
        }
        Update: {
          character_xp?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_date?: string | null
          gold_reward?: number
          icon?: Json
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          skill_xp?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          use_custom_gold?: boolean
          use_custom_xp?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          energy_baseline: number
          energy_current: number
          energy_last_checkin_date: string | null
          energy_reset_time: string
          gold: number
          id: string
          last_login_date: string | null
          momentum: number
          momentum_all_time_high: number
          resilience: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_baseline?: number
          energy_current?: number
          energy_last_checkin_date?: string | null
          energy_reset_time?: string
          gold?: number
          id?: string
          last_login_date?: string | null
          momentum?: number
          momentum_all_time_high?: number
          resilience?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          energy_baseline?: number
          energy_current?: number
          energy_last_checkin_date?: string | null
          energy_reset_time?: string
          gold?: number
          id?: string
          last_login_date?: string | null
          momentum?: number
          momentum_all_time_high?: number
          resilience?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          notes: string | null
          referral_source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          referral_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          referral_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_task_xp: {
        Args: {
          character_count?: number
          difficulty: Database["public"]["Enums"]["task_difficulty"]
          skill_count: number
        }
        Returns: {
          character_xp: number
          skill_xp: number
        }[]
      }
      get_default_gold_reward: {
        Args: { difficulty: Database["public"]["Enums"]["task_difficulty"] }
        Returns: number
      }
    }
    Enums: {
      goal_difficulty: "easy" | "normal" | "hard" | "expert"
      goal_status: "backlog" | "in_progress" | "paused" | "completed"
      goal_type: "time_based" | "skill_level_based" | "habit_consistency_based"
      habit_completion_time: "morning" | "afternoon" | "evening" | "overnight"
      habit_recurrence:
        | "daily"
        | "weekdays"
        | "x_per_week"
        | "weekly"
        | "bi_weekly"
        | "monthly"
        | "custom"
      habit_status: "active" | "paused" | "archived"
      task_difficulty: "easy" | "normal" | "hard" | "expert"
      task_priority: "critical" | "high" | "mid" | "low"
      task_status: "backlog" | "in_progress" | "completed" | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      goal_difficulty: ["easy", "normal", "hard", "expert"],
      goal_status: ["backlog", "in_progress", "paused", "completed"],
      goal_type: ["time_based", "skill_level_based", "habit_consistency_based"],
      habit_completion_time: ["morning", "afternoon", "evening", "overnight"],
      habit_recurrence: [
        "daily",
        "weekdays",
        "x_per_week",
        "weekly",
        "bi_weekly",
        "monthly",
        "custom",
      ],
      habit_status: ["active", "paused", "archived"],
      task_difficulty: ["easy", "normal", "hard", "expert"],
      task_priority: ["critical", "high", "mid", "low"],
      task_status: ["backlog", "in_progress", "completed", "paused"],
    },
  },
} as const
