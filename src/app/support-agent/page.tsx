'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useVoiceAgent } from '@/hooks/useVoiceAgent'
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Ticket, 
  Calendar, 
  HelpCircle, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Mail,
  Loader2,
  Volume2,
  Check,
  X,
  RefreshCw
} from 'lucide-react'

interface GeneratedAction {
  id: string
  type: 'ticket' | 'appointment' | 'inquiry'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'new' | 'in-progress' | 'resolved'
  customerName: string
  customerPhone: string
  customerEmail: string
  createdAt: string
  category: string
  originalTranscript: string
  agentResponse: string
}

interface BackendBooking {
  id: string
  session_id: string
  customer_name: string
  phone: string
  project: string
  preferred_datetime: string
  appointment_date: string
  appointment_time: string
  day_name: string
  status: string
  created_at: string
}

interface BackendTicket {
  id: string
  session_id: string
  customer_name: string
  phone: string
  issue: string
  priority: string
  project: string
  status: string
  created_at: string
}

export default function SupportAgentPage() {
  const [generatedActions, setGeneratedActions] = useState<GeneratedAction[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  
  // New states for real backend data
  const [backendBookings, setBackendBookings] = useState<BackendBooking[]>([])
  const [backendTickets, setBackendTickets] = useState<BackendTicket[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  const voiceAgent = useVoiceAgent({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setCurrentTranscript(text)
        processUserInput(text)
      } else {
        setCurrentTranscript(text)
      }
    },
    onResponse: (text) => {
      setAgentResponse(text)
    },
    onError: (error) => {
      console.error('Voice agent error:', error)
    },
    onStatusChange: (status) => {
      console.log('Voice agent status:', status)
    }
  })

  // Fetch real data from backend
  const fetchBackendData = async () => {
    setIsLoadingData(true)
    try {
      // First sync with ElevenLabs - get recent conversations and process them
      console.log('Syncing with ElevenLabs...')
      
      try {
        // Get conversation list
        const conversationsResponse = await fetch('http://127.0.0.1:8000/elevenlabs/conversations')
        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json()
          const conversations = conversationsData.conversations || []
          
          console.log(`Processing ${Math.min(3, conversations.length)} recent conversations...`)
          
          // Process the 3 most recent conversations
          for (let i = 0; i < Math.min(3, conversations.length); i++) {
            const conv = conversations[i]
            const conversationId = conv.conversation_id
            
            if (conversationId) {
              try {
                const processResponse = await fetch(`http://127.0.0.1:8000/elevenlabs/conversation/${conversationId}/process`, {
                  method: 'POST'
                })
                
                if (processResponse.ok) {
                  const processResult = await processResponse.json()
                  console.log(`Processed conversation ${conversationId}:`, processResult)
                }
              } catch (error) {
                console.warn(`Failed to process conversation ${conversationId}:`, error)
              }
            }
          }
        }
      } catch (error) {
        console.warn('ElevenLabs sync failed:', error)
      }

      // Then fetch all current data
      const [bookingsResponse, ticketsResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/bookings/recent'),
        fetch('http://127.0.0.1:8000/tickets/recent')
      ])

      if (bookingsResponse.ok) {
        const bookings = await bookingsResponse.json()
        setBackendBookings(bookings)
      }

      if (ticketsResponse.ok) {
        const tickets = await ticketsResponse.json()
        setBackendTickets(tickets)
      }
    } catch (error) {
      console.error('Error fetching backend data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Load data on component mount and set up polling
  useEffect(() => {
    fetchBackendData()
    
    // Set up automatic polling every 10 seconds for new appointments
    const interval = setInterval(() => {
      console.log('Auto-polling for new appointments...')
      fetchBackendData()
    }, 10000) // 10 seconds
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }, [])

  // Handle approval/denial of bookings
  const handleBookingAction = async (bookingId: string, action: 'approve' | 'deny') => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'confirmed' : 'cancelled'
        }),
      })

      if (response.ok) {
        // Refresh data after successful update
        fetchBackendData()
      }
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  // Handle approval/denial of tickets
  const handleTicketAction = async (ticketId: string, action: 'approve' | 'deny') => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'in_progress' : 'closed'
        }),
      })

      if (response.ok) {
        // Refresh data after successful update
        fetchBackendData()
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }

  const processUserInput = async (transcript: string) => {
    if (!transcript.trim()) return
    
    setIsProcessing(true)
    
    try {
      // Simulate processing the user's speech to determine intent
      const action = analyzeUserIntent(transcript)
      
      if (action) {
        setGeneratedActions(prev => [action, ...prev])
      }
    } catch (error) {
      console.error('Error processing user input:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const analyzeUserIntent = (transcript: string): GeneratedAction | null => {
    const text = transcript.toLowerCase()
    
    // Determine action type based on keywords
    let type: 'ticket' | 'appointment' | 'inquiry' = 'inquiry'
    let priority: 'low' | 'medium' | 'high' = 'medium'
    let category = 'عام'
    let title = ''
    let description = transcript

    // Ticket detection (problems, issues, complaints)
    if (text.includes('مشكلة') || text.includes('خطأ') || text.includes('لا يعمل') || 
        text.includes('تعطل') || text.includes('بطيء') || text.includes('شكوى') ||
        text.includes('problem') || text.includes('issue') || text.includes('error') ||
        text.includes('bug') || text.includes('not working') || text.includes('broken')) {
      type = 'ticket'
      priority = 'high'
      
      if (text.includes('فاتورة') || text.includes('دفع') || text.includes('bill') || text.includes('payment')) {
        category = 'الفواتير والدفع'
        title = 'مشكلة في الفاتورة'
      } else if (text.includes('تطبيق') || text.includes('موقع') || text.includes('app') || text.includes('website')) {
        category = 'مشاكل تقنية'
        title = 'مشكلة تقنية في التطبيق'
      } else if (text.includes('إنترنت') || text.includes('شبكة') || text.includes('internet') || text.includes('connection')) {
        category = 'جودة الخدمة'
        title = 'مشكلة في الاتصال'
      } else {
        category = 'دعم عام'
        title = 'مشكلة تتطلب دعم'
      }
    }
    
    // Appointment detection (booking, meeting, visit)
    else if (text.includes('موعد') || text.includes('حجز') || text.includes('زيارة') || 
             text.includes('لقاء') || text.includes('appointment') || text.includes('meeting') ||
             text.includes('schedule') || text.includes('visit') || text.includes('book')) {
      type = 'appointment'
      priority = 'medium'
      
      if (text.includes('تركيب') || text.includes('install') || text.includes('setup')) {
        category = 'التركيب والصيانة'
        title = 'موعد تركيب خدمة'
      } else if (text.includes('استشارة') || text.includes('consultation') || text.includes('advice')) {
        category = 'الاستشارات الفنية'
        title = 'موعد استشارة فنية'
      } else if (text.includes('صيانة') || text.includes('maintenance') || text.includes('repair')) {
        category = 'الصيانة'
        title = 'موعد صيانة'
      } else {
        category = 'مواعيد عامة'
        title = 'طلب موعد'
      }
    }
    
    // Inquiry detection (questions, information requests)
    else if (text.includes('كم') || text.includes('ما هو') || text.includes('أريد معرفة') ||
             text.includes('استفسار') || text.includes('سؤال') || text.includes('معلومات') ||
             text.includes('how much') || text.includes('what is') || text.includes('tell me') ||
             text.includes('information') || text.includes('question') || text.includes('inquiry')) {
      type = 'inquiry'
      priority = 'low'
      
      if (text.includes('سعر') || text.includes('تكلفة') || text.includes('price') || text.includes('cost')) {
        category = 'الأسعار والباقات'
        title = 'استفسار عن الأسعار'
      } else if (text.includes('تغطية') || text.includes('منطقة') || text.includes('coverage') || text.includes('area')) {
        category = 'التغطية الجغرافية'
        title = 'استفسار عن التغطية'
      } else if (text.includes('خدمة') || text.includes('منتج') || text.includes('service') || text.includes('product')) {
        category = 'معلومات الخدمات'
        title = 'استفسار عن الخدمات'
      } else {
        category = 'معلومات عامة'
        title = 'استفسار عام'
      }
    }

    // Generate customer data
    const customerNames = ['أحمد محمد', 'فاطمة علي', 'خالد السالم', 'نورا أحمد', 'محمد الخالد']
    const randomName = customerNames[Math.floor(Math.random() * customerNames.length)]
    
    const action: GeneratedAction = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      description,
      priority,
      status: 'new',
      customerName: randomName,
      customerPhone: `+9665${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      customerEmail: `${randomName.split(' ')[0].toLowerCase()}@email.com`,
      createdAt: new Date().toLocaleString('ar-SA'),
      category,
      originalTranscript: transcript,
      agentResponse: generateAgentResponse(type, title)
    }

    return action
  }

  const generateAgentResponse = (type: string, title: string): string => {
    const responses = {
      ticket: [
        `شكراً لك على التواصل. تم إنشاء تذكرة دعم رقم ${Math.floor(Math.random() * 1000) + 1000} لحل مشكلتك. سيتم التواصل معك خلال 24 ساعة.`,
        `فهمت مشكلتك وتم توثيقها. فريق الدعم الفني سيراجع طلبك ويعود إليك بأسرع وقت ممكن.`,
        `تم تسجيل شكواك بنجاح. سنعمل على حل هذه المشكلة وإبلاغك بالتحديثات.`
      ],
      appointment: [
        `ممتاز! تم حجز موعد لك. سيتصل بك أحد ممثلي خدمة العملاء لتأكيد الوقت المناسب.`,
        `تم تسجيل طلب الموعد. سنتواصل معك خلال ساعات العمل لتحديد الوقت الأنسب.`,
        `شكراً لك. تم إدراج طلبك في جدول المواعيد وسيتم التواصل معك قريباً.`
      ],
      inquiry: [
        `شكراً لاستفسارك. تم توثيق سؤالك وسيتم إرسال المعلومات المطلوبة إليك.`,
        `سعيد لمساعدتك! تم تسجيل استفسارك وستحصل على الإجابة التفصيلية قريباً.`,
        `تم استلام استفسارك. فريق خدمة العملاء سيزودك بالمعلومات اللازمة.`
      ]
    }
    
    const typeResponses = responses[type as keyof typeof responses]
    return typeResponses[Math.floor(Math.random() * typeResponses.length)]
  }

  const startCall = async () => {
    try {
      await voiceAgent.startVoiceSession('support')
    } catch (error) {
      console.error('Failed to start voice session:', error)
    }
  }

  const endCall = async () => {
    try {
      await voiceAgent.stopVoiceSession()
      setCurrentTranscript('')
      setAgentResponse('')
    } catch (error) {
      console.error('Failed to end voice session:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ticket': return <Ticket className="w-5 h-5" />
      case 'appointment': return <Calendar className="w-5 h-5" />
      case 'inquiry': return <HelpCircle className="w-5 h-5" />
      default: return <MessageSquare className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ticket': return 'bg-red-100 text-red-800 border-red-200'
      case 'appointment': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'inquiry': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
  <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">مساعد خدمة العملاء الذكي</h1>
          <p className="text-gray-600 dark:text-slate-400">تحدث مع المساعد الصوتي وسيتم إنشاء الإجراءات المناسبة تلقائياً</p>
        </div>

        {/* Voice Control Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-8 mb-8">
          <div className="text-center">
            <div className="mb-6">
              {voiceAgent.isConnected ? (
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">متصل - جاهز للاستماع</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-full">
                  <div className="w-3 h-3 bg-gray-400 dark:bg-slate-500 rounded-full"></div>
                  <span className="font-medium">غير متصل</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              {voiceAgent.isConnected ? (
                <Button 
                  onClick={endCall}
                  size="lg"
                  variant="destructive"
                  className="h-16 px-8"
                >
                  <PhoneOff className="w-6 h-6 mr-2" />
                  إنهاء المكالمة
                </Button>
              ) : (
                <Button 
                  onClick={startCall}
                  size="lg"
                  className="h-16 px-8 bg-green-600 hover:bg-green-700"
                >
                  <Phone className="w-6 h-6 mr-2" />
                  بدء مكالمة صوتية
                </Button>
              )}
            </div>

            {/* Current Transcript */}
            {currentTranscript && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">ما تقوله الآن:</span>
                </div>
                <p className="text-blue-900 dark:text-blue-100">{currentTranscript}</p>
                {isProcessing && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">جاري المعالجة...</span>
                  </div>
                )}
              </div>
            )}

            {/* Agent Response */}
            {agentResponse && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">رد المساعد:</span>
                </div>
                <p className="text-green-900 dark:text-green-100">{agentResponse}</p>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
              اضغط على "بدء مكالمة صوتية" وتحدث عن مشكلتك أو طلبك. سيقوم المساعد الذكي بفهم كلامك وإنشاء التذكرة أو الموعد أو الاستفسار المناسب تلقائياً.
            </p>
          </div>
        </div>

        {/* Real Webhook Requests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">طلبات العملاء الجديدة</h2>
            <Button onClick={fetchBackendData} variant="outline" size="sm" disabled={isLoadingData}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
              تحديث من ElevenLabs
            </Button>
          </div>

          {isLoadingData ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400">جاري مزامنة المكالمات من ElevenLabs...</p>
            </div>
          ) : (
            <>
              {/* Bookings Section */}
              {backendBookings.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    طلبات المواعيد ({backendBookings.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {backendBookings.map((booking) => (
                      <div key={booking.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <Calendar className="w-4 h-4" />
                              موعد
                            </span>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              booking.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                              booking.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                              {booking.status === 'pending' ? 'في الانتظار' :
                               booking.status === 'confirmed' ? 'مؤكد' : 'ملغي'}
                            </span>
                          </div>

                          <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{booking.project}</h4>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                              <span className="text-gray-700 dark:text-slate-300">{booking.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                              <span className="text-gray-600 dark:text-slate-400" dir="ltr">{booking.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                              <span className="text-gray-600 dark:text-slate-400">
                                {booking.day_name} {booking.appointment_date} - {booking.appointment_time}
                              </span>
                            </div>
                          </div>

                          {booking.status === 'pending' && (
                            <div className="flex gap-2 pt-4 border-t dark:border-slate-600">
                              <Button
                                onClick={() => handleBookingAction(booking.id, 'approve')}
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                موافقة
                              </Button>
                              <Button
                                onClick={() => handleBookingAction(booking.id, 'deny')}
                                size="sm"
                                variant="outline"
                                className="flex-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="w-4 h-4 mr-1" />
                                رفض
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tickets Section */}
              {backendTickets.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-red-600 dark:text-red-400" />
                    تذاكر الدعم ({backendTickets.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {backendTickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                              <Ticket className="w-4 h-4" />
                              تذكرة
                            </span>
                            <div className="flex gap-1">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                ticket.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                ticket.priority === 'med' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              }`}>
                                {ticket.priority === 'high' ? 'عالية' :
                                 ticket.priority === 'med' ? 'متوسطة' : 'منخفضة'}
                              </span>
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                ticket.status === 'open' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                ticket.status === 'in_progress' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              }`}>
                                {ticket.status === 'open' ? 'مفتوحة' :
                                 ticket.status === 'in_progress' ? 'قيد المعالجة' : 'مغلقة'}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{ticket.project}</h4>
                          
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">وصف المشكلة:</div>
                            <p className="text-sm text-gray-700 dark:text-slate-300">{ticket.issue}</p>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                              <span className="text-gray-700 dark:text-slate-300">{ticket.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                              <span className="text-gray-600 dark:text-slate-400" dir="ltr">{ticket.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                              <span className="text-gray-600 dark:text-slate-400">
                                {new Date(ticket.created_at).toLocaleString('ar-SA')}
                              </span>
                            </div>
                          </div>

                          {ticket.status === 'open' && (
                            <div className="flex gap-2 pt-4 border-t dark:border-slate-600">
                              <Button
                                onClick={() => handleTicketAction(ticket.id, 'approve')}
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                قبول
                              </Button>
                              <Button
                                onClick={() => handleTicketAction(ticket.id, 'deny')}
                                size="sm"
                                variant="outline"
                                className="flex-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="w-4 h-4 mr-1" />
                                رفض
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {backendBookings.length === 0 && backendTickets.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700">
                  <MessageSquare className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">لا توجد طلبات جديدة</h3>
                  <p className="text-gray-600 dark:text-slate-400 max-w-md mx-auto">
                    عندما يتم إنشاء طلبات جديدة من خلال المكالمات الصوتية، ستظهر هنا للمراجعة والموافقة.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Generated Actions */}
        {generatedActions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold dark:text-slate-100 mb-4">الإجراءات المنشأة ({generatedActions.length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {generatedActions.map((action) => (
                <div key={action.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getTypeColor(action.type)}`}>
                          {getTypeIcon(action.type)}
                          {action.type === 'ticket' ? 'تذكرة' : 
                           action.type === 'appointment' ? 'موعد' : 'استفسار'}
                        </span>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(action.priority)}`}>
                          {action.priority === 'high' ? 'عالية' :
                           action.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </span>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>

                    {/* Content */}
                    <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <div className="mb-4">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        {action.category}
                      </span>
                    </div>

                    {/* Original Transcript */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">ما قاله العميل:</div>
                      <p className="text-sm text-gray-700">"{action.originalTranscript}"</p>
                    </div>

                    {/* Agent Response */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-600 mb-1">رد المساعد:</div>
                      <p className="text-sm text-blue-800">{action.agentResponse}</p>
                    </div>

                    {/* Customer Info */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{action.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600" dir="ltr">{action.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 text-xs">{action.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{action.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {generatedActions.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ابدأ محادثة صوتية</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              لم يتم إنشاء أي إجراءات بعد. اضغط على "بدء مكالمة صوتية" وتحدث مع المساعد لإنشاء تذاكر أو مواعيد أو استفسارات تلقائياً.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
