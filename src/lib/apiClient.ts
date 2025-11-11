import { EnhancedBooking, EnhancedTicket } from "@/app/(shared)/types";

// (apiClient helper function remains the same)
async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorMessage;
    } catch (e) { /* Ignore */ }
    throw new Error(errorMessage);
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return Promise.resolve(undefined as T);
}

// --- EXPORTED API FUNCTIONS ---

// Read operations
export const getBookings = (): Promise<EnhancedBooking[]> => apiClient<EnhancedBooking[]>('/api/bookings/recent');
export const getTickets = (): Promise<EnhancedTicket[]> => apiClient<EnhancedTicket[]>('/api/tickets/recent');

// Voice session creation
export const createVoiceSession = (agentType: 'support' | 'sales'): Promise<any> => {
  return apiClient<any>('/api/voice/sessions', {
    method: 'POST',
    body: JSON.stringify({ agent_type: agentType }),
  });
};

// --- NEW: Write operations ---

export const updateBookingStatus = (bookingId: string, status: 'confirmed' | 'canceled'): Promise<any> => {
  return apiClient<any>(`/api/bookings/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const updateTicketStatus = (ticketId: string, status: 'in_progress' | 'resolved' | 'closed'): Promise<any> => {
  return apiClient<any>(`/api/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// Logging (remains the same)
export const postLog = (level: 'info' | 'warn' | 'error', message: string, meta?: any): Promise<void> => {
  return apiClient<void>('/api/logs', {
    method: 'POST',
    body: JSON.stringify({ source: 'client-hook', level, message, meta }),
  });
};