'use client'

import { useMemo, useState } from 'react'
import { HabitWithRelations, HABIT_STATUS } from '@/lib/types/habits'
import { IconData } from '@/lib/types/icon'
import { getRecurrenceLabel, getCompletionTimeLabel } from '@/lib/utils/habits'
import { completeHabit } from '@/lib/actions/habits'
import { useGold } from '@/lib/contexts/gold-context'
import { cn } from '@/lib/utils/general'
import { FaSun } from 'react-icons/fa6'
import { Clock, Coins, Repeat, Zap, Loader2, CheckCircle2 } from 'lucide-react'
import { renderIcon } from '@/lib/utils/icon'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

// =============================================================================
// PROPS
// =============================================================================

interface HabitCardProps {
  habit:      HabitWithRelations
  onClick?:   (habit: HabitWithRelations) => void
  onCompleted?: () => void // Refreshes list after a successful completion
  consistencyScore?: number
  className?: string
}

interface CompleteButtonProps {
  habitId:   string
  habitTitle: string
  goldReward: number
  onCompleted: () => void
}

// =============================================================================
// HELPERS
// =============================================================================

// Status pill — colours follow the PRD palette (muted for paused/archived,
// never alarming red).
function StatusPill({ status }: { status: HabitWithRelations['status'] }) {
  const map = {
    active:   { label: 'Active',   className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    paused:   { label: 'Paused',   className: 'bg-muted text-muted-foreground' },
    archived: { label: 'Archived', className: 'bg-muted text-muted-foreground' },
  } as const
  const { label, className } = map[status] ?? map.active
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', className)}>
      {label}
    </span>
  )
}

// Consistency bar — shown only when a score is provided (parent can pass it
// from calculateConsistencyScore).
function ConsistencyBar({ score }: { score: number }) {
  const colour =
    score >= 80 ? '#22c55e' :
    score >= 50 ? '#f59e0b' :
    '#94a3b8'  // neutral/muted for low scores — never red (PRD rule)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Consistency</span>
        <span className="text-[11px] font-semibold tabular-nums" 
              style={{ color: colour }}>
          {score}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: colour }}
        />
      </div>
    </div>
  )
}

// =============================================================================
// COMPLETE BUTTON
// Isolated so its loading state is self-contained and doesn't re-render
// the whole card.
// =============================================================================
 
