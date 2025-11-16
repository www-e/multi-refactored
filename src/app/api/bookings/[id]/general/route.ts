import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error('Error: BACKEND_URL environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const bookingId = params.id;
    const body = await request.json();

    const response = await fetch(`${backendUrl}/bookings/${bookingId}/general`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error from backend service on PATCH /bookings/${bookingId}/general: ${response.status} ${errorBody}`);
      return NextResponse.json(
        { error: `Backend failed to update booking: ${response.statusText}` },
        { status: response.status }
      );
    }
    const updatedBooking = await response.json();
    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error(`Error in PATCH /api/bookings/[id]/general:`, error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}