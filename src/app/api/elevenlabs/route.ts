import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';
import { logEvent } from '@/lib/serverLogger';

export const runtime = 'nodejs';

// SECURE THE POST ENDPOINT
export const POST = auth0.withApiAuthRequired(async function elevenlabsPost(request: NextRequest) {
  try {
    const { action, agentType, sessionId } = await request.json();
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const SUPPORT_AGENT_ID = process.env.ELEVENLABS_SUPPORT_AGENT_ID;
    const SALES_AGENT_ID = process.env.ELEVENLABS_SALES_AGENT_ID;

    if (!ELEVENLABS_API_KEY) {
      await logEvent('elevenlabs:POST', 'error', 'Missing ELEVENLABS_API_KEY');
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }
    const agentId = agentType === 'support' ? SUPPORT_AGENT_ID : SALES_AGENT_ID;
    if (!agentId) {
      await logEvent('elevenlabs:POST', 'error', 'Missing agentId', { agentType });
      return NextResponse.json({ error: `Agent ID not configured for ${agentType}` }, { status: 500 });
    }

    switch (action) {
      case 'start_conversation':
        try {
          await logEvent('elevenlabs:start', 'info', 'Starting conversation', { agentId, sessionId });
          const res = await startConversation(agentId, ELEVENLABS_API_KEY, sessionId);
          await logEvent('elevenlabs:start', 'info', 'Conversation started ok');
          return res;
        } catch (e: any) {
          const message = e?.message || 'Unknown error';
          console.error('start_conversation failed:', message);
          await logEvent('elevenlabs:start', 'error', 'Failed to start conversation', { error: message });
          return NextResponse.json({ error: message }, { status: 500 });
        }
      case 'end_conversation':
        if (!sessionId) {
          await logEvent('elevenlabs:end', 'error', 'Missing conversationId for end');
          return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
        }
        try {
          await logEvent('elevenlabs:end', 'info', 'Ending conversation', { conversationId: sessionId });
          const res = await endConversation(sessionId, ELEVENLABS_API_KEY);
          await logEvent('elevenlabs:end', 'info', 'Conversation ended ok');
          return res;
        } catch (e: any) {
          const message = e?.message || 'Unknown error';
          console.error('end_conversation failed:', message);
          await logEvent('elevenlabs:end', 'error', 'Failed to end conversation', { error: message });
          return NextResponse.json({ error: message }, { status: 500 });
        }
      default:
        await logEvent('elevenlabs:POST', 'warn', 'Invalid action', { action });
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    await logEvent('elevenlabs:POST', 'error', 'Unhandled error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// SECURE THE GET ENDPOINT
export const GET = auth0.withApiAuthRequired(async function elevenlabsGet(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversation_id');
  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
  }
  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    });
    if (!response.ok) {
      const error = await response.text();
      await logEvent('elevenlabs:http', 'error', 'Get conversation failed', { conversationId, error });
      throw new Error(`ElevenLabs API error: ${error}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    await logEvent('elevenlabs:GET', 'error', 'Unhandled error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});


// Helper functions (no changes needed, but included for completeness)
async function startConversation(agentId: string, apiKey: string, sessionId?: string) {
  const requireAuth = process.env.ELEVENLABS_REQUIRE_AUTH === 'true'
  const payloads: any[] = [
    { agent_id: agentId, session_id: sessionId, require_auth: requireAuth },
    { agent_id: agentId }
  ]
  const urls = [
    'https://api.elevenlabs.io/v1/convai/conversations',
    'https://api.elevenlabs.io/v1/convai/conversation'
  ]
  let lastError: string = ''
  for (const url of urls) {
    for (const body of payloads) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        await logEvent('elevenlabs:http', 'info', 'Start conversation OK', { url, body })
        return NextResponse.json(data)
      }
      const text = await res.text()
      lastError = `POST ${url} -> ${res.status}: ${text}`
      await logEvent('elevenlabs:http', 'warn', 'Start conversation failed variant', { url, status: res.status, body, text })
      // If 405/404, try the next variant
      if (res.status !== 405 && res.status !== 404) break
    }
  }
  throw new Error(`ElevenLabs API error: ${lastError || 'Unknown error'}`)
}

async function endConversation(conversationId: string, apiKey: string) {
  const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      'xi-api-key': apiKey,
    },
  })
  if (!response.ok) {
    const error = await response.text()
    await logEvent('elevenlabs:http', 'error', 'End conversation failed', { conversationId, error })
    throw new Error(`ElevenLabs API error: ${error}`)
  }
  return NextResponse.json({ success: true })
}