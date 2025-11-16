import { NextRequest, NextResponse } from 'next/server';
import { handlePatchApi, handleDeleteApi } from '@/lib/apiHandler';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handlePatchApi(
    request,
    params,
    `/bookings/[id]`
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleDeleteApi(
    request,
    params,
    `/bookings/[id]`
  );
}