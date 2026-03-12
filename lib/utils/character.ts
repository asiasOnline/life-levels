import { Character } from "../types/character";

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
 * Add XP to a character and calculate new level
 */
export function addXPToCharacter(character: Character, xpGained: number): Character {
  const newCurrentXP = character.current_xp + xpGained
  const newLevel = calculateLevelFromXP(newCurrentXP)
  const xpForCurrentLevel = calculateXPForLevel(newLevel)
  const xpForNextLevel = calculateXPForLevel(newLevel + 1)
  
  return {
    ...character,
    level: newLevel,
    current_xp: newCurrentXP - xpForCurrentLevel,
    xp_to_next_level: xpForNextLevel - xpForCurrentLevel,
    updated_at: new Date(),
  }
}