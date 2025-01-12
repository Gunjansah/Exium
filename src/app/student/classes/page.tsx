'use client'

import { JoinByCode } from '@/components/student-dashboard/classes/JoinByCode'
import { AvailableClasses } from '@/components/student-dashboard/classes/AvailableClasses'
import StudentDashboardLayout from '@/components/student-dashboard/layout/StudentDashboardLayout'
import { Separator } from '@/components/ui/separator'

export default function StudentClassesPage() {
  return (
    <StudentDashboardLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground">
            Join and manage your class enrollments
          </p>
        </div>

        <Separator />

        {/* Join by Code Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Join a Class</h2>
          <JoinByCode />
        </div>

        <Separator />

        {/* Available Classes Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Available Classes</h2>
          <AvailableClasses />
        </div>
      </div>
    </StudentDashboardLayout>
  )
} 