import { NextRequest, NextResponse } from 'next/server';
import { handleSessionPostApi } from '@/lib/apiHandler';

// POST /api/chat/customer (create customer conversation/message)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the authorization header from the incoming request
    // This will be set by the calling client component with NextAuth session token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customer_id, message, channel = 'chat' } = await request.json();

    // Validate required fields
    if (!customer_id || !message) {
      return NextResponse.json({ 
        error: 'customer_id and message are required' 
      }, { status: 400 });
    }

    // We'll use the existing chat API but with customer context
    // For a real implementation, this might create a conversation record in the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // First, create a conversation if it doesn't exist
    const convResponse = await fetch(`${backendUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Pass through the auth header
      },
      body: JSON.stringify({
        customer_id,
        channel,  // 'chat', 'voice', etc.
        summary: `Customer chat: ${message.substring(0, 50)}...`
      }),
    });

    if (!convResponse.ok) {
      // If conversation creation failed, we'll still try to process the message
      console.warn('Failed to create conversation:', await convResponse.text());
    }

    // Then process the message via the existing chat API
    const chatResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Pass through the auth header
      },
      body: JSON.stringify({
        message,
        agentType: 'support',  // Default to support
        conversationHistory: []  // Could include conversation history
      }),
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(errorData, { status: chatResponse.status });
    }

    const data = await chatResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Customer chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}