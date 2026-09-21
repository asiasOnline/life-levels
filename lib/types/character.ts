import { IconData, IconType } from "@/lib/types/icon";
import { SkillSummary } from "./skills";

// =======================================
// CONSTANTS
// =======================================
export const SKIN_TONES = {
  light:        { base: "#ffd3d1", dark: "#f59f9b", shadow: "#e07a86" },
  mediumLight:  { base: "#f5c4a8", dark: "#d99b78", shadow: "#c07a55" },
  medium:       { base: "#d4956a", dark: "#b5724a", shadow: "#9a5a35" },
  mediumDark:   { base: "#b07040", dark: "#8a5228", shadow: "#6e3c18" },
  deep:         { base: "#874c30", dark: "#5c3020", shadow: "#3e1e10" },
} as const;

export type SkinToneKey = keyof typeof SKIN_TONES;
export const DEFAULT_SKIN_TONE: SkinToneKey = "light";

// =================================
// SHARED / SUMMARY
// =================================

// Reusable slim shape for when Characters appear in other contexts
// (e.g. on a Task or Habit form)
export type CharacterSummary = Pick<
  Character, 
  "id" | "title" | "icon" | "character_color"
>;

export type CharacterSummaryWithLevel = Pick<
Character,
  "id" | "title" | "icon" | "character_color" | "level" 
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

export interface CharacterStyleProps {
  className?: string;
  skinTone?: SkinToneKey;
}

export interface CreateCharacterInput {
  title: string
  description?: string
  icon?: string
  icon_type?: IconType
  icon_color?: string
  character_color: string; // the character's background color
  avatar?: string | null // archetype id from AVATAR_REGISTRY
  avatar_color?: string // fill color applied to the avatar
  skill_ids?: string[]; // for linking existing items during Character creation
  habit_ids?: string[];
  task_ids?: string[];
  goal_ids?: string[];
}

export interface UpdateCharacterInput {
  id: string;
  title?: string;
  description?: string;
  icon?: string
  icon_type?: IconType
  icon_color?: string
  character_color?: string;
  avatar?: string | null
  avatar_color?: string
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
    character_color: string;
    avatar: string | null;
    avatar_color: string;
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