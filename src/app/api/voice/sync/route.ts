import { NextRequest, NextResponse } from 'next/server';
import { handleSessionPostApi } from '@/lib/apiHandler';

// POST /api/voice/sync
// Triggers the backend to manually fetch conversation data from ElevenLabs
// and run the processing logic (creating tickets/bookings/updating customer)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { conversation_id } = body;

  if (!conversation_id) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  // We are calling the backend endpoint: POST /elevenlabs/conversation/{id}/process
  // We use the existing API handler to manage authentication automatically
  return handleSessionPostApi(
    request,
    `/elevenlabs/conversation/${conversation_id}/process`,
    {
        // Pass the body explicitly if needed, but the backend endpoint only needs the ID in the URL
        // So we transform the request to have an empty body or specific flags if required by backend
        transformRequest: () => ({ manual_sync: true }) 
    }
  );
}