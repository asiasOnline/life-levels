'use client';

import { useState } from "react";
import { Character } from "@/lib/types/character";
import { IconType } from "@/lib/types/icon";
import { ViewMode } from "@/lib/types";
import PageHeader from "@/components/layout/app/page-header";
import ItemContainer from "@/components/layout/app/item-container";
import { ItemContainerHeader } from "@/components/layout/app/item-container-header";

export default function CharactersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [character, setCharacter] = useState<Character[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

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
      </ItemContainer>
      </>
    );
  }