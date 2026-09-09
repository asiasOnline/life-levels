'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@radix-ui/react-tooltip'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/general';

interface NavLinkProps {
    href: string;
    label: string;
    // Accepts both React Icons and string path names
    icon: React.ComponentType<{ className?: string }> | string;
    iconSize?: string;
    expanded: boolean
}

const SideNavLink = ({href, label, icon: Icon, expanded, iconSize}: NavLinkProps) => {
    const pathname = usePathname()
    const isActive = pathname === href || pathname.startsWith(`${href}/`)

  const renderIcon = () => {
    if (typeof Icon === 'string') {
      return (
        <Image 
          src={Icon}
          alt={label}
          width={32}
          height={32}
          className={cn(iconSize, 'shrink-0')}
        />
      )
    }
    return <Icon className={iconSize} />
  }

  const linkContent = (
    <Link
        href={href}
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground',
          expanded ? 'justify-start' : 'justify-center',
          isActive 
            ? 'bg-accent text-accent-foreground font-medium' 
            : 'text-muted-foreground'
        )}
        title={!expanded ? label : undefined} // Tooltip on hover when collapsed
    >
    {renderIcon()}
    {expanded && <span className="whitespace-nowrap text-sm">{label}</span>}
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

export default SideNavLink