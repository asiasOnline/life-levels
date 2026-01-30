import React from 'react'
import Link from 'next/link'

const SideNav = () => {
  return (
    <div className='h-screen px-10 border-r'>
        <h1>Life Levels</h1>
        <div className='flex flex-col'>
            <Link href="/">Dashboard</Link>
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