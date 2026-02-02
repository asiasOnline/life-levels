import React from 'react';
import { StatData, StatDisplayMode } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StatProps {
  stat: StatData;
  displayMode?: StatDisplayMode;
  className?: string;
}

const Stat = ({stat, displayMode, className}: StatProps) => {
  // Default to 'none' for stat's display mode
  const mode = displayMode ?? stat.displayMode ?? 'none';

  const percentage = stat.maxValue 
    ? (stat.value / stat.maxValue) * 100
    : 100;

  return (
    <div className={cn('flex flex-col justify-between', className)}>
        {/* Top Section: Shows Label & Icon */}
        <div className='flex flex-col gap-3 items-center justify-between'>
          <span className='text-sm font-medium'>
            {stat.label}
          </span>
          <div className='flex justify-center align-middle content-center w-8 h-8'>
            {stat.icon}
          </div>
        </div>

        {/* Bottom Section: Shows Progress Bar or Numeric Display */}
        {mode === 'progress' && stat.maxValue && (
          <div className="space-y-1">
            <Progress value={percentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stat.value}</span>
              <span>{stat.maxValue}</span>
            </div>
          </div>
        )}

        {mode === 'numeric' && (
          <div className="text-center font-medium">
            <span className='text-sm'>
              {stat.value} 
            </span>
            {stat.maxValue && (
            <span className="text-sm">
              /{stat.maxValue}
            </span>
          )}
          </div>
        )}
    </div>
  )
}

export default Stat