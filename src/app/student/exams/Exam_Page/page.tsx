'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Editor, { Monaco } from '@monaco-editor/react'
import { editor as MonacoEditor } from 'monaco-editor'
import { Shield, Play, Send, Clock, AlertTriangle, X, ChevronLeft, ChevronRight, Eye, Lock, Layout, Settings, RefreshCw, Terminal, Code2, Split, Maximize, Download, HelpCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Judge0Tester from '@/components/judge0'

// Types for exam data
interface ExamQuestion {
  id: string
  questionText: string
  type: 'CODING' | 'QUIZ' | 'SHORT_ANSWER'
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
  duration: string
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
const JUDGE0_API_URL = 'http://3.143.205.186:2358';

export default function ExamInterface() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('id')
  const { data: session } = useSession()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [code, setCode] = useState('')
  const [answer, setAnswer] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(7200)
  const [securityViolations, setSecurityViolations] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPlagiarismWarning, setShowPlagiarismWarning] = useState(false)
  const [executionResult, setExecutionResult] = useState<string | null>(null)
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
  const [processing, setProcessing] = useState(false);

  // Load exam data
  useEffect(() => {
    const loadExamData = async () => {
      if (!examId) {
        router.push('/student/exams')
        return
      }

      try {
        // This is a placeholder - replace with actual API call
        const data: ExamData = {
          id: examId,
          title: 'Advanced Algorithms',
          duration: '2 hours',
          questions: [
            {
              id: '1',
              type: 'CODING',
              questionText: 'Longest Common Subsequence',
              description: 'Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.',
              examples: [
                {
                  input: 'text1 = "abcde", text2 = "ace"',
                  output: '3',
                  explanation: 'The longest common subsequence is "ace" and its length is 3.'
                },
                {
                  input: 'text1 = "abc", text2 = "def"',
                  output: '0',
                  explanation: 'There is no common subsequence between the two strings.'
                }
              ],
              constraints: [
                '1 <= text1.length, text2.length <= 1000',
                'text1 and text2 consist of only lowercase English characters.'
              ],
              testCases: [
                { input: ['ABCDGH', 'AEDFHR'], expected: 'ADH' },
                { input: ['AGGTAB', 'GXTXAYB'], expected: 'GTAB' }
              ]
            },
            {
              id: '2',
              type: 'QUIZ',
              questionText: 'Which time complexity represents the worst-case scenario for QuickSort?',
              choices: [
                'O(n log n)',
                'O(n²)',
                'O(n)',
                'O(log n)'
              ],
              correctAnswer: 'O(n²)'
            },
            {
              id: '3',
              type: 'SHORT_ANSWER',
              questionText: 'Explain the difference between process and thread in operating systems.',
              description: 'Provide a concise explanation highlighting the key differences between processes and threads in terms of resource usage and communication.'
            }
          ]
        }
        setExamData(data)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load exam:', error)
        router.push('/student/exams')
      }
    }

    loadExamData()
  }, [examId, router])

  // Enhanced security monitoring setup
  useEffect(() => {
    const setupSecurityMonitoring = () => {
      // Full-screen enforcement
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          setSecurityViolations(prev => [...prev, 'Fullscreen mode exited'])
          document.documentElement.requestFullscreen().catch(() => {
            setSecurityViolations(prev => [...prev, 'Failed to enter fullscreen'])
          })
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
          const newCount = prev + 0
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
      
      // Request fullscreen
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        document.removeEventListener('mouseleave', handleMouseLeave)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }

    setupSecurityMonitoring()
  }, [])

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 300 && prev % 60 === 0) { // Warning at 5 minutes and every minute after
          new Notification('Time Warning', {
            body: `${prev / 60} minutes remaining!`,
            icon: '/timer-icon.png'
          })
        }
        if (prev <= 0) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Advanced plagiarism detection
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
    if (!value) return
    setCode(value)
    checkForPlagiarism(value)
  }

  const supportedLanguages = [
    { id: 'javascript', name: 'JavaScript', extension: '.js' },
    { id: 'python', name: 'Python', extension: '.py' },
    { id: 'java', name: 'Java', extension: '.java' },
    { id: 'cpp', name: 'C++', extension: '.cpp' },
    { id: 'csharp', name: 'C#', extension: '.cs' },
    { id: 'ruby', name: 'Ruby', extension: '.rb' },
    { id: 'go', name: 'Go', extension: '.go' },
    { id: 'rust', name: 'Rust', extension: '.rs' },
  ]

  // Then update the runCode function to use the correct language ID
  const runCode = async () => {
    try {
      setExecutionResult('Running code...');
      setProcessing(true);
      
      const languageId = languageIdMap[selectedLanguage] || 63;

      // Initial submission
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: ''
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Start polling with the token
      await checkStatus(data.token);

    } catch (err) {
      const error = err as Error;
      console.error('Error executing code:', error);
      setExecutionResult(`❌ Error: ${error.message}`);
      setTestCaseResults([]);
      setProcessing(false);
    }
  };

  const checkStatus = async (token: string) => {
    try {
      const response = await fetch(`${JUDGE0_API_URL}/submissions/${token}`);
      const data = await response.json();
      const statusId = data.status?.id;

      // If still processing, poll again
      if (statusId === 1 || statusId === 2) {
        setTimeout(() => {
          checkStatus(token);
        }, 2000);
        return;
      }

      // Process the results
      let output = '';
      if (data.stdout) {
        output = atob(data.stdout);
      } else if (data.stderr) {
        output = atob(data.stderr);
      } else if (data.compile_output) {
        output = atob(data.compile_output);
      }

      // Just show the output without test case comparison
      const results = [{
        passed: true, // Not relevant for simple code execution
        input: 'N/A',
        expected: 'N/A',
        output: output || 'No output',
        time: `${data.time || 0} seconds (${data.memory || 0} KB)`
      }];
      
      setTestCaseResults(results);
      setExecutionResult(data.status.description);
      setProcessing(false);

    } catch (err) {
      const error = err as Error;
      console.error('Error checking status:', error);
      setExecutionResult('❌ Error checking status');
      setTestCaseResults([]);
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Implement submission logic here
      await new Promise(resolve => setTimeout(resolve, 2000))
      router.push('/student/exams')
    } catch (error) {
      console.error('Submission failed:', error)
    }
    setIsSubmitting(false)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const renderQuestion = (question: ExamQuestion) => {
    switch (question.type) {
      case 'CODING':
        return (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <h2 className="text-xl font-bold text-gray-900">{question.questionText}</h2>
              <p className="text-gray-600">{question.description}</p>
              
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

              {question.constraints && (
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

      case 'QUIZ':
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
                    checked={answer === choice}
                    onChange={(e) => setAnswer(e.target.value)}
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
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your answer here..."
            />
          </div>
        )
    }
  }

  // Editor configuration
  const handleEditorWillMount = (monaco: Monaco) => {
    // Register themes
    monaco.editor.defineTheme('custom-dark', monacoTheme.dark)
    monaco.editor.defineTheme('custom-light', monacoTheme.light)

    // Configure JavaScript language features
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
    })

    // Register snippets
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        return {
          suggestions: Object.entries(javaScriptSnippets).map(([name, snippet]) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: snippet.description,
            insertText: snippet.body,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          }))
        }
      }
    })
  }

  const handleEditorDidMount = (editor: MonacoEditor.IStandaloneCodeEditor, monaco: Monaco) => {
    editor.focus()

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      runCode()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleSubmit()
    })

    // Add format command
    editor.addAction({
      id: 'format-code',
      label: 'Format Code',
      keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: (ed) => {
        ed.getAction('editor.action.formatDocument')?.run()
      }
    })

    // Add custom actions
    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: () => runCode()
    })

    // Add more custom actions
    editor.addAction({
      id: 'toggle-output',
      label: 'Toggle Output Panel',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO],
      run: () => setShowOutput(prev => !prev)
    })

    editor.addAction({
      id: 'maximize-output',
      label: 'Maximize Output Panel',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyO],
      run: () => setIsOutputMaximized(prev => !prev)
    })

    // Add code folding commands
    editor.addAction({
      id: 'fold-all',
      label: 'Fold All',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.BracketLeft],
      run: (ed) => ed.getAction('editor.foldAll')?.run()
    })

    editor.addAction({
      id: 'unfold-all',
      label: 'Unfold All',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.BracketRight],
      run: (ed) => ed.getAction('editor.unfoldAll')?.run()
    })

    // Add comment toggling
    editor.addAction({
      id: 'toggle-line-comment',
      label: 'Toggle Line Comment',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash],
      run: (ed) => ed.getAction('editor.action.commentLine')?.run()
    })

    editor.addAction({
      id: 'toggle-block-comment',
      label: 'Toggle Block Comment',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash],
      run: (ed) => ed.getAction('editor.action.blockComment')?.run()
    })

    // Add selection actions
    editor.addAction({
      id: 'select-all-occurrences',
      label: 'Select All Occurrences',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL],
      run: (ed) => ed.getAction('editor.action.selectHighlights')?.run()
    })

    // Add navigation actions
    editor.addAction({
      id: 'go-to-definition',
      label: 'Go to Definition',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF12],
      run: (ed) => ed.getAction('editor.action.revealDefinition')?.run()
    })

    // Add quick fix actions
    editor.addAction({
      id: 'quick-fix',
      label: 'Quick Fix',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period],
      run: (ed) => ed.getAction('editor.action.quickFix')?.run()
    })

    // Add rename symbol action
    editor.addAction({
      id: 'rename-symbol',
      label: 'Rename Symbol',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F2],
      run: (ed) => ed.getAction('editor.action.rename')?.run()
    })

    // Configure editor decorations
    const errorDecoration = editor.createDecorationsCollection([])
    const warningDecoration = editor.createDecorationsCollection([])

    // Update decorations on content change
    const updateDecorations = () => {
      const model = editor.getModel()
      if (!model) return

      const markers = monaco.editor.getModelMarkers({ resource: model.uri })
      
      const errorDecorations = markers
        .filter(marker => marker.severity === monaco.MarkerSeverity.Error)
        .map(marker => ({
          range: marker.range,
          options: {
            isWholeLine: true,
            className: 'error-line',
            glyphMarginClassName: 'error-glyph',
            overviewRulerColor: 'red',
            minimap: { color: 'red', position: 2 }
          }
        }))

      const warningDecorations = markers
        .filter(marker => marker.severity === monaco.MarkerSeverity.Warning)
        .map(marker => ({
          range: marker.range,
          options: {
            isWholeLine: true,
            className: 'warning-line',
            glyphMarginClassName: 'warning-glyph',
            overviewRulerColor: 'yellow',
            minimap: { color: 'yellow', position: 2 }
          }
        }))

      errorDecoration.set(errorDecorations)
      warningDecoration.set(warningDecorations)
    }

    editor.onDidChangeModelContent(updateDecorations)
    updateDecorations()

    // Add CSS for decorations
    const style = document.createElement('style')
    style.textContent = `
      .error-line { background-color: rgba(255, 0, 0, 0.1); }
      .error-glyph { background-color: red; width: 5px !important; margin-left: 3px; }
      .warning-line { background-color: rgba(255, 255, 0, 0.1); }
      .warning-glyph { background-color: yellow; width: 5px !important; margin-left: 3px; }
    `
    document.head.appendChild(style)
  }

  const editorOptions: MonacoEditor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    fontSize: fontSize,
    lineNumbers: 'on',
    readOnly: isSubmitting,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    suggestOnTriggerCharacters: true,
    padding: { top: 10 },
    folding: true,
    foldingStrategy: 'indentation',
    lineHeight: 21,
    glyphMargin: true,
    bracketPairColorization: { enabled: true },
    renderLineHighlight: 'all',
    matchBrackets: 'always',
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
    renderWhitespace: 'selection',
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    mouseWheelZoom: true,
    parameterHints: { enabled: true },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true
    },
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on',
    accessibilitySupport: 'on',
    autoSurround: 'languageDefined',
    colorDecorators: true,
    contextmenu: true,
    copyWithSyntaxHighlighting: true,
    definitionLinkOpensInPeek: true,
    dragAndDrop: true,
    links: true,
    guides: {
      indentation: true,
      bracketPairs: true,
    },
    hover: {
      enabled: true,
      delay: 300,
      sticky: true
    },
    inlineSuggest: {
      enabled: true,
    },
    occurrencesHighlight: 'singleFile',
    renderFinalNewline: 'on',
    roundedSelection: true,
    selectionHighlight: true,
    showFoldingControls: 'always',
    // Additional editor features
    snippetSuggestions: 'inline',
    suggest: {
      preview: true,
      showMethods: true,
      showFunctions: true,
      showConstructors: true,
      showDeprecated: false,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showStructs: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showKeywords: true,
      showWords: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showIssues: true,
      showUsers: true,
    },
    codeLens: true,
    lightbulb: {
      enabled: true as any
    },
    // Better error handling
    gotoLocation: {
      multiple: 'goto'
    },
    // Better find references
    peekWidgetDefaultFocus: 'tree',
    // Better symbol search
    smartSelect: {
      selectLeadingAndTrailingWhitespace: true
    },
    // Additional features for better coding experience
    bracketPairGuides: {
      enabled: true,
      highlightActiveScope: true,
    },
    stickyScroll: {
      enabled: true,
      maxLineCount: 5,
      scrollWithEditor: true,
    },
    unicodeHighlight: {
      ambiguousCharacters: true,
      invisibleCharacters: true,
      nonBasicASCII: true,
    },
    wordBasedSuggestions: 'matchingDocuments',
    tokenColorCustomizations: {
      comments: '#6A9955',
      strings: '#CE9178',
      numbers: '#B5CEA8',
      keywords: '#569CD6',
      types: '#4EC9B0',
      functions: '#DCDCAA',
      variables: '#9CDCFE',
    },
  }

  // Add checks for required data
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

  // If no examId or session, show loading
  if (!examId || !session) {
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
            {/* Editor */}
            <div className="flex-1 relative">
              <Judge0Tester />
            </div>

            {/* Submit Button */}
            <div className="p-4 bg-[#2D2D2D] border-t border-gray-700">
              <div className="flex justify-center">
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
  )
} 