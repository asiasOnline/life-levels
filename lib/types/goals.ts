import { IconData } from "@/lib/types/icon";

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