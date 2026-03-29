import { IconData } from "@/lib/types/icon";
import { CharacterSkillLink } from "./character";
// =================================
// SHARED / SUMMARY
// =================================

// Reusable slim shape for when Skills appear in other contexts
// (e.g. on a Task or Habit form, in a Character dashboard)
export type SkillSummary = Pick<
Skill, "id" | "title" | "icon" | "level"
>;

// =======================================
// INPUT TYPES
// =======================================

export interface CreateSkillInput {
  title: string
  description?: string
  icon: IconData
  tags?: string[]
  character_ids?: string[];
}

export interface UpdateSkillInput {
  id: string;
  title?: string;
  icon?: IconData;
  description?: string;
  starting_level?: number;
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
    characters?: CharacterSkillLink[]
    current_xp: number;
    xp_to_next_level: number;
    created_at: string;
    updated_at: string;
  }
  