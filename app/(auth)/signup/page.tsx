import React from 'react'
import Link from 'next/link'
import SignUpForm from '@/components/features/auth/sign-up-form'

const SignUp = () => {
  return (
    <div className='w-full flex flex-col items-center gap-4 my-8'>
      <SignUpForm />
      <div className='flex gap-2'>
        <p>Already have an account?</p>
        <Link href={'./login'} className='font-semibold text-[#005F73]'>Log In</Link>
      </div>
    </div>
  )
}

export default SignUp