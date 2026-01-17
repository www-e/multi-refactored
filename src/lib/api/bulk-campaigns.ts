/**
 * Bulk Campaigns API Service
 * Handles all API calls for scripts, campaigns, and results
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
 * Scripts API
 */
export const scriptsApi = {
  // Get all scripts
  getAll: async (): Promise<BulkCallScript[]> => {
    const response = await fetch(`${API_BASE_URL}/scripts`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch scripts');
    }

    const data = await response.json();
    return data.scripts || [];
  },

  // Get single script
  getById: async (id: string): Promise<BulkCallScript> => {
    const response = await fetch(`${API_BASE_URL}/scripts/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch script');
    }

    return response.json();
  },

  // Create new script
  create: async (script: CreateScriptRequest): Promise<BulkCallScript> => {
    const response = await fetch(`${API_BASE_URL}/scripts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(script),
    });

    if (!response.ok) {
      throw new Error('Failed to create script');
    }

    return response.json();
  },

  // Update script
  update: async (id: string, script: Partial<CreateScriptRequest>): Promise<BulkCallScript> => {
    const response = await fetch(`${API_BASE_URL}/scripts/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(script),
    });

    if (!response.ok) {
      throw new Error('Failed to update script');
    }

    return response.json();
  },

  // Delete script
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/scripts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete script');
    }
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
    const response = await fetch(`${API_BASE_URL}/campaigns/bulk`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }

    const data = await response.json();
    return data.campaigns || [];
  },

  // Get single campaign
  getById: async (id: string): Promise<BulkCallCampaign> => {
    const response = await fetch(`${API_BASE_URL}/campaigns/bulk/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaign');
    }

    return response.json();
  },

  // Create and execute campaign
  create: async (campaign: CreateCampaignRequest): Promise<BulkCallCampaign> => {
    const response = await fetch(`${API_BASE_URL}/campaigns/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(campaign),
    });

    if (!response.ok) {
      throw new Error('Failed to create campaign');
    }

    return response.json();
  },

  // Get campaign results
  getResults: async (campaignId: string): Promise<BulkCallResult[]> => {
    const response = await fetch(`${API_BASE_URL}/campaigns/bulk/${campaignId}/results`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaign results');
    }

    const data = await response.json();
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
