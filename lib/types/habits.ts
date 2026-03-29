import { IconData, IconType } from "@/lib/types/icon";
import { Database } from "../database.types";
import type { SkillSummary } from "@/lib/types/skills";
import type { CharacterSummary } from "@/lib/types/character";

// ==========================================
// ENUMS & CONSTANTS
// ===========================================

export const HABIT_STATUS = {
  ACTIVE:   'active',
  PAUSED:   'paused',
  ARCHIVED: 'archived',
} as const;

export type HabitStatus = typeof HABIT_STATUS[keyof typeof HABIT_STATUS];

export const HABIT_RECURRENCE = {
  DAILY:      'daily',
  WEEKDAYS:   'weekdays',
  X_PER_WEEK: 'x_per_week',
  WEEKLY:     'weekly',
  BI_WEEKLY:  'bi_weekly',
  MONTHLY:    'monthly',
  CUSTOM:     'custom',
} as const;

export type HabitRecurrence = typeof HABIT_RECURRENCE[keyof typeof HABIT_RECURRENCE];

export const HABIT_COMPLETION_TIME = {
  MORNING:   'morning',
  AFTERNOON: 'afternoon',
  EVENING:   'evening',
  OVERNIGHT: 'overnight',
} as const;

export type HabitCompletionTime = typeof HABIT_COMPLETION_TIME[keyof typeof HABIT_COMPLETION_TIME];

// =================================================
// CUSTOM RECURRENCE CONFIG
// Structured JSONB stored in habits.custom_recurrence_config.
// Only populated when recurrence = 'custom'.
// =================================================

export type HabitCustomRecurrenceUnit    = 'day' | 'week' | 'month';
export type HabitCustomRecurrenceEndType = 'never' | 'on_date' | 'after_occurrences';

export interface HabitCustomRecurrenceConfig {
  interval:     number;                        // Every N units; must be > 0
  unit:         HabitCustomRecurrenceUnit;
  end_type:     HabitCustomRecurrenceEndType;
  end_date?:    string;                        // ISO date string; only when end_type = 'on_date'
  occurrences?: number;                        // Only when end_type = 'after_occurrences'
}

// ===========================================
// SUMMARY TYPE
// Lean shape for when a Habit appears in another feature's context
// (e.g. listed on a Goal detail page or a Character dashboard).
// ===========================================

export type HabitSummary = Pick<
  Habit,
  'id' | 'title' | 'icon' | 'recurrence' | 'completion_time' | 'status'
>;

// =============================================
// MAIN HABIT TYPE
// No user_id — RLS enforces ownership; components never need it.
// Reward fields use frontend names (character_xp, skill_xp) — the toHabit mapper translates from DB column names (custom_character_xp, custom_skill_xp).
// =============================================

export interface Habit {
  // Base content
  id:           string;
  icon:         IconData;
  title:        string;
  description?: string;
  status:       HabitStatus;

  // Recurrence
  recurrence:                HabitRecurrence;
  x_per_week_count?:         number;      // Only when recurrence = 'x_per_week'
  x_per_week_days?:          number[];    // Optional specific days (0 = Sun … 6 = Sat)
  weekly_day?:               number;      // 0–6; only when recurrence = 'weekly'
  monthly_day?:              number;      // 1–31; only when recurrence = 'monthly'
  custom_recurrence_config?: HabitCustomRecurrenceConfig; // Only when recurrence = 'custom'

  // Scheduling
  time_consumption:  number;              // Average minutes; always > 0
  completion_time?:  HabitCompletionTime;

  // Rewards
  gold_reward:   number;
  use_custom_xp: boolean;
  character_xp:  number;   // Per-character award (full amount, not split)
  skill_xp:      number;   // Per-skill award (already divided by skill count)

  // Timestamps
  paused_at?:   string;
  archived_at?: string;

  created_at: string;
  updated_at: string;
}

// ===================================================
// HABIT WITH RELATIONS
// Used on the Habit detail page and anywhere the full relational picture is needed. The base Habit type is kept lean for list views and cards.
// ====================================================

export interface HabitWithRelations extends Habit {
  skills:     SkillSummary[];      // 1–3; hydrated from habit_skills join
  characters: CharacterSummary[];  // 1 to all active; hydrated from habit_characters join
  goal_ids?:  string[];            // IDs only; goals resolved separately when needed
}

