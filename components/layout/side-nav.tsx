'use client'
import React from 'react'
import Link from 'next/link'
import { useState } from 'react';
import NavLink from './nav-link';
import { GoSidebarExpand } from "react-icons/go";
import { BiSolidDashboard, BiSolidChat } from "react-icons/bi";
import { FaRotate, FaSquareCheck, FaFolder, FaStar, FaCircleArrowUp, FaUserGroup, FaRegCalendarDays } from "react-icons/fa6";
import { SiTarget } from "react-icons/si";


const SideNav = () => {
  const [expanded, setExpanded] = useState(true);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BiSolidDashboard },
    { href: '/habits', label: 'Habits', icon: FaRotate },
    { href: '/tasks', label: 'Tasks', icon: FaSquareCheck },
    { href: '/projects', label: 'Projects', icon: FaFolder },
    { href: '/goals', label: 'Goals', icon: SiTarget },
    { href: '/rewards', label: 'Rewards', icon: FaStar },
    { href: '/skills', label: 'Skills', icon: FaCircleArrowUp },
    { href: '/characters', label: 'Characters', icon: FaUserGroup },
    { href: '/schedule', label: 'Schedule', icon: FaRegCalendarDays },
    { href: '/community', label: 'Community', icon: BiSolidChat },
  ]

  return (
    <aside className='h-screen w-full px-6 py-4 border-r'>
        <div className='flex items-center gap-20 pb-6'>
          <Link href="/" className='block w-40 h-auto'>
            <img 
              src="/placeholder-logo.svg" 
              alt="Logo" 
            />
          </Link>
          <button onClick={() => setExpanded(curr =>!curr)} className=''>
            <GoSidebarExpand className='w-6 h-6'/>
          </button>
        </div>
        
        <nav className='flex flex-col gap-2'>
          {navItems.map((item) => (
            <NavLink 
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </nav>
    </aside>
  )
}

export default SideNav