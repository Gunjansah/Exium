'use client'

import { useState } from 'react'
import { authenticate } from '@/app/lib/actions'
import { AtSymbolIcon, KeyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { ArrowRightIcon } from '@heroicons/react/20/solid'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      const error = await authenticate(undefined, formData)
      if (error) {
        setErrorMessage(error)
      }
    } catch (error) {
      setErrorMessage('Something went wrong!')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8 pb-20 gap-8 sm:p-20">
      <h1 className="text-3xl font-bold text-gray-800">
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h1>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          
          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              minLength={6}
              className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            {isLogin ? 'Login' : 'Sign Up'}
            <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
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
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
