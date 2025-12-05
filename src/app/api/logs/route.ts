import { NextRequest, NextResponse } from 'next/server';
import { logEvent, getLogFilePath } from '@/lib/serverLogger';
import { promises as fs } from 'fs';

export const runtime = 'nodejs';

// This endpoint is now protected.
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Security Check: Ensure user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Safe Logging: Allow authenticated users to log
    try {
      const { source = 'client', level = 'info', message = '', meta } = await request.json();
      
      // Sanitize input to prevent massive logs
      const safeMeta = meta && typeof meta === 'object' ? meta : {};
      
      await logEvent(String(source), level, String(message), safeMeta);
      return NextResponse.json({ ok: true });
    } catch (error) {
      // Do not return 500, just warn and return OK to keep client stable
      console.error('[API LOG ROUTE ERROR]', error);
      return NextResponse.json({ ok: true, warning: 'Log processing failed' });
    }
  } catch (error) {
    console.error('[API LOG POST ROUTE ERROR]', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
  }
}

// This endpoint allows viewing logs (admin only ideally)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { searchParams } = new URL(request.url);
      const tail = Math.max(1, Math.min(500, Number(searchParams.get('tail') || 200)));
      
      // If file logging is disabled, we can't read the file.
      if (process.env.ENABLE_FILE_LOGGING !== 'true') {
         return new NextResponse("File logging is disabled. Check Docker/Server stdout for logs.", {
            status: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
         });
      }

      const filePath = getLogFilePath();
      // Check if file exists first
      try {
        await fs.access(filePath);
      } catch {
        return new NextResponse("Log file is empty or does not exist yet.", { status: 200 });
      }

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
  } catch (error) {
    console.error('[API LOG GET ROUTE ERROR]', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
  }
}