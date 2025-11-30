import { NextRequest, NextResponse } from 'next/server';
import { handleSessionPostApi, handleSessionGetApi } from '@/lib/apiHandler';

// GET /api/calls (proxies to backend GET /calls)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/calls`
  );
}

// POST /api/calls (proxies to backend POST /calls)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/calls`
  );
}