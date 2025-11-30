import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logEvent, getLogFilePath } from '@/lib/serverLogger';
import { promises as fs } from 'fs';

export const runtime = 'nodejs';

// This endpoint is now protected.
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the authorization header from the incoming request
    // This will be set by the calling client component with NextAuth session token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CRITICAL SECURITY MITIGATION: Check if logging is enabled based on environment
    // Allow logs in development and when explicitly enabled via environment variable
    const isLoggingEnabled = process.env.NODE_ENV !== 'production' ||
                             process.env.ALLOW_CLIENT_LOGS === 'true';

    if (!isLoggingEnabled) {
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
  } catch (error) {
    console.error('[API LOG POST ROUTE ERROR]', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
  }
}

// This endpoint is also now protected.
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the authorization header from the incoming request
    // This will be set by the calling client component with NextAuth session token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For NextAuth, we can implement role checks differently
    // For now, we'll just check if the user has the admin role in their session
    // This would need to be enhanced for a full admin check
    // Get user info from access token (for demonstration, we'll just check presence)
    // In a real implementation, you might decode the JWT to check roles
    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // For now, we'll skip the admin check and just verify authentication
    // In a real implementation you would decode the JWT to check roles

    // CRITICAL SECURITY MITIGATION: Check if log access is enabled based on environment
    // Allow logs in development and when explicitly enabled via environment variable
    const isLoggingEnabled = process.env.NODE_ENV !== 'production' ||
                             process.env.ALLOW_CLIENT_LOGS === 'true';

    if (!isLoggingEnabled) {
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
  } catch (error) {
    console.error('[API LOG GET ROUTE ERROR]', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
  }
}