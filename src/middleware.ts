import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage =
      req.nextUrl.pathname.startsWith('/signin') ||
      req.nextUrl.pathname.startsWith('/signup')

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL(
          token.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard',
          req.url
        ))
      }
      return null
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/signin?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Handle protected routes
    if (req.nextUrl.pathname.startsWith('/teacher') && token.role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/student/dashboard', req.url))
    }

    if (req.nextUrl.pathname.startsWith('/student') && token.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/teacher/dashboard', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/signin',
    '/signup',
    '/teacher/:path*',
    '/student/:path*',
  ],
} 