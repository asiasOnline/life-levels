'use client'

import { useState } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface SortOption {
  id: string
  label: string
  value: string
}

interface SortDropdownProps {
  options: SortOption[]
  defaultSort?: string
  onSortChange: (sortBy: string) => void
}

export function SortDropdown({ options, defaultSort, onSortChange }: SortDropdownProps) {
  const [selectedSort, setSelectedSort] = useState(defaultSort || options[0]?.value)

  const handleSortChange = (value: string) => {
    setSelectedSort(value)
    onSortChange(value)
  }

  const selectedLabel = options.find((opt) => opt.value === selectedSort)?.label

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={selectedSort} onValueChange={handleSortChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}