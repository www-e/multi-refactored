import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { logEvent, getLogFilePath } from '@/lib/serverLogger';
import { promises as fs } from 'fs';

// TODO: This entire route should be protected by authentication and aggressive rate-limiting.

export async function POST(request: NextRequest) {
  // CRITICAL SECURITY MITIGATION: Disable this vulnerable endpoint in production.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Client-side logging is disabled in this environment.' },
      { status: 403 } // 403 Forbidden
    );
  }

  // Functionality remains for local development ONLY.
  try {
    const { source = 'client', level = 'info', message = '', meta } = await request.json();
    await logEvent(String(source), level, String(message), meta);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API LOG ROUTE ERROR]', error);
    return NextResponse.json({ error: 'Failed to write log' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // TODO: This should be protected and only accessible to administrators.
  if (process.env.NODE_ENV === 'production') {
     return NextResponse.json({ error: 'Access forbidden.' }, { status: 403 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const tail = Math.max(1, Math.min(500, Number(searchParams.get('tail') || 200)));
    const filePath = getLogFilePath();
    const content = await fs.readFile(filePath, 'utf8').catch(() => '');
    const lines = content.split('\n').filter(Boolean);
    const last = lines.slice(-tail);
    return new NextResponse(last.join('\n'), {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error) {
    console.error('[API LOG ROUTE ERROR]', error);
    return NextResponse.json({ error: 'Failed to read log' }, { status: 500 });
  }
}