// src/app/api/voice/sessions/route.ts
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

// Helper to safely log without throwing
async function safeLog(source: string, level: 'info'|'warn'|'error', message: string, meta?: any) {
    try {
        await logEvent(source, level, message, meta);
    } catch (e) {
        console.error(`[SafeLog Fail] ${message}`, e);
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);
    const { agent_type, customer_id } = await request.json();

    await safeLog('voice:sessions:POST', 'info', 'Creating backend voice session', { agent_type, customer_id });

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error('CRITICAL: BACKEND_URL environment variable is not set.');
      await safeLog('voice:sessions:POST', 'error', 'Server configuration error: BACKEND_URL is not set.');
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
      await safeLog('voice:sessions:POST', 'error', 'Backend session creation failed', { status: backendResponse.status, error: errorText });
      return NextResponse.json({ error: `Backend session creation failed: ${errorText}` }, { status: backendResponse.status });
    }

    const backendSession = await backendResponse.json();
    await safeLog('voice:sessions:POST', 'info', 'Backend session created successfully', { session_id: backendSession.session_id });
    
    return NextResponse.json(backendSession);

  } catch (error: any) {
    console.error('Voice session creation error:', error);
    await safeLog('voice:sessions:POST', 'error', 'Voice session creation failed', { error: error.message });
    return NextResponse.json({ error: `Voice session creation failed: ${error.message}` }, { status: 500 });
  }
}