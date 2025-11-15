import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Customer,
  Conversation,
  EnhancedTicket,
  EnhancedBooking,
  EnhancedCampaign,
  DashboardKPIs,
  LiveOps,
  Property
} from '@/app/(shared)/types';

interface AppState {
  // Core data
  customers: Customer[];
  conversations: Conversation[];
  tickets: EnhancedTicket[];
  bookings: EnhancedBooking[];
  campaigns: EnhancedCampaign[];
  properties: Property[];
  // Loading states
  customersLoading: boolean; // ADDED
  ticketsLoading: boolean;
  bookingsLoading: boolean;
  dashboardLoading: boolean;
  // Dashboard state
  dashboardKPIs: DashboardKPIs;
  liveOps: LiveOps;
  // Actions
  setCustomers: (customers: Customer[]) => void; // ADDED
  setTickets: (tickets: EnhancedTicket[]) => void;
  setBookings: (bookings: EnhancedBooking[]) => void;
  setDashboardData: (data: { kpis: DashboardKPIs, liveOps: LiveOps }) => void;
  setCustomersLoading: (isLoading: boolean) => void; // ADDED
  setTicketsLoading: (isLoading: boolean) => void;
  setBookingsLoading: (isLoading: boolean) => void;
  setDashboardLoading: (isLoading: boolean) => void;
  // Optimistic UI update actions
  addCustomer: (customer: Customer) => void; // ADDED
  updateTicket: (id: string, updates: Partial<EnhancedTicket>) => void;
  updateBooking: (id: string, updates: Partial<EnhancedBooking>) => void;
  runCampaign: (id: string) => void;
  stopCampaign: (id: string) => void;
}

const initialState = {
  customers: [],
  conversations: [],
  tickets: [],
  bookings: [],
  campaigns: [],
  properties: [],
  customersLoading: true, // ADDED
  ticketsLoading: true,
  bookingsLoading: true,
  dashboardLoading: true,
  dashboardKPIs: {
    totalCalls: 0, answerRate: 0, conversionToBooking: 0, revenue: 0, roas: 0,
    avgHandleTime: 0, csat: 0, missedCalls: 0, aiTransferred: 0, systemStatus: 'AI_يعمل',
  },
  liveOps: {
    currentCalls: [],
    aiTransferredChats: [],
  },
};

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      ...initialState,
      // --- Setter Actions ---
      setCustomers: (customers) => set({ customers, customersLoading: false }),
      setTickets: (tickets) => set({ tickets, ticketsLoading: false }),
      setBookings: (bookings) => set({ bookings, bookingsLoading: false }),
      setDashboardData: (data) => set({ dashboardKPIs: data.kpis, liveOps: data.liveOps, dashboardLoading: false }),
      setCustomersLoading: (isLoading) => set({ customersLoading: isLoading }),
      setTicketsLoading: (isLoading) => set({ ticketsLoading: isLoading }),
      setBookingsLoading: (isLoading) => set({ bookingsLoading: isLoading }),
      setDashboardLoading: (isLoading) => set({ dashboardLoading: isLoading }),
      // --- Local UI Update Actions ---
      addCustomer: (customer) => set((state) => ({ customers: [customer, ...state.customers] })),
      updateTicket: (id, updates) => set((state) => ({
        tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      updateBooking: (id, updates) => set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, ...updates } : b)
      })),
      runCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.map(c => c.id === id ? { ...c, status: 'نشطة' } : c)
      })),
      stopCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.map(c => c.id === id ? { ...c, status: 'موقوفة' } : c)
      })),
    }),
    {
      name: 'navaia-app-store',
    }
  )
);