function CompleteButton({ 
  habitId, 
  habitTitle, 
  goldReward, 
  onCompleted 
}: CompleteButtonProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const { handleGoldReceived } = useGold()
 
  const handleComplete = async (e: React.MouseEvent) => {
    // Prevent the card's onClick from firing and opening the detail modal
    e.stopPropagation()
 
    if (isCompleting || justCompleted) return
    setIsCompleting(true)
 
    try {
      const result = await completeHabit(habitId)
 
      if (!result.success) {
        toast.error(result.error)
        return
      }
 
      const {
        gold_awarded,
        character_xp_awarded,
        skill_xp_per_skill,
        energy_cost,
        resilience_awarded,
        leveled_up_skills,
        leveled_up_characters,
      } = result.data
 
      // Optimistically update the Gold balance in the UI header
      if (gold_awarded > 0) {
        handleGoldReceived(gold_awarded, 'habit_completion', habitId)
      }
 
      // Brief visual celebration on the button itself before refreshing
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 1500)
 
      // Build a concise reward summary for the toast
      const parts: string[] = []
      if (character_xp_awarded > 0) parts.push(`+${character_xp_awarded} Char. XP`)
      if (skill_xp_per_skill   > 0) parts.push(`+${skill_xp_per_skill} Skill XP`)
      if (gold_awarded         > 0) parts.push(`+${gold_awarded} Gold`)
      if (resilience_awarded   > 0) parts.push(`+${resilience_awarded} Resilience`)
 
      toast.success(`${habitTitle} completed!`, {
        description: parts.length > 0 ? parts.join(' · ') : undefined,
      })
 
      // Level-up notifications — each is its own toast so they stack and
      // are individually dismissible, matching the PRD's "celebrate in sequence".
      for (const skillId of leveled_up_skills) {
        toast.success('Skill leveled up! 🎉', {
          description: `Check your Skills page to see your progress.`,
        })
      }
      for (const charId of leveled_up_characters) {
        toast.success('Character leveled up! ⭐', {
          description: `Check your Characters page to see your progress.`,
        })
      }
 
      // Let the parent page refresh the habit list
      onCompleted()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsCompleting(false)
    }
  }
 
  return (
    <button
      type="button"
      onClick={handleComplete}
      disabled={isCompleting || justCompleted}
      title="Mark as complete"
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 shrink-0',
        justCompleted
          ? 'border-emerald-500 bg-emerald-500 text-white scale-110'
          : 'border-muted-foreground/30 text-muted-foreground/50 hover:border-emerald-500 hover:text-emerald-500 hover:scale-105',
        isCompleting && 'cursor-wait'
      )}
    >
      {isCompleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CheckCircle2 className="w-4 h-4" />
      )}
    </button>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function HabitCard({ 
  habit, 
  onClick, 
  onCompleted,
  consistencyScore,
  className 
}: HabitCardProps) {
  const icon = habit.icon as IconData

  // Status-driven accent colour — muted palette for non-active states
  const accentColour =
    habit.status === HABIT_STATUS.ACTIVE   ? '#8b5cf6' :  // violet
    habit.status === HABIT_STATUS.PAUSED   ? '#94a3b8' :  // slate
    '#cbd5e1'                                              // lighter slate for archived

  const recurrenceLabel = useMemo(
    () =>
      getRecurrenceLabel(habit.recurrence, {
        x_per_week_count:        habit.x_per_week_count,
        weekly_day:              habit.weekly_day,
        monthly_day:             habit.monthly_day,
        custom_recurrence_config: habit.custom_recurrence_config,
      }),
    [habit]
  )

  const completionTimeLabel = getCompletionTimeLabel(habit.completion_time)

  const isInactive = habit.status !== HABIT_STATUS.ACTIVE

  const handleClick = () => {
    if (onClick) {
      onClick(habit)
    }
  }

  return (
    <Card
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        isInactive && 'opacity-60',
        className
      )}
    >
 
        {/* ── Header: icon + title + complete button + status ──────────── */}
        <CardHeader className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
 
            {/* Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: habit.icon.color + '18',
                borderColor: habit.icon.color + '55',
              }}
            >
              {renderIcon(habit.icon.value, habit.icon.type, habit.icon.color, 'w-6 h-6')}
            </div>
 
            {/* Title + recurrence */}
            <div className="min-w-0">
              <CardTitle className='leading-[150%]'>
                {habit.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Repeat className="w-3 h-3 shrink-0" />
                {recurrenceLabel}
              </p>
            </div>
          </div>

        </CardHeader>
 
        <CardContent>
          {/* ── Completion time + duration ─────────────────────────────── */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {habit.completion_time && (
            <span className="flex items-center gap-1">
              <span>
                {habit.completion_time === 'morning'   ? <FaSun /> :
                 habit.completion_time === 'afternoon' ? '☀️' :
                 habit.completion_time === 'evening'   ? '🌙' : '🌃'}
              </span>
              {getCompletionTimeLabel(habit.completion_time)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {habit.time_consumption >= 60
              ? `${Math.floor(habit.time_consumption / 60)}h${habit.time_consumption % 60 > 0 ? ` ${habit.time_consumption % 60}m` : ''}`
              : `${habit.time_consumption}m`}
          </span>
          <StatusPill status={habit.status} />
        </div>

        {/* Complete button — only shown for active habits */}
          <div className="flex items-center gap-2 shrink-0">
            {habit.status === HABIT_STATUS.ACTIVE && onCompleted && (
              <CompleteButton
                habitId={habit.id}
                habitTitle={habit.title}
                goldReward={habit.gold_reward}
                onCompleted={onCompleted}
              />
            )}
          </div>
 
        {/* ── Linked skills ─────────────────────────────────────────── */}
        {habit.skills && habit.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {habit.skills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                <span className="leading-none">
                  {skill.icon.type === 'emoji' ? skill.icon.value : '⚡'}
                </span>
                {skill.title}
              </span>
            ))}
          </div>
        )}
        </CardContent>
 
        {/* ── Footer: characters + rewards ──────────────────────────── */}
        <CardFooter className="flex items-center justify-between gap-2 mt-auto pt-2 border-t">
 
          {/* Character pips */}
          <div className="flex items-center gap-1">
            {habit.characters && habit.characters.slice(0, 4).map((char, i) => (
              <div
                key={char.id}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[11px]"
                style={{ backgroundColor: char.color_theme, marginLeft: i > 0 ? '-6px' : '0' }}
                title={char.title}
              >
                {char.icon.type === 'emoji' ? char.icon.value : '👤'}
              </div>
            ))}
            {(habit.characters?.length ?? 0) > 4 && (
              <span className="text-[11px] text-muted-foreground ml-1">
                +{habit.characters!.length - 4}
              </span>
            )}
          </div>
 
          {/* Reward chips */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {habit.character_xp > 0 && (
              <span className="flex items-center gap-0.5">
                <Zap className="w-3 h-3 text-violet-500" />
                {habit.character_xp} XP
              </span>
            )}
            {habit.gold_reward > 0 && (
              <span className="flex items-center gap-0.5">
                <Coins className="w-3 h-3 text-yellow-500" />
                {habit.gold_reward}
              </span>
            )}
          </div>
        </CardFooter>
 
    </Card>
  )
}