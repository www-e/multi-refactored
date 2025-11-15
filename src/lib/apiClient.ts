import { EnhancedBooking, EnhancedTicket, DashboardKPIs, LiveOps } from "@/app/(shared)/types";

/**
 * A simplified, client-side API fetcher.
 * Its ONLY job is to make requests to the Next.js API proxy layer (e.g., /api/dashboard).
 * It does NOT handle authentication; that is the responsibility of the server-side API route.
 */
async function clientFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Always use a relative path to call the Next.js API proxy.
  const url = `/api${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'An unknown API error occurred' }));
      console.error(`Client API Error on ${endpoint}:`, response.status, errorBody);
      throw new Error(errorBody.error || `Request failed with status ${response.status}`);
    }

    // Handle empty responses
    if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    console.error(`Client Network Error on ${endpoint}:`, error);
    throw new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
  }
}

// All functions now use the simplified clientFetch and do NOT handle tokens.
export const getDashboardKpis = (): Promise<{ kpis: DashboardKPIs, liveOps: LiveOps }> => clientFetch('/dashboard');
export const getBookings = (): Promise<EnhancedBooking[]> => clientFetch('/bookings/recent');
export const getTickets = (): Promise<EnhancedTicket[]> => clientFetch('/tickets/recent');

export const updateBookingStatus = (id: string, status: 'confirmed' | 'canceled'): Promise<any> => {
  return clientFetch(`/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const updateTicketStatus = (id: string, status: 'in_progress' | 'resolved' | 'closed' | 'pending_approval'): Promise<any> => {
  return clientFetch(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const createVoiceSession = (agentType: 'support' | 'sales'): Promise<any> => {
  return clientFetch('/voice/sessions', {
    method: 'POST',
    body: JSON.stringify({ agent_type: agentType }),
  });
};

export const postLog = (level: 'info' | 'warn' | 'error', message: string, meta: any): Promise<void> => {
  return clientFetch('/logs', {
    method: 'POST',
    body: JSON.stringify({ source: 'client-hook', level, message, meta }),
  });
};