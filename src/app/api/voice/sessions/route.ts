import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPostApi } from '@/lib/apiHandler';

// ✅ ADDED: GET Handler to fetch list from Backend
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/voice/sessions` // Proxies to Backend's @router.get("/voice/sessions")
  );
}

// Existing POST handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/voice/sessions`
  );
}