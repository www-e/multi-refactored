import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  Customer, 
  Conversation, 
  EnhancedTicket, 
  EnhancedBooking, 
  EnhancedCampaign,
  DashboardKPIs,
  LiveOps,
  Property,
  Neighborhood
} from '@/app/(shared)/types'

interface AppState {
  // Core data
  customers: Customer[]
  conversations: Conversation[]
  tickets: EnhancedTicket[]
  bookings: EnhancedBooking[]
  campaigns: EnhancedCampaign[]
  properties: Property[]
  
  // Dashboard state
  dashboardKPIs: DashboardKPIs
  liveOps: LiveOps
  
  // UI state
  selectedCustomer: Customer | null
  selectedConversation: Conversation | null
  selectedTicket: EnhancedTicket | null
  selectedBooking: EnhancedBooking | null
  selectedCampaign: EnhancedCampaign | null
  
  // Actions
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
  
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  closeConversation: (id: string) => void
  
  addTicket: (ticket: EnhancedTicket) => void
  updateTicket: (id: string, updates: Partial<EnhancedTicket>) => void
  assignTicket: (id: string, assignee: string) => void
  resolveTicket: (id: string, resolution: string) => void
  approveTicket: (id: string, approver: string) => void
  
  addBooking: (booking: EnhancedBooking) => void
  updateBooking: (id: string, updates: Partial<EnhancedBooking>) => void
  approveBooking: (id: string) => void
  rejectBooking: (id: string) => void
  
  addCampaign: (campaign: EnhancedCampaign) => void
  updateCampaign: (id: string, updates: Partial<EnhancedCampaign>) => void
  runCampaign: (id: string) => void
  stopCampaign: (id: string) => void
  
  // Refresh functions - fetch real data from backend
  refreshTickets: () => Promise<void>
  refreshBookings: () => Promise<void>
  refreshAllData: () => Promise<void>
  
  // Selections
  setSelectedCustomer: (customer: Customer | null) => void
  setSelectedConversation: (conversation: Conversation | null) => void
  setSelectedTicket: (ticket: EnhancedTicket | null) => void
  setSelectedBooking: (booking: EnhancedBooking | null) => void
  setSelectedCampaign: (campaign: EnhancedCampaign | null) => void
  
  // Live updates
  updateLiveOps: (updates: Partial<LiveOps>) => void
  updateDashboardKPIs: (updates: Partial<DashboardKPIs>) => void
  
  // Simulate real-time updates
  simulateInboundCall: () => void
  simulateInboundMessage: () => void
}

// Seed data for Arabic customers
const seedCustomers: Customer[] = [
  {
    id: '1',
    name: 'أحمد العتيبي',
    phone: '+966501234567',
    email: 'ahmed@example.com',
    budget: 12000,
    neighborhoods: ['حي الملقا', 'حي القيروان'],
    stage: 'مؤهل',
    consents: { marketing: true, recording: true, whatsapp: true },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '2',
    name: 'نورة السبيعي',
    phone: '+966507654321',
    email: 'noura@example.com',
    budget: 8000,
    neighborhoods: ['حي حطين', 'حي الندى'],
    stage: 'جديد',
    consents: { marketing: false, recording: true, whatsapp: false },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: '3',
    name: 'محمد القحطاني',
    phone: '+966509876543',
    email: 'mohammed@example.com',
    budget: 15000,
    neighborhoods: ['حي الملقا', 'حي التعاون'],
    stage: 'حجز',
    consents: { marketing: true, recording: true, whatsapp: true },
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString()
  }
]

// Seed data for conversations
const seedConversations: Conversation[] = [
  {
    id: '1',
    type: 'صوت',
    customerId: '1',
    transcript: [
      { role: 'user', text: 'أهلاً، أبحث عن شقة في حي الملقا', ts: Date.now() - 300000 },
      { role: 'agent', text: 'أهلاً وسهلاً! عندنا خيارات ممتازة في حي الملقا. ما هي ميزانيتك؟', ts: Date.now() - 280000 },
      { role: 'user', text: 'حوالي 12,000 ريال شهرياً', ts: Date.now() - 260000 },
      { role: 'agent', text: 'ممتاز! عندنا شقة بغرفتين نوم مفروشة بسعر 11,500 ريال. هل تود حجز زيارة؟', ts: Date.now() - 240000 }
    ],
    summary: 'عميل يبحث عن شقة في حي الملقا بميزانية 12,000 ريال',
    entities: { neighborhood: 'حي الملقا', budgetSAR: 12000, bedrooms: 2 },
    sentiment: 'إيجابي',
    status: 'مفتوحة',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    type: 'رسالة',
    customerId: '2',
    transcript: [
      { role: 'user', text: 'هل عندكم شقق متاحة في حي حطين؟', ts: Date.now() - 600000 },
      { role: 'agent', text: 'نعم! عندنا شقة بغرفة نوم واحدة مفروشة بسعر 7,500 ريال شهرياً', ts: Date.now() - 580000 },
      { role: 'user', text: 'ممكن أعرف المزيد عن الشقة؟', ts: Date.now() - 560000 }
    ],
    summary: 'عميلة تسأل عن شقق في حي حطين',
    entities: { neighborhood: 'حي حطين' },
    sentiment: 'محايد',
    status: 'مفتوحة',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  }
]

