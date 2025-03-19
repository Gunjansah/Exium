import { NextResponse } from 'next/server'

const JUDGE0_API = 'http://20.151.69.55:2358'

// Add type annotations and make the functions named exports
export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const body = await request.json()
    
    const response = await fetch(`${JUDGE0_API}/submissions?base64_encoded=true&wait=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_code: btoa(body.source_code),
        language_id: body.language_id,
        stdin: body.stdin ? btoa(body.stdin) : '',
        expected_output: body.expected_output ? btoa(body.expected_output) : '',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Judge0 submission error:', error)
    return NextResponse.json({ 
      error: 'Code execution service temporarily unavailable',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}

export const GET = async (request: Request): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const response = await fetch(`${JUDGE0_API}/submissions/${token}?base64_encoded=true`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // Only decode if the data exists and is base64 encoded
    try {
      if (data.stdout) data.stdout = atob(data.stdout)
      if (data.stderr) data.stderr = atob(data.stderr)
      if (data.compile_output) data.compile_output = atob(data.compile_output)
      if (data.message) data.message = atob(data.message)
    } catch (e) {
      console.warn('Failed to decode base64 output:', e)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Judge0 status check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check submission status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
} 