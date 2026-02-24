import React from 'react'
import { cn } from '@/lib/utils'

interface RewardPillProps {
  icon: React.ReactNode
  value: number
  label: string
  className?: string
}

export const RewardPill = ({icon, value, label, className,}: RewardPillProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5',
        className
      )}
    >
      {icon}
      <div className="flex flex-col leading-none">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold tabular-nums">+{value}</span>
      </div>
    </div>
  )
}
