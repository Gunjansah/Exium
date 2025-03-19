'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Shield, Play, Send, Clock, AlertTriangle, X, ChevronLeft, ChevronRight, Eye, Lock, Layout, Settings, RefreshCw, Terminal, Code2, Split, Maximize, Download, HelpCircle, CheckCircle, Minimize } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import  Judge0Tester  from '@/components/judge0'

// Types for exam data
interface ExamQuestion {
  id: string
  questionText: string
  type: 'CODING' | 'MULTIPLE_CHOICE' | 'SHORT_ANSWER'
  description?: string
  examples?: { input: string; output: string; explanation?: string }[]
  constraints?: string[]
  testCases?: any
  choices?: string[]
  correctAnswer?: string
}

interface ExamData {
  id: string
  title: string
  duration: number  // in minutes
  questions: ExamQuestion[]
}

// Add Monaco Editor theme configuration
const monacoTheme = {
  dark: {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'class', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'operator', foreground: 'D4D4D4' }
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#2F2F2F',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editor.findMatchBackground': '#515C6A',
      'editor.findMatchHighlightBackground': '#314365',
      'editorBracketMatch.background': '#0D3A58',
      'editorBracketMatch.border': '#888888',
      'editorCursor.foreground': '#A6A6A6',
      'editorWhitespace.foreground': '#3B3B3B',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
      'editor.lineHighlightBorder': '#282828',
    },
  },
  light: {
    base: 'vs' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000' },
      { token: 'keyword', foreground: '0000FF' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'regexp', foreground: '811F3F' },
      { token: 'type', foreground: '267F99' },
      { token: 'class', foreground: '267F99' },
      { token: 'function', foreground: '795E26' },
      { token: 'variable', foreground: '001080' },
      { token: 'operator', foreground: '000000' }
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editor.lineHighlightBackground': '#F7F7F7',
      'editorLineNumber.foreground': '#999999',
      'editorLineNumber.activeForeground': '#333333',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
      'editor.findMatchBackground': '#A8AC94',
      'editor.findMatchHighlightBackground': '#E8E8E8',
      'editorBracketMatch.background': '#E5E5E5',
      'editorBracketMatch.border': '#808080',
      'editorCursor.foreground': '#000000',
      'editorWhitespace.foreground': '#BFBFBF',
      'editorIndentGuide.background': '#D3D3D3',
      'editorIndentGuide.activeBackground': '#939393',
      'editor.lineHighlightBorder': '#E5E5E5',
    },
  },
}

// Language snippets
const javaScriptSnippets = {
  'Console Log': {
    prefix: 'log',
    body: 'console.log($1);',
    description: 'Log output to console'
  },
  'For Loop': {
    prefix: 'for',
    body: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t$0\n}',
    description: 'For Loop'
  },
  'Function': {
    prefix: 'fn',
    body: 'function ${1:name}(${2:params}) {\n\t$0\n}',
    description: 'Function'
  },
}

// First, let's define a mapping of our language IDs to Judge0 language IDs
const languageIdMap: { [key: string]: number } = {
  'javascript': 63,  // JavaScript (Node.js 12.14.0)
  'python': 71,      // Python (3.8.1)
  'java': 62,        // Java (OpenJDK 13.0.1)
  'cpp': 54,         // C++ (GCC 9.2.0)
  'csharp': 51,      // C# (Mono 6.6.0)
  'ruby': 72,        // Ruby (2.7.0)
  'go': 60,          // Go (1.13.5)
  'rust': 73,        // Rust (1.40.0)
  'typescript': 74   // TypeScript (3.7.4)
};

// Add this line after imports
const JUDGE0_API_URL = 'http://20.151.69.55';

