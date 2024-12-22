import NextAuth from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'

const handler = NextAuth(authConfig)

export { handler as GET, handler as POST } 