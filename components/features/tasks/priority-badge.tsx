import React from 'react'
import { cn } from '@/lib/utils'
import { TaskPriority, TASK_PRIORITY, TASK_PRIORITY_LABELS } from '@/lib/types/tasks'
import { AlertCircle, ChevronUp, Minus, ChevronDown } from 'lucide-react'

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
    const configs: Record<TaskPriority, { icon: React.ReactNode; classes: string }> = {
        [TASK_PRIORITY.CRITICAL]: {
        icon: <AlertCircle className="h-3 w-3" />,
        classes: 'bg-red-500/15 text-red-400 border-red-500/30',
        },
        [TASK_PRIORITY.HIGH]: {
        icon: <ChevronUp className="h-3 w-3" />,
        classes: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
        },
        [TASK_PRIORITY.MID]: {
        icon: <Minus className="h-3 w-3" />,
        classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        },
        [TASK_PRIORITY.LOW]: {
        icon: <ChevronDown className="h-3 w-3" />,
        classes: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        },
    }

    const config = configs[priority]

    return (
        <span
        className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
            config.classes
        )}
        >
        {config.icon}
        {TASK_PRIORITY_LABELS[priority]}
        </span>
    )
}

export default PriorityBadge