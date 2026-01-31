import React from 'react'
import Link from 'next/link'

const SideNav = () => {
  return (
    <div className='h-screen px-10 border-r'>
        <h1><Link href="/">Life Levels</Link></h1>
        <div className='flex flex-col'>
            <Link href="/tasks">Tasks</Link>
            <Link href="/habits">Habits</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/goals">Goals</Link>
            <Link href="/skills">Skills</Link>
            <Link href="/characters">Characters</Link>
            <Link href="/rewards">Rewards</Link>
        </div>
    </div>
  )
}

export default SideNav