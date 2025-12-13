import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi } from '@/lib/apiHandler';

// GET /api/transcripts/[id] (proxies to backend GET /transcripts/{id})
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/transcripts/${params.id}`
  );
}