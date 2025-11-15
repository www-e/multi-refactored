import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// GET /api/bookings (proxies to backend GET /bookings/recent)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.error('CRITICAL: BACKEND_URL environment variable is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const response = await fetch(`${backendUrl}/bookings/recent`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ detail: data.detail || 'Failed to fetch bookings from backend' }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 502 });
  }
}

// POST /api/bookings (proxies to backend POST /bookings)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.error('CRITICAL: BACKEND_URL environment variable is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`${backendUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();
    if (!response.ok) {
      console.error(`Error from backend service on POST /bookings: ${response.status}`, responseData);
      return NextResponse.json({ detail: responseData.detail || 'Backend failed to create booking' }, { status: response.status });
    }
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json({ error: 'An internal server error occurred while creating a booking.' }, { status: 500 });
  }
}