import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/teacher_dashboard/:path*', '/student_dashboard/:path*'],
};