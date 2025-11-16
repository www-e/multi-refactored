import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import * as apiClient from '@/lib/apiClient';
import { Customer } from '@/app/(shared)/types';

/**
 * Custom hook that provides memoized, authenticated API functions.
 */
export const useAuthApi = () => {
  const { data: session, status } = useSession();
  const accessToken = (session as any)?.accessToken as string;

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

  const getCustomers = useCallback(() => { // <-- ADDED
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.getCustomers(accessToken);
  }, [accessToken]);

  const createCustomer = useCallback((data: { name: string; phone: string; email?: string; }) => { // <-- ADDED
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.createCustomer(data, accessToken);
  }, [accessToken]);
  
  const updateCustomer = useCallback((id: string, data: { name: string; phone: string; email?: string; }) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.updateCustomer(id, data, accessToken);
  }, [accessToken]);

  const deleteCustomer = useCallback((id: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.deleteCustomer(id, accessToken);
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

  const createTicket = useCallback((data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.createTicket(data, accessToken);
  }, [accessToken]);

const createBooking = useCallback((data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.createBooking(data, accessToken);
  }, [accessToken]);

  const getCampaigns = useCallback(() => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.getCampaigns(accessToken);
  }, [accessToken]);

  const createCampaign = useCallback((data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.createCampaign(data, accessToken);
  }, [accessToken]);

  const updateCampaign = useCallback((id: string, data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.updateCampaign(id, data, accessToken);
  }, [accessToken]);

  const deleteCampaign = useCallback((id: string) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.deleteCampaign(id, accessToken);
  }, [accessToken]);

  const updateBooking = useCallback((id: string, data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.updateBooking(id, data, accessToken);
  }, [accessToken]);

  const updateTicket = useCallback((id: string, data: any) => {
    if (!accessToken) return Promise.reject(new Error("Not authenticated"));
    return apiClient.updateTicket(id, data, accessToken);
  }, [accessToken]);

  return {
    isAuthenticated: status === 'authenticated' && !!accessToken,
    isLoading: status === 'loading',
    
    getDashboardKpis,
    getTickets,
    getBookings,
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateBookingStatus,
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
  };
};