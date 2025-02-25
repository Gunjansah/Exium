'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'
import { AtSymbolIcon, KeyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { withAuth } from 'next-auth/middleware'

interface FormData {
  email: string
  password: string
  confirmPassword: string
}

export default function Signup() {
  const router = useRouter()
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const session = await getSession()
      console.log('Checking session',session)
      if (session) {
        const dashboardURL = session.user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
        router.push(dashboardURL);
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    const form = e.currentTarget
    const formData = new FormData(form)
    const email = formData.get('email')
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    if (!email || !password || !confirmPassword) {
      setErrorMessage('All fields are required')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toString(),
          password: password.toString(),
          role,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/signin')
      } else {
        setErrorMessage(data.error || 'Something went wrong')
      }
    } catch (error) {
      setErrorMessage('Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8 pb-20 gap-8 sm:p-20">
      <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 text-white bg-transparent"
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>

          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              minLength={6}
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 text-white bg-transparent"
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>

          <div className="relative">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              required
              minLength={6}
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 text-white bg-transparent"
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>

          <div className="flex items-center justify-center gap-4 my-2">
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                role === 'STUDENT'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('TEACHER')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                role === 'TEACHER'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Teacher
            </button>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <ExclamationCircleIcon className="h-5 w-5" />
              <p>{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-gray-900 text-white rounded-lg px-4 py-2 mt-2 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/signin" className="text-gray-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}