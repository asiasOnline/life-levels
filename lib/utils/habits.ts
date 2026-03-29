import type {
  HabitRecurrence,
  HabitTimeBucket,
  HabitRewardResult,
  HabitCustomRecurrenceConfig,
} from "@/lib/types/habits";

// ===============================================
// TIME BUCKET
// Converts a raw time_consumption (minutes) into the four reward tiers
// defined in the PRD. The same bucket is used across XP, Gold, Energy, and
// Resilience tables so only this one place needs updating if tiers change.
// ===============================================

export function getTimeBucket(minutes: number): HabitTimeBucket {
  if (minutes <= 15) return "quick";
  if (minutes <= 45) return "medium";
  if (minutes <= 90) return "extended";
  return "long";
}

// ================================================
// REWARD TABLES
// Indexed as [recurrence][timeBucket].
// 'custom' rows are zeroed out — custom recurrence is resolved to an
// effective tier before lookup via getEffectiveRecurrenceForCustom().
// ================================================

export const XP_TABLE: Record<HabitRecurrence, Record<HabitTimeBucket, number>> = {
  daily:      { quick: 10, medium: 20, extended: 30,  long: 45  },
  weekdays:   { quick: 12, medium: 22, extended: 35,  long: 50  },
  x_per_week: { quick: 15, medium: 28, extended: 42,  long: 60  },
  weekly:     { quick: 20, medium: 38, extended: 55,  long: 80  },
  bi_weekly:  { quick: 28, medium: 50, extended: 75,  long: 110 },
  monthly:    { quick: 40, medium: 70, extended: 100, long: 150 },
  custom:     { quick: 0,  medium: 0,  extended: 0,   long: 0   },
};

export const GOLD_TABLE: Record<HabitRecurrence, Record<HabitTimeBucket, number>> = {
  daily:      { quick: 5,  medium: 10, extended: 15, long: 22 },
  weekdays:   { quick: 6,  medium: 11, extended: 17, long: 25 },
  x_per_week: { quick: 7,  medium: 14, extended: 21, long: 30 },
  weekly:     { quick: 10, medium: 19, extended: 28, long: 40 },
  bi_weekly:  { quick: 14, medium: 25, extended: 38, long: 55 },
  monthly:    { quick: 20, medium: 35, extended: 50, long: 75 },
  custom:     { quick: 0,  medium: 0,  extended: 0,  long: 0  },
};

export const ENERGY_TABLE: Record<HabitRecurrence, Record<HabitTimeBucket, number>> = {
  daily:      { quick: 5, medium: 8,  extended: 12, long: 16 },
  weekdays:   { quick: 5, medium: 8,  extended: 12, long: 16 },
  x_per_week: { quick: 6, medium: 10, extended: 14, long: 18 },
  weekly:     { quick: 7, medium: 11, extended: 16, long: 20 },
  bi_weekly:  { quick: 7, medium: 11, extended: 16, long: 20 },
  monthly:    { quick: 8, medium: 12, extended: 17, long: 22 },
  custom:     { quick: 0, medium: 0,  extended: 0,  long: 0  },
};

// Resilience scales with time bucket only — Habits have no Priority field.
export const RESILIENCE_TABLE: Record<HabitTimeBucket, number> = {
  quick:    4,
  medium:   5,
  extended: 7,
  long:     10,
};

// ==================================================
// CUSTOM RECURRENCE → EFFECTIVE TIER
// The PRD rule: < 1 completion/week → monthly tier; ≥ 5/week → daily tier.
// Values in between map to the closest standard tier.
// ==================================================

/**
 * Returns the average completions per week implied by a custom recurrence
 * config. Used for reward tier mapping and consistency score calculation.
 */
export function getCustomCompletionsPerWeek(
  config: HabitCustomRecurrenceConfig
): number {
  const { interval, unit } = config;
  if (unit === "day")   return 7 / interval;
  if (unit === "week")  return 1 / interval;
  if (unit === "month") return 1 / (interval * (30 / 7));
  return 1;
}

/**
 * Maps a custom recurrence config to the closest standard recurrence tier
 * for use in the reward, energy, and consistency tables.
 */
export function getEffectiveRecurrenceForCustom(
  config: HabitCustomRecurrenceConfig
): Exclude<HabitRecurrence, "custom"> {
  const perWeek = getCustomCompletionsPerWeek(config);
  if (perWeek >= 5)    return "daily";
  if (perWeek >= 3)    return "x_per_week";
  if (perWeek >= 1.5)  return "weekdays";
  if (perWeek >= 0.75) return "weekly";
  if (perWeek >= 0.4)  return "bi_weekly";
  return "monthly";
}

// ===============================================
// REWARD CALCULATION
// ===============================================

