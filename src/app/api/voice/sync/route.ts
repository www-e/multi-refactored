import { NextRequest, NextResponse } from 'next/server';
import { handleSessionBasedApi } from '@/lib/apiHandler';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Read body ONCE
  const body = await request.json();
  const { conversation_id } = body;

  if (!conversation_id) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  // 2. Pass the data explicitly to the backend, NOT the request object
  // We use handleSessionBasedApi directly to bypass the double-read in handleSessionPostApi
  return handleSessionBasedApi(
    request,
    `/elevenlabs/conversation/${conversation_id}/process`,
    'POST',
    { manual_sync: true } // Pass the body directly here
  );
}