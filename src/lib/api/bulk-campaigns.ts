/**
 * Bulk Campaigns API Service
 * Handles all API calls for scripts, campaigns, and results
 * Uses Next.js API routes (server-side proxy to backend)
 */

import { clientFetch, ApiError } from '@/lib/apiClient';

export interface BulkCallScript {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  content: string;
  variables?: string[];
  agent_type: string;
  category: string;
  tags?: string[];
  usage_count: number;
  last_used_at?: string;
  created_by: string;
  is_template: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BulkCallCampaign {
  id: string;
  tenant_id: string;
  name: string;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  customer_ids: string[];
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  successful_calls: number;
  script_id?: string;
  script_content: string;
  agent_type: string;
  concurrency_limit: number;
  use_knowledge_base: boolean;
  custom_system_prompt?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface BulkCallResult {
  id: string;
  campaign_id: string;
  tenant_id: string;
  call_id?: string;
  conversation_id?: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  status: 'queued' | 'in_progress' | 'success' | 'failed' | 'voicemail' | 'no_answer' | 'busy' | 'cancelled';
  outcome?: 'interested' | 'not_interested' | 'follow_up_requested' | 'appointment_booked' | 'information_only' | 'wrong_number' | 'do_not_call';
  duration_seconds?: number;
  recording_url?: string;
  error_message?: string;
  twilio_call_sid?: string;
  twilio_status?: string;
  voice_session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScriptRequest {
  name: string;
  description?: string;
  content: string;
  agent_type: string;
  category: string;
  tags?: string[];
  is_template?: boolean;
  variables?: string[];
}

export interface CreateCampaignRequest {
  name: string;
  customer_ids: string[];
  script_id?: string;
  script_content: string;
  agent_type: string;
  concurrency_limit?: number;
  use_knowledge_base?: boolean;
  custom_system_prompt?: string;
}

/**
 * Helper function to get access token from localStorage
 */
const getAccessToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new ApiError('غير مصروف. يرجى تسجيل الدخول.', 401);
  }
  return token;
};

/**
 * Scripts API
 */
export const scriptsApi = {
  // Get all scripts
  getAll: async (): Promise<BulkCallScript[]> => {
    const data = await clientFetch<{ scripts?: BulkCallScript[] }>('/scripts', getAccessToken());
    return data.scripts || [];
  },

  // Get single script
  getById: async (id: string): Promise<BulkCallScript> => {
    return clientFetch<BulkCallScript>(`/scripts/${id}`, getAccessToken());
  },

  // Create new script
  create: async (script: CreateScriptRequest): Promise<BulkCallScript> => {
    return clientFetch<BulkCallScript>('/scripts', getAccessToken(), {
      method: 'POST',
      body: JSON.stringify(script),
    });
  },

  // Update script
  update: async (id: string, script: Partial<CreateScriptRequest>): Promise<BulkCallScript> => {
    return clientFetch<BulkCallScript>(`/scripts/${id}`, getAccessToken(), {
      method: 'PUT',
      body: JSON.stringify(script),
    });
  },

  // Delete script
  delete: async (id: string): Promise<void> => {
    await clientFetch<void>(`/scripts/${id}`, getAccessToken(), {
      method: 'DELETE',
    });
  },

  // Duplicate script
  duplicate: async (id: string): Promise<BulkCallScript> => {
    const original = await scriptsApi.getById(id);
    const duplicate: CreateScriptRequest = {
      name: `${original.name} (نسخة)`,
      description: original.description,
      content: original.content,
      agent_type: original.agent_type,
      category: original.category,
      tags: original.tags,
      variables: original.variables,
      is_template: false,
    };
    return scriptsApi.create(duplicate);
  },
};

/**
 * Campaigns API
 */
export const campaignsApi = {
  // Get all campaigns
  getAll: async (): Promise<BulkCallCampaign[]> => {
    const data = await clientFetch<{ campaigns?: BulkCallCampaign[] }>('/campaigns/bulk', getAccessToken());
    return data.campaigns || [];
  },

  // Get single campaign
  getById: async (id: string): Promise<BulkCallCampaign> => {
    return clientFetch<BulkCallCampaign>(`/campaigns/bulk/${id}`, getAccessToken());
  },

  // Create and execute campaign
  create: async (campaign: CreateCampaignRequest): Promise<BulkCallCampaign> => {
    return clientFetch<BulkCallCampaign>('/campaigns/bulk', getAccessToken(), {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
  },

  // Get campaign results
  getResults: async (campaignId: string): Promise<BulkCallResult[]> => {
    const data = await clientFetch<{ results?: BulkCallResult[] }>(
      `/campaigns/bulk/${campaignId}/results`,
      getAccessToken()
    );
    return data.results || [];
  },
};

/**
 * Utility Functions
 */
export const extractVariables = (content: string): string[] => {
  const regex = /\{(\w+)\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
};

export const formatScriptContent = (content: string, variables: Record<string, string>): string => {
  let formatted = content;
  Object.entries(variables).forEach(([key, value]) => {
    formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  return formatted;
};
