import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi } from '@/lib/apiHandler';

// GET /api/conversations/[id] (proxies to backend GET /conversations/{id})
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/conversations/${params.id}`
  );
}