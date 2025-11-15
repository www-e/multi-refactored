import { EnhancedBooking, EnhancedTicket, DashboardKPIs, LiveOps } from "@/app/(shared)/types";

/**
 * A client-side fetch wrapper that includes the authentication token.
 * It makes requests to the Next.js API proxy layer.
 */
async function clientFetch<T>(endpoint: string, accessToken: string, options?: RequestInit): Promise<T> {
  const url = `/api${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // CRITICAL FIX: The Authorization header is now sent from the client to the Next.js API route.
        'Authorization': `Bearer ${accessToken}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: `API request failed with status ${response.status}` }));
      console.error(`Client API Error on ${endpoint}:`, response.status, errorBody);
      throw new Error(errorBody.detail || errorBody.error);
    }

    if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    console.error(`Client Network Error on ${endpoint}:`, error);
    throw new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
  }
}

// All functions now REQUIRE an access token and pass it to clientFetch.
export const getDashboardKpis = (token: string): Promise<{ kpis: DashboardKPIs, liveOps: LiveOps }> => 
  clientFetch('/dashboard', token);

export const getBookings = (token: string): Promise<EnhancedBooking[]> => 
  clientFetch('/bookings/recent', token);

export const getTickets = (token: string): Promise<EnhancedTicket[]> => 
  clientFetch('/tickets/recent', token);

export const updateBookingStatus = (id: string, status: 'confirmed' | 'canceled', token: string): Promise<any> => {
  return clientFetch(`/bookings/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const updateTicketStatus = (id: string, status: 'in_progress' | 'resolved' | 'closed' | 'pending_approval', token: string): Promise<any> => {
  return clientFetch(`/tickets/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const createVoiceSession = (agentType: 'support' | 'sales', token: string): Promise<any> => {
  return clientFetch('/voice/sessions', token, {
    method: 'POST',
    body: JSON.stringify({ agent_type: agentType }),
  });
};

export const postLog = (level: 'info' | 'warn' | 'error', message: string, meta: any, token: string): Promise<void> => {
  return clientFetch('/logs', token, {
    method: 'POST',
    body: JSON.stringify({ source: 'client-hook', level, message, meta }),
  });
};
