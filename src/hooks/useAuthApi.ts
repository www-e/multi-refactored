import { useSession } from 'next-auth/react';
import { getDashboardKpis, getTickets, getBookings, updateBookingStatus, updateTicketStatus, createVoiceSession, postLog } from '@/lib/apiClient';

/**
 * Custom hook that provides API functions with NextAuth session token
 */
export const useAuthApi = () => {
  const { data: session, status } = useSession();
  const accessToken = (session as any)?.accessToken as string;

  return {
    // Status
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',

    // API functions with access token
    getDashboardKpis: () => getDashboardKpis(accessToken),
    getTickets: () => getTickets(accessToken),
    getBookings: () => getBookings(accessToken),
    updateBookingStatus: (id: string, status: 'confirmed' | 'canceled') => updateBookingStatus(id, status, accessToken),
    updateTicketStatus: (id: string, status: 'in_progress' | 'resolved' | 'closed' | 'pending_approval') => updateTicketStatus(id, status, accessToken),
    createVoiceSession: (agentType: 'support' | 'sales') => createVoiceSession(agentType, accessToken),
    postLog: (level: 'info' | 'warn' | 'error', message: string, meta?: any) => postLog(level, message, meta, accessToken)
  };
};