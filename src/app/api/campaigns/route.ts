import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPostApi } from '@/lib/apiHandler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/campaigns`
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/campaigns`
  );
}