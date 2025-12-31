import { NextRequest, NextResponse } from 'next/server';
import { handleSessionPatchApi, handleSessionDeleteApi } from '@/lib/apiHandler';

// Dynamic segment for the route - this will handle /api/admin/users/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').pop(); // Extract user ID from URL
  
  return handleSessionPatchApi(
    request,
    `/admin/users/${userId}`
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').pop(); // Extract user ID from URL
  
  return handleSessionDeleteApi(
    request,
    `/admin/users/${userId}`
  );
}