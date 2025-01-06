import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Teacher Dashboard | Exium',
  description: 'Manage your exams and students',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
