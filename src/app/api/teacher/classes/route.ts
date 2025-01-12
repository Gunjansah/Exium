import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { EventType } from '@prisma/client'

const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
  code: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const validatedData = createClassSchema.parse(body)

    // Create the class with a transaction to ensure all operations succeed
    const result = await prisma.$transaction(async (tx) => {
      // Create the class
      const newClass = await tx.class.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          code: validatedData.code || nanoid(8), // Generate a unique code if not provided
          teacher: {
            connect: { id: user.id }
          }
        },
        include: {
          teacher: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            }
          },
          _count: {
            select: {
              enrollments: true,
              exams: true,
            }
          }
        }
      })

      // Create a calendar event for the class creation
      await tx.calendarEvent.create({
        data: {
          title: `New Class: ${newClass.name}`,
          description: `Class created: ${newClass.name}`,
          type: EventType.OTHER,
          startTime: new Date(),
          user: {
            connect: { id: user.id }
          },
          class: {
            connect: { id: newClass.id }
          }
        }
      })

      return newClass
    })

    return NextResponse.json({ 
      success: true,
      data: result 
    }, {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in class creation:', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ 
          success: false,
          errors: error.errors 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        message: 'Error creating class',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const classes = await prisma.class.findMany({
      where: {
        teacherId: user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        _count: {
          select: {
            enrollments: true,
            exams: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ 
      success: true,
      data: classes || [] 
    }, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in classes API:', error)
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        message: 'Error processing request',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
