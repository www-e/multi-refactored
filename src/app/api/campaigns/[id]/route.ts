import { NextRequest, NextResponse } from 'next/server';
import { handlePatchApi, handleDeleteApi, handleSessionGetApi, handleSessionDeleteApi } from '@/lib/apiHandler';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/campaigns/bulk/${params.id}`  // Use bulk campaigns endpoint
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handlePatchApi(
    request,
    params,
    `/campaigns/bulk/${params.id}`  // Use bulk campaigns endpoint
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionDeleteApi(
    request,
    `/campaigns/bulk/${params.id}`  // Use bulk campaigns endpoint
  );
}