import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPostApi } from '@/lib/apiHandler';

// GET /api/tickets (proxies to backend GET /tickets/recent)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/tickets/recent`
  );
}

// POST /api/tickets (proxies to backend POST /tickets)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/tickets`
  );
}