import type {
  TaskPriority,
  TaskDifficulty,
  HabitRecurrence,
  HabitDuration,
  GoalType,
  GoalDifficulty,
} from '@/lib/actions/stats'

const TASK_GOLD: Record<TaskPriority, Record<TaskDifficulty, number>> = {
  critical: { easy: 30, normal: 50, hard: 70, expert: 70 },
  high:     { easy: 20, normal: 35, hard: 50, expert: 50 },
  mid:      { easy: 15, normal: 25, hard: 35, expert: 35 },
  low:      { easy: 10, normal: 15, hard: 25, expert: 25 },
}

const HABIT_GOLD: Record<HabitRecurrence, Record<HabitDuration, number>> = {
  daily:     { quick: 5,  medium: 10, extended: 15, long: 22 },
  weekdays:  { quick: 6,  medium: 11, extended: 17, long: 25 },
  '3x_week': { quick: 7,  medium: 14, extended: 21, long: 30 },
  weekly:    { quick: 10, medium: 19, extended: 28, long: 40 },
  biweekly:  { quick: 14, medium: 25, extended: 38, long: 55 },
  monthly:   { quick: 20, medium: 35, extended: 50, long: 75 },
}

const GOAL_GOLD: Record<GoalType, Record<GoalDifficulty, number>> = {
  time_based:              { easy: 50,  normal: 100, hard: 175, expert: 275 },
  skill_level_based:       { easy: 75,  normal: 150, hard: 250, expert: 375 },
  habit_consistency_based: { easy: 75,  normal: 150, hard: 250, expert: 375 },
}

export function calculateTaskGold(
  priority: TaskPriority,
  difficulty: TaskDifficulty
): number {
  return TASK_GOLD[priority][difficulty]
}

export function calculateHabitGold(
  recurrence: HabitRecurrence,
  duration: HabitDuration
): number {
  return HABIT_GOLD[recurrence][duration]
}

export function applyGoalChildModifier(baseGold: number, childCount: number): number {
  if (childCount <= 3)  return baseGold
  if (childCount <= 7)  return Math.floor(baseGold * 1.15)
  if (childCount <= 12) return Math.floor(baseGold * 1.25)
  return Math.floor(baseGold * 1.35)
}

export function calculateGoalGold(
  type: GoalType,
  difficulty: GoalDifficulty,
  childCount: number = 0
): number {
  const base = GOAL_GOLD[type][difficulty]
  return applyGoalChildModifier(base, childCount)
}

export function calculateSkillLevelUpGold(newLevel: number): number {
  if (newLevel === 1)  return 10
  if (newLevel === 2)  return 15
  if (newLevel === 3)  return 20
  if (newLevel === 4)  return 25
  if (newLevel === 5)  return 35
  if (newLevel <= 9)  return 35 + (newLevel - 5) * 10
  if (newLevel === 10) return 80
  if (newLevel <= 14) return 80 + (newLevel - 10) * 15
  if (newLevel === 15) return 150
  if (newLevel <= 19) return 150 + (newLevel - 15) * 20
  if (newLevel === 20) return 250
  return 250 + (newLevel - 20) * 25
}

export function calculateCharacterLevelUpGold(newLevel: number): number {
  if (newLevel === 1)  return 15
  if (newLevel === 2)  return 20
  if (newLevel === 3)  return 30
  if (newLevel === 4)  return 40
  if (newLevel === 5)  return 50
  if (newLevel <= 9)  return 50 + (newLevel - 5) * 15
  if (newLevel === 10) return 100
  if (newLevel <= 14) return 100 + (newLevel - 10) * 20
  if (newLevel === 15) return 175
  if (newLevel <= 19) return 175 + (newLevel - 15) * 25
  if (newLevel === 20) return 300
  return 300 + (newLevel - 20) * 30
}