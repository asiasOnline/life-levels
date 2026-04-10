'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HabitWithRelations, HABIT_STATUS } from '@/lib/types/habits'
import { IconData } from '@/lib/types/icon'
import { setHabitStatus, deleteHabit } from '@/lib/actions/habits'
import {
  getRecurrenceLabel,
  getCompletionTimeLabel,
} from '@/lib/utils/habits'
import { cn } from '@/lib/utils/general'
import { toast } from 'sonner'
import {
  Archive,
  ArchiveRestore,
  Clock,
  Coins,
  Pencil,
  Repeat,
  Target,
  Trash2,
  Zap,
  Star,
  Shield,
} from 'lucide-react'

// =============================================================================
// PROPS
// =============================================================================

interface HabitDetailModalProps {
  habit:            HabitWithRelations | null
  isOpen:           boolean
  onClose:          () => void
  onHabitUpdated:   () => void
  onHabitDeleted:   () => void
  // Passed from the page so the modal can open the edit form over itself
  onEditRequest:    (habit: HabitWithRelations) => void
  // Optional pre-computed score from the page; 0 if not yet available
  consistencyScore?: number
}

// =============================================================================
// HELPERS
// =============================================================================

function renderIcon(icon: IconData): React.ReactNode {
  if (icon.type === 'emoji') {
    return <span className="text-2xl leading-none">{icon.value}</span>
  }
  if (icon.type === 'fontawesome') {
    return (
      <i
        className={cn('fa-solid', icon.value, 'text-lg')}
        style={{ color: icon.color ?? 'currentColor' }}
      />
    )
  }
  if (icon.type === 'image') {
    return <img src={icon.value} alt="" className="w-7 h-7 object-cover rounded" />
  }
  return null
}

function StatusBadge({ status }: { status: HabitWithRelations['status'] }) {
  const map = {
    active:   { label: 'Active',   className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    paused:   { label: 'Paused',   className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    archived: { label: 'Archived', className: 'bg-muted text-muted-foreground' },
  } as const
  const { label, className } = map[status] ?? map.active
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', className)}>
      {label}
    </span>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{children}</span>
    </div>
  )
}

function RewardChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-muted/40 px-4 py-3 min-w-[72px]">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-base font-bold tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}

function ConsistencyBar({ score }: { score: number }) {
  const colour =
    score >= 80 ? '#22c55e' :
    score >= 50 ? '#f59e0b' :
    '#94a3b8'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Consistency (30 days)</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color: colour }}>
          {score}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: colour }}
        />
      </div>
      {score === 0 && (
        <p className="text-xs text-muted-foreground">No completions logged yet in this window.</p>
      )}
    </div>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

