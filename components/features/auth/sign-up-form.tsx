'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { FaRegEyeSlash, FaRegEye, FaFacebook, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Button } from '@/components/ui/button'

// Schema with password confirmation
const formSchema = z.object({
  email: z
  .email("Please enter a valid email address")
  .min(1, "Email is required")
  .toLowerCase()
  .trim(),
  password: z
  .string()
  .min(12, "Password must be at least 12 characters long"),
  confirmPassword: z
  .string()
  .min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof formSchema>

const SignUpForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: FormData) => {
  setIsLoading(true)
  setApiError(null) // Clear previous API errors

  try {
    console.log('Attempting signup with:', data.email) // Debug log

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    
    if (error) {
      setApiError(error.message) // Set the error in state
      toast.error(error.message)
    } else {
      toast.success('Check your email to confirm your account!')
      reset() // Clear form fields on successful signup
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    setApiError(errorMessage)
    toast.error(errorMessage)
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
        <h1 className='text-4xl font-medium'>Sign Up</h1>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
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
              type={showPassword ? "text" : "password"}
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

        {/* Confirm Password Field */}
        <Field className="max-w-sm">
          <FieldLabel htmlFor="user-password-confirm">
            Re-Enter Password<span className='text-red-600'>*</span>
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="user-password-confirm"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              {...register("confirmPassword")}
              aria-invalid={errors.confirmPassword ? "true" : "false"} 
            />
            <InputGroupAddon align="inline-end">
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaRegEye /> : <FaRegEyeSlash />}
              </button>
            </InputGroupAddon>
          </InputGroup>
          {errors.confirmPassword && (
            <FieldError role="alert">{errors.confirmPassword.message}</FieldError>
          )}
        </Field>

        <Button
          type="submit"
          className='w-full'
          disabled={isLoading}
        >
          {isLoading ? 'Signing Up...' : 'Sign Up'}
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
            Sign Up with Google
          </Button>
          <Button 
            variant={'outline'}
            onClick={() => handleOAuthSignIn('facebook')}
          >
            <FaFacebook className='text-[#1877f2]'/> 
            Sign Up with Facebook
          </Button>
          <Button 
            variant={'outline'}
            onClick={() => handleOAuthSignIn('apple')}
          >
            <FaApple /> 
            Sign Up with Apple
          </Button>
        </div>
        
        <p className='text-sm text-stone-500'>By signing up, you agree to our <Link href={'/terms-of-use'} className='underline'>Terms of Use</Link> and <Link href={'/privacy-policy'} className='underline'>Privacy Policy</Link>.</p>
      </Card>
  )
}

export default SignUpForm