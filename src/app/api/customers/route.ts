import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// GET /api/customers (proxies to backend GET /customers)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const response = await fetch(`${backendUrl}/customers`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ detail: data.detail || 'Failed to fetch customers' }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/customers:', error);
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 502 });
  }
}

// POST /api/customers (proxies to backend POST /customers)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.substring(7);

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error('CRITICAL: BACKEND_URL environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();
    const response = await fetch(`${backendUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();
    if (!response.ok) {
      console.error(`Error from backend service on POST /customers: ${response.status}`, responseData);
      return NextResponse.json(
        { detail: responseData.detail || `Backend failed to create customer` },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/customers route:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}