'use client';

import { useState } from "react";
import PageHeader from "@/components/layout/app/page-header";
import { ItemContainerHeader } from "@/components/layout/app/item-container-header";
import ItemContainer from "@/components/layout/app/item-container";
import { ViewMode } from "@/lib/types";
import { SkillData } from "@/components/features/skills/types";
import SkillCard from "@/components/features/skills/skill-card";
import { addXPToSkill } from "@/components/features/skills/utils";
import { GiWeightLiftingUp } from "react-icons/gi";
import { FaLightbulb } from "react-icons/fa6";
import { PiHairDryerFill } from "react-icons/pi";

export default function SkillsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const handleSkillClick = (skill: SkillData) => {
    console.log('Clicked skill:', skill)
    // Future: Open skill detail modal or navigate to skill page
    
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