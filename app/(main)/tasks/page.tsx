'use client'

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/app/page-header";
import ItemContainer from "@/components/layout/app/item-container";
import { ItemContainerHeader } from "@/components/layout/app/item-container-header";
import { ViewMode } from "@/lib/types";
import { Task } from "@/lib/types/tasks";
import { IconType } from "@/components/layout/app/icon-picker/types";
import { Button } from "@/components/ui/button";

export default function Tasks() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    return (
      <>
        <PageHeader 
        title="Tasks"
        subtitle="Manage all of the tasks that must be completed to contribute to larger projects and goals."
        />
        <ItemContainer>
          <ItemContainerHeader
            title="Task Log"
            searchPlaceholder="Search tasks..."
            addButtonLabel="New Skill"
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