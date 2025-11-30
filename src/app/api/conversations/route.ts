import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPostApi, handleSessionPatchApi, handleSessionDeleteApi } from '@/lib/apiHandler';

// GET /api/conversations (proxies to backend GET /conversations)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/conversations`
  );
}

// POST /api/conversations (proxies to backend POST /conversations)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/conversations`
  );
}

// PATCH /api/conversations/[id] (proxies to backend PATCH /conversations/{id})
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionPatchApi(
    request,
    `/conversations/${params.id}`
  );
}

// DELETE /api/conversations/[id] (proxies to backend DELETE /conversations/{id})
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionDeleteApi(
    request,
    `/conversations/${params.id}`
  );
}