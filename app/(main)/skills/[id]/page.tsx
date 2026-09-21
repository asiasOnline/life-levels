'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ItemContainer from '@/components/layout/app/item-container'
import { BackLink, DetailLoading, DetailNotFound } from '@/components/layout/app/detail-page-shell'
import { SkillDetailView } from '@/components/features/skills/skill-detail-view'
import { EditSkillModal } from '@/components/features/skills/edit-skill-modal'
import { fetchSkillById } from '@/lib/actions/skills'
import { SkillWithRelations } from '@/lib/types/skills'

export default function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [skill, setSkill] = useState<SkillWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const loadSkill = useCallback(async () => {
    const result = await fetchSkillById(id)
    setSkill(result.success ? result.data : null)
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    loadSkill()
  }, [loadSkill])

  return (
    <ItemContainer>
      <BackLink href="/skills" label="Back to Skills" />

      {isLoading ? (
        <DetailLoading message="Loading skill..." />
      ) : !skill ? (
        <DetailNotFound entity="Skill" backHref="/skills" backLabel="Back to Skills" />
      ) : (
        <>
          <SkillDetailView
            skill={skill}
            onSkillDeleted={() => router.push('/skills')}
            onEditRequest={() => setIsEditModalOpen(true)}
          />

          <EditSkillModal
            skill={skill}
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onSkillUpdated={() => {
              setIsEditModalOpen(false)
              loadSkill()
            }}
          />
        </>
      )}
    </ItemContainer>
  )
}
