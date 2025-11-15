import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import * as apiClient from '@/lib/apiClient';

/**
 * Custom hook that provides memoized, authenticated API functions.
 * It retrieves the access token from the session and passes it to the API client.
 */
export const useAuthApi = () => {
  const { data: session, status } = useSession();
  
  // CRITICAL FIX: Extract the backend's access token from the session.
  const accessToken = (session as any)?.accessToken as string;

  // All functions are wrapped in useCallback for stability in useEffect hooks.
  // They now pass the accessToken to the apiClient.
  const getDashboardKpis = useCallback(() => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.getDashboardKpis(accessToken);
  }, [accessToken]);

  const getTickets = useCallback(() => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.getTickets(accessToken);
  }, [accessToken]);

  const getBookings = useCallback(() => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.getBookings(accessToken);
  }, [accessToken]);
  
  const updateBookingStatus = useCallback((id: string, status: 'confirmed' | 'canceled') => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.updateBookingStatus(id, status, accessToken);
  }, [accessToken]);
  
  const updateTicketStatus = useCallback((id: string, status: 'in_progress' | 'resolved' | 'closed' | 'pending_approval') => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.updateTicketStatus(id, status, accessToken);
  }, [accessToken]);

  const createVoiceSession = useCallback((agentType: 'support' | 'sales') => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.createVoiceSession(agentType, accessToken);
  }, [accessToken]);
    
  const postLog = useCallback((level: 'info' | 'warn' | 'error', message: string, meta?: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.postLog(level, message, meta, accessToken);
  }, [accessToken]);

  return {
    isAuthenticated: status === 'authenticated' && !!accessToken,
    isLoading: status === 'loading',
    
    // Return the stable, memoized, and now correctly authenticated functions
    getDashboardKpis,
    getTickets,
    getBookings,
    updateBookingStatus,
    updateTicketStatus,
    createVoiceSession,
    postLog
  };
};