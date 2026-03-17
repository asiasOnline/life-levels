import { IconData } from "@/lib/types/icon";

// ==================================
// ENUMS & CONSTANTS
// ==================================


// =====================================================
// MAIN TYPE
// =====================================================
export interface Goal {
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