'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Lock, Camera, Check, X } from 'lucide-react'
import Image from 'next/image'

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
}

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  notTooLong: boolean;
}

export default function Profile() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    notTooLong: true,
  })
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to fetch profile')
          }
          return res.json()
        })
        .then(data => {
          setUserProfile(data)
          setProfileForm(prev => ({
            ...prev,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || ''
          }))
        })
        .catch(err => {
          console.error('Error fetching user details:', err)
          setError(err.message || 'Failed to load profile data')
        })
    }
  }, [status])

  // Check password requirements in real-time
  useEffect(() => {
    const newPassword = profileForm.newPassword
    setPasswordRequirements({
      minLength: newPassword.length >= 6,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      notTooLong: newPassword.length <= 100,
    })
  }, [profileForm.newPassword])

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

  if (status === 'unauthenticated') {
    router.push('/signin')
    return null
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          email: profileForm.email,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const data = await response.json()
      setUserProfile(data)
      await updateSession()
      alert('Profile updated successfully!')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      setError('New passwords do not match!')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update password')
      }

      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))

      alert('Password updated successfully!')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload image')
      }

      const data = await response.json()
      setUserProfile(prev => ({ ...prev!, profileImage: data.profileImage }))
      await updateSession()
      alert('Profile image updated successfully!')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
              {userProfile?.profileImage ? (
                <Image
                  src={userProfile.profileImage}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400 m-auto mt-6" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div className="ml-6">
            <h2 className="text-lg font-semibold">Profile Picture</h2>
            <p className="text-sm text-gray-600 mt-1">Upload a new profile picture</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-6">Personal Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-6">
          <Lock className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={profileForm.currentPassword}
              onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={profileForm.newPassword}
              onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
            {/* Password Requirements Box */}
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h3>
              <ul className="space-y-1">
                <li className="flex items-center text-sm">
                  {passwordRequirements.minLength ? (
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <X className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  At least 6 characters
                </li>
                <li className="flex items-center text-sm">
                  {passwordRequirements.hasUppercase ? (
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <X className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  One uppercase letter
                </li>
                <li className="flex items-center text-sm">
                  {passwordRequirements.hasLowercase ? (
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <X className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  One lowercase letter
                </li>
                <li className="flex items-center text-sm">
                  {passwordRequirements.hasNumber ? (
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <X className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  One number
                </li>
                <li className="flex items-center text-sm">
                  {passwordRequirements.notTooLong ? (
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <X className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  Not more than 100 characters
                </li>
              </ul>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={profileForm.confirmPassword}
              onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
            {profileForm.newPassword && profileForm.confirmPassword && (
              <p className={`mt-1 text-sm ${profileForm.newPassword === profileForm.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                {profileForm.newPassword === profileForm.confirmPassword ? 
                  'Passwords match' : 
                  'Passwords do not match'}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || 
              !Object.values(passwordRequirements).every(Boolean) || 
              profileForm.newPassword !== profileForm.confirmPassword}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
} 