import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function POST(req: Request) {
  const { requestId } = await req.json()
  const enrolledmentApproved = await prisma.enrollmentRequest.findFirst({
    where: {
      id: requestId,
    }})

    if (!enrolledmentApproved) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Enrollment Not Approved' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const classId = enrolledmentApproved?.classId
    const userId = enrolledmentApproved?.userId
    const deleteEnrollmentRequest = await prisma.enrollmentRequest.delete({
        where: {
            id: requestId
        }
    })
    const enrollment = await prisma.classEnrollment.create({
        data: {
          userId: userId,
          classId: classId,
          role: 'STUDENT',
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              description: true,
              code: true,
              createdAt: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  enrollments: true,
                  exams: true,
                },
              },
            },
          },
        },
      })

      return new NextResponse(
        JSON.stringify({ success: true, message: 'Enrollment Approved' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
}


