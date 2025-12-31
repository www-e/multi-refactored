import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPostApi, handleSessionPatchApi, handleSessionDeleteApi } from '@/lib/apiHandler';

// GET /api/admin/users (proxies to backend GET /admin/users)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/admin/users`
  );
}

// POST /api/admin/users (proxies to backend POST /admin/users)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/admin/users`
  );
}