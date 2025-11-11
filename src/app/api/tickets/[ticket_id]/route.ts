import { NextResponse } from 'next/server';

// TODO: Implement authentication. This should check if the user is an admin or assigned agent.

export async function PATCH(
  request: Request,
  { params }: { params: { ticket_id: string } }
) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.error('Error: BACKEND_URL environment variable is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const ticketId = params.ticket_id;
    const body = await request.json();

    // Proxy the PATCH request to the Python backend
    const response = await fetch(`${backendUrl}/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error from backend service on PATCH /tickets/${ticketId}: ${response.status} ${errorBody}`);
      return NextResponse.json(
        { error: `Backend failed to update ticket: ${response.statusText}` },
        { status: response.status }
      );
    }

    const updatedTicket = await response.json();
    return NextResponse.json(updatedTicket);

  } catch (error) {
    console.error(`Error in PATCH /api/tickets/[id]:`, error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}