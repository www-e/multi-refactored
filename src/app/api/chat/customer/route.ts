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
        // Check if response is JSON before parsing
        const contentType = conversationResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const conversations = await conversationResponse.json();
          if (conversations && Array.isArray(conversations) && conversations.length > 0) {
            // Use the most recent conversation
            conversationId = conversations[0].id;
          }
        } else {
          // Received non-JSON response (likely HTML error page), log and continue
          console.warn('Received non-JSON response when fetching conversations:', await conversationResponse.text());
        }
      } else {
        // Log the error response but don't fail completely
        const errorText = await conversationResponse.text();
        console.warn(`Failed to fetch conversations: ${conversationResponse.status} - ${errorText}`);
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
        const contentType = convCreateResponse.headers.get('content-type');
        let errorText;
        if (contentType && contentType.includes('application/json')) {
          const errorJson = await convCreateResponse.json().catch(() => ({ error: 'Unknown JSON error' }));
          errorText = JSON.stringify(errorJson);
        } else {
          // If not JSON, it might be HTML - get as text
          errorText = await convCreateResponse.text();
        }
        console.error('Failed to create conversation:', errorText);
        return NextResponse.json({
          error: 'Failed to create conversation',
          details: errorText
        }, { status: 500 });
      }

      const contentType = convCreateResponse.headers.get('content-type');
      let convData;
      if (contentType && contentType.includes('application/json')) {
        convData = await convCreateResponse.json();
      } else {
        // Handle case where response might be HTML
        const responseText = await convCreateResponse.text();
        console.error('Unexpected non-JSON response when creating conversation:', responseText);
        return NextResponse.json({
          error: 'Unexpected response format from server',
          details: responseText
        }, { status: 500 });
      }
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
      const contentType = messageResponse.headers.get('content-type');
      let errorText;
      if (contentType && contentType.includes('application/json')) {
        errorText = await messageResponse.json().catch(() => 'Unknown JSON error').then(data => JSON.stringify(data));
      } else {
        // If not JSON, it might be HTML - get as text
        errorText = await messageResponse.text();
      }
      console.error('Failed to store user message:', errorText);
      // Continue anyway, as we still want to get the AI response
    }

    // Get AI response from the backend chat API which should connect to ElevenLabs
    const chatBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!chatBackendUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const chatResponse = await fetch(`${chatBackendUrl}/chat`, {
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
          const contentType = aiMessageResponse.headers.get('content-type');
          let errorText;
          if (contentType && contentType.includes('application/json')) {
            errorText = await aiMessageResponse.json().catch(() => 'Unknown JSON error').then(data => JSON.stringify(data));
          } else {
            // If not JSON, it might be HTML - get as text
            errorText = await aiMessageResponse.text();
          }
          console.error('Failed to store AI message:', errorText);
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
        const contentType = aiMessageResponse.headers.get('content-type');
        let errorText;
        if (contentType && contentType.includes('application/json')) {
          errorText = await aiMessageResponse.json().catch(() => 'Unknown JSON error').then(data => JSON.stringify(data));
        } else {
          // If not JSON, it might be HTML - get as text
          errorText = await aiMessageResponse.text();
        }
        console.error('Failed to store AI message:', errorText);
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