'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const data = await signOut({
        redirect: false,
        callbackUrl: '/signin'
      })
      
      // Clear any local state or cookies if needed
      localStorage.clear()
      sessionStorage.clear()
      
      // Force a hard refresh to clear any cached state
      window.location.href = '/signin'
    } catch (error) {
      console.error('Error signing out:', error)
      // Fallback to basic redirect if signOut fails
      window.location.href = '/signin'
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 group w-full text-left"
    >
      <LogOut className="w-5 h-5 mr-3 group-hover:text-blue-600 text-gray-400" />
      <span className="text-gray-700 group-hover:text-blue-600">Sign Out</span>
    </button>
  )
} 