'use client'

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/app/page-header";
import ItemContainer from "@/components/layout/app/item-container";
import { ItemContainerHeader } from "@/components/layout/app/item-container-header";
import { ViewMode } from "@/components/layout/app/item-container-header";
import { fetchTasks } from "@/lib/actions/tasks";
import { TaskWithSkills } from "@/lib/actions/tasks";
import TaskCard from "@/components/features/tasks/task-card";
import { TaskTableRow } from "@/components/features/tasks/task-table-row";
import { CreateTaskModal } from "@/components/features/tasks/create-task-modal";
import { TaskDetailModal } from "@/components/features/tasks/task-detail-modal";
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

export default function TaskPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [tasks, setTasks] = useState<TaskWithSkills[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState<TaskWithSkills | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    useEffect(() => {
    loadTasks()
  }, [])

 const loadTasks = async () => {
    try {
      setIsLoading(true)
      const data = await fetchTasks()

      // Map database rows to Task objects
      const tasksData: TaskWithSkills[] = data.map((row) => ({
        id: row.id,
        user_id: row.id,
        title: row.title,
        description: row.description || null,
        icon: row.icon,
        task_skills: row.task_skills,
        status: row.status,
        difficulty: row.difficulty,
        priority: row.priority,
        start_date: row.start_date || null,
        due_date: row.due_date || null,
        completed_at: row.completed_at || null,
        use_custom_gold: row.use_custom_gold,
        gold_reward: row.gold_reward,
        use_custom_xp: row.use_custom_xp, 
        character_xp: row.character_xp,
        skill_xp: row.skill_xp, 
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))

      setTasks(tasksData)
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  function handleTaskClick(task: TaskWithSkills) {
    setSelectedTask(task)
    setIsDetailModalOpen(true)
  }

  function handleTaskCreated() {
    loadTasks()
  }

  function handleTaskUpdated() {
    loadTasks()
  }

  function handleTaskDeleted() {
    loadTasks()
  }

  if (isLoading) {
    return (
      <ItemContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </ItemContainer>
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

            {/* Skill Detail Modal */}
            <TaskDetailModal 
              task={selectedTask}
              isOpen={isDetailModalOpen}
              onClose={setIsDetailModalOpen}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />

        </ItemContainer>
      </>
    );
  }