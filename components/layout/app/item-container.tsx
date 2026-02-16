import React from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

const ItemContainer = ({ children, className }: PageContainerProps) => {
  return (
    <div className={cn('w-full rounded-lg border bg-card', className)}>
        {children}
    </div>
  )
}

export default ItemContainer