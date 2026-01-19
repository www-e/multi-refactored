import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPutApi, handleSessionDeleteApi } from '@/lib/apiHandler';

// GET /api/scripts/[id] (proxies to backend GET /api/scripts/{id})
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/api/scripts/${params.id}`
  );
}

// PUT /api/scripts/[id] (proxies to backend PUT /api/scripts/{id})
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionPutApi(
    request,
    `/api/scripts/${params.id}`
  );
}

// DELETE /api/scripts/[id] (proxies to backend DELETE /api/scripts/{id})
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionDeleteApi(
    request,
    `/api/scripts/${params.id}`
  );
}
