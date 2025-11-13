import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';
import { logEvent, getLogFilePath } from '@/lib/serverLogger';
import { promises as fs } from 'fs';

export const runtime = 'nodejs';

// This endpoint is now protected.
export const POST = auth0.withApiAuthRequired(async function postLog(request: NextRequest) {
  // CRITICAL SECURITY MITIGATION: This check is still valuable as a second layer of defense.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Client-side logging is disabled in this environment.' },
      { status: 403 }
    );
  }
  try {
    const { source = 'client', level = 'info', message = '', meta } = await request.json();
    await logEvent(String(source), level, String(message), meta);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API LOG ROUTE ERROR]', error);
    return NextResponse.json({ error: 'Failed to write log' }, { status: 500 });
  }
});

// This endpoint is also now protected.
export const GET = auth0.withApiAuthRequired(async function getLogs(request: NextRequest) {
  // TODO: Add role-based check here to ensure only Admins can view logs.
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
});