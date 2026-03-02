import { IconData } from "@/lib/types/icon";

// =====================================================
// MAIN TYPE
// =====================================================
export interface Skill extends IconData {
    id: string;
    title: string;
    description?: string;
    tags?: string[];
    level: number;
    currentXP: number;
    xpToNextLevel: number;
    characterId?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  