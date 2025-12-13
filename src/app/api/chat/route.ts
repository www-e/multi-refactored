import { NextRequest, NextResponse } from 'next/server';
import { handleSessionPostApi } from '@/lib/apiHandler';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the authorization header from the incoming request
    // This will be set by the calling client component with NextAuth session token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, agentType, conversationHistory } = await request.json()
    if (!message || !agentType) {
      return NextResponse.json({ error: 'Message and agentType are required' }, { status: 400 })
    }

    // Forward the request to the backend chat endpoint with proper authentication
    return handleSessionPostApi(
      request,
      `/chat`
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      error: 'يوجد مشكلة في الاتصال، يرجى إعادة المحاولة'
    }, { status: 500 });
  }
}