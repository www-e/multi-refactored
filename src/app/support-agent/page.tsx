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
  Volume2
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

export default function SupportAgentPage() {
  const [generatedActions, setGeneratedActions] = useState<GeneratedAction[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مساعد خدمة العملاء الذكي</h1>
          <p className="text-gray-600">تحدث مع المساعد الصوتي وسيتم إنشاء الإجراءات المناسبة تلقائياً</p>
        </div>

        {/* Voice Control Panel */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="text-center">
            <div className="mb-6">
              {voiceAgent.isConnected ? (
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-100 text-green-800 rounded-full">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">متصل - جاهز للاستماع</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-100 text-gray-600 rounded-full">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
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
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">ما تقوله الآن:</span>
                </div>
                <p className="text-blue-900">{currentTranscript}</p>
                {isProcessing && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-600">جاري المعالجة...</span>
                  </div>
                )}
              </div>
            )}

            {/* Agent Response */}
            {agentResponse && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">رد المساعد:</span>
                </div>
                <p className="text-green-900">{agentResponse}</p>
              </div>
            )}

            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              اضغط على "بدء مكالمة صوتية" وتحدث عن مشكلتك أو طلبك. سيقوم المساعد الذكي بفهم كلامك وإنشاء التذكرة أو الموعد أو الاستفسار المناسب تلقائياً.
            </p>
          </div>
        </div>

        {/* Generated Actions */}
        {generatedActions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">الإجراءات المنشأة ({generatedActions.length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {generatedActions.map((action) => (
                <div key={action.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
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
