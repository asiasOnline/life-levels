'use client';

import { useState } from "react";
import PageHeader from "@/components/layout/page-header";
import ItemContainer from "@/components/layout/item-container";
import { ItemContainerHeader } from "@/components/layout/item-container-header";
import { SkillData, ViewMode } from "@/lib/types";
import SkillCard from "@/components/features/skills/skill-card";
import { addXPToSkill } from "@/components/features/skills/utils";
import { GiWeightLiftingUp } from "react-icons/gi";
import { FaLightbulb } from "react-icons/fa6";
import { PiHairDryerFill } from "react-icons/pi";

export default function SkillsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [skills, setSkills] = useState<SkillData[]>([
    {
      id: '1',
      title: 'Strength, Endurance & Agility',
      description: 'The mastery of stamina and a journey to building power, endurance, and resilience. - A Gift From Ares',
      icon: <GiWeightLiftingUp />,
      level: 2,
      currentXP: 51,
      xpToNextLevel: 400,
      tags: ['physical fitness', 'exercise', 'flexibility', 'cardio', 'strength training'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Innovation & Creativity',
      description: 'Forge the future in your design by mastering a multitude of complex and intricate skills to hone your craft and make goods that balance beauty, usability, innovation, and quality. - A Gift From Hephaestus',
      icon: <FaLightbulb />,
      level: 9,
      currentXP: 333,
      xpToNextLevel: 900,
      tags: ['game design', 'creative thinking', 'writing', 'UX/UI', 'coding'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      title: 'Charisma & Beauty',
      description: 'It takes skill to radiate confidence, elegance, and beauty; mastering this defines a glow that shines from within captivating those around in an almost magical aura. - A Gift From Aphrodite',
      icon: <PiHairDryerFill />,
      level: 5,
      currentXP: 131,
      xpToNextLevel: 500,
      tags: ['beauty', 'style', 'skin care', 'confidence', 'charm', 'make up', 'hair care', 'fashion'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  const handleSkillClick = (skill: SkillData) => {
    console.log('Clicked skill:', skill)
    // Future: Open skill detail modal or navigate to skill page
    
    // Demo: Add 100 XP to clicked skill
    setSkills((prev) =>
      prev.map((s) => (s.id === skill.id ? addXPToSkill(s, 100) : s))
    )
  }


    return (
     <div>
      <PageHeader 
        title="Skills"
        subtitle="Manage your skills and expertise"
      />
      <ItemContainer>
      <ItemContainerHeader 
        title="Skill Log"
        searchPlaceholder="Search skills..."
        addButtonLabel="New Skill"
        onAddNew={() => console.log('Add skill')}
        onSearch={(query) => console.log('Search:', query)}
        onFilterChange={() => console.log('Filter')}
        onSortChange={() => console.log('Sort')}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} onClick={handleSkillClick} />
          ))}
        </div>
      )}
     </ItemContainer>
     </div>
    );
  }