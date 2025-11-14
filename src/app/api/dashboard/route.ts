import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';

export const GET = auth0.withApiAuthRequired(async function getDashboardKpis() {
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.error('CRITICAL: BACKEND_URL environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get access token from session
    const session = await auth0.getSession();
    const accessToken = session?.accessToken;

    // Fetch dashboard KPIs from the backend API
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
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
});