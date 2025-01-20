import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExamStatus, SecurityLevel } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: { classId: string } }
) {
  try {
    console.log('POST /api/teacher/classes/[classId]/exams - Start')
    console.log('Context params:', params)

    // 1. Get user session
    const session = await getServerSession(authOptions)
    console.log('Session:', session)

    if (!session?.user?.id) {
      console.log('Unauthorized: No valid session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get class ID from params
    const classId = params.classId
    if (!classId) {
      console.log('Missing classId in params')
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    // 3. Verify teacher owns the class
    console.log('Verifying class ownership for teacher:', session.user.id)
    const teacherClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id
      }
    })

    if (!teacherClass) {
      console.log('Class not found or unauthorized')
      return NextResponse.json({ error: 'Class not found or unauthorized' }, { status: 404 })
    }

    // 4. Get request data
    const body = await request.json()
    console.log('Request body:', body)

    const { title, description, duration, questions, ...securitySettings } = body

    if (!title || !duration) {
      console.log('Missing required fields')
      return NextResponse.json({ error: 'Title and duration are required' }, { status: 400 })
    }

    // 5. Create exam with basic settings
    console.log('Creating exam with data:', {
      title,
      description,
      duration,
      classId,
      teacherId: session.user.id
    })

    const exam = await prisma.exam.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        duration: Number(duration),
        classId,
        createdBy: session.user.id,
        status: ExamStatus.DRAFT,
        securityLevel: SecurityLevel.STANDARD,
        questions: questions?.length > 0 ? {
          create: questions.map((q: any, index: number) => ({
            content: q.content,
            type: q.type,
            points: q.points,
            difficulty: q.difficulty,
            orderIndex: index,
            timeLimit: q.timeLimit || null,
            explanation: q.explanation || null,
            options: q.type === 'MULTIPLE_CHOICE' && q.options ? q.options : null,
            correctAnswer: q.correctAnswer || null,
            rubric: q.rubric || null,
            testCases: q.testCases || null,
          })),
        } : undefined,
        ...securitySettings,
      },
      include: {
        questions: true,
      },
    })

    console.log('Exam created successfully:', exam)
    return NextResponse.json(exam)
  } catch (error) {
    console.error('Failed to create exam:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create exam' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classId = params.classId
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    const exams = await prisma.exam.findMany({
      where: {
        classId,
        createdBy: session.user.id,
      },
      include: {
        questions: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(exams)
  } catch (error) {
    console.error('Failed to fetch exams:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}
