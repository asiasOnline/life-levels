'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '../database.types'
import {
  UserStats,
  GoldTransaction,
  GoldSource,
  EnergyCheckInOption,
  EnergyCheckInResult,
  MomentumDecayResult,
  ComebackEvent,
} from '@/lib/types/stats'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

type UserStatsRow = Database['public']['Tables']['user_stats']['Row']

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Gold calculation inputs — mirrors the Priority x Difficulty matrix
// from the PRD. Used by task, habit, and goal completion actions.
export type TaskPriority = 'critical' | 'high' | 'mid' | 'low'
export type TaskDifficulty = 'expert' | 'hard' | 'normal' | 'easy'
export type HabitRecurrence = 'daily' | 'weekdays' | '3x_week' | 'weekly' | 'biweekly' | 'monthly'
export type HabitDuration = 'quick' | 'medium' | 'extended' | 'long'
export type GoalType = 'time_based' | 'skill_level_based' | 'habit_consistency_based'
export type GoalDifficulty = 'expert' | 'hard' | 'normal' | 'easy'

// ----------------------------------------------------------------
// Mapper
// Converts database Row to a frontend UserStats object.
// Strips user_id, id, created_at, updated_at and converts camelCases fields.
// ----------------------------------------------------------------

function mapRowToUserStats(row: UserStatsRow): UserStats {
  return {
    gold:                    row.gold,
    energyBaseline:          row.energy_baseline,
    energyCurrent:           row.energy_current,
    energyResetTime:         row.energy_reset_time,
    energyLastCheckinDate:   row.energy_last_checkin_date,
    momentum:                row.momentum,
    momentumAllTimeHigh:     row.momentum_all_time_high,
    lastLoginDate:           row.last_login_date,
    resilience:              row.resilience,
  }
}

// ----------------------------------------------------------------
// getUserStats
// Fetches the current user's stats row. Called on app load and
// after any stat-modifying action to keep the UI in sync.
// ----------------------------------------------------------------

export async function getUserStats(): Promise<ActionResult<UserStats>> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Could not load stats' }
  }

  return { success: true, data: mapRowToUserStats(data) }
}

// ================================================================
// GOLD
// ================================================================

// ----------------------------------------------------------------
// Gold calculation helpers
// Each returns the automatic Gold award for its activity type.
// Used when the user has not set a manual override.
// Mirrors the reward tables in the PRD exactly.
// ----------------------------------------------------------------

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

// Gold awarded when a Skill levels up.
// Covers levels 1–20 explicitly; 21+ follows the +25/level pattern.
export function calculateSkillLevelUpGold(newLevel: number): number {
  if (newLevel === 1)  return 10
  if (newLevel === 2)  return 15
  if (newLevel === 3)  return 20
  if (newLevel === 4)  return 25
  if (newLevel === 5)  return 35  // milestone
  if (newLevel <= 9)  return 35 + (newLevel - 5) * 10
  if (newLevel === 10) return 80  // milestone
  if (newLevel <= 14) return 80 + (newLevel - 10) * 15
  if (newLevel === 15) return 150 // milestone
  if (newLevel <= 19) return 150 + (newLevel - 15) * 20
  if (newLevel === 20) return 250 // milestone
  return 250 + (newLevel - 20) * 25
}

// Gold awarded when a Character levels up.
export function calculateCharacterLevelUpGold(newLevel: number): number {
  if (newLevel === 1)  return 15
  if (newLevel === 2)  return 20
  if (newLevel === 3)  return 30
  if (newLevel === 4)  return 40
  if (newLevel === 5)  return 50  // milestone
  if (newLevel <= 9)  return 50 + (newLevel - 5) * 15
  if (newLevel === 10) return 100 // milestone
  if (newLevel <= 14) return 100 + (newLevel - 10) * 20
  if (newLevel === 15) return 175 // milestone
  if (newLevel <= 19) return 175 + (newLevel - 15) * 25
  if (newLevel === 20) return 300 // milestone
  return 300 + (newLevel - 20) * 30
}

// Goal child activity modifier — applied to algorithm output only.
export function applyGoalChildModifier(baseGold: number, childCount: number): number {
  if (childCount <= 3)  return baseGold
  if (childCount <= 7)  return Math.floor(baseGold * 1.15)
  if (childCount <= 12) return Math.floor(baseGold * 1.25)
  return Math.floor(baseGold * 1.35)
}

