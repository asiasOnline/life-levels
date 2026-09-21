'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ItemContainer from '@/components/layout/app/item-container'
import { BackLink, DetailLoading, DetailNotFound } from '@/components/layout/app/detail-page-shell'
import { GoalDetailView } from '@/components/features/goals/goal-detail-view'
import { EditGoalModal } from '@/components/features/goals/edit-goal-modal'
import { fetchGoalById } from '@/lib/actions/goals'
import { useLinkableOptions } from '@/lib/hooks/use-linkable-options'
import { GoalWithRelations } from '@/lib/types/goals'

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { availableSkills, availableCharacters } = useLinkableOptions()

  const [goal, setGoal] = useState<GoalWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const loadGoal = useCallback(async () => {
    const result = await fetchGoalById(id)
    setGoal(result.success ? result.data : null)
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    loadGoal()
  }, [loadGoal])

  return (
    <ItemContainer>
      <BackLink href="/goals" label="Back to Goals" />

      {isLoading ? (
        <DetailLoading message="Loading goal..." />
      ) : !goal ? (
        <DetailNotFound entity="Goal" backHref="/goals" backLabel="Back to Goals" />
      ) : (
        <>
          <GoalDetailView
            goal={goal}
            onGoalDeleted={() => router.push('/goals')}
            onEditRequest={() => setIsEditModalOpen(true)}
          />

          <EditGoalModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onGoalUpdated={loadGoal}
            goal={goal}
            availableSkills={availableSkills}
            availableCharacters={availableCharacters}
          />
        </>
      )}
    </ItemContainer>
  )
}
