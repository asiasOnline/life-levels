'use client'

import { useState } from 'react'
import { SkillWithRelations } from '@/lib/types/skills'
import { renderIcon } from '@/lib/utils/icon'
import { getProgressPercentage } from '@/lib/utils/skills'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
import { LinkedItemsSection } from '@/components/layout/app/linked-items-section'
import { Pencil, Trash2, Target, ListTodo, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { deleteSkill } from '@/lib/actions/skills'



interface SkillDetailViewProps {
  skill: SkillWithRelations
  // Called after the skill is deleted; the page navigates back to the list
  onSkillDeleted: () => void
  // The page owns the edit modal
  onEditRequest: (skill: SkillWithRelations) => void
}

export function SkillDetailView({
  skill,
  onSkillDeleted,
  onEditRequest,
}: SkillDetailViewProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const progressPercentage = getProgressPercentage(skill.current_xp, skill.xp_to_next_level)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteSkill(skill.id)
      if (!result.success) {
        toast.error(`Failed to delete skill: ${result.error}`)
        return
      }

      toast(`${skill.title} has been removed from your skill log.`)

      onSkillDeleted()
    } catch (error) {
      console.error('Error deleting skill:', error)
      toast.error('Failed to delete skill. Please try again.')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <div className="rounded-xl border bg-background p-6 max-w-4xl space-y-6">
          <header>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">
                  {renderIcon(skill.icon.value, skill.icon.type, skill.icon.color, 'w-12 h-12')}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{skill.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {skill.description || 'No description'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEditRequest(skill)}
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
          </header>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Level & XP Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Progress</h3>
                  <Badge variant="secondary" className="text-lg font-bold px-4 py-1">
                    Level {skill.level}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">XP Progress</span>
                    <span className="font-medium">
                      {skill.current_xp} / {skill.xp_to_next_level} XP
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <p className="text-xs text-muted-foreground text-right">
                    {skill.xp_to_next_level - skill.current_xp} XP to Level {skill.level + 1}
                  </p>
                </div>
              </div>

              {/* Tags Section */}
              {skill.tags && skill.tags.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {skill.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {new Date(skill.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {new Date(skill.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Activities linked to this skill award it XP when completed.
              </p>

              <LinkedItemsSection
                label="Goals"
                singular="goal"
                basePath="/goals"
                items={skill.goals}
                headerIcon={<Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                iconBgClassName="bg-blue-100 dark:bg-blue-900/20"
              />
              <LinkedItemsSection
                label="Tasks"
                singular="task"
                basePath="/tasks"
                items={skill.tasks}
                headerIcon={<ListTodo className="h-5 w-5 text-green-600 dark:text-green-400" />}
                iconBgClassName="bg-green-100 dark:bg-green-900/20"
              />
              <LinkedItemsSection
                label="Habits"
                singular="habit"
                basePath="/habits"
                items={skill.habits}
                headerIcon={<RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                iconBgClassName="bg-orange-100 dark:bg-orange-900/20"
              />
            </TabsContent>
          </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Skill?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{skill.title}"? This action cannot be undone.
              All progress and XP associated with this skill will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}