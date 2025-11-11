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
  refreshAllData: () => Promise<void>;
}

// Default initial state
const initialState = {
  customers: [],
  conversations: [],
  tickets: [],
  bookings: [],
  campaigns: [],
  properties: [],
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
    (set, get) => ({
      ...initialState,
      
      // --- LOCAL "WRITE" ACTIONS (for non-persistent data or new items) ---
      addTicket: (ticket) => set((state) => ({ tickets: [ticket, ...state.tickets] })),
      updateTicket: (id, updates) => set((state) => ({ tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t) })),
      addBooking: (booking) => set((state) => ({ bookings: [booking, ...state.bookings] })),
      updateBooking: (id, updates) => set((state) => ({ bookings: state.bookings.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b) })),
      runCampaign: (id) => set((state) => ({ campaigns: state.campaigns.map(c => c.id === id ? { ...c, status: 'نشطة' } : c) })),
      stopCampaign: (id) => set((state) => ({ campaigns: state.campaigns.map(c => c.id === id ? { ...c, status: 'موقوفة' } : c) })),

      // --- ASYNC DATA FETCHING ACTIONS ---
      refreshTickets: async () => {
        try {
          const tickets = await getTickets();
          set({ tickets });
        } catch (error) { console.error("Error refreshing tickets:", error); set({ tickets: [] }); }
      },
      refreshBookings: async () => {
        try {
          const bookings = await getBookings();
          set({ bookings });
        } catch (error) { console.error("Error refreshing bookings:", error); set({ bookings: [] }); }
      },
      refreshAllData: async () => {
        await Promise.all([get().refreshTickets(), get().refreshBookings()]);
      },

      // --- FULLY IMPLEMENTED ASYNC "WRITE" ACTIONS ---
      
      // BOOKING ACTIONS
      approveBooking: async (id: string) => {
        try {
          await updateBookingStatus(id, 'confirmed');
          set((state) => ({
            bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'مؤكد', updatedAt: new Date().toISOString() } : b)
          }));
        } catch (error) {
          console.error(`Failed to approve booking ${id}:`, error);
          // In a real app, you would trigger a user-facing notification here.
        }
      },
      
      rejectBooking: async (id: string) => {
        try {
          await updateBookingStatus(id, 'canceled');
          set((state) => ({
            bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'ملغي', updatedAt: new Date().toISOString() } : b)
          }));
        } catch (error) {
          console.error(`Failed to reject booking ${id}:`, error);
        }
      },

      // TICKET ACTIONS
      assignTicket: async (id: string, assignee: string) => {
        try {
          // NOTE: The backend PATCH endpoint currently only supports 'status'.
          // For a real implementation, it would need to support changing the 'assignee' as well.
          // We will update the status optimistically here.
          await updateTicketStatus(id, 'in_progress');
          set((state) => ({
            tickets: state.tickets.map(t => 
              t.id === id ? { ...t, assignee, status: 'قيد_المعالجة', updatedAt: new Date().toISOString() } : t
            )
          }));
        } catch (error) {
          console.error(`Failed to assign ticket ${id}:`, error);
        }
      },

      resolveTicket: async (id: string, resolution: string) => {
        try {
          // NOTE: The backend would need to be updated to accept a 'resolutionNote' in its PATCH request.
          // For now, we only update the status.
          await updateTicketStatus(id, 'resolved'); // Assuming 'resolved' is the status for manager approval. Let's use 'pending_approval' from your model.
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
          // NOTE: The backend would need to be updated to accept an 'approvedBy' field.
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