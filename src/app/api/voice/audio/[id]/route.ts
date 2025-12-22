import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // 1. Security: Ensure user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversationId = params.id;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  if (!apiKey) {
    console.error('Missing ELEVENLABS_API_KEY in environment variables');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // 2. Fetch from ElevenLabs (Server-to-Server)
  // We use the ID passed in the URL to fetch the specific audio
  const audioUrl = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`;

  try {
    const response = await fetch(audioUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      // 422/404 means audio is processing or doesn't exist yet
      if (response.status === 404 || response.status === 422) {
        console.warn(`Audio not found for ${conversationId} (Status: ${response.status})`);
        return NextResponse.json({ error: 'Audio recording not found or not ready yet' }, { status: 404 });
      }
      const errorText = await response.text();
      console.error(`ElevenLabs Audio API Error: ${response.status} - ${errorText}`);
      return NextResponse.json({ error: `ElevenLabs API error: ${response.statusText}` }, { status: response.status });
    }

    // 3. Stream the audio back to the client
    const audioBlob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Content-Length', audioBlob.size.toString());
    // Cache for 1 hour to reduce API hits since recordings don't change
    headers.set('Cache-Control', 'private, max-age=3600'); 

    return new NextResponse(audioBlob, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error('Error proxying audio:', error);
    return NextResponse.json({ error: 'Internal server error processing audio' }, { status: 500 });
  }
}
