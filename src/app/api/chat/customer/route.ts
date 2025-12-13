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

    const { customer_id, message, channel = 'chat', agentType = 'support' } = await request.json();

    // Validate required fields
    if (!customer_id || !message) {
      return NextResponse.json({
        error: 'customer_id and message are required'
      }, { status: 400 });
    }

    // Backend URL for direct API calls
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // First, check if there's an existing conversation for this customer
    let conversationId: string | null = null;
    let conversationResponse;

    try {
      // Try to get existing conversations for the customer
      conversationResponse = await fetch(`${backendUrl}/conversations?customer_id=${customer_id}&channel=${channel}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      });

      if (conversationResponse.ok) {
        const conversations = await conversationResponse.json();
        if (conversations.length > 0) {
          // Use the most recent conversation
          conversationId = conversations[0].id;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch existing conversations:', error);
    }

    // If no existing conversation found, create a new one
    if (!conversationId) {
      const convCreateResponse = await fetch(`${backendUrl}/conversations`, {
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

      if (!convCreateResponse.ok) {
        console.error('Failed to create conversation:', await convCreateResponse.text());
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }

      const convData = await convCreateResponse.json();
      conversationId = convData.id;
    }

    // Store the user's message in the database
    const messageResponse = await fetch(`${backendUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Pass through the auth header
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        role: 'user',
        text: message
      }),
    });

    if (!messageResponse.ok) {
      console.error('Failed to store user message:', await messageResponse.text());
      // Continue anyway, as we still want to get the AI response
    }

    // Get AI response from the existing chat API which should connect to ElevenLabs
    const chatResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Pass through the auth header
      },
      body: JSON.stringify({
        message,
        agentType,  // support or sales
        conversationHistory: []  // Could include conversation history
      }),
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Chat API error:', errorData);

      // Fallback to a simple response if the chat API fails
      const fallbackResponse = 'أَبْشِرْ، حياك الله. نأسف لعدم قدرتنا على الإجابة الآن. يمكننا مساعدتك في مشاريع سقيفة العقارية، هل ترغب في معرفة مزيد من التفاصيل؟';

      // Store the fallback AI's response in the database
      if (fallbackResponse) {
        const aiMessageResponse = await fetch(`${backendUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader, // Pass through the auth header
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            role: 'assistant',
            text: fallbackResponse
          }),
        });

        if (!aiMessageResponse.ok) {
          console.error('Failed to store AI message:', await aiMessageResponse.text());
        }
      }

      return NextResponse.json({ response: fallbackResponse, conversationId });
    }

    const chatData = await chatResponse.json();
    const aiResponse = chatData.response;

    // Store the AI's response in the database
    if (aiResponse) {
      const aiMessageResponse = await fetch(`${backendUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader, // Pass through the auth header
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          role: 'assistant',
          text: aiResponse
        }),
      });

      if (!aiMessageResponse.ok) {
        console.error('Failed to store AI message:', await aiMessageResponse.text());
        // Continue anyway
      }
    }

    // Return the AI response
    return NextResponse.json({ response: aiResponse, conversationId });
  } catch (error) {
    console.error('Customer chat API error:', error);
    return NextResponse.json({
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}