import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPostApi } from '@/lib/apiHandler';

// ✅ CRITICAL: This GET handler allows the dashboard to fetch the call list
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/voice/sessions` 
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/voice/sessions`
  );
}