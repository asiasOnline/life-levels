import React from 'react'
import { IoGrid } from "react-icons/io5";
import { FaList } from "react-icons/fa6";
import { Button } from '@/components/ui/button';

const LayoutViewButton = () => {
  return (
    <div className='flex'>
        <Button className='bg-muted-foreground'>
          <IoGrid className='w-6 h-6'/>
        </Button>
        <Button className='bg-white text-black'>
          <FaList className='w-6 h-6'/>
        </Button>
    </div>
  )
}

export default LayoutViewButton