import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Get the authorization header from the incoming client request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // 2. Ensure the backend URL is configured
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error('CRITICAL: BACKEND_URL environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 3. Forward the request body to the FastAPI backend
    const body = await request.json();
    const response = await fetch(`${backendUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`, // Pass the token along
      },
      body: JSON.stringify(body),
    });

    // 4. Handle the response from the backend
    const responseData = await response.json();
    if (!response.ok) {
      console.error(`Error from backend service on POST /customers: ${response.status}`, responseData);
      return NextResponse.json(
        { detail: responseData.detail || `Backend failed to create customer` },
        { status: response.status }
      );
    }

    // 5. Return the successful response to the frontend
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/customers route:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}