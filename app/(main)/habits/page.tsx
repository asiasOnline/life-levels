'use client'

import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/app/page-header'
import ItemContainer from '@/components/layout/app/item-container'
import { ItemContainerHeader, ViewMode } from '@/components/layout/app/item-container-header'
import { HabitCard } from '@/components/features/habits/habit-card'
import { CreateHabitModal } from '@/components/features/habits/create-habit-modal'
import { Button } from '@/components/ui/button'
import { fetchHabits } from '@/lib/actions/habits'
import { fetchSkills } from '@/lib/actions/skills'
import { fetchCharacters } from '@/lib/actions/characters'
import { HabitWithRelations, HABIT_STATUS } from '@/lib/types/habits'
import { SkillSummary } from '@/lib/types/skills'
import { CharacterSummary } from '@/lib/types/character'
import {
  calculateConsistencyScore,
  getConsistencyWindowStart,
} from '@/lib/utils/habits'
import { Plus, Repeat } from 'lucide-react'
import { toast } from 'sonner'

// =============================================================================
// TYPES
// =============================================================================

// Extends the fetched habit with a client-computed consistency score
type HabitWithScore = HabitWithRelations & { consistency_score: number }

// Placeholder until habit_completions table exists — swap out this type
// and the score computation below once completion tracking is implemented.
type HabitCompletionRecord = { habit_id: string; completed_at: string }

// =============================================================================
// PAGE
// =============================================================================

export default function HabitPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [habits, setHabits] = useState<HabitWithScore[]>([])
  const [availableSkills, setAvailableSkills] = useState<SkillSummary[]>([])
  const [availableCharacters, setAvailableCharacters] = useState<CharacterSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHabit, setSelectedHabit] = useState<HabitWithRelations | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadHabits = useCallback(async () => {
    setIsLoading(true)
    try {
      const [habitsResult, skillsResult, charactersResult] = await Promise.all([
        fetchHabits(),
        fetchSkills(),
        fetchCharacters(),
      ])

      if (!habitsResult.success) {
        toast.error('Failed to load habits.')
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

      // Compute consistency scores client-side.
      // Once habit_completions is built, replace the empty array with real data.
      const completions: HabitCompletionRecord[] = []

      const habitsWithScores: HabitWithScore[] = habitsResult.data.map((habit) => {
        const windowStart    = getConsistencyWindowStart(habit.created_at)
        const habitCompletions = completions
          .filter((c) => c.habit_id === habit.id)
          .map((c) => c.completed_at)

        const consistency_score = calculateConsistencyScore(
          habitCompletions,
          windowStart,
          habit.recurrence,
          {
            x_per_week_count:        habit.x_per_week_count,
            custom_recurrence_config: habit.custom_recurrence_config,
          }
        )

        return { ...habit, consistency_score }
      })

      setHabits(habitsWithScores)

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
            id:           c.id,
            title:        c.title,
            icon:         c.icon,
            color_theme:  c.color_theme,
            level:        c.level,
          }))
      )

    } catch {
      toast.error('Something went wrong loading habits.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  // ── Derived lists ──────────────────────────────────────────────────────────

  const activeHabits   = habits.filter((h) => h.status === HABIT_STATUS.ACTIVE)
  const pausedHabits   = habits.filter((h) => h.status === HABIT_STATUS.PAUSED)
  const archivedHabits = habits.filter((h) => h.status === HABIT_STATUS.ARCHIVED)

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCardClick = (id: string) => {
    const habit = habits.find((h) => h.id === id) ?? null
    setSelectedHabit(habit)
    setIsDetailModalOpen(true)
  }

  const handleHabitCreated = () => {
    loadHabits()
    setIsCreateModalOpen(false)
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <>
      <PageHeader
        title="Habits"
        subtitle="Recurring activities that help develop consistent behaviors."
      />

      <ItemContainer>
        <ItemContainerHeader
          title="Habit Log"
          searchPlaceholder="Search tasks..."
          addButtonLabel="New Task"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddNew={() => setIsCreateModalOpen(true)}
          onSearch={(query) => console.log('Search:', query)}
          onFilterChange={() => console.log('Filter')}
          onSortChange={() => console.log('Sort')}
        />

        {/* ── Loading state ────────────────────────────────────────────── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-xl border bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {!isLoading && habits.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Repeat className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No habits yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Build your first recurring routine — small consistent actions compound into real growth.
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4" />
              Create your first habit
            </Button>
          </div>
        )}

        {/* ── Habit lists ──────────────────────────────────────────────── */}
        {!isLoading && habits.length > 0 && (
          <div className="space-y-8 p-4">

            {/* Active */}
            {activeHabits.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Active · {activeHabits.length}
                </h2>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'flex flex-col gap-2'
                }>
                  {activeHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Paused */}
            {pausedHabits.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Paused · {pausedHabits.length}
                </h2>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'flex flex-col gap-2'
                }>
                  {pausedHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Archived */}
            {archivedHabits.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Archived · {archivedHabits.length}
                </h2>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'flex flex-col gap-2'
                }>
                  {archivedHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </ItemContainer>

      {/* ── Create modal ───────────────────────────────────────────────── */}
      <CreateHabitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onHabitCreated={handleHabitCreated}
        availableSkills={availableSkills}
        availableCharacters={availableCharacters}
      />

      {/* ── Detail modal placeholder ────────────────────────────────────
          Wire in HabitDetailModal here once it is built.
          <HabitDetailModal
            habit={selectedHabit}
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            onHabitUpdated={fetchData}
          />
      ──────────────────────────────────────────────────────────────── */}
    </>
  )
}