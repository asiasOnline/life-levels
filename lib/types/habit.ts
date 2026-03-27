import { IconData } from "@/lib/types/icon";

// ==================================
// ENUMS & CONSTANTS
// ==================================
export const HABIT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived'
} as const;

export type HabitStatus = typeof HABIT_STATUS[keyof typeof HABIT_STATUS];

export const HABIT_RECURRENCE = {
  DAILY: 'daily',
  WEEKDAYS: 'weekdays',
  X_PER_WEEK: 'x_per_week',
  WEEKLY: 'weekly',
  BI_WEEKLY: 'bi_weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom' 
} as const;

export type HabitRecurrence = typeof HABIT_RECURRENCE[keyof typeof HABIT_RECURRENCE];

export const HABIT_COMPLETION_TIME = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  OVERNIGHT: 'overnight'
} as const;

export type HabitCompletionTime = typeof HABIT_COMPLETION_TIME [keyof typeof HABIT_COMPLETION_TIME];

// ===============================================
// CUSTOM RECURRENCE CONFIG
// Structured JSONB stored in habits.custom_recurrence_config.
// Only populated when recurrence = 'custom'.
// ===============================================

export type HabitCustomRecurrenceUnit = "day" | "week" | "month";
export type HabitCustomRecurrenceEndType = "never" | "on_date" | "after_occurrences";
 
export interface HabitCustomRecurrenceConfig {
  interval: number;                        // Every N units; must be > 0
  unit: HabitCustomRecurrenceUnit;
  end_type: HabitCustomRecurrenceEndType;
  end_date?: string;                       // ISO date string; only when end_type = 'on_date'
  occurrences?: number;                    // Only when end_type = 'after_occurrences'
}

// =================================
// SHARED / SUMMARY
// =================================
// Reusable slim shape for when Characters appear in other contexts
// (e.g. on a Task or Habit form)
export type HabitSummary = Pick<
  Habit, 
  "id" | "title" | "icon" | "recurrence" | "completion_time" | "status"
>;

// =====================================================
// MAIN TYPE
// =====================================================
export interface Habit {
  // Base Content
    id: string;
    icon: IconData;
    title: string;
    description?: string;
    status: HabitStatus;

    // Recurrence
    recurrence: HabitRecurrence;
    x_per_week_count?: number;
    x_per_week_days?: number[];
    weekly_day?: number;
    monthly_day?: number;
    custom_recurrence_config?: HabitCustomRecurrenceConfig;

    // Scheduling
    time_consumption: number;
    completion_time?: HabitCompletionTime;

    // Rewards
    gold_reward: number;
    use_custom_xp: boolean;
    character_xp: number;
    skill_xp: number;

    // Timestamps
    paused_at?: string;
    archived_at?: string;
    created_at: string;
    updated_at: string;
}