import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi } from '@/lib/apiHandler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/bookings/recent`
  );
}