'use client'

import React, { useMemo } from 'react'
import { formatDateShort, isOverdue } from '@/lib/utils'
import { renderIcon } from '@/lib/utils/icon'
import { cn } from '@/lib/utils'
import {
  Task,
  TaskDifficulty,
  TaskPriority,
  TaskStatus,
  TASK_PRIORITY,
  TASK_PRIORITY_LABELS,
  TASK_DIFFICULTY,
  TASK_DIFFICULTY_LABELS,
  TASK_STATUS,
} from '@/lib/types/tasks'
import { calculateTaskXP } from '@/lib/utils/tasks'
import { TableCell, TableRow } from '@/components/ui/table'
import { Coins, Sparkles, Swords, AlertCircle, ChevronUp, Minus, ChevronDown, Minus as Dash } from 'lucide-react'
import { TaskWithSkills } from '@/lib/actions/tasks'

// ─── Types ───────────────────────────

interface LinkedSkill {
  id: string
  title: string
}

interface TaskTableRowProps {
  task: TaskWithSkills
  linkedSkills: LinkedSkill[]
  linkedCharacterCount?: number
  onClick?: (task: TaskWithSkills) => void
  className?: string
}
// ─── Sub-components ──────────────────

function PriorityChip({ priority }: { priority: TaskPriority }) {
  const configs: Record<TaskPriority, { icon: React.ReactNode; classes: string }> = {
    [TASK_PRIORITY.CRITICAL]: {
      icon: <AlertCircle className="h-3 w-3" />,
      classes: 'bg-red-500/15 text-red-400 border-red-500/25',
    },
    [TASK_PRIORITY.HIGH]: {
      icon: <ChevronUp className="h-3 w-3" />,
      classes: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    },
    [TASK_PRIORITY.MID]: {
      icon: <Minus className="h-3 w-3" />,
      classes: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    },
    [TASK_PRIORITY.LOW]: {
      icon: <ChevronDown className="h-3 w-3" />,
      classes: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    },
  }

  const config = configs[priority]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        config.classes
      )}
    >
      {config.icon}
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  )
}

function DifficultyChip({ difficulty }: { difficulty: TaskDifficulty }) {
  const classes: Record<TaskDifficulty, string> = {
    [TASK_DIFFICULTY.EASY]: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    [TASK_DIFFICULTY.NORMAL]: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    [TASK_DIFFICULTY.HARD]: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    [TASK_DIFFICULTY.EXPERT]: 'bg-red-500/15 text-red-400 border-red-500/25',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        classes[difficulty]
      )}
    >
      {TASK_DIFFICULTY_LABELS[difficulty]}
    </span>
  )
}

function DateCell({ dateString }: { dateString: string | null }) {
  if (!dateString) {
    return <span className="text-xs text-muted-foreground/40">—</span>
  }

  const overdue = isOverdue(dateString)

  return (
    <span
      className={cn(
        'text-xs whitespace-nowrap',
        overdue ? 'text-red-400 font-medium' : 'text-muted-foreground'
      )}
    >
      {formatDateShort(dateString)}
    </span>
  )
}

function StatusBar({ status }: { status: TaskStatus }) {
  const colorMap: Record<TaskStatus, string> = {
    [TASK_STATUS.BACKLOG]: 'bg-slate-500',
    [TASK_STATUS.IN_PROGRESS]: 'bg-blue-500',
    [TASK_STATUS.COMPLETED]: 'bg-emerald-500',
    [TASK_STATUS.PAUSED]: 'bg-amber-500',
  }
  return <div className={cn('h-full w-0.75 rounded-full shrink-0', colorMap[status])} />
}

// ─── Main Component ──────────────

export function TaskTableRow({
  task,
  linkedSkills,
  linkedCharacterCount = 1,
  onClick,
  className,
}: TaskTableRowProps) {
  const isCompleted = task.status === TASK_STATUS.COMPLETED

  const { characterXP, skillXP } = useMemo(() => {
    if (task.use_custom_xp) {
      return {
        characterXP: task.custom_character_xp ?? 0,
        skillXP: task.custom_skill_xp ?? 0,
      }
    }
    return calculateTaskXP(
      task.difficulty as TaskDifficulty,
      linkedSkills.length,
      linkedCharacterCount
    )
  }, [task, linkedSkills.length, linkedCharacterCount])

  const totalSkillXP = skillXP * linkedSkills.length
  const totalCharacterXP = characterXP * linkedCharacterCount

  const handleClick = () => {
    if (onClick) {
      onClick(task)
    }
  }

  return (
    <TableRow
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      className="cursor-pointer hover:bg-accent"
    >
      {/* Status accent bar */}
      <td className="py-3 pr-3">
        <div className="flex h-full items-center justify-center">
          <StatusBar status={task.status} />
        </div>
      </td>

      {/* Icon + Title */}
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icon */}
            <div className="flex">
              <div className="text-2xl">
                  {renderIcon(task.icon.value, task.icon.value, task.icon.color, 'w-6 h-6')}
                </div>
            </div>
          <span
            className={cn(
              'text-sm font-medium text-foreground whitespace-nowrap',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
        </div>
      </td>

      {/* Description */}
      <td className="py-3 pr-4 max-w-55">
        {task.description ? (
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {task.description}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </td>

      {/* Start Date */}
      <td className="py-3 pr-4">
        <DateCell dateString={task.start_date} />
      </td>

      {/* Due Date */}
      <td className="py-3 pr-4">
        <TableCell>
          {task.due_date ? task.due_date : 'No due date'}
        </TableCell>
      </td>

      {/* Priority */}
      <td className="py-3 pr-4">
        <PriorityChip priority={task.priority as TaskPriority} />
      </td>

      {/* Difficulty */}
      <td className="py-3 pr-4">
        <DifficultyChip difficulty={task.difficulty as TaskDifficulty} />
      </td>

      {/* Gold */}
      <td className="py-3 pr-4 text-right">
        <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-amber-400">
          <Coins className="h-3.5 w-3.5" />
          {task.gold_reward}
        </span>
      </td>

      {/* Character XP */}
      <td className="py-3 pr-4 text-right">
        <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-cyan-400">
          <Sparkles className="h-3.5 w-3.5" />
          {totalCharacterXP}
        </span>
      </td>

      {/* Skill XP */}
      <td className="py-3 text-right">
        <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-violet-400">
          <Swords className="h-3.5 w-3.5" />
          {totalSkillXP}
        </span>
      </td>
    </TableRow>
  )
}