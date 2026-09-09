import { IconData, IconType } from "@/lib/types/icon";
import { Database } from "../database.types";
import type { SkillSummary } from "@/lib/types/skills";
import type { CharacterSummary } from "@/lib/types/character";

// ==================================
// ENUMS & CONSTANTS
// ==================================

export const GOAL_STATUS = {
  BACKLOG: 'backlog',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAUSED: 'paused',
} as const;

export type GoalStatus = typeof GOAL_STATUS[keyof typeof GOAL_STATUS];

export const GOAL_DIFFICULTY = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
  EXPERT: 'expert',
} as const;

export type GoalDifficulty = typeof GOAL_DIFFICULTY[keyof typeof GOAL_DIFFICULTY];

// Base XP values by difficulty (before distribution). Goals are a bigger
// commitment than a single Task, so these are set well above BASE_XP_VALUES
// in lib/types/tasks.ts.
export const GOAL_BASE_XP_VALUES: Record<GoalDifficulty, number> = {
  [GOAL_DIFFICULTY.EASY]:   200,
  [GOAL_DIFFICULTY.NORMAL]: 400,
  [GOAL_DIFFICULTY.HARD]:   800,
  [GOAL_DIFFICULTY.EXPERT]: 1600,
};

export const GOAL_DEFAULT_GOLD_REWARDS: Record<GoalDifficulty, number> = {
  [GOAL_DIFFICULTY.EASY]:   50,
  [GOAL_DIFFICULTY.NORMAL]: 100,
  [GOAL_DIFFICULTY.HARD]:   200,
  [GOAL_DIFFICULTY.EXPERT]: 400,
};

// ===========================================
// SUMMARY TYPE
// Lean shape for when a Goal appears in another feature's context
// (e.g. listed on a Skill detail page or a Character dashboard).
// ===========================================

export type GoalSummary = Pick<
  Goal, 
  'id' | 'title' | 'icon'
>;

// =====================================================
// MAIN TYPE
// No user_id — RLS enforces ownership; components never need it.
// Reward fields use frontend names (character_xp, skill_xp) — the toGoal mapper translates from DB column names (custom_character_xp, custom_skill_xp).
// =====================================================
export interface Goal {
    // Base content
    id: string;
    title: string;
    icon: IconData;
    description?: string;

    // Goal Details
    status: GoalStatus;
    difficulty: GoalDifficulty;
    start_date?: Date;
    due_date?: Date;

    // Rewards
    use_custom_xp: boolean;
    character_xp?: number;
    skill_xp?: number;

    // Timestamps
    created_at: Date;
    updated_at: Date;
  }

// ======================================
// GOAL WITH RELATIONS
// Used on the Goal detail page and anywhere the full relational picture is
// needed. The base Goal type is kept lean for list views and cards.
// ======================================

export interface GoalWithRelations extends Goal {
  skills:     SkillSummary[];      // 1–3; hydrated from goal_skills join
  characters: CharacterSummary[];  // 1–3; hydrated from goal_characters join
}

// ========================================
// INPUT TYPES
// _ids arrays are flat ID lists — the action translates them into junction
// table rows using the delete-then-insert pattern.
// ========================================

export interface CreateGoalInput {
  title:        string;
  icon?:        string;
  icon_type?:   IconType;
  icon_color?:  string;
  description?: string;

  difficulty:  GoalDifficulty;
  start_date?: string;
  due_date?:   string;

  // Rewards — omit to use algorithm output; provide both to override
  gold_reward?:  number;
  use_custom_xp?: boolean;
  character_xp?: number;
  skill_xp?:     number;

  skill_ids?:     string[];   // Optional, max 3 — enforced by action guard
  character_ids?: string[];   // Optional, max 3 — enforced by action guard
}

export interface UpdateGoalInput {
  id: string;

  title?:        string;
  icon?:        string;
  icon_type?:   IconType;
  icon_color?:  string;
  description?:  string | null;

  status?:     GoalStatus;
  difficulty?: GoalDifficulty;
  start_date?: string | null;
  due_date?:   string | null;

  gold_reward?:  number;
  use_custom_xp?: boolean;
  character_xp?: number | null;
  skill_xp?:     number | null;

  // Full replacement when provided; omit to leave existing links unchanged
  skill_ids?:     string[];
  character_ids?: string[];
}

// ============================================
// REWARD CALCULATION TYPES
// Used by lib/utils/goals.ts — defined here so the return type is
// importable by both utils and actions without a circular dependency.
// ============================================

export interface GoalRewardResult {
  character_xp: number;  // Awarded in full to every linked Character (not split)
  skill_xp:     number;  // Per-skill amount (pool ÷ skill count, remainder discarded)
  gold:         number;
}

// =================================================
// MAPPER — DB row → frontend Goal type
// Called in lib/actions/goals.ts immediately after a Supabase fetch.
// ==================================================

type GoalRow = Database['public']['Tables']['goals']['Row'];

export function toGoal(row: GoalRow): Goal {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description ?? undefined,
    icon:        row.icon as unknown as IconData,
    status:      row.status as GoalStatus,
    difficulty:  row.difficulty as GoalDifficulty,

    start_date: row.start_date ? new Date(row.start_date) : undefined,
    due_date:   row.due_date   ? new Date(row.due_date)   : undefined,

    use_custom_xp: row.use_custom_xp,
    character_xp:  row.character_xp ?? undefined,
    skill_xp:      row.skill_xp     ?? undefined,

    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}