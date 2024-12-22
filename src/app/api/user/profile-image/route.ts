import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (err) {
      // Ignore error if directory already exists
    }

    // Get current user to check for existing profile image
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete old profile image if it exists
    if (currentUser.profileImage) {
      const oldImagePath = join(process.cwd(), 'public', currentUser.profileImage)
      if (existsSync(oldImagePath)) {
        try {
          await unlink(oldImagePath)
        } catch (err) {
          console.error('Error deleting old profile image:', err)
        }
      }
    }

    // Create unique filename with sanitization
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '')
    const fileName = `${session.user.id}-${Date.now()}-${sanitizedFileName}`
    const path = join(uploadsDir, fileName)

    // Save file
    await writeFile(path, buffer)
    const imageUrl = `/uploads/${fileName}`

    // Update user profile with image URL
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profileImage: imageUrl,
      },
    })

    // Only return safe user data
    const safeUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      profileImage: updatedUser.profileImage,
      role: updatedUser.role,
    }

    return NextResponse.json(safeUser)
  } catch (error) {
    console.error('Profile image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 