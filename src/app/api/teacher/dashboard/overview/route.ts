import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the start and end of the current month
    const start = startOfMonth(new Date())
    const end = endOfMonth(new Date())

    // Get all days in the month
    const days = eachDayOfInterval({ start, end })

    // Get all submissions for the month
    const submissions = await prisma.submission.findMany({
      where: {
        exam: {
          createdBy: user.id,
        },
        submittedAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        submittedAt: true,
      },
    })

    // Create a map of submissions per day
    const submissionsPerDay = submissions.reduce((acc, { submittedAt }) => {
      const day = format(submittedAt, 'MMM dd')
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Format data for the chart
    const data = days.map((day) => ({
      name: format(day, 'MMM dd'),
      total: submissionsPerDay[format(day, 'MMM dd')] || 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        data,
      },
    })
  } catch (error) {
    console.error('Overview error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch overview data' },
      { status: 500 }
    )
  }
}
