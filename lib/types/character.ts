import { IconData, IconType } from "@/lib/types/icon";
import { SkillSummary } from "./skills";
// =================================
// SHARED / SUMMARY
// =================================

// Reusable slim shape for when Characters appear in other contexts
// (e.g. on a Task or Habit form)
export type CharacterSummary = Pick<
  Character, 
  "id" | "title" | "icon" | "color_theme"
>;

export type CharacterSummaryWithLevel = Pick<
Character,
  "id" | "title" | "icon" | "color_theme" | "level" 
>;

// Summary shapes for activity history on the Character detail page
export type CharacterLinkedHabit = {
  id: string; 
  title: string; 
  icon: IconData; 
  status: string 
}

export type CharacterLinkedTask  = { 
  id: string; 
  title: string; 
  icon: IconData; 
  status: string 
}

export type CharacterLinkedGoal  = { 
  id: string; 
  title: string; 
  icon: IconData; 
  status: string 
}

// =======================================
// INPUT TYPES
// =======================================

export interface CharacterAvatarData {
  archetype_id: string
  skin_tone: string
  clothing_color: string | null // null = clothing inherits character's color theme
}

export interface CreateCharacterInput {
  title: string
  description?: string
  icon: IconData
  color_theme: string;
  avatar?: CharacterAvatarData | null 
  skill_ids?: string[]; // for linking existing Skills during Character creation
}

export interface UpdateCharacterInput {
  id: string;
  title?: string;
  description?: string;
  icon?: IconData;
  color_theme?: string;
  avatar?: CharacterAvatarData | null 
  is_archived?: boolean;
  skill_ids?: string[]; // full replacement — action does delete-then-insert
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
    skills?: SkillSummary[];
    current_xp: number;
    xp_to_next_level: number;
    total_xp: number;
    is_archived: boolean;
    created_at: Date;
    updated_at: Date;
  }

// =================================
// EXTENDED TYPE
// =================================
export interface CharacterWithRelations extends Character {
    habits?: CharacterLinkedHabit[];
    tasks?: CharacterLinkedTask[];
    goals?: CharacterLinkedGoal[];
  }