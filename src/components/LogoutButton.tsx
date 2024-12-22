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
      className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700 w-full text-left text-white"
    >
      <LogOut className="w-5 h-5 mr-3" />
      Sign Out
    </button>
  )
} 