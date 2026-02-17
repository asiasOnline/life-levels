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

const TaskCard = () => {
  return (
    <div className='w-80 m-4 border'>
      <div className="flex">

      </div>
    </div>
  )
}

export default TaskCard