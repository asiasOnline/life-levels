'use client'

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/layout/app/page-header";
import ItemContainer from "@/components/layout/app/item-container";
import { ItemContainerHeader } from "@/components/layout/app/item-container-header";
import { IconType } from "@/components/layout/app/icon-picker/types";
import { ViewMode } from "@/lib/types";
import { Task } from "@/lib/types/tasks";
import TaskCard from "@/components/features/tasks/task-card";
import TaskTableRow from "@/components/features/tasks/task-table-row";
import { CreateTaskModal } from "@/components/features/tasks/create-task-modal";
import TaskDetailModal from "@/components/features/tasks/task-detail-modal";
import { 
  Table, 
  TableHead, 
  TableHeader,
  TableBody,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FaPlus, FaXmark } from "react-icons/fa6";

// ─── Types ───────────────────────────

interface TaskWithSkills extends Task {
  task_skills: {
    skills: {
      id: string
      title: string
      icon: string
      icon_type: string
      icon_color: string
      level: number
    }
  }[]
}


export default function TaskPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_skills (
            skills (
              id,
              title,
              icon,
              icon_type,
              icon_color,
              level
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleTaskCreated() {
    loadTasks()
  }

  function handleTaskClick(taskId: string) {
    // Navigate to task detail page or open edit modal
    console.log('Clicked task:', taskId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    )
  }

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
            addButtonLabel="New Task"
            onAddNew={() => setIsCreateModalOpen(true)}
            onSearch={(query) => console.log('Search:', query)}
            onFilterChange={() => console.log('Filter')}
            onSortChange={() => console.log('Sort')}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

           {/* Tasks Display */}
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-100 rounded-lg border border-dashed">
                <div className="text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FaPlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">No tasks yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first task to get started
                    </p>
                  </div>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <FaPlus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    linkedSkills={task.task_skills.map((ts) => ({
                      id: ts.skills.id,
                      title: ts.skills.title,
                    }))}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      {tasks.map((task) => (
                        <TaskTableRow
                          key={task.id}
                          task={task}
                          linkedSkills={task.task_skills.map((ts) => ({
                            id: ts.skills.id,
                            title: ts.skills.title,
                          }))}
                          onClick={handleTaskClick}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Create Task Modal */}
            <CreateTaskModal
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
              onTaskCreated={handleTaskCreated}
            />

        </ItemContainer>
      </>
    );
  }