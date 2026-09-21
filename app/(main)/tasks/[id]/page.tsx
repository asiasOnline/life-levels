'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ItemContainer from '@/components/layout/app/item-container'
import { BackLink, DetailLoading, DetailNotFound } from '@/components/layout/app/detail-page-shell'
import { TaskDetailView } from '@/components/features/tasks/task-detail-view'
import { EditTaskModal } from '@/components/features/tasks/edit-task-modal'
import { fetchTaskById } from '@/lib/actions/tasks'
import { useLinkableOptions } from '@/lib/hooks/use-linkable-options'
import { TaskWithRelations } from '@/lib/types/tasks'

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { availableSkills, availableCharacters } = useLinkableOptions()

  const [task, setTask] = useState<TaskWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const loadTask = useCallback(async () => {
    const result = await fetchTaskById(id)
    setTask(result.success ? result.data : null)
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    loadTask()
  }, [loadTask])

  return (
    <ItemContainer>
      <BackLink href="/tasks" label="Back to Tasks" />

      {isLoading ? (
        <DetailLoading message="Loading task..." />
      ) : !task ? (
        <DetailNotFound entity="Task" backHref="/tasks" backLabel="Back to Tasks" />
      ) : (
        <>
          <TaskDetailView
            task={task}
            onTaskDeleted={() => router.push('/tasks')}
            onEditRequest={() => setIsEditModalOpen(true)}
          />

          <EditTaskModal
            isOpen={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onTaskUpdated={loadTask}
            task={task}
            availableSkills={availableSkills}
            availableCharacters={availableCharacters}
          />
        </>
      )}
    </ItemContainer>
  )
}
