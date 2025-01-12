import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { 
  saveExamDraft, 
  getExamDraft, 
  updateExamDraft, 
  deleteExamDraft,
  addQuestionToDraft,
  removeQuestionFromDraft
} from '@/lib/redis'

// Get draft
export async function GET(
  req: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const draft = await getExamDraft(user.id)
    return NextResponse.json(draft || {})
  } catch (error) {
    console.error('Failed to get exam draft:', error)
    return NextResponse.json(
      { error: 'Failed to get exam draft' },
      { status: 500 }
    )
  }
}

// Save/update draft
export async function POST(
  req: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'save':
        await saveExamDraft(user.id, body.data)
        break
      case 'update':
        await updateExamDraft(user.id, body.data)
        break
      case 'addQuestion':
        await addQuestionToDraft(user.id, body.question)
        break
      case 'removeQuestion':
        await removeQuestionFromDraft(user.id, body.questionIndex)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedDraft = await getExamDraft(user.id)
    return NextResponse.json({
      success: true,
      message: 'Draft updated successfully',
      data: updatedDraft
    })
  } catch (error) {
    console.error('Failed to update exam draft:', error)
    return NextResponse.json(
      { error: 'Failed to update exam draft' },
      { status: 500 }
    )
  }
}

// Delete draft
export async function DELETE(
  req: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteExamDraft(user.id)
    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete exam draft:', error)
    return NextResponse.json(
      { error: 'Failed to delete exam draft' },
      { status: 500 }
    )
  }
} 