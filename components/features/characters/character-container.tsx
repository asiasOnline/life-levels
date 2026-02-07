import React from 'react'
import { Progress } from '@/components/ui/progress'

const CharacterContainer = () => {
  return (
    <div className='w-full rounded-lg bg-amber-400 mb-4 border'>
      <div className='flex justify-center pt-4'>
        <img 
          src='/characters/swordsman.svg'
          width={150}
          height ={150}
          alt="The Knight Character" 
          />
      </div>
      <div className='px-4 py-2 rounded-br-lg rounded-bl-lg bg-card'>
        <div className='flex justify-between'>
          <h3>The Knight</h3>
          <p>LVL 2</p>
        </div>
        <Progress 
          className='my-1.5'
        />
        <div className='flex justify-end'>
          <p className='text-sm'>80/100</p>
        </div>
      </div>
    </div>
  )
}

export default CharacterContainer