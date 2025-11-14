import { EnhancedBooking, EnhancedTicket } from "@/app/(shared)/types";

async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const url = `${baseUrl}${endpoint}`;

  try {
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
export const getBookings = (): Promise<EnhancedBooking[]> => apiClient<EnhancedBooking[]>('/api/bookings/recent');
export const getTickets = (): Promise<EnhancedTicket[]> => apiClient<EnhancedTicket[]>('/api/tickets/recent');
export const getDashboardKpis = (): Promise<DashboardApiResponse> => apiClient<DashboardApiResponse>('/api/dashboard');

// Add proper typing for the return type
export interface DashboardApiResponse {
  kpis: {
    totalCalls: number;
    answerRate: number;
    conversionToBooking: number;
    revenue: number;
    roas: number;
    avgHandleTime: number;
    csat: number;
    missedCalls: number;
    aiTransferred: number;
    systemStatus: 'AI_يعمل' | 'التحويل_للبشر';
    totalCallsChange?: number;
    answerRateChange?: number;
    conversionChange?: number;
    revenueChange?: number;
    reachedCount?: number;
    interactedCount?: number;
    qualifiedCount?: number;
    bookedCount?: number;
    reachedPercentage?: number;
    interactedPercentage?: number;
    qualifiedPercentage?: number;
    bookedPercentage?: number;
  };
  liveOps: {
    currentCalls: Array<{
      id: string;
      customerName: string;
      duration: string;
      status: 'وارد' | 'فائت';
    }>;
    aiTransferredChats: Array<{
      id: string;
      customerName: string;
      reason: string;
      waitingTime: string;
    }>;
  };
}

// Voice session creation
export const createVoiceSession = (agentType: 'support' | 'sales'): Promise<any> => {
  return apiClient<any>('/api/voice/sessions', {
    method: 'POST',
    body: JSON.stringify({ agent_type: agentType }),
  });
};

// Write operations
export const updateBookingStatus = (bookingId: string, status: 'confirmed' | 'canceled'): Promise<any> => {
  return apiClient<any>(`/api/bookings/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// FIX: Added 'pending_approval' to the list of allowed statuses.
export const updateTicketStatus = (ticketId: string, status: 'in_progress' | 'resolved' | 'closed' | 'pending_approval'): Promise<any> => {
  return apiClient<any>(`/api/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// Logging
export const postLog = (level: 'info' | 'warn' | 'error', message: string, meta?: any): Promise<void> => {
  return apiClient<void>('/api/logs', {
    method: 'POST',
    body: JSON.stringify({ source: 'client-hook', level, message, meta }),
  });
};