import React from 'react'
import Link from 'next/link'
import { GoSidebarExpand } from "react-icons/go";

const SideNav = () => {
  return (
    <aside className='h-screen w-full px-6 py-4 border-r'>
        <div className='flex items-center gap-20 pb-6'>
          <Link href="/" className='block w-40 h-auto'>
            <img 
              src="/placeholder-logo.svg" 
              alt="Logo" 
            />
          </Link>
          <GoSidebarExpand className='w-6 h-6'/>
        </div>
        <div className='flex flex-col'>
            <Link href="/tasks">Tasks</Link>
            <Link href="/habits">Habits</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/goals">Goals</Link>
            <Link href="/skills">Skills</Link>
            <Link href="/characters">Characters</Link>
            <Link href="/rewards">Rewards</Link>
        </div>
    </aside>
  )
}

export default SideNav