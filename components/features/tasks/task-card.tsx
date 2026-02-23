'use client'

import React, { useMemo } from 'react'
import { 
  Task,
  TaskDifficulty,
  TaskPriority,
  TaskStatus,
  TASK_PRIORITY,
  TASK_PRIORITY_LABELS,
  TASK_STATUS,
  BASE_XP_VALUES 
} from '@/lib/types/tasks'
import { calculateTaskXP } from '@/lib/utils/tasks'
import { renderIcon } from '@/components/layout/app/icon-picker/icon-utils'
import { Badge } from '@/components/ui/badge'
import {Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter} from '@/components/ui/card'
import { FaRegCalendarDays, FaCoins } from "react-icons/fa6";
import { cn } from '@/lib/utils'
import { getProgressPercentage } from '@/lib/utils/skills'

// TYPES -------------------------

interface LinkedSkill {
  id: string
  title: string
}

interface TaskCardProps {
  task: Task
  linkedSkills: LinkedSkill[]
  linkedCharacterCount?: number
  onClick?: (taskId: string) => void
  className?: string
}

const TaskCard = ({ task, linkedSkills, linkedCharacterCount, onClick, className}: TaskCardProps) => {
  
  return (
    <Card className={cn(
          'w-full max-w-120 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.005]', 
          className)}
          >
      <div className="flex">
        <div className="text-2xl">
            {renderIcon(task.icon, task.iconType, task.iconColor, 'w-6 h-6')}
          </div>
      </div>
    </Card>
  )
}

export default TaskCard