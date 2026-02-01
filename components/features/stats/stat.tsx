import React from 'react';
import { StatData } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StatProps {
  stat: StatData;
  showProgress?: boolean;
  className?: string;
}

const Stat = ({stat, showProgress = false, className}: StatProps) => {
  const percentage = stat.maxValue 
    ? (stat.value / stat.maxValue) * 100
    : 100;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>
            {stat.label}
          </span>
          {stat.icon}
        </div>
    </div>
  )
}

export default Stat