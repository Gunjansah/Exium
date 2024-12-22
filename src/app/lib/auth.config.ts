import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isTeacher = auth?.user?.role === 'TEACHER';
      const isStudent = auth?.user?.role === 'STUDENT';
      
      const isTeacherDashboard = nextUrl.pathname.startsWith('/teacher_dashboard');
      const isStudentDashboard = nextUrl.pathname.startsWith('/student_dashboard');

      if (isTeacherDashboard && !isTeacher) {
        return false;
      }

      if (isStudentDashboard && !isStudent) {
        return false;
      }

      if (isLoggedIn && nextUrl.pathname === '/signin') {
        // Redirect to appropriate dashboard based on role
        const redirectUrl = isTeacher ? '/teacher_dashboard' : '/student_dashboard';
        return Response.redirect(new URL(redirectUrl, nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;