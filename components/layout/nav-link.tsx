'use client'
import React from 'react'
import Link from 'next/link'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@radix-ui/react-tooltip'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils';

interface NavLinkProps {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>
    expanded: boolean
}

const NavLink = ({href, label, icon: Icon, expanded}: NavLinkProps) => {
    const pathname = usePathname()
    const isActive = pathname === href || pathname.startsWith(`${href}/`)

  const linkContent = (
    <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground',
          expanded ? 'justify-start' : 'justify-center',
          isActive 
            ? 'bg-accent text-accent-foreground font-medium' 
            : 'text-muted-foreground'
        )}
        title={!expanded ? label : undefined} // Tooltip on hover when collapsed
    >
    <Icon className='w-5 h-5'/>
    {expanded && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  )

  if (!expanded) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side='right'>
            <p className='p-2 bg-white rounded font-medium'>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return linkContent
}

export default NavLink