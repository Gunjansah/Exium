import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { z } from 'zod'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    role: Role
  }
  
  interface Session {
    user: {
      id: string
      email: string
      role: Role
    }
  }
}

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const { email, password } = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .parse(credentials)

          console.log('Auth attempt for email:', email.toLowerCase())

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
              id: true,
              email: true,
              passwordHash: true,
              role: true
            }
          })
          
          if (!user) {
            console.log('User not found')
            return null
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash)
          console.log('Password valid:', isValidPassword)

          if (!isValidPassword) {
            console.log('Invalid password')
            return null
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}