// src/app/api/voice/sessions/route.ts
import { auth0 } from '@/lib/auth0';
import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/serverLogger';

async function fetchWithRetry(url: string, init: RequestInit, retries = 2, timeoutMs = 8000): Promise<Response> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (e) {
      clearTimeout(id);
      lastErr = e;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

export const POST = auth0.withApiAuthRequired(async function createSession(request: NextRequest) {
  const session = await auth0.getSession();
  const accessToken = session?.accessToken;
  
  try {
    const { agent_type, customer_id } = await request.json();
    await logEvent('voice:sessions:POST', 'info', 'Creating backend voice session', { agent_type, customer_id });

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error('CRITICAL: BACKEND_URL environment variable is not set.');
      await logEvent('voice:sessions:POST', 'error', 'Server configuration error: BACKEND_URL is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const backendResponse = await fetchWithRetry(`${backendUrl}/voice/sessions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        agent_type: agent_type,
        customer_id: customer_id || `customer_${Date.now()}`,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      await logEvent('voice:sessions:POST', 'error', 'Backend session creation failed', { status: backendResponse.status, error: errorText });
      return NextResponse.json({ error: `Backend session creation failed: ${errorText}` }, { status: backendResponse.status });
    }

    const backendSession = await backendResponse.json();
    await logEvent('voice:sessions:POST', 'info', 'Backend session created successfully', { session_id: backendSession.session_id });
    return NextResponse.json(backendSession);
  } catch (error: any) {
    await logEvent('voice:sessions:POST', 'error', 'Voice session creation failed', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: `Voice session creation failed: ${error.message}` }, { status: 500 });
  }
});