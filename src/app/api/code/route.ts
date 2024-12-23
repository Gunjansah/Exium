import { NextResponse } from 'next/server';

const JUDGE0_API_URL = 'http://localhost:2358';

export async function POST(req: Request) {
  try {
    const { source_code, language_id, stdin = '' } = await req.json();

    // Initial submission
    const submitResponse = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_code,
        language_id,
        stdin
      }),
    });

    if (!submitResponse.ok) {
      throw new Error(`Submission failed: ${submitResponse.statusText}`);
    }

    const submitData = await submitResponse.json();
    return NextResponse.json(submitData);

  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
} 