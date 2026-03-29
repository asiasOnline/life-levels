'use client'

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/app/page-header";
import ItemContainer from "@/components/layout/app/item-container";
import { ItemContainerHeader } from "@/components/layout/app/item-container-header";
import { ViewMode } from "@/components/layout/app/item-container-header"
import { fetchHabits } from "@/lib/actions/habits";
import { HabitWithRelations } from "@/lib/types/habits";
import { HabitCard } from "@/components/features/habits/habit-card";

export default function HabitPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
        const [habits, setHabits] = useState<HabitWithRelations[]>([])
        const [isLoading, setIsLoading] = useState(true)
        const [selectedHabit, setSelectedHabit] = useState<HabitWithRelations | null>(null)
        const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
        const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    useEffect(() => {
    loadTasks()
  }, [])

 const loadTasks = async () => {
    try {
      setIsLoading(true)
      const data = await fetchHabits()

      // Map database rows to Task objects
      const habitsData: HabitWithRelations[] = data.map((row) => ({
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

    return (
      <>
      <PageHeader 
        title="Habits"
        subtitle="Recurring activities that help develop consistent behaviors."
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