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
  MONTHLY: 'monthly'
} as const;

export type HabitRecurrence = typeof HABIT_RECURRENCE[keyof typeof HABIT_RECURRENCE];

export const HABIT_COMPLETION_TIME = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  OVERNIGHT: 'overnight'
} as const;

export type HabitCompletionTime = typeof HABIT_COMPLETION_TIME [keyof typeof HABIT_COMPLETION_TIME];

// =====================================================
// MAIN TYPE
// =====================================================
export interface Habit {
    id: string;
    icon: IconData;
    title: string;
    description?: string;
    status: HabitStatus;
    recurrence: HabitRecurrence;
    x_per_week_count: number | null;
    x_per_week_days: number[] | null;
    weekly_day: number | null;
    monthly_day: number | null;
    time_consumption: number
    completion_time: HabitCompletionTime | null
    gold_reward: number
    use_custom_xp: boolean
    custom_character_xp: number | null
    custom_skill_xp: number | null
    paused_at: string | null
    archived_at: string | null
    created_at: string
    updated_at: string
}