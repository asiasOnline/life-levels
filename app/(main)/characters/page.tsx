'use client';

import { useState, useEffect } from "react";
import { Character } from "@/lib/types/character";
import { IconType } from "@/lib/types/icon";
import { ViewMode } from "@/components/layout/app/item-container-header";
import PageHeader from "@/components/layout/app/page-header";
import ItemContainer from "@/components/layout/app/item-container";
import { ItemContainerHeader } from "@/components/layout/app/item-container-header";
import { CreateCharacterModal } from "@/components/features/characters/create-character-modal";
import { CharacterCard } from "@/components/features/characters/character-card";
import { CharacterTableRow } from "@/components/features/characters/character-table-row";
import { CharacterDetailModal } from "@/components/features/characters/character-detail-modal";
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody
 } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  fetchCharacters, 
  fetchCharacterById 
} from "@/lib/actions/characters";
import { Button } from "@/components/ui/button";
import { FaPlus, FaXmark } from "react-icons/fa6";

export default function CharactersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [characters, setCharacters] = useState<Character[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    const loadCharacters = async () => {
      setIsLoading(true)
      try {
        const result = await fetchCharacters()
        
        if (!result.success) {
          toast.error('Failed to load characters. Please refresh the page.')
          return
        }
        
        setCharacters(result.data)
      } catch (error) {
        console.error('Error loading skills:', error)
        toast.error('Failed to load skills. Please refresh the page.')

      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    loadCharacters()
  }, [])

  const handleCharacterClick = async (character: Character) => {
    const result = await fetchCharacterById(character.id)

    if (!result.success) {
      toast.error('Failed to load character details.')
      return
    }

    setSelectedCharacter(result.data)
    setIsDetailModalOpen(true)
  }

  const handleCharacterCreated = () => {
    loadCharacters()
  }

  const handleCharacterUpdated = () => {
    setIsDetailModalOpen(false)
    setSelectedCharacter(null)
    loadCharacters()
  }

  const handleCharacterDeleted = () => {
    setIsDetailModalOpen(false)
    setSelectedCharacter(null)
    loadCharacters()
  }

  if (isLoading) {
    return (
      <ItemContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Calling your characters...</p>
        </div>
      </ItemContainer>
    )
  }

    return (
      <>
        <PageHeader 
        title="Characters"
        subtitle="Create characters to define different versions of yourself."
      />
      {/* Character Log Container */}
      <ItemContainer>
        <ItemContainerHeader 
          title="Character Log"
          searchPlaceholder="Search characters..."
          addButtonLabel="New Character"
          onAddNew={() => setIsCreateModalOpen(true)}
          onSearch={(query) => console.log('Search:', query)}
          onFilterChange={() => console.log('Filter')}
          onSortChange={() => console.log('Sort')}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

      {/* Characters Display */}
      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          {/* No Characters View */}
          <p className="text-muted-foreground mb-4">No characters yet</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <FaPlus className="h-4 w-4 mr-2" />
            Create Your First Character
          </Button>
        </div>
      ) : (
        <>
        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 justify-center content-start auto-cols-max gap-4 p-6">
            {characters.map((character) => (
              <CharacterCard 
              key={character.id} 
              character={character} 
              onClick={handleCharacterClick} />
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
                {characters.map((character) => (
                  <CharacterTableRow 
                    key={character.id} 
                    character={character}
                    onClick={handleCharacterClick} 
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        </>
        )}
        
        {/* Create Character Modal */}
        <CreateCharacterModal
        isOpen={isCreateModalOpen}
        onClose={setIsCreateModalOpen}
        onCharacterCreated={handleCharacterCreated}
      />

      {/* Character Detail Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        isOpen={isDetailModalOpen}
        onClose={setIsDetailModalOpen}
        onCharacterUpdated={handleCharacterUpdated}
        onCharacterDeleted={handleCharacterDeleted}
      />

      </ItemContainer>
      </>
    );
  }