// Seed data for tickets
const seedTickets: EnhancedTicket[] = [
  {
    id: '1',
    customerId: '1',
    priority: 'متوسط',
    category: 'كهرباء',
    status: 'مفتوحة',
    slaDueAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    customerId: '3',
    priority: 'عالٍ',
    category: 'سباكة',
    status: 'قيد_المعالجة',
    assignee: 'أحمد الصيانة',
    slaDueAt: new Date(Date.now() + 43200000).toISOString(),
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  }
]

// Seed data for bookings
const seedBookings: EnhancedBooking[] = [
  {
    id: '1',
    customerId: '1',
    propertyId: '1',
    startDate: '2024-02-15',
    endDate: '2024-02-16',
    status: 'معلق',
    price: 11500,
    source: 'صوت',
    createdBy: 'AI',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '2',
    customerId: '3',
    propertyId: '2',
    startDate: '2024-02-20',
    endDate: '2024-02-21',
    status: 'مؤكد',
    price: 12000,
    source: 'صوت',
    createdBy: 'AI',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  }
]

// Seed data for campaigns
const seedCampaigns: EnhancedCampaign[] = [
  {
    id: '1',
    name: 'حملة الصيف - تجديد العقود',
    type: 'صوتية',
    objective: 'تجديدات',
    audienceQuery: 'عملاء حاليون، عقود تنتهي خلال 3 أشهر',
    status: 'نشطة',
    metrics: {
      reached: 150,
      engaged: 89,
      qualified: 45,
      booked: 15,
      revenue: 180000,
      roas: 3.2
    },
    attribution: 'AI',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '2',
    name: 'حملة العيد - ترويج خاص',
    type: 'رسائل',
    objective: 'ترويج',
    audienceQuery: 'عملاء محتملون، ميزانية 8,000-15,000 ريال',
    status: 'نشطة',
    metrics: {
      reached: 200,
      engaged: 120,
      qualified: 67,
      booked: 23,
      revenue: 276000,
      roas: 2.8
    },
    attribution: 'AI',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  }
]

// Seed data for properties
const seedProperties: Property[] = [
  {
    id: '1',
    code: 'المجيدية - MG13',
    city: 'الرياض',
    neighborhood: 'حي الملقا',
    rooms: 3,
    bedrooms: 2,
    bathrooms: 2,
    furnished: true,
    monthlyPriceSAR: 11500,
    yearlyPriceSAR: 115000,
    images: ['/images/mg13-1.jpg', '/images/mg13-2.jpg'],
    availability: 'متاح'
  },
  {
    id: '2',
    code: 'المجيدية - MG132',
    city: 'الرياض',
    neighborhood: 'حي الملقا',
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    furnished: false,
    monthlyPriceSAR: 12000,
    yearlyPriceSAR: 120000,
    images: ['/images/mg132-1.jpg'],
    availability: 'محجوز'
  },
  {
    id: '3',
    code: 'بيات - WH41',
    city: 'الرياض',
    neighborhood: 'حي حطين',
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    furnished: true,
    monthlyPriceSAR: 7500,
    yearlyPriceSAR: 75000,
    images: ['/images/wh41-1.jpg'],
    availability: 'متاح'
  }
]

// Initial dashboard KPIs
const initialKPIs: DashboardKPIs = {
  totalCalls: 1842,
  answerRate: 62,
  conversionToBooking: 21,
  revenue: 1420000,
  roas: 3.2,
  avgHandleTime: 180,
  csat: 4.4,
  missedCalls: 23,
  aiTransferred: 8,
  systemStatus: 'AI_يعمل'
}

