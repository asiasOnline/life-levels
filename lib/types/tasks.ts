// =====================================================
// ENUMS & CONSTANTS
// =====================================================
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
// ICON TYPE (reused from Skills)
// =====================================================
export interface IconData {
  type: 'emoji' | 'fontawesome' | 'image';
  value: string;
  color?: string; // For FontAwesome icons
}

// =====================================================
// DATABASE TYPES
// =====================================================
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: IconData;
  status: TaskStatus;
  difficulty: TaskDifficulty;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  gold_reward: number;
  use_custom_xp: boolean;
  custom_character_xp: number | null;
  custom_skill_xp: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskSkill {
  id: string;
  task_id: string;
  skill_id: string;
  created_at: string;
}

export interface TaskCharacter {
  id: string;
  task_id: string;
  character_id: string;
  created_at: string;
}

export interface TaskGoal {
  id: string;
  task_id: string;
  goal_id: string;
  created_at: string;
}

// =====================================================
// EXTENDED TYPES WITH RELATIONSHIPS
// =====================================================
export interface TaskWithSkills extends Task {
  task_skills: (TaskSkill & {
    skills: {
      id: string;
      title: string;
      icon: IconData;
      level: number;
    };
  })[];
}

export interface TaskWithRelations extends Task {
  skills: {
    id: string;
    title: string;
    icon: IconData;
    level: number;
  }[];
  characters?: {
    id: string;
    name: string;
    icon: IconData;
  }[];
  goals?: {
    id: string;
    title: string;
    icon: IconData;
  }[];
}

// =====================================================
// FORM TYPES
// =====================================================
export interface CreateTaskInput {
  title: string;
  description?: string;
  icon: IconData;
  status?: TaskStatus; // Optional, defaults to 'backlog'
  priority?: TaskPriority  // Optional, defaults to 'mid'
  difficulty: TaskDifficulty;
  start_date?: string;
  due_date?: string;
  gold_reward?: number; // Optional, will use default if not provided
  use_custom_xp?: boolean;
  custom_character_xp?: number;
  custom_skill_xp?: number;
  skill_ids: string[]; // Must have 1-3 skills
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  skill_ids?: string[]; // Optional for updates
}