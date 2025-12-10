import { EnhancedBooking, EnhancedTicket, DashboardKPIs, LiveOps, Customer, EnhancedCampaign } from "@/app/(shared)/types";
import { mapCallStatusToArabic } from "@/lib/statusMapper";

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

// Helper function to transform backend customer data to frontend Customer interface
const transformCustomer = (customer: any): Customer => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone,
  email: customer.email,
  budget: customer.budget,
  // Convert neighborhoods from JSON to array if needed
  neighborhoods: Array.isArray(customer.neighborhoods) ? customer.neighborhoods : (customer.neighborhoods ? [customer.neighborhoods] : []),
  // Default stage if not provided by backend (can be calculated based on customer history)
  stage: customer.stage || 'جديد',
  consents: customer.consents || {
    marketing: customer.consent || true,
    recording: true,
    whatsapp: true
  },
  createdAt: customer.created_at,
  updatedAt: customer.updated_at || customer.created_at
});

export const getCustomers = (token: string): Promise<Customer[]> =>
  clientFetch('/customers', token).then((customers: unknown) => {
    const custArray = Array.isArray(customers) ? customers : [];
    return custArray.map(transformCustomer);
  });

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
  }).then(transformCustomer);
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
  token: string,
  customerId?: string,
  customerPhone?: string
): Promise<{ session_id: string; status: string; agent_type: string; customer_id?: string; created_at: string }> => {
  return clientFetch('/voice/sessions', token, {
    method: 'POST',
    body: JSON.stringify({
      agent_type: agentType,
      customer_id: customerId,
      customer_phone: customerPhone
    }),
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

export const createBooking = (data: {
  customerId: string;
  propertyCode: string;
  startDate: string;
  price: number;
  source: 'voice' | 'chat';
}, token: string): Promise<EnhancedBooking> => {
  return clientFetch('/bookings', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getCampaigns = (token: string): Promise<EnhancedCampaign[]> =>
  clientFetch('/campaigns', token);

export const createCampaign = (data: {
  name: string;
  type: 'voice' | 'chat';
  objective: 'bookings' | 'renewals' | 'leadgen' | 'upsell';
  audienceQuery?: any;
}, token: string): Promise<EnhancedCampaign> => {
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
  }).then(transformCustomer);
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

export const deleteBooking = (
  id: string,
  token: string
): Promise<null> => {
  return clientFetch<null>(`/bookings/${id}`, token, {
    method: 'DELETE',
  });
};

export const deleteTicket = (
  id: string,
  token: string
): Promise<null> => {
  return clientFetch<null>(`/tickets/${id}`, token, {
    method: 'DELETE',
  });
};

export const makeCall = (
  data: {
    customer_id: string;
    phone: string;
    direction?: string;
    agent_type?: string;
    campaign_id?: string;
  },
  token: string
): Promise<any> => {
  return clientFetch('/calls', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const makeBulkCalls = (
  customer_ids: string[],
  token: string
): Promise<any> => {
  return clientFetch('/calls/bulk', token, {
    method: 'POST',
    body: JSON.stringify({ customer_ids }),
  });
};

export const sendCustomerMessage = (
  data: {
    customer_id: string;
    message: string;
    channel?: string;
  },
  token: string
): Promise<any> => {
  return clientFetch('/chat/customer', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getConversations = (token: string): Promise<any[]> => {
  return clientFetch('/conversations', token).then((convs: unknown) => {
    const conversations = Array.isArray(convs) ? convs : [];
    return conversations.map((conv: any) => ({
      ...conv,
      customerId: conv.customer_id,  // Convert snake_case to camelCase
      type: conv.channel === 'voice' ? 'صوت' : 'رسالة', // Map channel to Arabic type
      createdAt: conv.created_at,
      // Add other fields as needed to match the Conversation interface
      transcript: conv.transcript || [],
      entities: conv.entities || {},
      sentiment: conv.sentiment || 'محايد',
      recordingUrl: conv.recording_url,
      status: conv.status || 'مفتوحة',
      assignedTo: conv.assigned_to,
      updatedAt: conv.updated_at || conv.created_at
    }));
  });
};

// Helper function to transform backend call data to frontend format
const transformCall = (call: any) => ({
  ...call,
  // Map snake_case backend fields to camelCase for consistency
  customerId: call.customer_id,
  conversationId: call.conversation_id,
  direction: call.direction === 'outbound' ? 'صادر' : 'وارد', // Map to Arabic direction
  status: mapCallStatusToArabic(call.status || 'unknown'),
  outcome: call.outcome,
  handleSec: call.handle_sec,
  aiOrHuman: call.ai_or_human,
  recordingUrl: call.recording_url,
  createdAt: call.created_at,
  updatedAt: call.updated_at || call.created_at,
  // Add voice session fields if they exist in the backend response
  voiceSessionId: call.voice_session_id || call.session_id,
  extractedIntent: call.extracted_intent,
  sessionSummary: call.summary,
  agentName: call.agent_name,
  sessionStatus: call.session_status
});

export const getCalls = (token: string): Promise<any[]> => {
  return clientFetch('/calls', token).then((calls: unknown) => {
    const callsArray = Array.isArray(calls) ? calls : [];
    return callsArray.map(transformCall);
  });
};

export const getCall = (id: string, token: string): Promise<any> => {
  return clientFetch(`/calls/${id}`, token).then((call: any) => {
    return transformCall(call);
  });
};

export interface VoiceSession {
  id: string;
  tenant_id: string;
  customer_id?: string;
  direction: string;
  status: string;
  created_at: string;
  ended_at?: string;
  conversation_id?: string;
  agent_name?: string;
  customer_phone?: string;
  summary?: string;
  extracted_intent?: string;
}

export const getVoiceSessions = (token: string): Promise<VoiceSession[]> => {
  return clientFetch('/voice/sessions', token);
};