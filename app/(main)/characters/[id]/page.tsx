'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ItemContainer from '@/components/layout/app/item-container'
import { BackLink, DetailLoading, DetailNotFound } from '@/components/layout/app/detail-page-shell'
import { CharacterDetailView } from '@/components/features/characters/character-detail-view'
import { EditCharacterModal } from '@/components/features/characters/edit-character-modal'
import { fetchCharacterById } from '@/lib/actions/characters'
import { CharacterWithRelations } from '@/lib/types/character'

export default function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [character, setCharacter] = useState<CharacterWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const loadCharacter = useCallback(async () => {
    const result = await fetchCharacterById(id)
    setCharacter(result.success ? result.data : null)
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    loadCharacter()
  }, [loadCharacter])

  return (
    <ItemContainer>
      <BackLink href="/characters" label="Back to Characters" />

      {isLoading ? (
        <DetailLoading message="Loading character..." />
      ) : !character ? (
        <DetailNotFound entity="Character" backHref="/characters" backLabel="Back to Characters" />
      ) : (
        <>
          <CharacterDetailView
            character={character}
            onCharacterUpdated={loadCharacter}
            onCharacterDeleted={() => router.push('/characters')}
            onEditRequest={() => setIsEditModalOpen(true)}
          />

          <EditCharacterModal
            character={character}
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onCharacterUpdated={() => {
              setIsEditModalOpen(false)
              loadCharacter()
            }}
          />
        </>
      )}
    </ItemContainer>
  )
}
