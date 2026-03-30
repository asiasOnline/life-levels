import { IconData, IconType } from "@/lib/types/icon";
import { Database } from "../database.types";
import type { SkillSummary } from "@/lib/types/skills";
import type { CharacterSummary } from "@/lib/types/character";

// ==================================
// ENUMS & CONSTANTS
// ==================================
export const TASK_STATUS = {
  BACKLOG: 'backlog',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAUSED: 'paused',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export const TASK_DIFFICULTY = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
  EXPERT: 'expert',
} as const;

export type TaskDifficulty = typeof TASK_DIFFICULTY[keyof typeof TASK_DIFFICULTY];

export const TASK_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MID: 'mid',
  LOW: 'low',
} as const;

export type TaskPriority = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];

// Display labels
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TASK_STATUS.BACKLOG]: 'Backlog',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.COMPLETED]: 'Completed',
  [TASK_STATUS.PAUSED]: 'Paused',
};

export const TASK_DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  [TASK_DIFFICULTY.EASY]: 'Easy',
  [TASK_DIFFICULTY.NORMAL]: 'Normal',
  [TASK_DIFFICULTY.HARD]: 'Hard',
  [TASK_DIFFICULTY.EXPERT]: 'Expert',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TASK_PRIORITY.CRITICAL]: 'Critical',
  [TASK_PRIORITY.HIGH]: 'High',
  [TASK_PRIORITY.MID]: 'Mid',
  [TASK_PRIORITY.LOW]: 'Low',
};

// Default gold rewards by difficulty
export const DEFAULT_GOLD_REWARDS: Record<TaskDifficulty, number> = {
  [TASK_DIFFICULTY.EASY]: 10,
  [TASK_DIFFICULTY.NORMAL]: 25,
  [TASK_DIFFICULTY.HARD]: 50,
  [TASK_DIFFICULTY.EXPERT]: 100,
};

// Base XP values by difficulty (before distribution)
export const BASE_XP_VALUES: Record<TaskDifficulty, number> = {
  [TASK_DIFFICULTY.EASY]: 50,
  [TASK_DIFFICULTY.NORMAL]: 100,
  [TASK_DIFFICULTY.HARD]: 200,
  [TASK_DIFFICULTY.EXPERT]: 400,
};

// =====================================================
// MAIN TASK TYPE
// No user_id — RLS enforces ownership; components never need it.
// Reward fields use frontend names (character_xp, skill_xp) — the toHabit mapper translates from DB column names (custom_character_xp, custom_skill_xp).
// =====================================================
export interface Task {
  // Base content
  id: string;
  icon: IconData;
  title: string;
  description?: string;

  // Task Details
  status: TaskStatus;
  difficulty: TaskDifficulty;
  priority: TaskPriority;
  start_date?: Date;
  due_date?: Date;

  // Rewards
  gold_reward: number;
  use_custom_xp: boolean;
  character_xp?: number;
  skill_xp?: number;

  // Timestamps
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// =======================================
// TASK WITH RELATIONS
// Used on the Task detail page and anywhere the full relational picture is needed. The base Task type is kept lean for list views and cards.
// =======================================

export interface TaskWithRelations extends Task {
  skills: SkillSummary[]; // 1–3; hydrated from task_skills join
  characters: CharacterSummary[]; // 1 to all active; hydrated from task_characters join
  goal_ids?: string[]; // IDs only; goals resolved separately when needed
}

// =======================================
// INPUT TYPES
// _ids arrays are flat ID lists — the action translates them into junction table rows using the delete-then-insert pattern.
// =======================================

export interface CreateTaskInput {
    title: string
    description?: string
    icon?: string
    icon_type?: IconType
    icon_color?: string

    status?: TaskStatus
    priority: TaskPriority
    difficulty: TaskDifficulty
    start_date?: string
    due_date?: string

    skill_ids:     string[];   // Min 1, max 3 — enforced by DB trigger + action guard
    character_ids: string[];   // Min 1 — enforced by action guard
    goal_ids?:     string[];   // Optional parent Goals
    gold_reward: number
    use_custom_xp?: boolean
    character_xp: number
    skill_xp: number
}

export interface UpdateTaskInput {
    id: string;
    title?: string
    description?: string
    icon?: string
    icon_type?: IconType
    icon_color?: string
    status?: TaskStatus
    priority?: TaskPriority
    difficulty?: TaskDifficulty
    start_date?: string
    due_date?: string
    // Full replacement when provided; omit to leave existing links unchanged
    skill_ids?:     string[];
    character_ids?: string[];
    goal_ids?:      string[];
    
    gold_reward?: number
    use_custom_xp?: boolean
    character_xp?: number
    skill_xp?: number
}

// =================================================
// MAPPER — DB row → frontend Task type
// Called in lib/actions/tasks.ts immediately after a Supabase fetch.
// Responsibilities:
//   - Strips user_id
//   - Casts JSONB icon column to IconData
//   - Translates DB column names (custom_character_xp / custom_skill_xp)
//     to the frontend names (character_xp / skill_xp)
//   - Unwraps nullable DB fields to undefined so components get a clean shape
// ==================================================

type TaskRow = Database['public']['Tables']['tasks']['Row'];

export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    icon: row.icon as unknown as IconData,

    // Task details
    status: row.status as TaskStatus,
    difficulty: row.difficulty as TaskDifficulty,
    priority: row.priority as TaskPriority,
    start_date: row.start_date ? new Date(row.start_date) : undefined,
    due_date: row.due_date ? new Date(row.due_date) : undefined,
    gold_reward: row.gold_reward,
    use_custom_xp: row.use_custom_xp,
    character_xp: row.character_xp ?? undefined,
    skill_xp: row.skill_xp ?? undefined,
    completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }
}