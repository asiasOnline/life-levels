import React from 'react'
import { StatData } from '@/lib/types'
import Stat from './stat'
import { cn } from '@/lib/utils'

interface StatContainerProps {
  stats: StatData[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  showProgress?: boolean;
  className?: string;
}

const StatContainer = ({
  stats,
  layout = 'horizontal',
  showProgress = false,
  className
}: StatContainerProps) => {
  const layoutClasses = {
    horizontal: 'flex flex-row gap-4',
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
          showProgress={showProgress}
        />
      ))}
    </div>
  );
}

export default StatContainer