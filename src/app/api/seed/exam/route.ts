import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { QuestionType, DifficultyLevel, ExamStatus, SecurityLevel } from '@prisma/client'

export async function POST() {
  try {
    // First, create a dummy class if not exists
    const dummyClass = await prisma.class.upsert({
      where: {
        code: 'DEMO101',
      },
      update: {},
      create: {
        name: 'Demo Mathematics Class',
        description: 'A demo class for testing the exam system',
        code: 'DEMO101',
        teacher: {
          create: {
            email: 'demo.teacher@example.com',
            passwordHash: 'dummy-hash', // In real app, this would be properly hashed
            role: 'TEACHER',
            firstName: 'Demo',
            lastName: 'Teacher',
          },
        },
      },
    })

    // Create the exam
    const exam = await prisma.exam.create({
      data: {
        title: 'Sample Mathematics Exam',
        description: 'This is a sample exam to test the secure exam environment. It includes various question types and security features.',
        duration: 60,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: ExamStatus.PUBLISHED,
        classId: dummyClass.id,
        createdBy: dummyClass.teacherId,
        // Security settings
        blockClipboard: true,
        blockKeyboardShortcuts: true,
        blockMultipleTabs: true,
        blockRightClick: true,
        blockSearchEngines: true,
        browserMonitoring: true,
        deviceTracking: true,
        fullScreenMode: true,
        maxViolations: 3,
        periodicUserValidation: true,
        resumeCount: 1,
        screenshotBlocking: true,
        securityLevel: SecurityLevel.STRICT,
        webcamRequired: true,
        // Sample questions
        questions: {
          create: [
            {
              type: QuestionType.MULTIPLE_CHOICE,
              content: 'What is the value of π (pi) to two decimal places?',
              points: 5,
              difficulty: DifficultyLevel.EASY,
              orderIndex: 1,
              options: JSON.stringify([
                { text: '3.14', isCorrect: true },
                { text: '3.12', isCorrect: false },
                { text: '3.16', isCorrect: false },
                { text: '3.18', isCorrect: false },
              ]),
              explanation: 'Pi (π) is approximately equal to 3.14159...',
            },
            {
              type: QuestionType.TRUE_FALSE,
              content: 'The square root of 144 is 12.',
              points: 5,
              difficulty: DifficultyLevel.EASY,
              orderIndex: 2,
              correctAnswer: 'true',
              explanation: 'Since 12 × 12 = 144, the square root of 144 is indeed 12.',
            },
            {
              type: QuestionType.SHORT_ANSWER,
              content: 'What is the formula for the area of a circle?',
              points: 10,
              difficulty: DifficultyLevel.MEDIUM,
              orderIndex: 3,
              correctAnswer: 'πr²',
              explanation: 'The area of a circle is calculated using the formula A = πr², where r is the radius.',
            },
            {
              type: QuestionType.LONG_ANSWER,
              content: 'Explain the Pythagorean theorem and provide a real-world example of its application.',
              points: 15,
              difficulty: DifficultyLevel.HARD,
              orderIndex: 4,
              rubric: JSON.stringify({
                criteria: [
                  { name: 'Definition', points: 5, description: 'Correctly states the theorem (a² + b² = c²)' },
                  { name: 'Explanation', points: 5, description: 'Clear explanation of what the theorem means' },
                  { name: 'Example', points: 5, description: 'Relevant real-world example provided' },
                ],
              }),
            },
            {
              type: QuestionType.CODING,
              content: 'Write a function that returns the factorial of a given number n.',
              points: 15,
              difficulty: DifficultyLevel.HARD,
              orderIndex: 5,
              codeTemplate: `function factorial(n) {
  // Your code here
}`,
              testCases: JSON.stringify([
                { input: '5', expectedOutput: '120', isHidden: false },
                { input: '0', expectedOutput: '1', isHidden: false },
                { input: '3', expectedOutput: '6', isHidden: true },
              ]),
            },
          ],
        },
      },
    })

    return new NextResponse(JSON.stringify({ success: true, examId: exam.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Failed to seed exam:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to seed exam' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 