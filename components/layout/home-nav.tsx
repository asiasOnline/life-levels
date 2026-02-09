import React from 'react'
import Link from 'next/link'

const navItems = [
    { href: '/', label: 'Dashboard'},
    { href: '/habits', label: 'Habits'},
    { href: '/tasks', label: 'Tasks'},
    { href: '/projects', label: 'Projects'},
  ]

const HomeNav = () => {
  return (
    <div>
        <nav className='flex gap-4'>
        {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
            >
                {item.label}
            </Link>
          ))}
        </nav>
    </div>
  )
}

export default HomeNav