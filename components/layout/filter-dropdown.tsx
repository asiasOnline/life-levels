'use client'

import { useState } from "react"
import { IoFilterOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { Button } from "../ui/button";
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";

export interface FilterOption {
    id: string;
    label: string;
    value: string;
}

export interface FilterGroup {
    id: string;
    label: string;
    options: FilterOption[];
}

interface FilterDropdownProps {
    filterGroups: FilterGroup[];
    onFilterChange: (filters: Record<string, string[]>) => void;
}

export function FilterDropdown({ filterGroups, onFilterChange }: FilterDropdownProps) {
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({}); 

    const handleToggleFilter = (groupId: string, optionValue: string) => {
        setSelectedFilters((prev) => {
            const groupFilters = prev[groupId] || [];
            const updatedGroupFilters = groupFilters.includes(optionValue)
                ? groupFilters.filter(value => value !== optionValue) 
                : [...groupFilters, optionValue];
            
                const updatedFilters = { 
                ...prev, 
                [groupId]: updatedGroupFilters 
            };
            
            onFilterChange(updatedFilters); // Notify parent of filter change
            return updatedFilters;
        });
    };

    const handleClearFilters = () => {
        setSelectedFilters({});
        onFilterChange({}); // Notify parent that filters are cleared
    };

    const activeFilterCount = Object.values(selectedFilters).flat().length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={'icon'} className="relative">
                    <IoFilterOutline className="mr-2 h-4 w-4" />
                    {activeFilterCount > 0 && (
                        <Badge 
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">
                        Filters
                    </DropdownMenuLabel>
                    {activeFilterCount > 0 && (
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-auto p-1 text-xs"
                        >
                        Clear All
                        </Button>
                    )}
                </div>

                <DropdownMenuSeparator />

                {filterGroups.map((group) => (
                    <div key={group.id}>
                        <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                        {group.options.map((option) => (
                            <DropdownMenuCheckboxItem
                                key={option.id}
                                checked={selectedFilters[group.id]?.includes(option.value)}
                                onCheckedChange={() => handleToggleFilter(group.id, option.value)}
                            >
                                {option.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}