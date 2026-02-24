'use client'

import React, { use, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FiMenu } from "react-icons/fi";
import { CgClose } from "react-icons/cg";

const navItems = [
    { href: '/features', label: 'Features'},
    { href: '/pricing', label: 'Pricing'},
    { href: '/resources', label: 'Resources'},
    { href: '/about', label: 'About'},
  ]

const HomeNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='w-full pl-5 pr-10 py-4 flex content-center justify-between'>
        <Link href='/' className='block w-20 md:w-24 h-auto'>
          <img 
            src="/Life-Levels-Logo.svg" 
            alt="Life Levels Logo" 
          />
        </Link>
        {/* Desktop Menu */}
        <div className='hidden lg:flex place-items-center'>
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
            <Link href={'/login'}>
              <Button variant={'outline'}>
                Log In
              </Button>
            </Link>
            <Link href={'/signup'}>
              <Button>
              Sign Up for Free
            </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Button */}
        <button className='block lg:hidden'
          onClick={() => setIsOpen(!isOpen)}
          >
          { isOpen ? <CgClose className='w-7 h-auto'/> : <FiMenu className='w-7 h-auto'/> }
        </button>

        {/* Mobile Menu */}
        {isOpen && (
          <div className='w-full sm:w-1/2 h-auto absolute lg:hidden top-24 right-0 py-12 mx-4 z-10 bg-stone-200'>
            <nav className='flex flex-col gap-16 place-items-center'>
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
        )}
    </div>
  )
}

export default HomeNav