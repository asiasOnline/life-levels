import React from 'react'
import Link from 'next/link'
import LogInForm from '@/components/features/auth/login-form'

const Login = () => {
  return (
    <div className='w-full flex flex-col items-center gap-4 my-8'>
      <LogInForm />
      <div className='flex gap-2'>
        <p>Don't have an account yet?</p>
        <Link href={'./signup'} className='font-semibold text-[#005F73]'>Sign Up</Link>
      </div>
    </div>
  )
}

export default Login