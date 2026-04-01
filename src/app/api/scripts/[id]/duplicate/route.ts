import { NextRequest, NextResponse } from 'next/server';
import { handleSessionPostApi } from '@/lib/apiHandler';

// POST /api/scripts/[id]/duplicate (proxies to backend POST /scripts/{id}/duplicate)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/scripts/${params.id}/duplicate`
  );
}
