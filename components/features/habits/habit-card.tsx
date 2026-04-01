'use client'

import { useMemo } from 'react'
import { HabitWithRelations, HABIT_STATUS } from '@/lib/types/habits'
import { IconData } from '@/lib/types/icon'
import { getRecurrenceLabel, getCompletionTimeLabel } from '@/lib/utils/habits'
import { cn } from '@/lib/utils/general'
import { Clock, Coins, Repeat, Zap } from 'lucide-react'
import { renderIcon } from '@/lib/utils/icon'

// =============================================================================
// PROPS
// =============================================================================

interface HabitCardProps {
  habit:      HabitWithRelations
  onClick?:   (id: string) => void
  className?: string
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
        <span className="text-[11px] font-semibold tabular-nums" style={{ color: colour }}>
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
// MAIN COMPONENT
// =============================================================================

export function HabitCard({ habit, onClick, className }: HabitCardProps) {
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

  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(habit.id)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(habit.id)}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        isInactive && 'opacity-60',
        className
      )}
    >
      {/* Status accent bar */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: accentColour }} />

      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* ── Header: icon + title + status ─────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">

            {/* Icon */}
            <div className="flex">
              <div className="text-2xl">
                  {renderIcon(habit.icon.value, habit.icon.type, habit.icon.color, 'w-6 h-6')}
                </div>
            </div>

            {/* Title + recurrence */}
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{habit.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Repeat className="w-3 h-3 shrink-0" />
                {recurrenceLabel}
              </p>
            </div>
          </div>

          <StatusPill status={habit.status} />
        </div>

        {/* ── Completion time + duration ─────────────────────────────────── */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {habit.completion_time && (
            <span className="flex items-center gap-1">
              <span>
                {habit.completion_time === 'morning'   ? '🌅' :
                 habit.completion_time === 'afternoon' ? '☀️' :
                 habit.completion_time === 'evening'   ? '🌙' : '🌃'}
              </span>
              {completionTimeLabel}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {habit.time_consumption >= 60
              ? `${Math.floor(habit.time_consumption / 60)}h ${habit.time_consumption % 60 > 0 ? `${habit.time_consumption % 60}m` : ''}`
              : `${habit.time_consumption}m`}
          </span>
        </div>

        {/* ── Consistency score (only when provided) ─────────────────────── */}
        {typeof (habit as HabitWithRelations & { consistency_score?: number }).consistency_score === 'number' && (
          <ConsistencyBar
            score={(habit as HabitWithRelations & { consistency_score?: number }).consistency_score!}
          />
        )}

        {/* ── Linked skills ─────────────────────────────────────────────── */}
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

        {/* ── Footer: characters + rewards ──────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t">

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
        </div>

      </div>
    </article>
  )
}