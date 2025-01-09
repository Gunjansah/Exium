import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Get the resource
    const resource = await prisma.resource.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        title: true,
        type: true,
        url: true,
        fileSize: true,
        class: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!resource) {
      return new NextResponse('Resource not found', { status: 404 })
    }

    // Check if student is enrolled in the class
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        userId: session.user.id,
        classId: resource.class.id,
        role: 'STUDENT',
      },
    })

    if (!enrollment) {
      return new NextResponse('Not enrolled in this class', { status: 403 })
    }

    // Download the file from storage (implementation depends on storage solution)
    // For example, if using AWS S3:
    // const file = await s3.getObject({
    //   Bucket: process.env.AWS_S3_BUCKET,
    //   Key: resource.url,
    // }).promise()

    // For now, redirect to the URL (assuming it's a direct download link)
    return NextResponse.redirect(resource.url)
  } catch (error) {
    console.error('Error downloading resource:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 