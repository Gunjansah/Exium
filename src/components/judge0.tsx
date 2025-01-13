'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { X } from 'lucide-react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface SubmissionResult {
  status?: {
    id: number
    description: string
  }
  stdout?: string
  stderr?: string
  compile_output?: string
  time?: string
  memory?: number
}

interface Language {
  id: number
  name: string
}

const languages: Language[] = [
  { id: 71, name: 'Python (3.8.1)' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)' },
  { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
  { id: 54, name: 'C++ (GCC 9.2.0)' },
  { id: 50, name: 'C (GCC 9.2.0)' },
  { id: 51, name: 'C# (Mono 6.6.0.161)' },
  { id: 60, name: 'Go (1.13.5)' },
  { id: 72, name: 'Ruby (2.7.0)' },
  { id: 73, name: 'Rust (1.40.0)' },
  { id: 74, name: 'TypeScript (3.7.4)' },
  { id: 68, name: 'PHP (7.4.1)' },
  { id: 78, name: 'Kotlin (1.3.70)' },
  { id: 82, name: 'SQL (SQLite 3.27.2)' },
  { id: 83, name: 'Swift (5.2.3)' },
  { id: 85, name: 'R (4.0.0)' }
]

interface Judge0TesterProps {
  onCodeChange?: (code: string) => void;
  initialCode?: string;
}

export default function Judge0Tester({ onCodeChange, initialCode = 'print("Hello, World!")' }: Judge0TesterProps) {
  const [processing, setProcessing] = useState<boolean>(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [code, setCode] = useState<string>(initialCode)
  const [language, setLanguage] = useState<Language>(languages[0])
  const [showOutput, setShowOutput] = useState(true)

  useEffect(() => {
    setCode(initialCode);
    setResult(null);
    setShowOutput(true);
  }, [initialCode]);

  const checkStatus = async (token: string): Promise<void> => {
    try {
      const response = await fetch(`http://3.135.196.174:2358/submissions/${token}`)
      const result: SubmissionResult = await response.json()
      const statusId = result.status?.id

      console.log('\nExecution Details:')
      console.log('Status:', result.status?.description)
      console.log('Time:', result.time, 'seconds')
      console.log('Memory:', result.memory, 'KB')

      if (statusId === 1 || statusId === 2) {
        setTimeout(() => {
          checkStatus(token)
        }, 2000)
        return
      }

      setResult(result)
      setProcessing(false)

      if (result.stdout) {
        console.log('Output:', result.stdout)
      }
      if (result.stderr) {
        console.log('Error:', result.stderr)
      }
      if (result.compile_output) {
        console.log('Compilation output:', result.compile_output)
      }
    } catch (error) {
      console.error('Error checking status:', error)
      setProcessing(false)
    }
  }

  const handleSubmit = async () => {
    setProcessing(true)
    setResult(null)
    setShowOutput(true)

    try {
      console.log('Submitting code...')
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const submitResponse = await fetch('http://3.135.196.174:2358/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: language.id,
          stdin: '',
          cpu_time_limit: 5,
          cpu_extra_time: 1,
          wall_time_limit: 10,
          memory_limit: 128000,
          stack_limit: 64000,
          max_processes_and_or_threads: 60,
          enable_per_process_and_thread_time_limit: true,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!submitResponse.ok) {
        throw new Error('Failed to submit code');
      }

      const data = await submitResponse.json();
      await checkStatus(data.token);
    } catch (error) {
      console.error('Error submitting code:', error);
      setResult({
        status: {
          id: -1,
          description: '❌ Error: Unable to communicate with the server. Please try again later.'
        },
        stderr: 'Failed to fetch results from the server. Please check your network connection or try again later.'
      });
    }
  }

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-[#2D2D2D] text-white p-2 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <select
            value={language.name}
            onChange={(e) => setLanguage(languages.find(lang => lang.name === e.target.value) || languages[0])}
            className="bg-[#3D3D3D] text-white px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.name}>
                {lang.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSubmit}
            disabled={processing}
            className="px-4 py-2 bg-[#3D3D3D] hover:bg-[#4D4D4D] text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className={`${result && showOutput ? 'h-[70%]' : 'h-full'} transition-all duration-200`}>
          <MonacoEditor
            height="100%"
            language={language.name.toLowerCase().split(' ')[0]}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </div>

        {result && showOutput && (
          <div className="h-[30%] bg-[#2D2D2D] border-t border-gray-700 text-white flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between p-2 bg-[#252525] border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center text-sm">
                <span>Time: {result.time}s | Memory: {result.memory}KB</span>
              </div>
              <button
                onClick={() => setShowOutput(false)}
                className="p-1 hover:bg-[#3D3D3D] rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="p-4 space-y-2">
                {result.stdout ? (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Output:</p>
                    <pre className="bg-[#1E1E1E] p-3 rounded text-sm font-mono overflow-auto max-h-[200px]">{result.stdout}</pre>
                  </div>
                ) : result.stderr ? (
                  <div>
                    <p className="text-sm text-red-400 mb-1">Error:</p>
                    <pre className="bg-[#1E1E1E] p-3 rounded text-sm font-mono overflow-auto max-h-[200px] text-red-400">{result.stderr}</pre>
                  </div>
                ) : result.compile_output ? (
                  <div>
                    <p className="text-sm text-yellow-400 mb-1">Compilation Output:</p>
                    <pre className="bg-[#1E1E1E] p-3 rounded text-sm font-mono overflow-auto max-h-[200px] text-yellow-400">{result.compile_output}</pre>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">No output available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

