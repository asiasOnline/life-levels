import { IconData } from "@/lib/types/icon";

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
// MAIN TYPE
// =====================================================
export interface Task extends IconData {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  difficulty: TaskDifficulty;
  priority: TaskPriority;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  goldReward: number;
  useCustomXP: boolean;
  customCharacterXP?: number;
  customSkillXP?: number;
  createdAt: Date;
  updatedAt: Date;
}