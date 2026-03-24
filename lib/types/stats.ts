// ----------------------------------------------------------------
// User Stats
// All four core stat values plus Energy configuration.
// ----------------------------------------------------------------
export interface UserStats {
  gold: number
  energyBaseline: number
  energyCurrent: number
  energyResetTime: string
  energyLastCheckinDate: string | null
  momentum: number
  momentumAllTimeHigh: number
  lastLoginDate: string | null
  resilience: number
}

// ----------------------------------------------------------------
// Login History Entry
// Used for comeback detection display and momentum history.
// ----------------------------------------------------------------
export interface LoginHistoryEntry {
  loginDate: string
  daysMissed: number
  momentumBefore: number
  momentumDecayed: number
  momentumGained: number
  momentumAfter: number
  comebackTriggered: boolean
  resilienceAwarded: number
}

// ----------------------------------------------------------------
// Energy
// ----------------------------------------------------------------
export type EnergyCheckInOption = 'low' | 'normal' | 'high'

// Resolved numeric value after a check-in selection is applied
export interface EnergyCheckInResult {
  option: EnergyCheckInOption
  value: number
}

// ----------------------------------------------------------------
// Momentum
// ----------------------------------------------------------------
export interface MomentumDecayResult {
  daysMissed: number
  momentumBefore: number
  momentumDecayed: number
  momentumAfter: number
  newAllTimeHigh: boolean
}

// ----------------------------------------------------------------
// Comeback
// Resolved on login after 3+ missed days.
// ----------------------------------------------------------------
export interface ComebackEvent {
  daysMissed: number
  resilienceAwarded: number
  momentumAfter: number
}

// ----------------------------------------------------------------
// Gold
// Describes a single gold transaction for display/notification
// purposes (e.g. the reward summary shown before completing a task).
// ----------------------------------------------------------------
export interface GoldTransaction {
  amount: number
  source: GoldSource
  sourceId: string   // id of the task, habit, goal, or skill level-up
}

export type GoldSource =
  | 'task_completion'
  | 'habit_completion'
  | 'goal_completion'
  | 'skill_level_up'
  | 'character_level_up'