/**
 * Calculates XP, Gold, and Energy for a habit completion.
 *
 * - character_xp: awarded in full to every linked Character (not split).
 * - skill_xp: the total distributable pool. The action divides this by
 *   skillCount and uses Math.floor — remainder is discarded per the PRD.
 * - gold: applied immediately to the user's balance.
 * - energy_cost: deducted at the moment of completion. If the user's Energy
 *   is already 0, the action should award Resilience instead of deducting.
 *
 * Pass customConfig whenever recurrence === 'custom'.
 */
export function calculateHabitRewards(
  recurrence: HabitRecurrence,
  timeConsumption: number,
  skillCount: number,
  customConfig?: HabitCustomRecurrenceConfig
): HabitRewardResult {
  const bucket = getTimeBucket(timeConsumption);

  const effectiveRecurrence: Exclude<HabitRecurrence, "custom"> =
    recurrence === "custom" && customConfig
      ? getEffectiveRecurrenceForCustom(customConfig)
      : (recurrence as Exclude<HabitRecurrence, "custom">);

  const rawXP  = XP_TABLE[effectiveRecurrence][bucket];
  const gold   = GOLD_TABLE[effectiveRecurrence][bucket];
  const energy = ENERGY_TABLE[effectiveRecurrence][bucket];

  // Skill XP pool: floor ensures no fractional XP leaks to any one Skill.
  const count    = Math.max(1, skillCount);
  const skillXP  = Math.floor(rawXP / count) * count;

  return {
    character_xp: rawXP,   // each Character receives this in full
    skill_xp:     skillXP, // divide by skillCount in the action layer
    gold,
    energy_cost:  energy,
  };
}

// =============================================
// ENERGY COST & RESILIENCE
// Kept separate so the action can call them individually — the action needs
// to check current Energy before deciding whether to deduct or award Resilience.
// =============================================

/**
 * Returns the Energy cost for completing this habit.
 */
export function calculateHabitEnergyCost(
  recurrence: HabitRecurrence,
  timeConsumption: number,
  customConfig?: HabitCustomRecurrenceConfig
): number {
  const bucket = getTimeBucket(timeConsumption);
  const effectiveRecurrence: Exclude<HabitRecurrence, "custom"> =
    recurrence === "custom" && customConfig
      ? getEffectiveRecurrenceForCustom(customConfig)
      : (recurrence as Exclude<HabitRecurrence, "custom">);

  return ENERGY_TABLE[effectiveRecurrence][bucket];
}

/**
 * Returns the Resilience awarded when a habit is completed at 0 Energy.
 * Scales with time bucket only (no Priority field on Habits).
 */
export function calculateHabitResilienceAward(timeConsumption: number): number {
  return RESILIENCE_TABLE[getTimeBucket(timeConsumption)];
}

// =============================================================================
// EXPECTED COMPLETIONS
// Used both by calculateConsistencyScore() and by the detail page to display
// "X completions expected in the last 30 days" context.
// =============================================================================

/**
 * Returns how many times a habit is expected to be completed within a given
 * number of days, based on its recurrence pattern.
 */
export function getExpectedCompletions(
  recurrence: HabitRecurrence,
  windowDays: number,
  options?: {
    x_per_week_count?: number;
    custom_recurrence_config?: HabitCustomRecurrenceConfig;
  }
): number {
  switch (recurrence) {
    case "daily":
      return windowDays;

    case "weekdays":
      // 5 out of every 7 days; rounded to nearest whole number.
      return Math.round(windowDays * (5 / 7));

    case "x_per_week": {
      const perWeek = options?.x_per_week_count ?? 3;
      return Math.round((windowDays / 7) * perWeek);
    }

    case "weekly":
      return Math.round(windowDays / 7);

    case "bi_weekly":
      return Math.round(windowDays / 14);

    case "monthly":
      return Math.round(windowDays / 30);

    case "custom": {
      const cfg = options?.custom_recurrence_config;
      if (!cfg) return 0;
      const perWeek = getCustomCompletionsPerWeek(cfg);
      return Math.round((windowDays / 7) * perWeek);
    }

    default:
      return 0;
  }
}

// =======================================================
// CONSISTENCY SCORE
// Rolling 30-day window (or since creation if the habit is < 30 days old).
// Formula: completions in window ÷ expected completions in window × 100.
// Capped at 100 — the PRD doesn't reward over-completion here.
// ========================================================

/**
 * Calculates the rolling consistency score (0–100) for a habit.
 *
 * @param completionDates - ISO date strings for all logged completions
 * @param windowStart     - ISO date string: start of the rolling window
 *                          (either 30 days ago or the habit creation date)
 * @param recurrence      - The habit's recurrence pattern
 * @param options         - Required extra params for x_per_week and custom
 */
