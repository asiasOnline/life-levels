import React from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'

const navItems = [
    { href: '/features', label: 'Features'},
    { href: '/pricing', label: 'Pricing'},
    { href: '/resources', label: 'Resources'},
    { href: '/about', label: 'About'},
  ]

const HomeNav = () => {
  return (
    <div className='w-full pl-5 pr-10 py-4 flex content-center justify-between'>
        <Link href='/' className='block w-24 h-auto'>
          <img 
            src="/Life-Levels-Logo.svg" 
            alt="Life Levels Logo" 
          />
        </Link>
        <div className='flex place-items-center'>
        <nav className='flex gap-16 place-items-center'>
            {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href}
                >
                    {item.label}
                </Link>
              ))}
            </nav>
          <div className='pl-20 flex gap-4'>
            <Button variant={'outline'}>
              Log In
            </Button>
            <Button>
              Sign Up for Free
            </Button>
          </div>
        </div>
    </div>
  )
}

export default HomeNav