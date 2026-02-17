// components/features/skills/utils.ts

import { Skill } from "../types/skills"

/**
 * Calculate XP required for a given level
 * Uses exponential scaling: level^2 * 100
 */
export function calculateXPForLevel(level: number): number {
  return Math.floor(Math.pow(level, 2) * 100)
}

/**
 * Calculate level from total XP
 */
export function calculateLevelFromXP(totalXP: number): number {
  let level = 1
  let xpRequired = calculateXPForLevel(level)
  
  while (totalXP >= xpRequired) {
    level++
    xpRequired = calculateXPForLevel(level)
  }
  
  return level - 1
}

/**
 * Get progress percentage to next level
 */
export function getProgressPercentage(currentXP: number, xpToNextLevel: number): number {
  return Math.min(Math.round((currentXP / xpToNextLevel) * 100), 100)
}

/**
 * Add XP to a skill and calculate new level
 */
export function addXPToSkill(skill: Skill, xpGained: number): Skill {
  const newCurrentXP = skill.currentXP + xpGained
  const newLevel = calculateLevelFromXP(newCurrentXP)
  const xpForCurrentLevel = calculateXPForLevel(newLevel)
  const xpForNextLevel = calculateXPForLevel(newLevel + 1)
  
  return {
    ...skill,
    level: newLevel,
    currentXP: newCurrentXP - xpForCurrentLevel,
    xpToNextLevel: xpForNextLevel - xpForCurrentLevel,
    updatedAt: new Date(),
  }
}