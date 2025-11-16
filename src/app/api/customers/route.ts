import { NextRequest, NextResponse } from 'next/server';
import { handleSessionGetApi, handleSessionPostApi } from '@/lib/apiHandler';

// GET /api/customers (proxies to backend GET /customers)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSessionGetApi(
    request,
    `/customers`
  );
}

// POST /api/customers (proxies to backend POST /customers)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSessionPostApi(
    request,
    `/customers`
  );
}