// ========================================
// INPUT TYPES
// _ids arrays are flat ID lists — the action translates them into junction table rows using the delete-then-insert pattern.
// ========================================

export interface CreateHabitInput {
  title:        string;
  icon?:        string
  icon_type?:   IconType
  icon_color?:  string
  description?: string;

  recurrence:                HabitRecurrence;
  x_per_week_count?:         number;
  x_per_week_days?:          number[];
  weekly_day?:               number;
  monthly_day?:              number;
  custom_recurrence_config?: HabitCustomRecurrenceConfig;

  time_consumption:  number;
  completion_time?:  HabitCompletionTime;

  // Rewards — omit to use algorithm output; provide both to override
  gold_reward?:         number;
  use_custom_xp?:       boolean;
  character_xp?: number;
  skill_xp?:     number;

  skill_ids:     string[];   // Min 1, max 3 — enforced by DB trigger + action guard
  character_ids: string[];   // Min 1 — enforced by action guard
  goal_ids?:     string[];   // Optional parent Goals
}

export interface UpdateHabitInput {
  id: string;

  title?:        string;
  icon?:        string
  icon_type?:   IconType
  icon_color?:  string
  description?:  string | null;

  recurrence?:               HabitRecurrence;
  x_per_week_count?:         number | null;
  x_per_week_days?:          number[] | null;
  weekly_day?:               number | null;
  monthly_day?:              number | null;
  custom_recurrence_config?: HabitCustomRecurrenceConfig | null;

  time_consumption?: number;
  completion_time?:  HabitCompletionTime | null;

  gold_reward?:         number;
  use_custom_xp?:       boolean;
  character_xp?: number | null;
  skill_xp?:     number | null;

  // Full replacement when provided; omit to leave existing links unchanged
  skill_ids?:     string[];
  character_ids?: string[];
  goal_ids?:      string[];
}

// Separate from UpdateHabitInput because status transitions have side-effects (timestamp writes, consistency window freeze) that a generic update should not trigger accidentally. Reactivation uses UpdateHabitInput with status: 'active'.
export interface ArchiveHabitInput {
  id:     string;
  status: 'paused' | 'archived';
}

// ============================================
// REWARD CALCULATION TYPES
// Used by lib/utils/habit.ts — defined here so the return type is importable
// by both utils and actions without a circular dependency.
// ============================================

// Time bucket derived from time_consumption; indexes all reward/energy tables.
export type HabitTimeBucket = 'quick' | 'medium' | 'extended' | 'long';

export interface HabitRewardResult {
  character_xp: number;  // Awarded in full to every linked Character (not split)
  skill_xp:     number;  // Total pool; action divides by skillCount, remainder discarded
  gold:         number;
  energy_cost:  number;
}

// =================================================
// MAPPER — DB row → frontend Habit type
// Called in lib/actions/habits.ts immediately after a Supabase fetch.
// Responsibilities:
//   - Strips user_id
//   - Casts JSONB icon column to IconData
//   - Translates DB column names (custom_character_xp / custom_skill_xp)
//     to the frontend names (character_xp / skill_xp)
//   - Unwraps nullable DB fields to undefined so components get a clean shape
// ==================================================

type HabitRow = Database['public']['Tables']['habits']['Row'];

export function toHabit(row: HabitRow): Habit {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description ?? undefined,
    icon:        row.icon as unknown as IconData,
    status:      row.status as HabitStatus,

    // Recurrence
    recurrence:               row.recurrence as HabitRecurrence,
    x_per_week_count:         row.x_per_week_count  ?? undefined,
    x_per_week_days:          row.x_per_week_days   ?? undefined,
    weekly_day:               row.weekly_day        ?? undefined,
    monthly_day:              row.monthly_day       ?? undefined,
    custom_recurrence_config: row.custom_recurrence_config
                                ? (row.custom_recurrence_config as unknown as HabitCustomRecurrenceConfig)

                                : undefined,

    // Scheduling
    time_consumption: row.time_consumption,
    completion_time:  row.completion_time
                        ? (row.completion_time as HabitCompletionTime)
                        : undefined,

    // Rewards — DB uses custom_* prefix; frontend drops it
    gold_reward:   row.gold_reward,
    use_custom_xp: row.use_custom_xp,
    character_xp:  row.character_xp ?? 0,
    skill_xp:      row.skill_xp     ?? 0,

    // Timestamps
    paused_at:   row.paused_at   ?? undefined,
    archived_at: row.archived_at ?? undefined,

    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}