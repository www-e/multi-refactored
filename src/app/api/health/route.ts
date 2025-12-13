import { NextRequest, NextResponse } from 'next/server';
import { validateAllEnvironment } from '@/lib/envValidator';

// Health check endpoint to monitor service readiness
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate environment configuration
    const isEnvironmentValid = validateAllEnvironment('Health Check');
    
    // Check backend connectivity
    let backendStatus = 'unknown';
    let backendError = null;
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      try {
        const backendResponse = await fetch(`${backendUrl}/healthz`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (backendResponse.ok) {
          backendStatus = 'ok';
        } else {
          backendStatus = 'error';
          backendError = `Backend responded with status: ${backendResponse.status}`;
        }
      } catch (error) {
        backendStatus = 'error';
        backendError = error instanceof Error ? error.message : 'Unknown backend error';
      }
    } else {
      backendStatus = 'not_configured';
      backendError = 'NEXT_PUBLIC_BACKEND_URL not set';
    }
    
    const healthStatus = {
      status: isEnvironmentValid && backendStatus === 'ok' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        frontend: 'ok', // This endpoint is running
        environment: isEnvironmentValid ? 'ok' : 'configuration_error',
        backend: backendStatus,
      },
      details: {
        environment_check: isEnvironmentValid,
        backend_error: backendError,
      }
    };

    const status = healthStatus.status === 'healthy' ? 200 : 503;
    return NextResponse.json(healthStatus, { status });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}