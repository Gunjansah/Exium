'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AtSymbolIcon, KeyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function Signup() {
  const router = useRouter()
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    if (formData.get('password') !== formData.get('confirmPassword')) {
      setErrorMessage('Passwords do not match')
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          role: role,
        }),
      })

      if (response.ok) {
        router.push('/signin')
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Something went wrong')
      }
    } catch (error) {
      setErrorMessage('Failed to create account')
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
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
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
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
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
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>

          <div className="flex items-center justify-center gap-4 my-2">
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              className={`px-4 py-2 rounded-lg ${
                role === 'STUDENT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('TEACHER')}
              className={`px-4 py-2 rounded-lg ${
                role === 'TEACHER'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Teacher
            </button>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </button>

          {errorMessage && (
            <div className="flex items-center gap-2 text-red-500">
              <ExclamationCircleIcon className="h-5 w-5" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?
            <Link href="/signin" className="ml-2 text-blue-600 hover:text-blue-700 font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 