// Initial live ops
const initialLiveOps: LiveOps = {
  currentCalls: [
    { id: '1', customerName: 'أحمد العتيبي', duration: '2:15', status: 'وارد' },
    { id: '2', customerName: 'نورة السبيعي', duration: '1:45', status: 'وارد' }
  ],
  aiTransferredChats: [
    { id: '1', customerName: 'محمد القحطاني', reason: 'طلب ممثل بشري', waitingTime: '0:30' }
  ]
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state - start with empty arrays for real data
      customers: seedCustomers,
      conversations: seedConversations,
      tickets: [], // Will be populated by refreshTickets()
      bookings: [], // Will be populated by refreshBookings()
      campaigns: seedCampaigns,
      properties: seedProperties,
      dashboardKPIs: initialKPIs,
      liveOps: initialLiveOps,
      
      // Selections
      selectedCustomer: null,
      selectedConversation: null,
      selectedTicket: null,
      selectedBooking: null,
      selectedCampaign: null,
      
      // Customer actions
      addCustomer: (customer) => set((state) => ({
        customers: [...state.customers, customer]
      })),
      
      updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map(c => 
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        )
      })),
      
      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),
      
      // Conversation actions
      addConversation: (conversation) => set((state) => ({
        conversations: [...state.conversations, conversation]
      })),
      
      updateConversation: (id, updates) => set((state) => ({
        conversations: state.conversations.map(c => 
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        )
      })),
      
      closeConversation: (id) => set((state) => ({
        conversations: state.conversations.map(c => 
          c.id === id ? { ...c, status: 'مغلقة', updatedAt: new Date().toISOString() } : c
        )
      })),
      
      // Ticket actions
      addTicket: (ticket) => set((state) => ({
        tickets: [...state.tickets, ticket]
      })),
      
      updateTicket: (id, updates) => set((state) => ({
        tickets: state.tickets.map(t => 
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        )
      })),
      
      assignTicket: (id, assignee) => set((state) => ({
        tickets: state.tickets.map(t => 
          t.id === id ? { ...t, assignee, status: 'قيد_المعالجة', updatedAt: new Date().toISOString() } : t
        )
      })),
      
      resolveTicket: (id, resolution) => set((state) => ({
        tickets: state.tickets.map(t => 
          t.id === id ? { ...t, resolutionNote: resolution, status: 'بانتظار_الموافقة', updatedAt: new Date().toISOString() } : t
        )
      })),
      
      approveTicket: (id, approver) => set((state) => ({
        tickets: state.tickets.map(t => 
          t.id === id ? { ...t, approvedBy: approver, status: 'محلولة', updatedAt: new Date().toISOString() } : t
        )
      })),
      
      // Booking actions
      addBooking: (booking) => set((state) => ({
        bookings: [...state.bookings, booking]
      })),
      
      updateBooking: (id, updates) => set((state) => ({
        bookings: state.bookings.map(b => 
          b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
        )
      })),
      
      approveBooking: (id) => set((state) => ({
        bookings: state.bookings.map(b => 
          b.id === id ? { ...b, status: 'مؤكد', updatedAt: new Date().toISOString() } : b
        )
      })),
      
      rejectBooking: (id) => set((state) => ({
        bookings: state.bookings.map(b => 
          b.id === id ? { ...b, status: 'ملغي', updatedAt: new Date().toISOString() } : b
        )
      })),
      
      // Campaign actions
      addCampaign: (campaign) => set((state) => ({
        campaigns: [...state.campaigns, campaign]
      })),
      
      updateCampaign: (id, updates) => set((state) => ({
        campaigns: state.campaigns.map(c => 
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        )
      })),
      
      runCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.map(c => 
          c.id === id ? { ...c, status: 'نشطة', updatedAt: new Date().toISOString() } : c
        )
      })),
      
      stopCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.map(c => 
          c.id === id ? { ...c, status: 'موقوفة', updatedAt: new Date().toISOString() } : c
        )
      })),
      
      // Selection setters
      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
      setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
      setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
      setSelectedBooking: (booking) => set({ selectedBooking: booking }),
      setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),
      
      // Live updates
      updateLiveOps: (updates) => set((state) => ({
        liveOps: { ...state.liveOps, ...updates }
      })),
      
      updateDashboardKPIs: (updates) => set((state) => ({
        dashboardKPIs: { ...state.dashboardKPIs, ...updates }
      })),
      
      // Simulation functions
      simulateInboundCall: () => {
        const newCall: Conversation = {
          id: `call-${Date.now()}`,
          type: 'صوت',
          customerId: '1',
          transcript: [
            { role: 'user', text: 'أهلاً، أبحث عن شقة للإيجار', ts: Date.now() }
          ],
          summary: 'مكالمة واردة جديدة',
          entities: {},
          sentiment: 'محايد',
          status: 'مفتوحة',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        set((state) => ({
          conversations: [newCall, ...state.conversations],
          dashboardKPIs: {
            ...state.dashboardKPIs,
            totalCalls: state.dashboardKPIs.totalCalls + 1
          }
        }))
      },
      
      simulateInboundMessage: () => {
        const newMessage: Conversation = {
          id: `msg-${Date.now()}`,
          type: 'رسالة',
          customerId: '2',
          transcript: [
            { role: 'user', text: 'مرحباً، هل عندكم شقق متاحة؟', ts: Date.now() }
          ],
          summary: 'رسالة واردة جديدة',
          entities: {},
          sentiment: 'محايد',
          status: 'مفتوحة',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        set((state) => ({
          conversations: [newMessage, ...state.conversations]
        }))
      },

      // Refresh functions - fetch real data from backend (max 10 items)
      refreshTickets: async () => {
        try {
          const response = await fetch('http://127.0.0.1:8000/tickets/recent')
          if (response.ok) {
            const tickets = await response.json()
            set({ tickets })
          }
        } catch (error) {
          console.error('Failed to refresh tickets:', error)
        }
      },

      refreshBookings: async () => {
        try {
          const response = await fetch('http://127.0.0.1:8000/bookings/recent')
          if (response.ok) {
            const bookings = await response.json()
            set({ bookings })
          }
        } catch (error) {
          console.error('Failed to refresh bookings:', error)
        }
      },

      refreshAllData: async () => {
        await Promise.all([
          get().refreshTickets(),
          get().refreshBookings()
        ])
      }
    }),
    {
      name: 'navaia-store'
    }
  )
) 