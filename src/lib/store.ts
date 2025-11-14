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
import {
  getTickets,
  getBookings,
  getDashboardKpis,
  updateBookingStatus,
  updateTicketStatus
} from './apiClient';

interface AppState {
  // Core data
  customers: Customer[];
  conversations: Conversation[];
  tickets: EnhancedTicket[];
  bookings: EnhancedBooking[];
  campaigns: EnhancedCampaign[];
  properties: Property[];

  // Loading states
  ticketsLoading: boolean;
  bookingsLoading: boolean;
  dashboardLoading: boolean;

  // Dashboard state
  dashboardKPIs: DashboardKPIs;
  liveOps: LiveOps;

  // Actions
  addTicket: (ticket: EnhancedTicket) => void;
  updateTicket: (id: string, updates: Partial<EnhancedTicket>) => void;
  assignTicket: (id: string, assignee: string) => Promise<void>;
  resolveTicket: (id: string, resolution: string) => Promise<void>;
  approveTicket: (id: string, approver: string) => Promise<void>;

  addBooking: (booking: EnhancedBooking) => void;
  updateBooking: (id: string, updates: Partial<EnhancedBooking>) => void;
  approveBooking: (id: string) => Promise<void>;
  rejectBooking: (id: string) => Promise<void>;

  runCampaign: (id: string) => void;
  stopCampaign: (id: string) => void;

  // Data fetching functions
  refreshTickets: () => Promise<void>;
  refreshBookings: () => Promise<void>;
  refreshDashboardKpis: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const initialState = {
  customers: [],
  conversations: [],
  tickets: [],
  bookings: [],
  campaigns: [],
  properties: [],
  ticketsLoading: false,
  bookingsLoading: false,
  dashboardLoading: false,
  dashboardKPIs: {
    totalCalls: 0, answerRate: 0, conversionToBooking: 0, revenue: 0, roas: 0,
    avgHandleTime: 0, csat: 0, missedCalls: 0, aiTransferred: 0, systemStatus: 'AI_يعمل',
    totalCallsChange: 0, answerRateChange: 0, conversionChange: 0, revenueChange: 0,
    roasChange: 0, avgHandleTimeChange: 0, csatChange: 0, monthlyTarget: 2000000,
    qualifiedCount: 0,
  },
  liveOps: {
    currentCalls: [],
    aiTransferredChats: [],
  },
};

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Local actions
      addTicket: (ticket) => set((state) => ({ tickets: [ticket, ...state.tickets] })),
      updateTicket: (id, updates) => set((state) => ({ tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t) })),
      addBooking: (booking) => set((state) => ({ bookings: [booking, ...state.bookings] })),
      updateBooking: (id, updates) => set((state) => ({ bookings: state.bookings.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b) })),
      runCampaign: (id) => set((state) => ({ campaigns: state.campaigns.map(c => c.id === id ? { ...c, status: 'نشطة' } : c) })),
      stopCampaign: (id) => set((state) => ({ campaigns: state.campaigns.map(c => c.id === id ? { ...c, status: 'موقوفة' } : c) })),

      // Async data fetching
      refreshTickets: async () => {
        set({ ticketsLoading: true });
        try {
          const tickets = await getTickets();
          set({ tickets });
        } catch (error) {
          console.error("Error refreshing tickets:", error);
          set({ tickets: [] });
        } finally {
          set({ ticketsLoading: false });
        }
      },
      refreshBookings: async () => {
        set({ bookingsLoading: true });
        try {
          const bookings = await getBookings();
          set({ bookings });
        } catch (error) {
          console.error("Error refreshing bookings:", error);
          set({ bookings: [] });
        } finally {
          set({ bookingsLoading: false });
        }
      },
      refreshAllData: async () => {
        set({ dashboardLoading: true });
        try {
          // Fetch all data in parallel for better performance
          await Promise.all([
            get().refreshTickets(),
            get().refreshBookings(),
            get().refreshDashboardKpis()
          ]);
        } finally {
          set({ dashboardLoading: false });
        }
      },

      refreshDashboardKpis: async () => {
        try {
          const { kpis, liveOps } = await getDashboardKpis();
          set({
            dashboardKPIs: kpis,
            liveOps: liveOps
          });
        } catch (error) {
          console.error("Error refreshing dashboard KPIs:", error);
          // Keep existing data or set to default values
        }
      },

      // Async write actions
      approveBooking: async (id: string) => {
        try {
          await updateBookingStatus(id, 'confirmed');
          set((state) => ({ bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'مؤكد', updatedAt: new Date().toISOString() } : b) }));
        } catch (error) { console.error(`Failed to approve booking ${id}:`, error); }
      },
      
      rejectBooking: async (id: string) => {
        try {
          await updateBookingStatus(id, 'canceled');
          set((state) => ({ bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'ملغي', updatedAt: new Date().toISOString() } : b) }));
        } catch (error) { console.error(`Failed to reject booking ${id}:`, error); }
      },

      assignTicket: async (id: string, assignee: string) => {
        try {
          await updateTicketStatus(id, 'in_progress');
          set((state) => ({
            tickets: state.tickets.map(t => t.id === id ? { ...t, assignee, status: 'قيد_المعالجة', updatedAt: new Date().toISOString() } : t)
          }));
        } catch (error) { console.error(`Failed to assign ticket ${id}:`, error); }
      },

      resolveTicket: async (id: string, resolution: string) => {
        try {
          // FIX: Removed the incorrect, redundant API call. Only call it once with the correct status.
          await updateTicketStatus(id, 'pending_approval');
          set((state) => ({
            tickets: state.tickets.map(t => 
              t.id === id ? { ...t, resolutionNote: resolution, status: 'بانتظار_الموافقة', updatedAt: new Date().toISOString() } : t
            )
          }));
        } catch (error) {
          console.error(`Failed to resolve ticket ${id}:`, error);
        }
      },

      approveTicket: async (id: string, approver: string) => {
        try {
          await updateTicketStatus(id, 'resolved');
          set((state) => ({
            tickets: state.tickets.map(t => 
              t.id === id ? { ...t, approvedBy: approver, status: 'محلولة', updatedAt: new Date().toISOString() } : t
            )
          }));
        } catch(error) {
          console.error(`Failed to approve ticket ${id}:`, error);
        }
      },
    }),
    {
      name: 'navaia-live-store',
    }
  )
);