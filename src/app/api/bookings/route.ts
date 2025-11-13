import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';

export const GET = auth0.withApiAuthRequired(async function getBookings() {
  const session = await auth0.getSession();
  const accessToken = session?.accessToken;

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
});

// The POST endpoint is a mock and does not call the backend.
// We will still protect it to ensure only logged-in users can call it.
export const POST = auth0.withApiAuthRequired(async function postBooking(request: Request) {
  try {
    const body = await request.json();
    const newBooking = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString()
    };
    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Error processing POST request for bookings:', error);
    return NextResponse.json({ error: 'خطأ في معالجة الطلب' }, { status: 400 });
  }
});