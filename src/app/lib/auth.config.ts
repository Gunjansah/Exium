import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

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

const prisma = new PrismaClient()

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

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
              id: true,
              email: true,
              passwordHash: true,
              role: true
            }
          })
          
          if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role,
          }
        } catch {
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
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
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