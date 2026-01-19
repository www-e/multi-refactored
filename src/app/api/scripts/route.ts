import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPostApi } from '@/lib/apiHandler';

// GET /api/scripts (proxies to backend GET /api/scripts)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/api/scripts`
  );
}

// POST /api/scripts (proxies to backend POST /api/scripts)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/api/scripts`
  );
}
