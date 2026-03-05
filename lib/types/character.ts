import { IconData } from "@/lib/types/icon";

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
    userId: string;
    title: string;
    icon: IconData
    description?: string;
    color_theme: string;
    avatar: CharacterAvatarData | null;
    level: number;
    current_xP: number;
    xp_to_next_level: number;
    total_xP: number;
    is_archived: boolean;
    created_at: Date;
    updated_at: Date;
  }