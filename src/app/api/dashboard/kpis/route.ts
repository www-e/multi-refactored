import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Get the session on the SERVER side.
  const session = await getServerSession(authOptions);

  // 2. Extract the backend access token from the session.
  // @ts-ignore
  const accessToken = session?.accessToken;

  // 3. SECURITY: If no token, reject the request.
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.error('CRITICAL: BACKEND_URL environment variable is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // 4. Make the AUTHENTICATED request from the Next.js server to the FastAPI backend.
    const response = await fetch(`${backendUrl}/dashboard/kpis`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching dashboard KPIs from backend:', errorData);
      return NextResponse.json({ error: 'Failed to fetch dashboard data from backend' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    // This will catch the ECONNREFUSED error if the backend is not running.
    return NextResponse.json({ error: 'Failed to connect to backend service' }, { status: 502 }); // 502 Bad Gateway
  }
}