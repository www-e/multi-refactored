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

    const customerId = params.id;
    const body = await request.json();

    const response = await fetch(`${backendUrl}/customers/${customerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error from backend service on PATCH /customers/${customerId}: ${response.status} ${errorBody}`);
      return NextResponse.json(
        { error: `Backend failed to update customer: ${response.statusText}` },
        { status: response.status }
      );
    }
    const updatedCustomer = await response.json();
    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error(`Error in PATCH /api/customers/[id]:`, error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const customerId = params.id;

    const response = await fetch(`${backendUrl}/customers/${customerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error from backend service on DELETE /customers/${customerId}: ${response.status} ${errorBody}`);
      return NextResponse.json(
        { error: `Backend failed to delete customer: ${response.statusText}` },
        { status: response.status }
      );
    }
    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error(`Error in DELETE /api/customers/[id]:`, error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}