import { NextRequest, NextResponse } from 'next/server';
import { handleSessionPostApi, handleSessionGetApi } from '@/lib/apiHandler';

// POST /api/calls (proxies to backend POST /calls)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the authorization header from the incoming request
    // This will be set by the calling client component with NextAuth session token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customer_id, phone, direction = 'outbound', agent_type = 'human', campaign_id } = await request.json();

    // Validate required fields
    if (!customer_id || !phone) {
      return NextResponse.json({ 
        error: 'customer_id and phone are required' 
      }, { status: 400 });
    }

    // Call backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Pass through the auth header
      },
      body: JSON.stringify({
        customer_id,
        phone,
        direction,
        agent_type,
        campaign_id
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Call API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/calls (proxies to backend GET /calls)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/calls`
  );
}