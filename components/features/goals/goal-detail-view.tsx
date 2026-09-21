'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GoalWithRelations, GOAL_STATUS, GoalStatus, GoalDifficulty } from '@/lib/types/goals'
import { deleteGoal } from '@/lib/actions/goals'
import { calculateGoalRewards } from '@/lib/utils/goals'
import { formatDateLong, cn } from '@/lib/utils/general'
import { renderIcon } from '@/lib/utils/icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Calendar, CheckCircle2, Coins, Pencil, Sparkles, Swords, Target, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

// =======================================
// PROPS
// =======================================

interface GoalDetailViewProps {
  goal: GoalWithRelations
  // Called after the goal is deleted; the page navigates back to the list
  onGoalDeleted: () => void
  // The page owns the edit modal
  onEditRequest: (goal: GoalWithRelations) => void
}

// =======================================
// HELPERS
// =======================================

const STATUS_STYLES: Record<GoalStatus, { label: string; className: string }> = {
  [GOAL_STATUS.BACKLOG]:     { label: 'Backlog',     className: 'bg-muted text-muted-foreground' },
  [GOAL_STATUS.IN_PROGRESS]: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  [GOAL_STATUS.COMPLETED]:   { label: 'Completed',   className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  [GOAL_STATUS.PAUSED]:      { label: 'Paused',      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
}

const DIFFICULTY_LABELS: Record<GoalDifficulty, string> = {
  easy:   'Easy',
  normal: 'Normal',
  hard:   'Hard',
  expert: 'Expert',
}

function formatTimestamp(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// =======================================
// MAIN COMPONENT
// =======================================

export function GoalDetailView({ goal, onGoalDeleted, onEditRequest }: GoalDetailViewProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const status = STATUS_STYLES[goal.status] ?? STATUS_STYLES[GOAL_STATUS.BACKLOG]

  // Custom XP if set, otherwise the algorithm output for the difficulty and linked skills
  const calculated = calculateGoalRewards(goal.difficulty, goal.skills.length)
  const characterXP = goal.use_custom_xp ? (goal.character_xp ?? 0) : calculated.character_xp
  const skillXP     = goal.use_custom_xp ? (goal.skill_xp ?? 0)     : calculated.skill_xp

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteGoal(goal.id)
      if (!result.success) {
        toast.error(`Failed to delete goal: ${result.error}`)
        return
      }
      toast.success(`"${goal.title}" has been deleted.`)
      onGoalDeleted()
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast.error('Error deleting goal. Please try again.')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <div className="rounded-xl border bg-background p-6 max-w-4xl space-y-6">
        {/* ── Header ── */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="shrink-0">
              {renderIcon(goal.icon.value, goal.icon.type, goal.icon.color, 'w-12 h-12')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold">{goal.title}</h1>
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', status.className)}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {goal.description || 'No description'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEditRequest(goal)}
              title="Edit goal"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              title="Delete goal"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </header>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills ({goal.skills.length})</TabsTrigger>
            <TabsTrigger value="characters">Characters ({goal.characters.length})</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant="outline" className="w-full justify-center">{status.label}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Difficulty</p>
                <Badge variant="outline" className="w-full justify-center">
                  {DIFFICULTY_LABELS[goal.difficulty]}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </div>
                <p className="text-sm font-semibold">
                  {goal.start_date ? formatDateLong(goal.start_date) : 'No start date'}
                </p>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Target className="h-4 w-4" />
                  Due Date
                </div>
                <p className="text-sm font-semibold">
                  {goal.due_date ? formatDateLong(goal.due_date) : 'No due date'}
                </p>
              </div>
            </div>

            {goal.status === GOAL_STATUS.COMPLETED && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                This goal has been completed.
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
                    <p className="text-lg font-bold text-amber-600">{goal.gold_reward}</p>
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
                      {skillXP} × {goal.skills.length}
                    </p>
                  </div>
                </div>
              </div>
              {goal.use_custom_xp && (
                <p className="text-xs text-muted-foreground italic">Using custom XP values</p>
              )}
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatTimestamp(goal.created_at)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">{formatTimestamp(goal.updated_at)}</p>
              </div>
            </div>
          </TabsContent>

          {/* ── Skills ── */}
          <TabsContent value="skills" className="mt-6">
            {goal.skills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No skills linked to this goal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goal.skills.map((skill) => (
                  <Link
                    key={skill.id}
                    href={`/skills/${skill.id}`}
                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="shrink-0">
                      {renderIcon(skill.icon.value, skill.icon.type, skill.icon.color, 'w-8 h-8')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{skill.title}</h4>
                      <p className="text-sm text-muted-foreground">Level {skill.level}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">XP Award</p>
                      <p className="text-lg font-bold text-violet-600">+{skillXP}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Characters ── */}
          <TabsContent value="characters" className="mt-6">
            {goal.characters.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No characters linked to this goal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goal.characters.map((character) => (
                  <Link
                    key={character.id}
                    href={`/characters/${character.id}`}
                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: character.character_color }}
                    >
                      {renderIcon(character.icon.value, character.icon.type, '#ffffff', 'w-5 h-5')}
                    </div>
                    <h4 className="flex-1 min-w-0 font-semibold truncate">{character.title}</h4>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">XP Award</p>
                      <p className="text-lg font-bold text-cyan-600">+{characterXP}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => { if (!open && !isDeleting) setIsDeleteDialogOpen(false) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&quot;{goal.title}&quot;</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Goal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