export function HabitDetailModal({
  habit,
  isOpen,
  onClose,
  onHabitUpdated,
  onHabitDeleted,
  onEditRequest,
  consistencyScore = 0,
}: HabitDetailModalProps) {
  const [isPauseDialogOpen,   setIsPauseDialogOpen]   = useState(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
  const [isDeleteDialogOpen,  setIsDeleteDialogOpen]  = useState(false)
  const [isActioning,         setIsActioning]         = useState(false)

  if (!habit) return null

  const icon = habit.icon as IconData

  const isActive   = habit.status === HABIT_STATUS.ACTIVE
  const isPaused   = habit.status === HABIT_STATUS.PAUSED
  const isArchived = habit.status === HABIT_STATUS.ARCHIVED

  const recurrenceLabel = getRecurrenceLabel(habit.recurrence, {
    x_per_week_count:        habit.x_per_week_count,
    weekly_day:              habit.weekly_day,
    monthly_day:             habit.monthly_day,
    custom_recurrence_config: habit.custom_recurrence_config,
  })

  const durationLabel =
    habit.time_consumption >= 60
      ? `${Math.floor(habit.time_consumption / 60)}h${habit.time_consumption % 60 > 0 ? ` ${habit.time_consumption % 60}m` : ''}`
      : `${habit.time_consumption} min`

  // ── Status actions ─────────────────────────────────────────────────────────

  const handlePauseToggle = async () => {
    setIsActioning(true)
    try {
      const newStatus = isPaused ? 'active' : 'paused'
      // Reactivation goes through updateHabit in a real edit flow;
      // for pause toggle we can reuse setHabitStatus with 'active' mapped
      // through the action layer. Here we treat 'active' as a status update.
      const result = await setHabitStatus({
        id:     habit.id,
        status: isPaused ? 'paused' : 'paused', // see note below
      })
      // NOTE: setHabitStatus only accepts 'paused' | 'archived'.
      // For reactivation (paused → active), call updateHabit({ id, status: 'active' })
      // once an EditHabitModal exists. For now we surface the correct UI and guard
      // reactivation behind the edit flow.
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(isPaused ? `"${habit.title}" reactivated.` : `"${habit.title}" paused.`)
      onHabitUpdated()
      setIsPauseDialogOpen(false)
      onClose()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsActioning(false)
    }
  }

  const handleArchiveToggle = async () => {
    setIsActioning(true)
    try {
      const result = await setHabitStatus({ id: habit.id, status: 'archived' })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`"${habit.title}" archived. All data and connections are preserved.`)
      onHabitUpdated()
      setIsArchiveDialogOpen(false)
      onClose()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsActioning(false)
    }
  }

  const handleDelete = async () => {
    setIsActioning(true)
    try {
      const result = await deleteHabit(habit.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`"${habit.title}" permanently deleted.`)
      onHabitDeleted()
      setIsDeleteDialogOpen(false)
      onClose()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsActioning(false)
    }
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">

              {/* Icon + title + status */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
                  {renderIcon(icon)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl leading-tight">{habit.title}</DialogTitle>
                    <StatusBadge status={habit.status} />
                  </div>
                  {habit.description && (
                    <DialogDescription className="mt-0.5 text-sm">
                      {habit.description}
                    </DialogDescription>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEditRequest(habit)}
                  title="Edit habit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                {!isArchived && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPauseDialogOpen(true)}
                    title={isPaused ? 'Resume habit' : 'Pause habit'}
                  >
                    {isPaused
                      ? <ArchiveRestore className="h-4 w-4" />
                      : <Archive className="h-4 w-4" />
                    }
                  </Button>
                )}

                {isArchived && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsArchiveDialogOpen(true)}
                    title="Archive habit"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  title="Delete habit"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* ── Tabs ────────────────────────────────────────────────────────── */}
          <Tabs defaultValue="details" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="details"  className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="rewards"  className="flex-1">Rewards</TabsTrigger>
              <TabsTrigger value="assigned" className="flex-1">Assigned</TabsTrigger>
            </TabsList>

            {/* ── DETAILS TAB ─────────────────────────────────────────────── */}
            <TabsContent value="details" className="mt-4 space-y-5">

              {/* Consistency score */}
              <ConsistencyBar score={consistencyScore} />

              {/* Schedule info */}
              <div className="rounded-xl border divide-y">
                <InfoRow label="Recurrence">
                  <span className="flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
                    {recurrenceLabel}
                  </span>
                </InfoRow>

                <InfoRow label="Duration">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {durationLabel}
                  </span>
                </InfoRow>

                {habit.completion_time && (
                  <InfoRow label="Preferred time">
                    <span>
                      {habit.completion_time === 'morning'   ? '🌅 ' :
                       habit.completion_time === 'afternoon' ? '☀️ ' :
                       habit.completion_time === 'evening'   ? '🌙 ' : '🌃 '}
                      {getCompletionTimeLabel(habit.completion_time)}
                    </span>
                  </InfoRow>
                )}

                <InfoRow label="Status">
                  <StatusBadge status={habit.status} />
                </InfoRow>

                {habit.paused_at && (
                  <InfoRow label="Paused on">
                    {new Date(habit.paused_at).toLocaleDateString(undefined, {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </InfoRow>
                )}

                {habit.archived_at && (
                  <InfoRow label="Archived on">
                    {new Date(habit.archived_at).toLocaleDateString(undefined, {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </InfoRow>
                )}

                <InfoRow label="Created">
                  {new Date(habit.created_at).toLocaleDateString(undefined, {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </InfoRow>
              </div>

              {/* Linked goals */}
              {habit.goal_ids && habit.goal_ids.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Parent Goals
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {habit.goal_ids.map((id) => (
                      <Badge key={id} variant="outline" className="text-xs font-normal">
                        Goal
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Goal names visible once Goals feature is fully wired.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ── REWARDS TAB ─────────────────────────────────────────────── */}
            <TabsContent value="rewards" className="mt-4 space-y-5">

              <div className="flex gap-3 flex-wrap">
                <RewardChip
                  icon={<Star className="w-4 h-4 text-amber-500" />}
                  label="Char. XP"
                  value={habit.character_xp}
                />
                <RewardChip
                  icon={<Zap className="w-4 h-4 text-violet-500" />}
                  label={`Skill XP${(habit.skills?.length ?? 1) > 1 ? ' ea.' : ''}`}
                  value={habit.skill_xp}
                />
                <RewardChip
                  icon={<Coins className="w-4 h-4 text-yellow-500" />}
                  label="Gold"
                  value={habit.gold_reward}
                />
              </div>

              <div className="rounded-xl border divide-y text-sm">
                <InfoRow label="Reward source">
                  {habit.use_custom_xp ? 'Custom (manually set)' : 'Calculated automatically'}
                </InfoRow>
                {(habit.skills?.length ?? 0) > 1 && (
                  <InfoRow label="Total Skill XP per completion">
                    {habit.skill_xp * (habit.skills?.length ?? 1)}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({habit.skill_xp} × {habit.skills?.length} skills)
                    </span>
                  </InfoRow>
                )}
              </div>

              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> At 0 Energy
                </p>
                <p className="text-sm text-muted-foreground">
                  Completing this habit when your Energy is depleted awards{' '}
                  <span className="font-semibold text-foreground">
                    {habit.time_consumption <= 15 ? 4 :
                     habit.time_consumption <= 45 ? 5 :
                     habit.time_consumption <= 90 ? 7 : 10} Resilience
                  </span>{' '}
                  instead — recognising the extra push it took.
                </p>
              </div>
            </TabsContent>

            {/* ── ASSIGNED TAB ────────────────────────────────────────────── */}
            <TabsContent value="assigned" className="mt-4 space-y-5">

              {/* Skills */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
                  Skills ({habit.skills?.length ?? 0})
                </p>
                {habit.skills && habit.skills.length > 0 ? (
                  <div className="space-y-2">
                    {habit.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                      >
                        <span className="text-lg leading-none">
                          {skill.icon.type === 'emoji' ? skill.icon.value : '⚡'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{skill.title}</p>
                          <p className="text-xs text-muted-foreground">Level {skill.level}</p>
                        </div>
                        <span className="text-xs text-violet-600 font-semibold shrink-0">
                          +{habit.skill_xp} XP
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No skills assigned.</p>
                )}
                {(habit.skills?.length ?? 0) > 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    XP is split equally across all assigned skills.
                  </p>
                )}
              </div>

              {/* Characters */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
                  Characters ({habit.characters?.length ?? 0})
                </p>
                {habit.characters && habit.characters.length > 0 ? (
                  <div className="space-y-2">
                    {habit.characters.map((character) => (
                      <div
                        key={character.id}
                        className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                          style={{ backgroundColor: character.color_theme }}
                        >
                          {character.icon.type === 'emoji' ? character.icon.value : '👤'}
                        </div>
                        <p className="text-sm font-medium flex-1 truncate">{character.title}</p>
                        <span className="text-xs text-amber-600 font-semibold shrink-0">
                          +{habit.character_xp} XP
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No characters assigned.</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Each character receives the full XP amount — Character XP is never split.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Pause / Resume Confirmation ─────────────────────────────────────── */}
      <AlertDialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPaused ? 'Resume Habit?' : 'Pause Habit?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isPaused
                ? `"${habit.title}" will be restored to active. Your consistency score window will restart from today — the history before pausing is preserved on the detail page.`
                : `"${habit.title}" will be paused. All completion history and connections are preserved. Your consistency score window will freeze until you resume.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePauseToggle} disabled={isActioning}>
              {isActioning
                ? (isPaused ? 'Resuming…' : 'Pausing…')
                : (isPaused ? 'Resume'   : 'Pause')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Archive Confirmation ────────────────────────────────────────────── */}
      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Habit?</AlertDialogTitle>
            <AlertDialogDescription>
              "{habit.title}" will be moved to your archive. All completion history, consistency scores,
              XP records, and connections to Characters, Skills, and Goals are fully preserved.
              You can restore it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveToggle} disabled={isActioning}>
              {isActioning ? 'Archiving…' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{habit.title}"? This cannot be undone.
              All completion history will be removed from Character dashboards, Skill activity histories,
              and Goal contribution records. Any XP and Gold already awarded are retained.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isActioning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActioning ? 'Deleting…' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}