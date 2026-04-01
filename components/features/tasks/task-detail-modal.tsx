import React from 'react'

import { useState } from 'react'
import type { TaskWithSkills } from '@/lib/actions/tasks'
import { deleteTask } from '@/lib/actions/tasks'
import { 
  getTaskStatusColor,
  getTaskPriorityColor, 
  getTaskDifficultyColor, 
  calculateTaskXP 
} from '@/lib/utils/tasks'
import { formatDateLong } from '@/lib/utils/general'
import { renderIcon } from '@/lib/utils/icon'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Link2, Users, Target, ListTodo, RefreshCw, CheckCircle2, Calendar, Coins, Sparkles, Swords } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/general'
import { TASK_DIFFICULTY_LABELS, TASK_PRIORITY_LABELS } from '@/lib/types/tasks'

interface TaskDetailModalProps {
  task: TaskWithSkills | null
  isOpen: boolean
  onClose: (isOpen: boolean) => void
  onTaskUpdated: () => void
  onTaskDeleted: () => void
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!task) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteTask(task.id)

      toast.success(`"${task.title}" has been successfully deleted.`)
      
      onClose(false)
      onTaskDeleted()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Error deleting task. Please try again.')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const { skillXP, characterXP } = calculateTaskXP(
    task.difficulty,
    task.task_skills.length,
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {renderIcon(task.icon.value, task.icon.type, task.icon.color, 'w-12 h-12')}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl">{task.title}</DialogTitle>
                  <DialogDescription>
                    {task.description || 'No description'}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
        </DialogHeader>

        <Tabs defaultValue='overview' className='mt-6'>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">
              Number of Linked Skills: {task.task_skills.length}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Status & Metadata */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <Badge
                  variant="outline"
                  className={cn('w-full justify-center gap-2', getTaskStatusColor(task.status))}
                >
                </Badge>
              </div>

              <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Priority
                  </label>
                  <Badge
                    variant="outline"
                    className={cn('w-full justify-center', getTaskPriorityColor(task.priority))}
                  >
                    {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Difficulty
                  </label>
                  <Badge
                    variant="outline"
                    className={cn('w-full justify-center', getTaskDifficultyColor(task.difficulty))}
                  >
                    {TASK_DIFFICULTY_LABELS[task.difficulty as keyof typeof TASK_DIFFICULTY_LABELS]}
                  </Badge>
                </div>
            </div>

       {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </div>
                  <p className="text-sm font-semibold">
                    {task.start_date ? formatDateLong(task.start_date) : 'No start date'}
                  </p>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Target className="h-4 w-4" />
                    Due Date
                  </div>
                  <p className="text-sm font-semibold">
                    {task.due_date ? formatDateLong(task.due_date) : 'No due date'}
                  </p>
                </div>
              </div>

              {/* Completion Date (if completed) */}
              {task.completed_at && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed
                  </div>
                  <p className="text-sm font-semibold text-green-800">
                    {formatDateLong(task.completed_at)}
                  </p>
                </div>
              )}

              {/* Rewards */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="text-sm font-semibold">Rewards</h3>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <Coins className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Gold</p>
                      <p className="text-lg font-bold text-amber-600">{task.gold_reward}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                    <Sparkles className="h-5 w-5 text-cyan-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Char XP</p>
                      <p className="text-lg font-bold text-cyan-600">{characterXP}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                    <Swords className="h-5 w-5 text-violet-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Skill XP</p>
                      <p className="text-lg font-bold text-violet-600">
                        {skillXP} × {task.task_skills.length}
                      </p>
                    </div>
                  </div>
                </div>

                {task.use_custom_xp && (
                  <p className="text-xs text-muted-foreground italic">
                    Using custom XP values
                  </p>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {new Date(task.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">
                    {new Date(task.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Linked Skills Tab */}
            <TabsContent value="skills" className="mt-6">
              {task.task_skills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No skills linked to this task</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {task.task_skills.map((taskSkill) => {
                    const skill = taskSkill.skills
                    const skillIcon = skill.icon as any

                    return (
                      <div
                        key={skill.id}
                        className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="shrink-0">
                          {skillIcon.type === 'emoji' ? (
                            <span className="text-2xl">{skillIcon.value}</span>
                          ) : skillIcon.type === 'fontawesome' ? (
                            <i
                              className={cn('fa-solid', skillIcon.value, 'text-xl')}
                              style={{ color: skillIcon.color ?? '#94a3b8' }}
                            />
                          ) : (
                            <img
                              src={skillIcon.value}
                              alt={skill.title}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{skill.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Level {skill.level}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">XP Award</p>
                          <p className="text-lg font-bold text-violet-600">+{skillXP}</p>
                        </div>
                      </div>
                    )
                  })}

                  <div className="mt-6 rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      Completing this task will award <strong className="text-violet-600">{skillXP} XP</strong> to each of the {task.task_skills.length} skill{task.task_skills.length !== 1 ? 's' : ''} above.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{task.title}"</strong>? This action cannot be undone.
              {task.status === 'completed' && (
                <span className="block mt-2 text-amber-600">
                  Note: Any XP and Gold already earned from this task will be kept.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
