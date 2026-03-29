import { IconData } from "@/lib/types/icon";

// =================================
// SHARED / SUMMARY
// =================================

// Reusable slim shape for when Characters appear in other contexts
// (e.g. on a Task or Habit form)
export type CharacterSummary = Pick<
  Character, 
  "id" | "title" | "icon" | "level" | "color_theme"
>;

export type CharacterSkillLink = Pick<
Character,
  "id" | "title" | "icon" | "color_theme"
>;

// =======================================
// INPUT TYPES
// =======================================

export interface CharacterAvatarData {
  archetype_id: string
  skin_tone: string
  clothing_color: string | null // null = clothing inherits character's color theme
}

// =================================
// MAIN TYPE
// =================================
export interface Character {
    id: string;
    title: string;
    icon: IconData
    description?: string;
    color_theme: string;
    avatar: CharacterAvatarData | null;
    level: number;
    current_xp: number;
    xp_to_next_level: number;
    total_xp: number;
    is_archived: boolean;
    created_at: Date;
    updated_at: Date;
  }