import React from 'react'
import Link from 'next/link'

const Footer = () => {
  return (
    <div className='border-t border-stone-400'>
      <Link href='/' className='block w-24 h-auto'>
        <img 
            src="/Life-Levels-Logo.svg" 
            alt="Life Levels Logo" 
          />
      </Link>
    </div>
  )
}

export default Footer