import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPutApi, handleSessionDeleteApi } from '@/lib/apiHandler';

// GET /api/scripts/[id] (proxies to backend GET /scripts/{id})
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/scripts/${params.id}`
  );
}

// PUT /api/scripts/[id] (proxies to backend PUT /scripts/{id})
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionPutApi(
    request,
    `/scripts/${params.id}`
  );
}

// DELETE /api/scripts/[id] (proxies to backend DELETE /scripts/{id})
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionDeleteApi(
    request,
    `/scripts/${params.id}`
  );
}
