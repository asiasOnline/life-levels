import {
  GoalDifficulty,
  GoalRewardResult,
  GOAL_BASE_XP_VALUES,
  GOAL_DEFAULT_GOLD_REWARDS,
} from "@/lib/types/goals";

/**
 * Calculate XP + gold rewards for a Goal based on difficulty and how many
 * skills are linked. Character XP is the full base amount (awarded in full
 * to every linked character); Skill XP is the base pool split evenly across
 * linked skills, mirroring the Habit/Task reward split.
 */
export function calculateGoalRewards(
  difficulty: GoalDifficulty,
  skillCount: number
): GoalRewardResult {
  const baseXp = GOAL_BASE_XP_VALUES[difficulty];

  return {
    character_xp: baseXp,
    skill_xp:     Math.floor(baseXp / Math.max(skillCount, 1)),
    gold:         GOAL_DEFAULT_GOLD_REWARDS[difficulty],
  };
}
