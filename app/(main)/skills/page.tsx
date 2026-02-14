'use client';

import { useState } from "react";
import PageHeader from "@/components/layout/page-header";
import ItemContainer from "@/components/layout/item-container";
import { ItemContainerHeader } from "@/components/layout/item-container-header";
import { SkillData, ViewMode } from "@/lib/types";
import SkillCard from "@/components/features/skills/skill-card";
import { addXPToSkill } from "@/components/features/skills/utils";

export default function SkillsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [skills, setSkills] = useState<SkillData[]>([
    {
      id: '1',
      title: 'Financial Planning',
      description: 'Managing budgets, investments, and long-term financial goals',
      level: 5,
      currentXP: 750,
      xpToNextLevel: 1000,
      tags: ['Finance', 'Planning', 'Wealth'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Weight Training',
      description: 'Building strength through resistance exercises',
      icon: '🏋️',
      level: 3,
      currentXP: 200,
      xpToNextLevel: 400,
      tags: ['Fitness', 'Gym'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      title: 'Meditation',
      description: 'Practicing mindfulness and mental clarity',
      level: 7,
      currentXP: 1200,
      xpToNextLevel: 1600,
      tags: ['Mindfulness', 'Mental Health'],
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