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

    const response = await fetch(`${backendUrl}/bookings/recent`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error from backend service: ${response.status} ${errorBody}`);
      return NextResponse.json(
        { error: `Failed to fetch bookings from backend: ${response.statusText}` },
        { status: response.status }
      );
    }
    const bookings = await response.json();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred while fetching bookings.' },
      { status: 502 } // 502 Bad Gateway
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

    const accessToken = session.accessToken;

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error('CRITICAL: BACKEND_URL environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();

    const response = await fetch(`${backendUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error from backend service on POST /bookings: ${response.status} ${errorBody}`);
      return NextResponse.json(
        { error: `Backend failed to create booking: ${response.statusText}` },
        { status: response.status }
      );
    }
    const newBooking = await response.json();
    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred while creating booking.' },
      { status: 500 }
    );
  }
}