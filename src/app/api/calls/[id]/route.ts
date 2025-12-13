import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi } from '@/lib/apiHandler';

// GET /api/calls/[id] (proxies to backend GET /calls/{id})
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/calls/${params.id}`
  );
}