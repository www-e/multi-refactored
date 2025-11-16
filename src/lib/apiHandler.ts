import { NextRequest, NextResponse } from 'next/server';

// Generic handler for authenticated API routes
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface ApiHandlerContext {
  req: NextRequest;
  params?: { [key: string]: string };
  backendUrl: string;
  endpoint: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
}

export interface ApiHandlerConfig {
  authenticate?: boolean;
  validateBackendUrl?: boolean;
  transformRequest?: (data: any) => any;
  transformResponse?: (data: any) => any;
}

export async function handleAuthenticatedApi(
  context: ApiHandlerContext,
  config: ApiHandlerConfig = {}
): Promise<NextResponse> {
  const { 
    req, 
    params, 
    backendUrl, 
    endpoint, 
    method, 
    headers = {}, 
    body 
  } = context;
  
  const { 
    authenticate = true, 
    validateBackendUrl = true,
    transformRequest,
    transformResponse 
  } = config;

  try {
    // Authentication check
    if (authenticate) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const accessToken = authHeader.substring(7);
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Backend URL validation
    if (validateBackendUrl && !backendUrl) {
      console.error('Error: BACKEND_URL environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Build the backend endpoint with parameters
    let backendEndpoint = `${backendUrl}${endpoint}`;
    if (params && params.id) {
      backendEndpoint = backendEndpoint.replace('[id]', params.id);
    }

    // Prepare request body
    let requestBody = body;
    if (body && typeof body === 'object') {
      requestBody = transformRequest ? transformRequest(body) : body;
    }

    // Make the backend API call
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Add body only if method is not GET or HEAD and if requestBody exists
    if (method !== 'GET' && method !== 'HEAD' && requestBody !== undefined) {
      fetchOptions.body = JSON.stringify(requestBody);
    }

    const response = await fetch(backendEndpoint, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error from backend service on ${method} ${endpoint}: ${response.status} ${errorBody}`);
      return NextResponse.json(
        { error: `Backend failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Return the response from backend
    const responseData = await response.json();
    const transformedResponse = transformResponse 
      ? transformResponse(responseData) 
      : responseData;
    
    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error(`Error in ${method} API handler:`, error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}

// Shorthand functions for common operations
export async function handleGetApi(
  req: NextRequest,
  params: { [key: string]: string },
  endpoint: string,
  config: ApiHandlerConfig = {}
): Promise<NextResponse> {
  return handleAuthenticatedApi({
    req,
    params,
    backendUrl: process.env.BACKEND_URL!,
    endpoint,
    method: 'GET',
  }, config);
}

export async function handlePostApi(
  req: NextRequest,
  endpoint: string,
  config: ApiHandlerConfig = {}
): Promise<NextResponse> {
  const body = await req.json();
  return handleAuthenticatedApi({
    req,
    backendUrl: process.env.BACKEND_URL!,
    endpoint,
    method: 'POST',
    body,
  }, config);
}

export async function handlePatchApi(
  req: NextRequest,
  params: { [key: string]: string },
  endpoint: string,
  config: ApiHandlerConfig = {}
): Promise<NextResponse> {
  const body = await req.json();
  return handleAuthenticatedApi({
    req,
    params,
    backendUrl: process.env.BACKEND_URL!,
    endpoint,
    method: 'PATCH',
    body,
  }, config);
}

export async function handleDeleteApi(
  req: NextRequest,
  params: { [key: string]: string },
  endpoint: string,
  config: ApiHandlerConfig = {}
): Promise<NextResponse> {
  return handleAuthenticatedApi({
    req,
    params,
    backendUrl: process.env.BACKEND_URL!,
    endpoint,
    method: 'DELETE',
  }, config);
}

// Handler for APIs using getServerSession for authentication
export async function handleSessionBasedApi(
  req: NextRequest,
  endpoint: string,
  method: HttpMethod,
  body?: any,
  config: ApiHandlerConfig = {}
): Promise<NextResponse> {
  // Import dynamically to avoid circular dependencies
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/lib/authOptions');

  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.error('Error: BACKEND_URL environment variable is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Build headers object
  const headersObj: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };

  try {
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method,
      headers: headersObj,
      ...(method !== 'GET' && method !== 'HEAD' && body !== undefined && {
        body: JSON.stringify(body)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ detail: data.detail || `Failed to ${method} ${endpoint}` }, { status: response.status });
    }

    return method === 'POST' ? NextResponse.json(data, { status: 201 }) : NextResponse.json(data);
  } catch (error) {
    const errorMessage = method === 'POST'
      ? 'An internal server error occurred'
      : 'Failed to connect to backend service';
    return NextResponse.json({ error: errorMessage }, { status: method === 'POST' ? 500 : 502 });
  }
}

// Shorthand functions for session-based APIs
export async function handleSessionGetApi(
  req: NextRequest,
  endpoint: string,
  config: ApiHandlerConfig = {}
): Promise<NextResponse> {
  return handleSessionBasedApi(req, endpoint, 'GET', undefined, config);
}

export async function handleSessionPostApi(
  req: NextRequest,
  endpoint: string,
  config: ApiHandlerConfig = {}
): Promise<NextResponse> {
  const body = await req.json();
  return handleSessionBasedApi(req, endpoint, 'POST', body, config);
}