import React from 'react'
import { TASK_STATUS, TaskStatus } from '@/lib/types/tasks'
import { cn } from '@/lib/utils/general'

const StatusAccent = ({ status }: { status: TaskStatus }) => {
  const colorMap: Record<TaskStatus, string> = {
    [TASK_STATUS.BACKLOG]: 'bg-slate-500',
    [TASK_STATUS.IN_PROGRESS]: 'bg-blue-500',
    [TASK_STATUS.COMPLETED]: 'bg-emerald-500',
    [TASK_STATUS.PAUSED]: 'bg-amber-500',
  }
  return <div className={cn('absolute left-0 top-3 bottom-3 w-0.75 rounded-full', colorMap[status])} />
}

export default StatusAccent