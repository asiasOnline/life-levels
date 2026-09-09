'use client'

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/app/page-header";
import ItemContainer from "@/components/layout/app/item-container";
import { ItemContainerHeader, ViewMode } from "@/components/layout/app/item-container-header";
import { CreateGoalModal } from "@/components/features/goals/create-goal-modal";
import { EditGoalModal } from "@/components/features/goals/edit-goal-modal";
import { Button } from "@/components/ui/button";
import { fetchGoals } from "@/lib/actions/goals";
import { fetchSkills } from "@/lib/actions/skills";
import { fetchCharacters } from "@/lib/actions/characters";
import { GoalWithRelations } from "@/lib/types/goals";
import { SkillSummary } from "@/lib/types/skills";
import { CharacterSummary } from "@/lib/types/character";
import { toast } from "sonner";
import { Target, Plus, Pencil } from "lucide-react";

export default function GoalsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [goals, setGoals] = useState<GoalWithRelations[]>([])
  const [availableSkills, setAvailableSkills] = useState<SkillSummary[]>([])
  const [availableCharacters, setAvailableCharacters] = useState<CharacterSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [goalToEdit, setGoalToEdit] = useState<GoalWithRelations | null>(null)

  // ── Data fetching ─────────────────────────
  const loadGoals = useCallback(async () => {
    setIsLoading(true)
    try {
      const [goalsResult, skillsResult, charactersResult] = await Promise.all([
        fetchGoals(),
        fetchSkills(),
        fetchCharacters(),
      ])

      if (!goalsResult.success) {
        toast.error('Failed to load goals.')
        return
      }
      if (!skillsResult.success) {
        toast.error('Failed to load skills.')
        return
      }
      if (!charactersResult.success) {
        toast.error('Failed to load characters.')
        return
      }

      setGoals(goalsResult.data)

      setAvailableSkills(
        (skillsResult.data ?? []).map((s) => ({
          id:    s.id,
          title: s.title,
          icon:  s.icon,
          level: s.level,
        }))
      )
      setAvailableCharacters(
        (charactersResult.data ?? [])
          .filter((c) => !c.is_archived)
          .map((c) => ({
            id:          c.id,
            title:       c.title,
            icon:        c.icon,
            color_theme: c.color_theme,
          }))
      )
    } catch (error) {
      console.error('Error loading goals:', error)
      toast.error('Failed to load goals. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  function handleGoalCreated() {
    loadGoals()
  }

  function handleGoalUpdated() {
    loadGoals()
  }

  function handleEditRequest(goal: GoalWithRelations) {
    setGoalToEdit(goal)
    setIsEditModalOpen(true)
  }

  return (
    <>
      <PageHeader
        icon={Target}
        iconSize="w-6 h-6"
        title="Goals"
      />

      <ItemContainer>
        <ItemContainerHeader
          title="Goal Log"
          searchPlaceholder="Search goals..."
          addButtonLabel="New Goal"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddNew={() => setIsCreateModalOpen(true)}
          onSearch={(query) => console.log('Search:', query)}
          onFilterChange={() => console.log('Filter')}
          onSortChange={() => console.log('Sort')}
        />

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl border bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && goals.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Target className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No goals yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Set a goal and link the skills and characters that will grow when you hit it.
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4" />
              Create your first goal
            </Button>
          </div>
        )}

        {!isLoading && goals.length > 0 && (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4'
              : 'flex flex-col gap-2 p-4'
          }>
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-xl border bg-background p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg leading-none">
                      {goal.icon.type === 'emoji' ? goal.icon.value : '🎯'}
                    </span>
                    <h3 className="font-semibold truncate">{goal.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-7 w-7"
                    onClick={() => handleEditRequest(goal)}
                    title="Edit goal"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {goal.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {goal.skills.map((s) => (
                    <span key={s.id} className="text-xs rounded-full border px-2 py-0.5 text-muted-foreground">
                      {s.title}
                    </span>
                  ))}
                  {goal.characters.map((c) => (
                    <span
                      key={c.id}
                      className="text-xs rounded-full px-2 py-0.5 text-white"
                      style={{ backgroundColor: c.color_theme }}
                    >
                      {c.title}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ItemContainer>

      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGoalCreated={handleGoalCreated}
        availableSkills={availableSkills}
        availableCharacters={availableCharacters}
      />

      <EditGoalModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onGoalUpdated={handleGoalUpdated}
        goal={goalToEdit}
        availableSkills={availableSkills}
        availableCharacters={availableCharacters}
      />
    </>
  );
}
