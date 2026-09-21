'use client'

import { use, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ItemContainer from '@/components/layout/app/item-container'
import { BackLink, DetailLoading, DetailNotFound } from '@/components/layout/app/detail-page-shell'
import { HabitDetailView } from '@/components/features/habits/habit-detail-view'
import { EditHabitModal } from '@/components/features/habits/edit-habit-modal'
import { fetchHabitById } from '@/lib/actions/habits'
import { useLinkableOptions } from '@/lib/hooks/use-linkable-options'
import { HabitWithRelations } from '@/lib/types/habits'
import {
  calculateConsistencyScore,
  getConsistencyWindowStart,
} from '@/lib/utils/habits'

export default function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { availableSkills, availableCharacters } = useLinkableOptions()

  const [habit, setHabit] = useState<HabitWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const loadHabit = useCallback(async () => {
    const result = await fetchHabitById(id)
    setHabit(result.success ? result.data : null)
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    loadHabit()
  }, [loadHabit])

  // Same placeholder as the habits list: there is no completions table yet, so
  // the score is computed from an empty history. Swap in real data once
  // habit_completions exists.
  const consistencyScore = useMemo(() => {
    if (!habit) return 0
    return calculateConsistencyScore(
      [],
      getConsistencyWindowStart(habit.created_at),
      habit.recurrence,
      {
        x_per_week_count:         habit.x_per_week_count,
        custom_recurrence_config: habit.custom_recurrence_config,
      }
    )
  }, [habit])

  return (
    <ItemContainer>
      <BackLink href="/habits" label="Back to Habits" />

      {isLoading ? (
        <DetailLoading message="Loading habit..." />
      ) : !habit ? (
        <DetailNotFound entity="Habit" backHref="/habits" backLabel="Back to Habits" />
      ) : (
        <>
          <HabitDetailView
            habit={habit}
            onHabitUpdated={loadHabit}
            onHabitDeleted={() => router.push('/habits')}
            onEditRequest={() => setIsEditModalOpen(true)}
            consistencyScore={consistencyScore}
          />

          <EditHabitModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onHabitUpdated={loadHabit}
            habit={habit}
            availableSkills={availableSkills}
            availableCharacters={availableCharacters}
          />
        </>
      )}
    </ItemContainer>
  )
}