export function calculateConsistencyScore(
  completionDates: string[],
  windowStart: string,
  recurrence: HabitRecurrence,
  options?: {
    x_per_week_count?: number;
    custom_recurrence_config?: HabitCustomRecurrenceConfig;
  }
): number {
  const start      = new Date(windowStart);
  const now        = new Date();
  const windowDays = Math.max(
    1,
    Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  const expected = getExpectedCompletions(recurrence, windowDays, options);
  if (expected === 0) return 0;

  const actual = completionDates.filter((d) => new Date(d) >= start).length;

  return Math.min(100, Math.round((actual / expected) * 100));
}

/**
 * Returns the ISO start date string for the rolling consistency window.
 * Uses the later of (today − 30 days) and the habit's creation date,
 * so newly created habits don't show an artificially deflated score.
 */
export function getConsistencyWindowStart(createdAt: string): string {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const created = new Date(createdAt);
  const windowStart = created > thirtyDaysAgo ? created : thirtyDaysAgo;

  return windowStart.toISOString();
}

/**
 * Returns true if the habit is new enough that the consistency window
 * is still building. The detail page uses this to show a "Score based
 * on X days of data" caveat rather than a potentially misleading low %.
 */
export function isConsistencyWindowBuilding(createdAt: string): boolean {
  const created     = new Date(createdAt);
  const now         = new Date();
  const daysSince   = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < 7;
}

// =========================================================
// RECURRENCE LABEL
// Human-readable display strings for cards, detail pages, and form summaries.
// ==========================================================

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
}

/**
 * Returns a concise, user-facing recurrence label.
 * Examples:
 * getRecurrenceLabel("daily")                               // "Daily"
 * getRecurrenceLabel("x_per_week", { x_per_week_count: 3}) // "3× per week"
 * getRecurrenceLabel("weekly", { weekly_day: 1 })           // "Weekly on Monday"
 * getRecurrenceLabel("monthly", { monthly_day: 15 })        // "Monthly on the 15th"
 * getRecurrenceLabel("custom", { custom_recurrence_config: { interval: 2, unit: "week", end_type: "never" } })
 *                                                           // "Every 2 weeks"
 */
export function getRecurrenceLabel(
  recurrence: HabitRecurrence,
  options?: {
    x_per_week_count?: number;
    weekly_day?: number;
    monthly_day?: number;
    custom_recurrence_config?: HabitCustomRecurrenceConfig;
  }
): string {
  switch (recurrence) {
    case "daily":
      return "Daily";

    case "weekdays":
      return "Weekdays";

    case "x_per_week": {
      const count = options?.x_per_week_count ?? 3;
      return `${count}× per week`;
    }

    case "weekly": {
      const day = options?.weekly_day;
      return day !== undefined
        ? `Weekly on ${DAYS_OF_WEEK[day]}`
        : "Weekly";
    }

    case "bi_weekly":
      return "Every 2 weeks";

    case "monthly": {
      const day = options?.monthly_day;
      if (day !== undefined) {
        return `Monthly on the ${day}${getOrdinalSuffix(day)}`;
      }
      return "Monthly";
    }

    case "custom": {
      const cfg = options?.custom_recurrence_config;
      if (!cfg) return "Custom";
      const { interval, unit } = cfg;
      return interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`;
    }

    default:
      return "Custom";
  }
}

// =====================================================
// COMPLETION TIME LABEL
// ======================================================

/**
 * Returns a display label for the optional completion_time field.
 */
export function getCompletionTimeLabel(
  time: "morning" | "afternoon" | "evening" | "overnight" | undefined
): string {
  if (!time) return "Any time";
  return time.charAt(0).toUpperCase() + time.slice(1);
}

// ===================================================
// VALIDATION HELPERS
// Used by Zod refinements and action-layer guard checks.
// ===================================================

/** Returns true if time_consumption is a valid positive integer. */
export function isValidTimeConsumption(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Returns true if time_consumption exceeds the soft-warning threshold.
 * The PRD specifies a prompt to confirm above 480 minutes (8 hours)
 * but no hard ceiling.
 */
export function isUnusuallyLongHabit(minutes: number): boolean {
  return minutes > 480;
}

/**
 * Returns true if a custom recurrence config would result in more than one
 * expected completion per day — which the PRD explicitly disallows.
 */
export function isCustomRecurrenceTooFrequent(
  config: HabitCustomRecurrenceConfig
): boolean {
  return getCustomCompletionsPerWeek(config) > 7;
}

/**
 * Returns true if a custom recurrence config is fully and validly specified.
 * Used to guard form submission before the action is called.
 */
export function isCustomRecurrenceConfigComplete(
  config: HabitCustomRecurrenceConfig
): boolean {
  if (!config.interval || config.interval <= 0) return false;
  if (config.end_type === "on_date" && !config.end_date) return false;
  if (
    config.end_type === "after_occurrences" &&
    (!config.occurrences || config.occurrences <= 0)
  ) return false;
  return true;
}