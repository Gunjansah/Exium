import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'TEACHER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Get user settings
    const settings = await prisma.userSettings.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        notifications: true,
        privacy: true,
        preferences: true,
      },
    })

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          notifications: {
            email: true,
            push: true,
            examReminders: true,
            classUpdates: true,
            announcements: true,
          },
          privacy: {
            showProfile: true,
            showActivity: true,
            showProgress: true,
          },
          preferences: {
            language: 'en',
            timezone: 'UTC',
          },
        },
      })

      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'TEACHER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { category, setting, value } = await request.json()

    if (!category || !setting || typeof value === 'undefined') {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Update the specific setting
    const settings = await prisma.userSettings.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        [category]: {
          [setting]: value,
        },
      },
      update: {
        [category]: {
          [setting]: value,
        },
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 