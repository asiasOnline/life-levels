import { IconData, IconType } from "@/lib/types/icon";
import { CharacterSummary } from "./character";
// =================================
// SHARED / SUMMARY
// =================================

// Reusable slim shape for when Skills appear in other contexts
// (e.g. on a Task or Habit form, in a Character dashboard)
export type SkillSummary = Pick<
Skill, "id" | "title" | "icon" | "level"
>;

// Summary shapes for activity history on the Skill detail page
export type SkillLinkedHabit = { 
  id: string; 
  title: string; 
  icon: IconData; 
  status: string 
}

export type SkillLinkedTask  = { 
  id: string; 
  title: string; 
  icon: IconData; 
  status: string 
}

export type SkillLinkedGoal  = { 
  id: string; 
  title: string; 
  icon: IconData; 
  status: string 
}

// =======================================
// INPUT TYPES
// =======================================

export interface CreateSkillInput {
  title: string
  description?: string
  starting_level?: number; // defaults to 1, maxes at 5
  icon?: string
  icon_type?: IconType
  icon_color?: string
  tags?: string[]
  character_ids?: string[];
}

export interface UpdateSkillInput {
  id: string;
  title?: string;
  icon?: IconData;
  description?: string;
  tags?: string[];
  character_ids?: string[]; // full replacement — action does delete-then-insert
}


// =================================
// MAIN TYPE
// =================================
export interface Skill {
    id: string;
    title: string;
    icon: IconData;
    description?: string;
    tags?: string[];
    level: number;
    characters?: CharacterSummary[]
    current_xp: number;
    xp_to_next_level: number;
    created_at: string;
    updated_at: string;
  }
  
// =================================
// EXTENDED TYPE
// =================================
  export interface SkillWithRelations extends Skill {
  habits: SkillLinkedHabit[]
  tasks:  SkillLinkedTask[]
  goals:  SkillLinkedGoal[]
}