// Public helpers — called by task/habit/goal completion actions
// in their respective action files to get the auto-calculated amount.

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

export function calculateGoalGold(
  type: GoalType,
  difficulty: GoalDifficulty,
  childCount: number = 0
): number {
  const base = GOAL_GOLD[type][difficulty]
  return applyGoalChildModifier(base, childCount)
}

// ----------------------------------------------------------------
// awardGold
// Adds gold to the user's balance. Called by task, habit, goal
// completion actions and skill/character level-up actions.
// Gold cannot go below 0 (enforced by DB constraint), but since
// this only adds, the floor is never at risk here.
// Returns the new balance so the UI can update immediately.
// ----------------------------------------------------------------

export async function awardGold(
  transaction: GoldTransaction
): Promise<ActionResult<{ newBalance: number; awarded: number }>> {
  if (transaction.amount <= 0) {
    return { success: false, error: 'Gold award amount must be greater than 0' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Fetch current balance first so we can return the new total.
  const { data: current, error: fetchError } = await supabase
    .from('user_stats')
    .select('gold')
    .eq('user_id', user.id)
    .single()

  if (fetchError || !current) {
    return { success: false, error: fetchError?.message ?? 'Could not fetch current balance' }
  }

  const newBalance = current.gold + transaction.amount

  const { error: updateError } = await supabase
    .from('user_stats')
    .update({ gold: newBalance })
    .eq('user_id', user.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return {
    success: true,
    data: {
      newBalance,
      awarded: transaction.amount,
    },
  }
}

// ----------------------------------------------------------------
// spendGold
// Deducts gold when a reward is redeemed. Enforces the floor:
// gold cannot go below 0. Returns the new balance on success,
// or a specific error if the user cannot afford the reward.
// ----------------------------------------------------------------

export async function spendGold(
  amount: number,
  rewardId: string
): Promise<ActionResult<{ newBalance: number; spent: number }>> {
  if (amount < 0) {
    return { success: false, error: 'Spend amount cannot be negative' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: current, error: fetchError } = await supabase
    .from('user_stats')
    .select('gold')
    .eq('user_id', user.id)
    .single()

  if (fetchError || !current) {
    return { success: false, error: fetchError?.message ?? 'Could not fetch current balance' }
  }

  if (current.gold < amount) {
    return {
      success: false,
      error: `Not enough Gold. You need ${amount - current.gold} more.`,
    }
  }

  const newBalance = current.gold - amount

  const { error: updateError } = await supabase
    .from('user_stats')
    .update({ gold: newBalance })
    .eq('user_id', user.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return {
    success: true,
    data: {
      newBalance,
      spent: amount,
    },
  }
}

// ================================================================
// ENERGY
// TODO: Implement when building the Energy check-in UI.
//
// Functions to add:
//   setEnergyBaseline(baseline: number)
//   setEnergyResetTime(time: string)
//   performEnergyCheckin(option: EnergyCheckInOption)
//   adjustEnergyCurrent(newValue: number)
//   deductEnergy(amount: number, sourceId: string)
//   resolveEnergyCheckinValue(option, baseline): EnergyCheckInResult
// ================================================================

// ================================================================
// MOMENTUM
// TODO: Implement when building the daily login system.
//
// Functions to add:
//   recordDailyLogin()  — master function that:
//     1. Calculates days missed since last_login_date
//     2. Applies percentage-based decay per missed day
//     3. Enforces the 10%-of-ATH decay floor
//     4. Adds +10 for the current login day
//     5. Updates momentum_all_time_high if exceeded
//     6. Writes the login_history row
//     7. Triggers comeback flow if days_missed >= 3
//   calculateMomentumDecay(current, allTimeHigh, daysMissed): MomentumDecayResult
// ================================================================

// ================================================================
// RESILIENCE
// TODO: Implement alongside Energy and Momentum.
//
// Functions to add:
//   awardEffortResilience(priority: TaskPriority | 'habit', duration?: HabitDuration)
//     — called by task/habit completion actions when energy === 0
//   awardComebackResilience(daysMissed: number): ComebackEvent
//     — called inside recordDailyLogin when comeback is triggered
// ================================================================