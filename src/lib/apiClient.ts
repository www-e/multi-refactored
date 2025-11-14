import { EnhancedBooking, EnhancedTicket, DashboardKPIs, LiveOps } from "@/app/(shared)/types";

async function apiClient<T>(endpoint: string, options?: RequestInit, accessToken?: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorMessage;
      } catch (e) { /* Ignore */ }

      // Log for debugging
      console.error('API Error:', errorMessage, { url, status: response.status });
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    return Promise.resolve(undefined as T);
  } catch (error) {
    // Log network or other errors
    console.error('Network Error:', error);
    throw new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
  }
}

// Read operations
export const getBookings = (accessToken?: string): Promise<EnhancedBooking[]> => apiClient<EnhancedBooking[]>('/api/bookings/recent', undefined, accessToken);
export const getTickets = (accessToken?: string): Promise<EnhancedTicket[]> => apiClient<EnhancedTicket[]>('/api/tickets/recent', undefined, accessToken);
export const getDashboardKpis = (accessToken?: string): Promise<{ kpis: DashboardKPIs, liveOps: LiveOps }> => apiClient<{ kpis: DashboardKPIs, liveOps: LiveOps }>('/api/dashboard', undefined, accessToken);

// Voice session creation
export const createVoiceSession = (agentType: 'support' | 'sales', accessToken?: string): Promise<any> => {
  return apiClient<any>('/api/voice/sessions', {
    method: 'POST',
    body: JSON.stringify({ agent_type: agentType }),
  }, accessToken);
};

// Write operations
export const updateBookingStatus = (bookingId: string, status: 'confirmed' | 'canceled', accessToken?: string): Promise<any> => {
  return apiClient<any>(`/api/bookings/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, accessToken);
};

// FIX: Added 'pending_approval' to the list of allowed statuses.
export const updateTicketStatus = (ticketId: string, status: 'in_progress' | 'resolved' | 'closed' | 'pending_approval', accessToken?: string): Promise<any> => {
  return apiClient<any>(`/api/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, accessToken);
};

// Logging
export const postLog = (level: 'info' | 'warn' | 'error', message: string, meta?: any, accessToken?: string): Promise<void> => {
  return apiClient<void>('/api/logs', {
    method: 'POST',
    body: JSON.stringify({ source: 'client-hook', level, message, meta }),
  }, accessToken);
};