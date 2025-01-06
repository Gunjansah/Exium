'use client'

import { Error } from '@/components/error'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'

export default function ExamError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <TeacherDashboardLayout>
      <Error error={error} reset={reset} />
    </TeacherDashboardLayout>
  )
}
