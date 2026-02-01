'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaLink } from "react-icons/fa6";
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

        )}
    >
    <Icon className='w-6 h-6'/>
    </Link>
  )
}

export default NavLink