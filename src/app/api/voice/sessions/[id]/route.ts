import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi } from '@/lib/apiHandler';

// GET /api/voice/sessions/[id] (proxies to backend GET /voice/sessions/{id})
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/voice/sessions/${params.id}`
  );
}