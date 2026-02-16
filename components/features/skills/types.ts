import { IconData } from "@/components/layout/app/icon-picker/types";

export interface SkillData extends IconData {
    id: string;
    title: string;
    description?: string;
    icon: React.ReactNode;
    tags?: string[];
    level: number;
    currentXP: number;
    xpToNextLevel: number;
    characterId?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  