import { NextRequest, NextResponse } from 'next/server';
import { handlePatchApi } from '@/lib/apiHandler';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handlePatchApi(
    request,
    params,
    `/tickets/[id]/general`
  );
}