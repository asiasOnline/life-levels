"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { FaRegEye, FaRegEyeSlash, FaFacebook, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

const formSchema = z.object({
  email: z
  .email("Please enter a valid email address")
  .min(1, "Email is required")
  .toLowerCase()
  .trim(),
  password: z
  .string()
  .min(1, "Password is required"),
})

type FormData = z.infer<typeof formSchema>

const LogInForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Welcome back!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(`Failed to sign in with ${provider}`)
    }
  }

  return (
    <Card className='w-120 p-8'>
            <div className='flex flex-col items-center gap-6'>
              <div className='block w-28 h-auto'>
                <img 
                  src="/Life-Levels-Logo.svg" 
                  alt="Life Levels Logo" 
                />
              </div>
              <p className='font-semibold text-stone-500'>Designed for progress, rather than pressure</p>
            </div>
            <h1 className='text-4xl font-medium'>Log In</h1>
            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
            {/* Email Field */}
            <Field className="max-w-sm">
              <FieldLabel htmlFor="user-email">
                Email<span className='text-red-600'>*</span>
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="user-email"
                  type="email"
                  placeholder="Enter email"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                />
              </InputGroup>
              {errors.email && (
                <FieldError role="alert">{errors.email.message}</FieldError>
              )}
            </Field>

            {/* Password Field */}
            <Field className="max-w-sm">
              <FieldLabel htmlFor="user-password">
                Password<span className='text-red-600'>*</span>
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="user-password"
                  type="password"
                  placeholder="Enter password"
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                  </button>
                </InputGroupAddon>
              </InputGroup>
                {errors.password && (
                  <FieldError role="alert">{errors.password.message}</FieldError>
                )}
            </Field>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                href="/forgot-password" 
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
            </form>
            <div className='flex place-items-center gap-4 text-stone-400'>
              <hr className='w-full '/> 
              <p>OR</p> 
              <hr className='w-full'/>
            </div>
            <div className='flex flex-col gap-4'>
              <Button 
                variant={'outline'}
                onClick={() => handleOAuthSignIn('google')}
              >
                <FcGoogle /> 
                Continue with Google
              </Button>

              <Button 
                variant={'outline'}
                onClick={() => handleOAuthSignIn('facebook')}
              >
                <FaFacebook className='text-[#1877f2]'/> 
                Continue with Facebook
              </Button>

              <Button 
                variant={'outline'}
                onClick={() => handleOAuthSignIn('apple')}
              >
                <FaApple /> 
                Continue with Apple
              </Button>
            </div>
          </Card>
  )
}

export default LogInForm