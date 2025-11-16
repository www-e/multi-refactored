import { EnhancedBooking, EnhancedTicket, DashboardKPIs, LiveOps, Customer, EnhancedCampaign } from "@/app/(shared)/types";

// PRODUCTION-READY ERROR HANDLING: A custom error class for API-specific issues.
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// CENTRALIZED FETCHER: A single, robust function to handle all client-side API calls.
async function clientFetch<T>(
  endpoint: string,
  accessToken: string,
  options?: RequestInit
): Promise<T> {
  const url = `/api${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({
        error: `API request failed with status ${response.status}`
      }));
      console.error(`Client API Error on ${endpoint}:`, response.status, errorBody);
      throw new ApiError(
        errorBody.detail || errorBody.error || 'فشل الطلب',
        response.status,
        errorBody.detail
      );
    }

    // Handle responses with no content (e.g., PATCH, DELETE, POST returning 204)
    if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) {
      return null as T; // Return null explicitly for void/empty responses
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error; // Re-throw known API errors
    console.error(`Client Network Error on ${endpoint}:`, error);
    // Throw a generic network error for fetch failures (e.g., server is down)
    throw new ApiError('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
  }
}

// --- API Functions ---

export const getDashboardKpis = (token: string): Promise<{ kpis: DashboardKPIs; liveOps: LiveOps }> =>
  clientFetch('/dashboard', token);

export const getBookings = (token: string): Promise<EnhancedBooking[]> =>
  clientFetch('/bookings/recent', token);

export const getTickets = (token: string): Promise<EnhancedTicket[]> =>
  clientFetch('/tickets/recent', token);

export const getCustomers = (token: string): Promise<Customer[]> =>
  clientFetch('/customers', token);

export const createCustomer = (
  data: {
    name: string;
    phone: string;
    email?: string;
  },
  token: string
): Promise<Customer> => {
  return clientFetch('/customers', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// CORRECTED DATA CONTRACT
export const createTicket = (
  data: {
    customerId: string;
    category: string;
    priority: string;
    project: string;
    issue: string;
  },
  token: string
): Promise<EnhancedTicket> => {
  return clientFetch('/tickets', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateBookingStatus = (
  id: string,
  status: 'confirmed' | 'canceled',
  token: string
): Promise<null> => {
  return clientFetch<null>(`/bookings/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const updateTicketStatus = (
  id: string,
  status: 'in_progress' | 'resolved' | 'closed' | 'pending_approval',
  token: string
): Promise<null> => {
  return clientFetch<null>(`/tickets/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const createVoiceSession = (
  agentType: 'support' | 'sales',
  token: string
): Promise<{ session_id: string; websocket_url: string }> => {
  return clientFetch('/voice/sessions', token, {
    method: 'POST',
    body: JSON.stringify({ agent_type: agentType }),
  });
};

export const postLog = (
  level: 'info' | 'warn' | 'error',
  message: string,
  meta: Record<string, any>,
  token: string
): Promise<null> => {
  return clientFetch<null>('/logs', token, {
    method: 'POST',
    body: JSON.stringify({ source: 'client-hook', level, message, meta }),
  });
};

export const createBooking = (data: any, token: string): Promise<EnhancedBooking> => {
  return clientFetch('/bookings', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getCampaigns = (token: string): Promise<EnhancedCampaign[]> =>
  clientFetch('/campaigns', token);

export const createCampaign = (data: any, token: string): Promise<EnhancedCampaign> => {
  return clientFetch('/campaigns', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCustomer = (
  id: string,
  data: {
    name: string;
    phone: string;
    email?: string;
  },
  token: string
): Promise<Customer> => {
  return clientFetch(`/customers/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteCustomer = (
  id: string,
  token: string
): Promise<null> => {
  return clientFetch<null>(`/customers/${id}`, token, {
    method: 'DELETE',
  });
};

export const updateCampaign = (
  id: string,
  data: {
    name?: string;
    objective?: string;
    audienceQuery?: any;
    status?: string;
  },
  token: string
): Promise<EnhancedCampaign> => {
  return clientFetch(`/campaigns/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteCampaign = (
  id: string,
  token: string
): Promise<null> => {
  return clientFetch<null>(`/campaigns/${id}`, token, {
    method: 'DELETE',
  });
};

export const updateBooking = (
  id: string,
  data: {
    propertyCode?: string;
    startDate?: string;
    price?: number;
    assignee?: string;
  },
  token: string
): Promise<EnhancedBooking> => {
  return clientFetch(`/bookings/${id}/general`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const updateTicket = (
  id: string,
  data: {
    category?: string;
    issue?: string;
    project?: string;
    priority?: string;
    assignee?: string;
  },
  token: string
): Promise<EnhancedTicket> => {
  return clientFetch(`/tickets/${id}/general`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};