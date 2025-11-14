import { auth0 } from '@/lib/auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get session to validate authentication
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = session.accessToken;

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error('CRITICAL: BACKEND_URL environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/tickets/recent`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error from backend service: ${response.status} ${errorBody}`);
      return NextResponse.json(
        { error: `Failed to fetch tickets from backend: ${response.statusText}` },
        { status: response.status }
      );
    }
    const tickets = await response.json();
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred while fetching tickets.' },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get session to validate authentication
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const newTicket = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString()
    };
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error('Error processing POST request for tickets:', error);
    return NextResponse.json({ error: 'خطأ في معالجة الطلب' }, { status: 400 });
  }
}