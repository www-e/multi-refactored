import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { logEvent } from '@/lib/serverLogger'

async function fetchWithRetry(url: string, init: RequestInit, retries = 2, timeoutMs = 8000): Promise<Response> {
  let lastErr: any
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(id)
      return res
    } catch (e) {
      clearTimeout(id)
      lastErr = e
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      throw lastErr
    }
  }
  throw lastErr
}

export async function POST(request: NextRequest) {
  try {
    const { agent_type, customer_id } = await request.json()
    await logEvent('voice:sessions:POST', 'info', 'Creating backend voice session', { agent_type, customer_id })

    // Create backend session only - ElevenLabs connection is now handled by the React SDK
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    
    const backendResponse = await fetchWithRetry(`${BACKEND_URL}/voice/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_type: agent_type,
        customer_id: customer_id || `customer_${Date.now()}`,
      }),
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      await logEvent('voice:sessions:POST', 'error', 'Backend session creation failed', {
        status: backendResponse.status,
        error: errorText
      })
      return NextResponse.json(
        { error: `Backend session creation failed: ${errorText}` },
        { status: backendResponse.status }
      )
    }

    const backendSession = await backendResponse.json()
    await logEvent('voice:sessions:POST', 'info', 'Backend session created successfully', {
      session_id: backendSession.session_id
    })

    return NextResponse.json(backendSession)

  } catch (error: any) {
    await logEvent('voice:sessions:POST', 'error', 'Voice session creation failed', {
      error: error.message,
      stack: error.stack
    })
    
    return NextResponse.json(
      { error: `Voice session creation failed: ${error.message}` },
      { status: 500 }
    )
  }
}
