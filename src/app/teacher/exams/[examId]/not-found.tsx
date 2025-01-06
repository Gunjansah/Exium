import { NotFound } from '@/components/error'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'

export default function ExamNotFound() {
  return (
    <TeacherDashboardLayout>
      <NotFound />
    </TeacherDashboardLayout>
  )
}
