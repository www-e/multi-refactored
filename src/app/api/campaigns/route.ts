import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

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
    const response = await fetch(`${backendUrl}/campaigns`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ detail: data.detail || 'Failed to fetch campaigns' }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 502 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
      const body = await request.json();
      const response = await fetch(`${backendUrl}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
  
      const responseData = await response.json();
      if (!response.ok) {
        return NextResponse.json({ detail: responseData.detail || 'Backend failed to create campaign' }, { status: response.status });
      }
      return NextResponse.json(responseData, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}