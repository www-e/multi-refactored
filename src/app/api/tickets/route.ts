import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPostApi } from '@/lib/apiHandler';

// GET /api/tickets (proxies to backend GET /tickets)
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Check if we want recent tickets or all tickets based on URL params
  const url = new URL(request.url);
  const recent = url.searchParams.get('recent');

  const endpoint = recent ? `/tickets/recent` : `/tickets`;
  return handleSessionGetApi(
    request,
    endpoint
  );
}

// POST /api/tickets (proxies to backend POST /tickets)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/tickets`
  );
}