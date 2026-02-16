'use client';

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/app/page-header";
import ItemContainer from "@/components/layout/app/item-container";
import { ItemContainerHeader } from "@/components/layout/app/item-container-header";
import { SkillCard } from "@/components/features/skills/skill-card";
import { SkillTableRow } from "@/components/features/skills/skill-table-row";
import { CreateSkillModal } from "@/components/features/skills/create-skill-modal";
import { 
  Table, 
  TableHead, 
  TableHeader,
  TableBody,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchSkills } from "@/lib/actions/skill";
import { ViewMode } from "@/lib/types";
import { SkillData } from "@/components/features/skills/types";
import { IconType } from "@/components/layout/app/icon-picker/types";
import { FaPlus, FaXmark } from "react-icons/fa6";

export default function SkillsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [skills, setSkills] = useState<SkillData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

 const loadSkills = async () => {
    try {
      setIsLoading(true)
      const data = await fetchSkills()
      
      // Map database rows to Skill objects
      const skillsData: SkillData[] = data.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        icon: row.icon,
        iconType: row.icon_type as IconType,
        iconColor: row.icon_color,
        level: row.level,
        currentXP: row.current_xp,
        xpToNextLevel: row.xp_to_next_level,
        tags: row.tags,
        characterId: row.character_id || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }))
      
      setSkills(skillsData)
    } catch (error) {
      console.error('Error loading skills:', error)
      toast.error('Failed to load skills. Please refresh the page.')

    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSkills()
  }, [])

  const handleSkillClick = (skill: SkillData) => {
    console.log('Clicked skill:', skill)
    // Future: Open skill detail modal
  }

  const handleSkillCreated = () => {
    loadSkills() // Reload skills after creating a new one
  }

  if (isLoading) {
    return (
      <ItemContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading skills...</p>
        </div>
      </ItemContainer>
    )
  }


    return (
     <div>
      <PageHeader 
        title="Skills"
        subtitle="Track long-term mastery and capability development across all life contexts, with clear progression milestones that unlock meaningful rewards."
      />
      <ItemContainer>
      <ItemContainerHeader 
        title="Skill Log"
        searchPlaceholder="Search skills..."
        addButtonLabel="New Skill"
        onAddNew={() => setIsModalOpen(true)}
        onSearch={(query) => console.log('Search:', query)}
        onFilterChange={() => console.log('Filter')}
        onSortChange={() => console.log('Sort')}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No skills yet</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <FaPlus className="h-4 w-4 mr-2" />
            Create Your First Skill
          </Button>
        </div>
      ) : (
        <>
        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 justify-center content-start auto-cols-max gap-4 p-6">
            {skills.map((skill) => (
              <SkillCard 
              key={skill.id} 
              skill={skill} 
              onClick={handleSkillClick} />
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Icon</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((skill) => (
                  <SkillTableRow key={skill.id} skill={skill} onClick={handleSkillClick} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        </>
        )}
        
        <CreateSkillModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSkillCreated={handleSkillCreated}
      />

     </ItemContainer>
     </div>
    );
  }