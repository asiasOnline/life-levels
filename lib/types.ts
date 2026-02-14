/* #region View Mode */
export type ViewMode = 'grid' | 'table'
/* #endregion View Mode */

/* #region Task Types */
export type TaskStatus = 
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'on-hold';

export type TaskPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

  export type TaskDifficulty = 
  | 'easy'
  | 'medium'
  | 'hard'

export interface TaskInterface {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  status: TaskStatus;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  xpReward?: number;
}

// Helper objects for dropdowns
export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];
/* #endregion Task */

/* #region Stat Types */
export type StatType = 
  | 'health'
  | 'gold'
  | 'xp'
  | 'energy'
  | 'streak';

export type StatDisplayMode = 
  | 'progress'
  | 'numeric'
  | 'none';

export interface StatData {
  type: StatType;
  label: string;
  value: number;
  maxValue?: number; 
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  displayMode?: StatDisplayMode;
}
/* #endregion Stat Types */

/* #region Skill Types */
export interface SkillData {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  tags?: string[];
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  characterId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* #endregion Skill Types */

