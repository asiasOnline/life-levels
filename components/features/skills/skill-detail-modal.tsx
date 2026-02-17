'use client'

import { useState } from 'react'
import { Skill } from '@/lib/types/skills'
import { renderIcon } from '@/components/layout/app/icon-picker/icon-utils'
import { getProgressPercentage } from '../../../lib/utils/skills'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { EditSkillModal } from './edit-skill-modal'
import { Pencil, Trash2, Link2, Users, Target, ListTodo, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { deleteSkill } from '@/lib/actions/skill'



interface SkillDetailModalProps {
  skill: Skill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSkillUpdated: () => void
  onSkillDeleted: () => void
}

export function SkillDetailModal({
  skill,
  open,
  onOpenChange,
  onSkillUpdated,
  onSkillDeleted,
}: SkillDetailModalProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!skill) return null

  const progressPercentage = getProgressPercentage(skill.currentXP, skill.xpToNextLevel)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteSkill(skill.id)
      toast(`${skill.title} has been removed from your skill log.`)
      onSkillDeleted()
      onOpenChange(false)
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">
                  {renderIcon(skill.icon, skill.iconType, skill.iconColor, 'w-12 h-12')}
                </div>
                <div>
                  <DialogTitle className="text-2xl">{skill.title}</DialogTitle>
                  <DialogDescription>
                    {skill.description || 'No description'}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex gap-2">
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
                      {skill.currentXP} / {skill.xpToNextLevel} XP
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <p className="text-xs text-muted-foreground text-right">
                    {skill.xpToNextLevel - skill.currentXP} XP to Level {skill.level + 1}
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
                      {skill.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {skill.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections" className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Link this skill to other features to track related activities and progress.
                </p>

                {/* Character Link */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">Character</h4>
                        <p className="text-sm text-muted-foreground">
                          {skill.characterId ? 'Linked to character' : 'Not linked'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Link2 className="h-4 w-4 mr-2" />
                      Link
                    </Button>
                  </div>
                </div>

                {/* Goals Link */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">Goals</h4>
                        <p className="text-sm text-muted-foreground">
                          0 linked goals
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Link2 className="h-4 w-4 mr-2" />
                      Link
                    </Button>
                  </div>
                </div>

                {/* Tasks Link */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <ListTodo className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">Tasks</h4>
                        <p className="text-sm text-muted-foreground">
                          0 linked tasks
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Link2 className="h-4 w-4 mr-2" />
                      Link
                    </Button>
                  </div>
                </div>

                {/* Habits Link */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                        <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">Habits</h4>
                        <p className="text-sm text-muted-foreground">
                          0 linked habits
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Link2 className="h-4 w-4 mr-2" />
                      Link
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <EditSkillModal
        skill={skill}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSkillUpdated={() => {
          onSkillUpdated()
          setIsEditModalOpen(false)
        }}
      />

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