'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils';

interface NavLinkProps {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>
}

const NavLink = ({href, label, icon: Icon}: NavLinkProps) => {
    const pathname = usePathname()
    const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-4 py-2 justify-center md:justify-start bg-white',
          'hover: hover:text-accent-foreground',
          isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground'
        )}
    >
    <Icon className='w-5 h-5'/>
    <span className='hidden md:inline'>{label}</span>
    </Link>
  )
}

export default NavLink