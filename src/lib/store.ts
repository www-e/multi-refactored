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
  Property,
  Call
} from '@/app/(shared)/types';


interface AppState {
  // Core data
  customers: Customer[];
  conversations: Conversation[];
  calls: Call[]; // Array to hold call data from backend
  tickets: EnhancedTicket[];
  bookings: EnhancedBooking[];
  campaigns: EnhancedCampaign[];
  properties: Property[];
  // Loading states
  customersLoading: boolean;
  conversationsLoading: boolean;
  callsLoading: boolean;
  ticketsLoading: boolean;
  bookingsLoading: boolean;
  dashboardLoading: boolean;
  campaignsLoading: boolean;
  // Dashboard state
  dashboardKPIs: DashboardKPIs;
  liveOps: LiveOps;
  // Actions
  setCustomers: (customers: Customer[]) => void;
  setConversations: (conversations: Conversation[]) => void;
  setCalls: (calls: any[]) => void;
  setTickets: (tickets: EnhancedTicket[]) => void;
  setBookings: (bookings: EnhancedBooking[]) => void;
  setDashboardData: (data: { kpis: DashboardKPIs, liveOps: LiveOps }) => void;
  setCampaigns: (campaigns: EnhancedCampaign[]) => void;
  setCustomersLoading: (isLoading: boolean) => void;
  setConversationsLoading: (isLoading: boolean) => void;
  setCallsLoading: (isLoading: boolean) => void;
  setTicketsLoading: (isLoading: boolean) => void;
  setBookingsLoading: (isLoading: boolean) => void;
  setDashboardLoading: (isLoading: boolean) => void;
  setCampaignsLoading: (isLoading: boolean) => void;
  // Optimistic UI update actions
  addCustomer: (customer: Customer) => void;
  addTicket: (ticket: EnhancedTicket) => void;
  addBooking: (booking: EnhancedBooking) => void;
  addCampaign: (campaign: EnhancedCampaign) => void;
  updateTicket: (id: string, updates: Partial<EnhancedTicket>) => void;
  updateBooking: (id: string, updates: Partial<EnhancedBooking>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  updateCampaign: (id: string, updates: Partial<EnhancedCampaign>) => void;
  removeCustomer: (id: string) => void;
  removeBooking: (id: string) => void;
  removeTicket: (id: string) => void;
  removeCampaign: (id: string) => void;
  runCampaign: (id: string) => void;
  stopCampaign: (id: string) => void;
}


const initialState = {
  customers: [],
  conversations: [],
  calls: [],
  tickets: [],
  bookings: [],
  campaigns: [],
  properties: [],
  customersLoading: true,
  conversationsLoading: true,
  callsLoading: true,
  ticketsLoading: true,
  bookingsLoading: true,
  dashboardLoading: true,
  campaignsLoading: true,
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
      setConversations: (conversations) => set({ conversations, conversationsLoading: false }),
      setCalls: (calls) => set({ calls, callsLoading: false }),
      setTickets: (tickets) => set({ tickets, ticketsLoading: false }),
      setBookings: (bookings) => set({ bookings, bookingsLoading: false }),
      setDashboardData: (data) => set({ dashboardKPIs: data.kpis, liveOps: data.liveOps, dashboardLoading: false }),
      setCampaigns: (campaigns) => set({ campaigns, campaignsLoading: false }),
      setCustomersLoading: (isLoading) => set({ customersLoading: isLoading }),
      setConversationsLoading: (isLoading) => set({ conversationsLoading: isLoading }),
      setCallsLoading: (isLoading) => set({ callsLoading: isLoading }),
      setTicketsLoading: (isLoading) => set({ ticketsLoading: isLoading }),
      setBookingsLoading: (isLoading) => set({ bookingsLoading: isLoading }),
      setDashboardLoading: (isLoading) => set({ dashboardLoading: isLoading }),
      setCampaignsLoading: (isLoading) => set({ campaignsLoading: isLoading }),
      
      // --- Local UI Update Actions ---
      addCustomer: (customer) => set((state) => ({ customers: [customer, ...state.customers] })),
      addTicket: (ticket) => set((state) => ({ tickets: [ticket, ...state.tickets] })),
      addBooking: (booking) => set((state) => ({ bookings: [booking, ...state.bookings] })),
      addCampaign: (campaign) => set((state) => ({ campaigns: [campaign, ...state.campaigns] })),
      
      updateTicket: (id, updates) => set((state) => ({
        tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      updateBooking: (id, updates) => set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, ...updates } : b)
      })),
      updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      removeCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),
      removeBooking: (id) => set((state) => ({
        bookings: state.bookings.filter(b => b.id !== id)
      })),
      removeTicket: (id) => set((state) => ({
        tickets: state.tickets.filter(t => t.id !== id)
      })),
      updateCampaign: (id, updates) => set((state) => ({
        campaigns: state.campaigns.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      removeCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.filter(c => c.id !== id)
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
