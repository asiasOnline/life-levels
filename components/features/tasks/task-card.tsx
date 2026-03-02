'use client'

import React, { useMemo } from 'react'
import { 
  Task,
  TaskDifficulty,
  TaskPriority,
  TASK_STATUS,
} from '@/lib/types/tasks'
import { calculateTaskXP } from '@/lib/utils/tasks'
import StatusAccent from './status-accent'
import { RewardPill } from '@/components/layout/app/reward-pill'
import { renderIcon } from '@/lib/utils/icon'
import PriorityBadge from './priority-badge'
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDueDate } from '@/lib/utils'
import { FaRegCalendarDays, FaClock, FaCoins, FaStar, FaCircleArrowUp, FaUserGroup } from "react-icons/fa6";
import { TbAlertCircleFilled } from "react-icons/tb";
import { TaskWithSkills } from '@/lib/actions/tasks'

// TYPES -------------------------

interface LinkedSkill {
  id: string
  title: string
}

interface TaskCardProps {
  task: TaskWithSkills
  linkedSkills: LinkedSkill[]
  linkedCharacterCount?: number
  onClick?: (taskId: string) => void
  className?: string
}

const TaskCard = ({ task, linkedSkills, linkedCharacterCount = 1, onClick, className}: TaskCardProps) => {
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
      linkedCharacterCount,
    )
    }, [task, linkedSkills.length, linkedCharacterCount])
    

  const totalSkillXP = skillXP * linkedSkills.length
  const totalCharacterXP = characterXP * linkedCharacterCount

  const dueInfo = task.due_date ? formatDueDate(task.due_date) : null

  return (
    <Card 
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(task.id)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(task.id)}
      className={cn(
      'w-full max-w-120 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.005]', 
      className)}
    >

      <StatusAccent status={task.status} />

      <CardHeader>
        {/* Icon */}
        <div className="flex">
          <div className="text-2xl">
              {renderIcon(task.icon.value, task.icon.type, task.icon.color, 'w-6 h-6')}
            </div>
        </div>

        {/* Title & Description */}
        <CardTitle className="text-lg">{task.title}</CardTitle>
        <CardDescription className="text-sm">{task.description}</CardDescription>

        {/* Priority Badge */}
        <PriorityBadge priority={task.priority as TaskPriority} />

        {/* Skills Row */}
        {linkedSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {linkedSkills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-400 border border-violet-500/20"
            >
              <FaStar className="h-2.5 w-2.5" />
              {skill.title}
            </span>
          ))}
        </div>
      )}
      </CardHeader>

        <CardFooter className="mt-3 flex items-center justify-between gap-2">
          {/* Due Date */}
          <div className="flex items-center gap-1.5">
            {dueInfo ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs',
                dueInfo.overdue
                  ? 'text-red-400 font-medium'
                  : dueInfo.urgent
                    ? 'text-amber-400 font-medium'
                    : 'text-muted-foreground'
              )}
            >
              {dueInfo.overdue ? (
                <TbAlertCircleFilled className="h-3.5 w-3.5" />
              ) : (
                <FaRegCalendarDays className="h-3.5 w-3.5" />
              )}
              {dueInfo.label}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/50">
              <FaClock className="h-3.5 w-3.5" />
              No due date
            </span>
          )} 
          </div>

          {/* Rewards */}
          {/* Gold XP */}
          <RewardPill
            icon={<FaCoins className="h-3.5 w-3.5 text-amber-400" />}
            value={task.gold_reward}
            label="Gold"
            className="border-amber-500/20 bg-amber-500/10"
          />

          {/* Skill XP */}
          <RewardPill
            icon={<FaCircleArrowUp className="h-3.5 w-3.5 text-violet-400" />}
            value={totalSkillXP}
            label="Skill XP"
            className="border-violet-500/20 bg-violet-500/10"
          />

          {/* Character XP */}
          <RewardPill
            icon={<FaUserGroup className="h-3.5 w-3.5 text-cyan-400" />}
            value={totalCharacterXP}
            label="Char XP"
            className="border-cyan-500/20 bg-cyan-500/10"
          />
        </CardFooter>
    </Card>
  )
}

export default TaskCard