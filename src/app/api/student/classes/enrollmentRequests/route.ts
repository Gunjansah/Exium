import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET() {
    // Get the list of class ids that the student has requested to enroll in
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const enrollmentRequests = await prisma.enrollmentRequest.findMany({
    where: { userId: session.user.id, 
             status : 'PENDING'},
    include: {
      class: true
    }
  });

  const classIds = enrollmentRequests.map(enrollment => enrollment.classId)
  return NextResponse.json(classIds)
}
