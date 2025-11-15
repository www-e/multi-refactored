import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import * as apiClient from '@/lib/apiClient';

/**
 * Custom hook that provides memoized, authenticated API functions.
 * This is the primary way components should interact with the API.
 */
export const useAuthApi = () => {
  const { data: session, status } = useSession();
  
  // The token is no longer needed here, as the apiClient doesn't use it.
  // The API routes on the server handle the token.

  // By wrapping each function in useCallback, we ensure they have a stable
  // reference, which prevents infinite loops in useEffect hooks.
  const getDashboardKpis = useCallback(() => apiClient.getDashboardKpis(), []);
  const getTickets = useCallback(() => apiClient.getTickets(), []);
  const getBookings = useCallback(() => apiClient.getBookings(), []);
  
  const updateBookingStatus = useCallback((id: string, status: 'confirmed' | 'canceled') => 
    apiClient.updateBookingStatus(id, status), []);
  
  const updateTicketStatus = useCallback((id: string, status: 'in_progress' | 'resolved' | 'closed' | 'pending_approval') => 
    apiClient.updateTicketStatus(id, status), []);

  const createVoiceSession = useCallback((agentType: 'support' | 'sales') => 
    apiClient.createVoiceSession(agentType), []);
    
  const postLog = useCallback((level: 'info' | 'warn' | 'error', message: string, meta?: any) => 
    apiClient.postLog(level, message, meta), []);

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    
    // Return the stable, memoized functions
    getDashboardKpis,
    getTickets,
    getBookings,
    updateBookingStatus,
    updateTicketStatus,
    createVoiceSession,
    postLog
  };
};