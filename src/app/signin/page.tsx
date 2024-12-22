'use client'

import { useState } from 'react'
import { AtSymbolIcon, KeyIcon } from '@heroicons/react/24/outline'
import { authenticate } from '@/app/lib/actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'

export default function SignIn() {
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    
    const formData = new FormData(e.currentTarget)
    try {
      const result = await signIn('credentials', {
        email: formData.get('email'),
        password: formData.get('password'),
        redirect: false,
      })

      if (result?.error) {
        setErrorMessage('Invalid credentials')
      } else {
        // Fetch the session to get the user role
        const response = await fetch('/api/auth/session')
        const session = await response.json()
        
        if (session?.user?.role) {
          const redirectPath = session.user.role === 'TEACHER' ? '/teacher_dashboard' : '/student_dashboard'
          router.push(redirectPath)
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setErrorMessage('Something went wrong!')
    } finally {
      setIsLoading(false)
    }
  }

  // If already authenticated, redirect to appropriate dashboard
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'authenticated' && session?.user) {
    const redirectPath = session.user.role === 'TEACHER' ? '/teacher_dashboard' : '/student_dashboard'
    router.push(redirectPath)
    return null
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8 pb-20 gap-8 sm:p-20">
      <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              disabled={isLoading}
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>

          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              disabled={isLoading}
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>

          {errorMessage && (
            <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?
            <Link href="/signup" className="ml-2 text-blue-600 hover:text-blue-700 font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 