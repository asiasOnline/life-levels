'use client'

import { useState } from 'react'
import { Search, Plus, Grid3x3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FilterDropdown, FilterGroup } from './filter-dropdown'
import { SortDropdown, SortOption } from './sort-dropdown'
import { ViewMode } from '@/lib/types'

interface ItemContainerHeaderProps {
  title: string
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  onAddNew?: () => void
  addButtonLabel?: string
  filterGroups?: FilterGroup[]
  onFilterChange?: (filters: Record<string, string[]>) => void
  sortOptions?: SortOption[]
  onSortChange?: (sortBy: string) => void
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  showSearch?: boolean
  showFilter?: boolean
  showSort?: boolean
  showViewToggle?: boolean
}

export function ItemContainerHeader({
  title,
  onSearch,
  searchPlaceholder = 'Search...',
  onAddNew,
  addButtonLabel = 'Add New',
  filterGroups = [],
  onFilterChange,
  sortOptions = [],
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  showSearch = true,
  showFilter = true,
  showSort = true,
  showViewToggle = true,
}: ItemContainerHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  return (
    <div className="w-full space-y-4 p-6 border-b border-stone-200">
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-12">
          <h1 className="text-lg text-stone-500">{title}</h1>
        
          {/* Search */}
          <div className="w-120 flex-1 max-w-md">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Add Button */}
          {onAddNew && (
            <Button onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              {addButtonLabel}
            </Button>
          )}

          {/* Filter */}
          {showFilter && filterGroups.length > 0 && onFilterChange && (
            <FilterDropdown
              filterGroups={filterGroups}
              onFilterChange={onFilterChange}
            />
          )}

          {/* Sort */}
          {showSort && sortOptions.length > 0 && onSortChange && (
            <SortDropdown
              options={sortOptions}
              onSortChange={onSortChange}
            />
          )}

          {/* View Toggle */}
          {showViewToggle && onViewModeChange && (
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => {
                if (value) onViewModeChange(value as ViewMode)
              }}
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid3x3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}

        </div>
      </div>
    </div>
  )
}