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
      const contentType = response.headers.get('content-type');

      try {
        if (contentType && contentType.includes('application/json')) {
          // Try to parse the standardized error response from backend
          const errorBody = await response.json();

          // Check if this is a standardized error response from our backend
          if (errorBody && typeof errorBody === 'object' && errorBody.error) {
            console.error(`Standardized error from backend service on ${method} ${endpoint}:`, response.status, errorBody.error);
            return NextResponse.json(errorBody, { status: response.status });
          } else {
            // If not a standardized error, create a formatted error response
            const formattedError = {
              error: {
                message: errorBody?.detail || `Backend failed: ${response.statusText}`,
                code: "BACKEND_ERROR",
                status_code: response.status
              }
            };
            console.error(`Error from backend service on ${method} ${endpoint}:`, response.status, errorBody);
            return NextResponse.json(formattedError, { status: response.status });
          }
        } else {
          // If not JSON, it's likely an HTML error page or plain text - get as text
          const textError = await response.text();

          // Check if it looks like an HTML error page
          if (textError.includes('<!DOCTYPE html') || textError.includes('<html') || textError.includes('404') || textError.includes('405') || textError.includes('500')) {
            console.error(`HTML error page received from backend service on ${method} ${endpoint}:`, response.status, textError.substring(0, 200) + '...');
            const formattedError = {
              error: {
                message: `Received HTML error page instead of JSON response: ${response.status} ${response.statusText}`,
                code: "BACKEND_ERROR",
                status_code: response.status,
                html_preview: textError.substring(0, 200) + '...'
              }
            };
            return NextResponse.json(formattedError, { status: response.status });
          } else {
            console.error(`Non-JSON error from backend service on ${method} ${endpoint}:`, response.status, textError);
            const formattedError = {
              error: {
                message: `Backend failed: ${response.statusText}`,
                code: "BACKEND_ERROR",
                status_code: response.status
              }
            };
            return NextResponse.json(formattedError, { status: response.status });
          }
        }
      } catch (parseError) {
        // If we can't parse the response at all, log and return a generic error
        console.error(`Failed to parse error response from backend service on ${method} ${endpoint}:`, parseError);
        const formattedError = {
          error: {
            message: `Backend failed: ${response.statusText}`,
            code: "BACKEND_ERROR",
            status_code: response.status
          }
        };
        return NextResponse.json(formattedError, { status: response.status });
      }
    }

    // Check if the successful response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // Return the response from backend
      const responseData = await response.json();
      const transformedResponse = transformResponse
        ? transformResponse(responseData)
        : responseData;

      return NextResponse.json(transformedResponse);
    } else {
      // Handle case where successful response is not JSON
      const responseText = await response.text();
      console.error(`Unexpected non-JSON response from backend service on ${method} ${endpoint}:`, responseText.substring(0, 200) + '...');
      const formattedError = {
        error: {
          message: `Backend returned non-JSON response for ${method} ${endpoint}`,
          code: "BACKEND_ERROR",
          status_code: 200
        }
      };
      return NextResponse.json(formattedError, { status: 502 });
    }
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

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, handle as text and provide error context
      const responseText = await response.text();

      // Check if it looks like an HTML error page
      if (responseText.includes('<!DOCTYPE html') || responseText.includes('<html')) {
        console.error(`HTML error page received from backend service on ${method} ${endpoint}:`, response.status, responseText.substring(0, 200) + '...');
        return NextResponse.json({
          detail: `Received HTML error page instead of JSON response: ${response.status}`,
          html_preview: responseText.substring(0, 200) + '...'
        }, { status: response.status });
      } else {
        console.error(`Non-JSON response from backend service on ${method} ${endpoint}:`, response.status, responseText);
        return NextResponse.json({
          detail: `Backend returned non-JSON response: ${responseText}`
        }, { status: response.status });
      }
    }

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

export async function handleSessionPatchApi(
  req: NextRequest,
  endpoint: string,
  config: ApiHandlerConfig = {}
): Promise<NextResponse> {
  const body = await req.json();
  return handleSessionBasedApi(req, endpoint, 'PATCH', body, config);
}

export async function handleSessionDeleteApi(
  req: NextRequest,
  endpoint: string,
  config: ApiHandlerConfig = {}
): Promise<NextResponse> {
  return handleSessionBasedApi(req, endpoint, 'DELETE', undefined, config);
}