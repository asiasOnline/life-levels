import { Button } from '@/components/ui/button'
import React from 'react'

const Home = () => {
  return (
    <main className='my-10 flex justify-center gap-40'>
      <div className='w-140 flex flex-col justify-center place-content-center gap-8'>
        <h1 className='text-6xl leading-20 font-bold'>Turn your life into an <span className='bg-linear-to-r from-[#04A295] via-[#E1BB1F] to-[#AE2012] text-transparent bg-clip-text inline-block'>adventure</span></h1>
        <h2 className='text-xl text-stone-600'>Level up your habits, skills, and goals with a RPG-style productivity system designed for progress, rather than pressure.</h2>
        <Button className='w-72 h-12'>
          Start Your Adventure
        </Button>
      </div>
      <div>
        <img 
          src="/above-fold-img.svg" 
          alt="girl looking toward a map" 
          width={850}
        />
      </div>
    </main>
  )
}

export default Home