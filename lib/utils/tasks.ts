import { 
  TaskDifficulty, 
  BASE_XP_VALUES, 
  DEFAULT_GOLD_REWARDS, 
  Task, 
  TASK_STATUS, 
  TaskStatus, 
  TASK_DIFFICULTY, 
  TaskPriority, 
  TASK_PRIORITY 
} from "@/lib/types/tasks";


/**
 * Calculate XP rewards based on difficulty and linked entities
 */
export function calculateTaskXP(
  difficulty: TaskDifficulty,
  skillCount: number,
  characterCount: number = 1
): { characterXP: number; skillXP: number } {
  const baseXP = BASE_XP_VALUES[difficulty];
  
  return {
    characterXP: Math.floor(baseXP / Math.max(characterCount, 1)),
    skillXP: Math.floor(baseXP / Math.max(skillCount, 1)),
  };
}

/**
 * Get default gold reward for a difficulty level
 */
export function getDefaultGoldReward(difficulty: TaskDifficulty): number {
  return DEFAULT_GOLD_REWARDS[difficulty];
}

/**
 * Validate skill count (must be 1-3)
 */
export function validateSkillCount(skillIds: string[]): boolean {
  return skillIds.length >= 1 && skillIds.length <= 3;
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === TASK_STATUS.COMPLETED) {
    return false;
  }
  return new Date(task.dueDate) < new Date();
}

/**
 * Get status color for UI display
 */
export function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case TASK_STATUS.BACKLOG:
      return 'gray';
    case TASK_STATUS.IN_PROGRESS:
      return 'blue';
    case TASK_STATUS.COMPLETED:
      return 'green';
    case TASK_STATUS.PAUSED:
      return 'yellow';
    default:
      return 'gray';
  }
}

/**
 * Get difficulty color for UI display
 */
export function getTaskDifficultyColor(difficulty: TaskDifficulty): string {
  switch (difficulty) {
    case TASK_DIFFICULTY.EASY:
      return 'green';
    case TASK_DIFFICULTY.NORMAL:
      return 'blue';
    case TASK_DIFFICULTY.HARD:
      return 'orange';
    case TASK_DIFFICULTY.EXPERT:
      return 'red';
    default:
      return 'gray';
  }
}

export function getTaskPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case TASK_PRIORITY.CRITICAL: return 'red';
    case TASK_PRIORITY.HIGH:     return 'orange';
    case TASK_PRIORITY.MID:      return 'blue';
    case TASK_PRIORITY.LOW:      return 'gray';
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isOverdue(dateString: string): boolean {
  return new Date(dateString) < new Date()
}
