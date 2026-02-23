import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const Home = () => {
  return (
    <main className='my-10 flex justify-center gap-40'>
      <div className='w-140 flex flex-col justify-center place-content-center gap-8'>
        <h1 className='md:text-4xl lg:text-5xl xl:text-5xl leading-20 font-bold'>Turn your life into an <span className='bg-linear-to-r from-[#04A295] via-[#E1BB1F] to-[#AE2012] text-transparent bg-clip-text inline-block'>adventure</span></h1>
        <h2 className='text-xl text-stone-600'>Level up your habits, skills, and goals with a RPG-style productivity system designed for progress, rather than pressure.</h2>
        <Link href={'/signup'}>
          <Button className='w-72 h-12'>
          Start Your Adventure
        </Button>
        </Link>
      </div>
      <div className='md:w-80 lg:w-160'>
        <img 
          src="/above-fold-img.svg" 
          alt="girl looking toward a map" 
          className='w-full'
        />
      </div>
    </main>
  )
}

export default Home