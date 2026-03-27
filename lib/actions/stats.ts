"use server"

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


export async function awardGold(
  transaction: { amount: number; source: GoldSource; sourceId: string }
): Promise<ActionResult<{ newBalance: number; awarded: number }>> {
  if (transaction.amount <= 0) {
    return { success: false, error: 'Gold award amount must be greater than 0' }
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