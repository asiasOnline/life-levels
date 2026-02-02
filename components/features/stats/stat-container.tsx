import React from 'react'
import { StatData, StatDisplayMode } from '@/lib/types'
import Stat from './stat'
import { cn } from '@/lib/utils'

interface StatContainerProps {
  stats: StatData[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  displayMode?: StatDisplayMode;
  className?: string;
}

const StatContainer = ({
  stats,
  layout = 'horizontal',
  displayMode,
  className
}: StatContainerProps) => {
  const layoutClasses = {
    horizontal: 'flex flex-row justify-around',
    vertical: 'flex flex-col gap-4',
    grid: 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4',
  }

  return (
    <div className={cn(
      'rounded-lg border bg-card p-4',
      layoutClasses[layout],
      className
    )}>
      {stats.map((stat) => (
        <Stat 
          key={stat.type}
          stat={stat}
          displayMode={displayMode}
        />
      ))}
    </div>
  );
}

export default StatContainer