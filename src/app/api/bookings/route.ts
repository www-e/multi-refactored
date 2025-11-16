import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPostApi } from '@/lib/apiHandler';

// GET /api/bookings (proxies to backend GET /bookings/recent)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/bookings/recent`
  );
}

// POST /api/bookings (proxies to backend POST /bookings)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/bookings`
  );
}