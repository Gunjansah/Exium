import NextAuth from 'next-auth'
import { Role } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: string
    role: Role
  }

  interface Session {
    user: {
      id: string
      role: Role
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }
} 