import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/serverLogger';

export const runtime = 'nodejs';

interface BulkCallRequest {
  customer_ids: string[];
  script_content?: string;
  agent_type?: 'support' | 'sales';
  concurrency_limit?: number;
  use_knowledge_base?: boolean;
  custom_system_prompt?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the authorization header from the incoming request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BulkCallRequest = await request.json();
    const {
      customer_ids,
      script_content,
      agent_type = 'sales',
      concurrency_limit = 3,
      use_knowledge_base = true,
      custom_system_prompt
    } = body;

    // Validate required fields
    if (!customer_ids || !Array.isArray(customer_ids) || customer_ids.length === 0) {
      return NextResponse.json({
        error: 'customer_ids array is required and cannot be empty'
      }, { status: 400 });
    }

    await logEvent('bulk_calls:start', 'info', 'Starting bulk call campaign', {
      customerCount: customer_ids.length,
      agentType: agent_type,
      concurrencyLimit: concurrency_limit,
      hasCustomScript: !!script_content,
      hasCustomPrompt: !!custom_system_prompt,
      useKnowledgeBase: use_knowledge_base
    });

    // Call backend API with enhanced parameters
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      await logEvent('bulk_calls:error', 'error', 'Backend URL not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/calls/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        customer_ids,
        script_content,
        agent_type,
        concurrency_limit,
        use_knowledge_base: use_knowledge_base,
        custom_system_prompt
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      await logEvent('bulk_calls:error', 'error', 'Backend API error', {
        status: response.status,
        error: errorData
      });
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    
    await logEvent('bulk_calls:success', 'info', 'Bulk call campaign initiated', {
      customerCount: customer_ids.length,
      initiatedCalls: data.initiated_calls || data.created_count
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Bulk calls API error:', error);
    await logEvent('bulk_calls:error', 'error', 'Unhandled error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
