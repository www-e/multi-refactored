import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';
import * as apiClient from '@/lib/apiClient';
import { Customer } from '@/app/(shared)/types';
import { mapBookingStatusToEnglish } from '@/lib/statusMapper';

/**
 * Custom hook that provides memoized, authenticated API functions with loading states.
 */
export const useAuthApi = () => {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken as string;

  // Loading states for different operations
  const [loadingStates, setLoadingStates] = useState({
    getDashboardKpis: false,
    getTickets: false,
    getBookings: false,
    getCustomers: false,
    createCustomer: false,
    updateCustomer: false,
    deleteCustomer: false,
    updateBookingStatus: false,
    updateBookingStatusWithMapping: false,
    updateTicketStatus: false,
    createVoiceSession: false,
    postLog: false,
    createTicket: false,
    createBooking: false,
    getCampaigns: false,
    createCampaign: false,
    updateCampaign: false,
    deleteCampaign: false,
    updateBooking: false,
    updateTicket: false,
    deleteBooking: false,
    deleteTicket: false,
    makeCall: false,
    makeBulkCalls: false,
    sendCustomerMessage: false,
    getConversations: false,
    getCalls: false,
    getCall: false,
    getVoiceSessions: false,
    getTranscript: false,
    getMessages: false,
  });

  const updateLoadingState = (operation: keyof typeof loadingStates, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [operation]: isLoading }));
  };

  const getDashboardKpis = useCallback(async () => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getDashboardKpis', true);
    try {
      const result = await apiClient.getDashboardKpis(accessToken);
      return result;
    } finally {
      updateLoadingState('getDashboardKpis', false);
    }
  }, [accessToken]);

  const getTickets = useCallback(async () => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getTickets', true);
    try {
      const result = await apiClient.getTickets(accessToken);
      return result;
    } finally {
      updateLoadingState('getTickets', false);
    }
  }, [accessToken]);

  const getAllTickets = useCallback(async () => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getTickets', true);
    try {
      const result = await apiClient.getAllTickets(accessToken);
      return result;
    } finally {
      updateLoadingState('getTickets', false);
    }
  }, [accessToken]);

  const getBookings = useCallback(async () => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getBookings', true);
    try {
      const result = await apiClient.getBookings(accessToken);
      return result;
    } finally {
      updateLoadingState('getBookings', false);
    }
  }, [accessToken]);

  const getCustomers = useCallback(async () => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getCustomers', true);
    try {
      const result = await apiClient.getCustomers(accessToken);
      return result;
    } finally {
      updateLoadingState('getCustomers', false);
    }
  }, [accessToken]);

  const createCustomer = useCallback(async (data: { name: string; phone: string; email?: string; }) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('createCustomer', true);
    try {
      const result = await apiClient.createCustomer(data, accessToken);
      return result;
    } finally {
      updateLoadingState('createCustomer', false);
    }
  }, [accessToken]);

  const updateCustomer = useCallback(async (id: string, data: { name: string; phone: string; email?: string; }) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('updateCustomer', true);
    try {
      const result = await apiClient.updateCustomer(id, data, accessToken);
      return result;
    } finally {
      updateLoadingState('updateCustomer', false);
    }
  }, [accessToken]);

  const deleteCustomer = useCallback(async (id: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('deleteCustomer', true);
    try {
      const result = await apiClient.deleteCustomer(id, accessToken);
      return result;
    } finally {
      updateLoadingState('deleteCustomer', false);
    }
  }, [accessToken]);

  const updateBookingStatus = useCallback(async (id: string, status: 'confirmed' | 'canceled') => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('updateBookingStatus', true);
    try {
      const result = await apiClient.updateBookingStatus(id, status, accessToken);
      return result;
    } finally {
      updateLoadingState('updateBookingStatus', false);
    }
  }, [accessToken]);

  const updateBookingStatusWithMapping = useCallback(async (id: string, status: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('updateBookingStatusWithMapping', true);
    try {
      const englishStatus = mapBookingStatusToEnglish(status);
      const result = await apiClient.updateBookingStatus(id, englishStatus as 'confirmed' | 'canceled', accessToken);
      return result;
    } finally {
      updateLoadingState('updateBookingStatusWithMapping', false);
    }
  }, [accessToken]);

  const updateTicketStatus = useCallback(async (id: string, status: 'in_progress' | 'resolved' | 'closed') => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('updateTicketStatus', true);
    try {
      const result = await apiClient.updateTicketStatus(id, status, accessToken);
      return result;
    } finally {
      updateLoadingState('updateTicketStatus', false);
    }
  }, [accessToken]);

  const createVoiceSession = useCallback(async (agentType: 'support' | 'sales', customerId?: string, customerPhone?: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('createVoiceSession', true);
    try {
      const result = await apiClient.createVoiceSession(agentType, accessToken, customerId, customerPhone);
      return result;
    } finally {
      updateLoadingState('createVoiceSession', false);
    }
  }, [accessToken]);

  const postLog = useCallback(async (level: 'info' | 'warn' | 'error', message: string, meta?: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('postLog', true);
    try {
      const result = await apiClient.postLog(level, message, meta, accessToken);
      return result;
    } finally {
      updateLoadingState('postLog', false);
    }
  }, [accessToken]);

  const createTicket = useCallback(async (data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('createTicket', true);
    try {
      const result = await apiClient.createTicket(data, accessToken);
      return result;
    } finally {
      updateLoadingState('createTicket', false);
    }
  }, [accessToken]);

  const createBooking = useCallback(async (data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('createBooking', true);
    try {
      const result = await apiClient.createBooking(data, accessToken);
      return result;
    } finally {
      updateLoadingState('createBooking', false);
    }
  }, [accessToken]);

  const getCampaigns = useCallback(async () => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getCampaigns', true);
    try {
      const result = await apiClient.getCampaigns(accessToken);
      return result;
    } finally {
      updateLoadingState('getCampaigns', false);
    }
  }, [accessToken]);

  const createCampaign = useCallback(async (data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('createCampaign', true);
    try {
      const result = await apiClient.createCampaign(data, accessToken);
      return result;
    } finally {
      updateLoadingState('createCampaign', false);
    }
  }, [accessToken]);

  const updateCampaign = useCallback(async (id: string, data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('updateCampaign', true);
    try {
      const result = await apiClient.updateCampaign(id, data, accessToken);
      return result;
    } finally {
      updateLoadingState('updateCampaign', false);
    }
  }, [accessToken]);

  const deleteCampaign = useCallback(async (id: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('deleteCampaign', true);
    try {
      const result = await apiClient.deleteCampaign(id, accessToken);
      return result;
    } finally {
      updateLoadingState('deleteCampaign', false);
    }
  }, [accessToken]);

  const updateBooking = useCallback(async (id: string, data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('updateBooking', true);
    try {
      const result = await apiClient.updateBooking(id, data, accessToken);
      return result;
    } finally {
      updateLoadingState('updateBooking', false);
    }
  }, [accessToken]);

  const updateTicket = useCallback(async (id: string, data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('updateTicket', true);
    try {
      const result = await apiClient.updateTicket(id, data, accessToken);
      return result;
    } finally {
      updateLoadingState('updateTicket', false);
    }
  }, [accessToken]);

  const deleteBooking = useCallback(async (id: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('deleteBooking', true);
    try {
      const result = await apiClient.deleteBooking(id, accessToken);
      return result;
    } finally {
      updateLoadingState('deleteBooking', false);
    }
  }, [accessToken]);

  const deleteTicket = useCallback(async (id: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('deleteTicket', true);
    try {
      const result = await apiClient.deleteTicket(id, accessToken);
      return result;
    } finally {
      updateLoadingState('deleteTicket', false);
    }
  }, [accessToken]);

  const makeCall = useCallback(async (data: { customer_id: string; phone: string; direction?: string; agent_type?: string; campaign_id?: string; }) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('makeCall', true);
    try {
      const result = await apiClient.makeCall(data, accessToken);
      return result;
    } finally {
      updateLoadingState('makeCall', false);
    }
  }, [accessToken]);

  const makeBulkCalls = useCallback(async (customer_ids: string[]) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('makeBulkCalls', true);
    try {
      const result = await apiClient.makeBulkCalls(customer_ids, accessToken);
      return result;
    } finally {
      updateLoadingState('makeBulkCalls', false);
    }
  }, [accessToken]);

  const sendCustomerMessage = useCallback(async (data: { customer_id: string; message: string; channel?: string; agentType?: string; }) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('sendCustomerMessage', true);
    try {
      const result = await apiClient.sendCustomerMessage(data, accessToken);
      return result;
    } finally {
      updateLoadingState('sendCustomerMessage', false);
    }
  }, [accessToken]);

  const getConversations = useCallback(async () => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getConversations', true);
    try {
      const result = await apiClient.getConversations(accessToken);
      return result;
    } finally {
      updateLoadingState('getConversations', false);
    }
  }, [accessToken]);

  const getConversation = useCallback(async (conversationId: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getConversations', true); // Reuse the same loading state
    try {
      const result = await apiClient.getConversation(conversationId, accessToken);
      return result;
    } finally {
      updateLoadingState('getConversations', false);
    }
  }, [accessToken]);

  const getCalls = useCallback(async () => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getCalls', true);
    try {
      const result = await apiClient.getCalls(accessToken);
      return result;
    } finally {
      updateLoadingState('getCalls', false);
    }
  }, [accessToken]);

  const getCall = useCallback(async (id: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getCall', true);
    try {
      const result = await apiClient.getCall(id, accessToken);
      return result;
    } finally {
      updateLoadingState('getCall', false);
    }
  }, [accessToken]);

  const getVoiceSessions = useCallback(async () => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getVoiceSessions', true);
    try {
      const result = await apiClient.getVoiceSessions(accessToken);
      return result;
    } finally {
      updateLoadingState('getVoiceSessions', false);
    }
  }, [accessToken]);

  const getTranscript = useCallback(async (conversationId: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getTranscript', true);
    try {
      const result = await apiClient.getTranscript(conversationId, accessToken);
      return result;
    } finally {
      updateLoadingState('getTranscript', false);
    }
  }, [accessToken]);

  const getMessages = useCallback(async (conversationId?: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    updateLoadingState('getMessages', true);
    try {
      const result = await apiClient.getMessages(accessToken, conversationId);
      return result;
    } finally {
      updateLoadingState('getMessages', false);
    }
  }, [accessToken]);

  return {
    loadingStates,
    isAuthenticated: status === 'authenticated' && !!accessToken,
    isLoading: status === 'loading',
    isTranscriptLoading: loadingStates.getTranscript,

    getDashboardKpis,
    getTickets,
    getAllTickets,
    getBookings,
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateBookingStatus,
    updateBookingStatusWithMapping,
    updateTicketStatus,
    createVoiceSession,
    postLog,
    createTicket,
    createBooking,
    getCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    updateBooking,
    updateTicket,
    deleteBooking,
    deleteTicket,
    makeCall,
    makeBulkCalls,
    sendCustomerMessage,
    getConversations,
    getCalls,
    getCall,
    getVoiceSessions,
    getTranscript,
    getMessages,
    getConversation,
  };
};