// Add a helper function at the top of the file
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function ExamInterface() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('id')
  const { data: session } = useSession()

  // Group all useState hooks together at the top
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [code, setCode] = useState('')
  const [answer, setAnswer] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [examStartTime, setExamStartTime] = useState<Date | null>(null)
  const [securityViolations, setSecurityViolations] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPlagiarismWarning, setShowPlagiarismWarning] = useState(false)
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSecurityStatus, setShowSecurityStatus] = useState(false)
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [fontSize, setFontSize] = useState(14)
  const [isRecording, setIsRecording] = useState(false)
  const [mouseOutCount, setMouseOutCount] = useState(0)
  const [showOutput, setShowOutput] = useState(true)
  const [outputHeight, setOutputHeight] = useState(200)
  const [isOutputMaximized, setIsOutputMaximized] = useState(false)
  const [testCaseResults, setTestCaseResults] = useState<Array<{ passed: boolean; input: string; expected: string; output: string; time: string }>>([])
  const [processing, setProcessing] = useState(false)
  const [questionAnswers, setQuestionAnswers] = useState<{[key: string]: string}>({})
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [hasStarted, setHasStarted] = useState(false)

  // Required data checks useEffect
  useEffect(() => {
    if (!examId) {
      router.push('/student')
      return
    }

    if (!session) {
      router.push('/signin')
      return
    }
  }, [examId, session, router])

  // Load exam data useEffect
  useEffect(() => {
    const loadExamData = async () => {
      if (!examId) {
        router.push('/student')
        return
      }

      try {
        const examResponse = await fetch(`/api/exams/${examId}`)
        if (!examResponse.ok) {
          throw new Error('Failed to fetch exam details')
        }
        const examDetails = await examResponse.json()

        // Convert duration from minutes to seconds and ensure it's a number
        const durationInSeconds = (examDetails.data.duration || 60) * 60

        // Check if exam has already started for this user
        const enrollmentResponse = await fetch(`/api/exams/${examId}/enrollment`)
        const enrollmentData = await enrollmentResponse.json()

        if (enrollmentData.startTime) {
          // If exam was already started, calculate remaining time
          const startTime = new Date(enrollmentData.startTime)
          const elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000)
          const remainingSeconds = Math.max(0, durationInSeconds - elapsedSeconds)
          setTimeLeft(remainingSeconds)
          setExamStartTime(startTime)
          setHasStarted(true)
        } else {
          // If first time starting exam
          setTimeLeft(durationInSeconds)
        }

        // Then fetch questions
        const questionsResponse = await fetch(`/api/exams/${examId}/questions`)
        if (!questionsResponse.ok) {
          throw new Error('Failed to fetch exam questions')
        }
        const { data: questions } = await questionsResponse.json()

        const formattedQuestions = questions.map((question: any) => ({
          id: question.id,
          type: question.type,
          questionText: question.questionText || question.content, // Handle both formats
          description: question.description,
          examples: question.examples,
          constraints: question.constraints,
          testCases: question.testCases,
          choices: question.options, // Updated to match schema
          correctAnswer: question.correctAnswer
        }))

        const data: ExamData = {
          id: examId,
          title: examDetails.data.title,
          duration: examDetails.data.duration || 60,
          questions: formattedQuestions
        }

        setExamData(data)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load exam:', error)
        toast.error('Failed to load exam data')
        router.push('/student/exams')
      }
    }

    loadExamData()
  }, [examId, router])

  // Timer countdown useEffect
  useEffect(() => {
    if (!hasStarted || timeLeft === 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        // Warning notifications for last 5 minutes
        if (prev <= 300 && prev % 60 === 0) {
          toast.warning(`${Math.floor(prev / 60)} minutes remaining!`)
        }
        // Final warning at 1 minute
        if (prev === 60) {
          toast.error('1 minute remaining!')
        }
        // Auto-submit when time is up
        if (prev <= 0) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, hasStarted])

  // Security monitoring useEffect
  useEffect(() => {
    if (hasStarted) {
      const setupSecurityMonitoring = () => {
        // Remove the initial fullscreen request from here
        const handleFullscreenChange = () => {
          if (!document.fullscreenElement && hasStarted) {
            setSecurityViolations(prev => [...prev, 'Fullscreen mode exited'])
            toast.error("Please maintain fullscreen mode during the exam")
            // Don't auto-request fullscreen here, just warn the user
          }
        }

        // Tab visibility monitoring
        const handleVisibilityChange = () => {
          if (document.hidden) {
            setSecurityViolations(prev => [...prev, 'Tab switching detected'])
          }
        }

        // Mouse tracking
        const handleMouseLeave = () => {
          setMouseOutCount(prev => {
            const newCount = prev + 1
            if (newCount > 3) {
              setSecurityViolations(prev => [...prev, 'Excessive mouse exits detected'])
            }
            return newCount
          })
        }

        // Keyboard shortcuts monitoring
        const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v')) {
            e.preventDefault()
            setSecurityViolations(prev => [...prev, `${e.key === 'c' ? 'Copy' : 'Paste'} attempt detected`])
          }
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        document.addEventListener('mouseleave', handleMouseLeave)
        document.addEventListener('keydown', handleKeyDown)
        
        return () => {
          document.removeEventListener('fullscreenchange', handleFullscreenChange)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          document.removeEventListener('mouseleave', handleMouseLeave)
          document.removeEventListener('keydown', handleKeyDown)
        }
      }

      setupSecurityMonitoring()
    }
  }, [hasStarted])

  // Navigation prevention useEffect
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      toast.error("Please complete or submit the exam before leaving")
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    window.history.pushState(null, '', window.location.href)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Question switching useEffect
  useEffect(() => {
    if (examData?.questions[currentQuestion]) {
      const questionId = examData.questions[currentQuestion].id
      const savedCode = questionAnswers[questionId] || ''
      setCode(savedCode)
    }
  }, [currentQuestion, examData, questionAnswers])

  // Plagiarism detection callback
  const checkForPlagiarism = useCallback((newCode: string) => {
    const suspiciousPatterns = [
      /copied from/i,
      /stackoverflow/i,
      /github\.com/i,
      /leetcode/i,
      /geeksforgeeks/i,
      // Add more patterns
    ]

    // Check for rapid paste events
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(newCode))
    
    // Check for sudden large code additions
    const previousLength = code.length
    const newLength = newCode.length
    const suddenLargeAddition = newLength - previousLength > 100

    if (hasSuspiciousPattern || suddenLargeAddition) {
      setShowPlagiarismWarning(true)
      setSecurityViolations(prev => [...prev, 'Potential plagiarism detected'])
    }
  }, [code])

  const handleCodeChange = (value: string | undefined) => {
    if (!value || !examData) return;
    const currentQuestionId = examData.questions[currentQuestion].id;
    setCode(value);
    setQuestionAnswers(prev => ({
      ...prev,
      [currentQuestionId]: value
    }));
    checkForPlagiarism(value);
  }

  // Update answer for non-coding questions
  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    if (examData?.questions[currentQuestion]) {
      setQuestionAnswers(prev => ({
        ...prev,
        [examData.questions[currentQuestion].id]: value
      }));
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (!examData || !session?.user) {
        throw new Error('Missing exam data or user session')
      }

      // Compile all answers into a JSON object
      const answers = examData.questions.map((question) => {
        return {
          questionId: question.id,
          type: question.type,
          answer: questionAnswers[question.id] || '',
          executionResults: question.type === 'CODING' ? testCaseResults : undefined
        }
      })

      // Create a JSON blob and trigger download
      const jsonData = JSON.stringify({
        examId: examData.id,
        studentId: session.user.email || 'unknown',
        submittedAt: new Date().toISOString(),
        answers: answers,
        securityReport: {
          totalViolations: securityViolations.length,
          violations: securityViolations.map((violation, index) => ({
            id: index + 1,
            description: violation,
            timestamp: new Date().toISOString()
          })),
          mouseExitCount: mouseOutCount,
          tabSwitchCount: securityViolations.filter(v => v.includes('Tab switching')).length,
          fullscreenExitCount: securityViolations.filter(v => v.includes('Fullscreen')).length,
          plagiarismWarnings: securityViolations.filter(v => v.includes('plagiarism')).length
        }
      }, null, 2)

      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `exam_${examData.id}_submission.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      router.push('/student/exams')
    } catch (error) {
      console.error('Submission failed:', error)
    }
    setIsSubmitting(false)
  }

  const renderQuestion = (question: ExamQuestion) => {
    switch (question.type) {
      case 'CODING':
        return (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <h2 className="text-xl font-bold text-gray-900">{question.questionText}</h2>
              {question.description && (
                <div className="mt-4">
                  <p className="text-gray-600 whitespace-pre-wrap">{question.description}</p>
                </div>
              )}
              
              {question.examples && question.examples.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Examples:</h3>
                  <div className="space-y-4">
                    {question.examples.map((example, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-mono text-sm">Input: {example.input}</p>
                        <p className="font-mono text-sm">Output: {example.output}</p>
                        {example.explanation && (
                          <p className="text-sm text-gray-600 mt-2">Explanation: {example.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {question.constraints && question.constraints.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Constraints:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {question.constraints.map((constraint, index) => (
                      <li key={index} className="text-sm text-gray-600">{constraint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )

      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">{question.questionText}</h2>
            <div className="space-y-4">
              {question.choices?.map((choice, index) => (
                <label key={index} className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="quiz-answer"
                    value={choice}
                    checked={questionAnswers[question.id] === choice}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-900">{choice}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'SHORT_ANSWER':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">{question.questionText}</h2>
            <p className="text-gray-600">{question.description}</p>
            <textarea
              value={questionAnswers[question.id] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your answer here..."
            />
          </div>
        )
    }
  }

  // If no examId, session, or examData, show loading
  if (!examId || !session || !examData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {!hasStarted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Start Exam</h2>
            <p className="mb-4">This exam requires full-screen mode. Click Start to begin.</p>
            <button
              onClick={() => {
                document.documentElement.requestFullscreen()
                  .then(() => {
                    setIsFullscreen(true)
                    setHasStarted(true)
                  })
                  .catch((err) => {
                    toast.error("Fullscreen request was denied. Please enable fullscreen to continue.")
                    console.error("Fullscreen error:", err)
                  })
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Start Exam
            </button>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-[#F3F4F6]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
          <div className="max-w-full px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">{examData.title}</h1>
                <div className="flex items-center space-x-4 ml-8">
                  <button
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                    title="Previous question"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600 font-medium">
                    Question {currentQuestion + 1} of {examData.questions.length}
                  </span>
                  <button
                    onClick={() => setCurrentQuestion(prev => Math.min(examData.questions.length - 1, prev + 1))}
                    disabled={currentQuestion === examData.questions.length - 1}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                    title="Next question"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-gray-900">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                </div>
                <button
                  onClick={() => setShowSecurityStatus(!showSecurityStatus)}
                  className={`flex items-center ${securityViolations.length > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  <Shield className="w-5 h-5 mr-2" />
                  <span>{securityViolations.length} violation(s)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Status Dropdown */}
        <AnimatePresence>
          {showSecurityStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-16 right-8 w-96 bg-white rounded-lg shadow-lg z-40 border border-gray-200"
            >
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Status</h3>
                <div className="space-y-2">
                  {securityViolations.map((violation, index) => (
                    <div key={index} className="flex items-center text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {violation}
                    </div>
                  ))}
                  {securityViolations.length === 0 && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      No security violations detected
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="pt-16 h-screen flex">
          {/* Question Panel */}
          <div className={`${examData.questions[currentQuestion].type === 'CODING' ? 'w-[40%]' : 'w-full'} h-full overflow-y-auto border-r border-gray-200 bg-white shadow-lg`}>
            <div className="p-6">
              {examData && renderQuestion(examData.questions[currentQuestion])}
              {examData.questions[currentQuestion].type !== 'CODING' && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Answer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Editor/Answer Panel */}
          {examData.questions[currentQuestion].type === 'CODING' && (
            <div className="w-[60%] h-full flex flex-col bg-[#1E1E1E]">
              <div className="flex-1">
                <Judge0Tester
                  initialCode={code}
                  onCodeChange={handleCodeChange}
                  onResult={(result) => {
                    // Update test case results when code is run
                    if (result) {
                      setTestCaseResults([{
                        passed: true,
                        input: result.input || 'N/A',
                        expected: 'N/A',
                        output: result.output || 'No output',
                        time: `${result.time || 0}s (${result.memory || 0} KB)`
                      }]);
                    }
                  }}
                />
              </div>
              
              {/* Submit Button */}
              <div className="p-4 bg-[#2D2D2D] border-t border-gray-700">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Plagiarism warning modal */}
        <AnimatePresence>
          {showPlagiarismWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Shield className="w-6 h-6 text-red-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Plagiarism Warning</h3>
                  </div>
                  <button
                    onClick={() => setShowPlagiarismWarning(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-4">
                  Potential plagiarism detected in your code. Please ensure your submission is your own work.
                  Academic integrity violations may result in disciplinary action.
                </p>
                <button
                  onClick={() => setShowPlagiarismWarning(false)}
                  className="w-full inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  I Understand
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}