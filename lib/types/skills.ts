import { IconData } from "@/lib/types/icon";

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
    current_xp: number;
    xp_to_next_level: number;
    created_at: Date;
    updated_at: Date;
  }
  