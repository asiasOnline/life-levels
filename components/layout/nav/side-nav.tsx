'use client'
import React from 'react'
import Link from 'next/link'
import { useState, useEffect } from 'react';
import SideNavLink from './side-nav-link';
import { GoSidebarExpand, GoSidebarCollapse } from "react-icons/go";
import { BiSolidDashboard, BiSolidChat } from "react-icons/bi";
import { FaRotate, FaSquareCheck, FaFolder, FaStar, FaCircleArrowUp, FaUserGroup, FaRegCalendarDays } from "react-icons/fa6";
import { SiTarget } from "react-icons/si";
import { cn } from '@/lib/utils'

const SideNav = () => {
  const [expanded, setExpanded] = useState(true);

  // Collapse Sidebar on Tablet by Default 
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setExpanded(false)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BiSolidDashboard },
    { href: '/habits', label: 'Habits', icon: FaRotate },
    { href: '/tasks', label: 'Tasks', icon: FaSquareCheck },
    { href: '/goals', label: 'Goals', icon: SiTarget },
    { href: '/rewards', label: 'Rewards', icon: FaStar },
    { href: '/skills', label: 'Skills', icon: FaCircleArrowUp },
    { href: '/characters', label: 'Characters', icon: FaUserGroup },
    { href: '/schedule', label: 'Schedule', icon: FaRegCalendarDays },
    { href: '/community', label: 'Community', icon: BiSolidChat },
  ]

  return (
    <aside className={cn(
      'h-screen border-r transition-all duration-300 ease-in-out',
      expanded ? 'w-64 px-6' : 'w-20 px-3',
      'py-4'
    )}>
        {/* Header w/ Logo & Toggle Button */}
        <div className={cn(
          'flex items-center pb-6 gap-6',
          expanded ? 'justify-between' : 'justify-center'
        )}>
          {expanded && (
            <Link href="/" className='block w-40 h-auto'>
            <img 
              src="/placeholder-logo.svg" 
              alt="Logo" 
            />
          </Link>
          )}

          <button onClick={() => setExpanded(curr =>!curr)} 
           className='p-2 rounded-lg hover:bg-accent transition-colors'
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
           >
            {expanded ? (
            <GoSidebarExpand className='w-5 h-5' />
          ) : (
            <GoSidebarCollapse className='w-5 h-5' />
          )}
          </button>
        </div>
        
        <nav className='flex flex-col gap-2'>
          {navItems.map((item) => (
            <SideNavLink 
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              expanded={expanded}
            />
          ))}
        </nav>
    </aside>
  )
}

export default SideNav