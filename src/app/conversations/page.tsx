'use client'

import { useState, useRef } from 'react'
import { 
  Phone, 
  MessageSquare, 
  Search, 
  Filter,
  Play,
  Pause,
  MoreVertical,
  User,
  Bot,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  DollarSign,
  Home,
  Plus,
  Send,
  FileText,
  PhoneOutgoing,
  PhoneIncoming,
  Volume2
} from 'lucide-react'

// Sample conversation data
const phoneCallsData = [
  {
    id: 'outbound-001',
    type: 'outbound',
    customerName: 'ناصر الزامل',
    phoneNumber: '+966501234567',
    duration: '2:34',
    status: 'completed',
    timestamp: new Date('2025-09-16T14:30:00'),
    audioFile: '/audio/outbound_call_nasser.mp3',
    transcript: [
      {
        role: 'agent',
        text: 'السلام عليكم استاذ ناصر، معاك عبدالله من ادارة خدمات المساندة في سقيفة، بس تذكير بموعد صيانة التكييف يوم الأحد الساعة ١٠ صباحاً. هل حاب ناكد الموعد؟',
        timestamp: '00:00'
      },
      {
        role: 'user',
        text: 'با اي بالله يأكد الموعد',
        timestamp: '00:25'
      },
      {
        role: 'agent',
        text: 'أَبْشِرْ، تم تأكيد موعد صيانة التكييف يوم الأحد الساعة العاشرة صباحاً. إذا كان لديك أي استفسار آخر أو تحتاج إلى مساعدة إضافية، لا تتردد في التواصل معنا. في أمان الله.',
        timestamp: '00:30'
      }
    ],
    summary: 'مكالمة صادرة لتأكيد موعد صيانة التكييف - تم التأكيد بنجاح',
    purpose: 'تأكيد موعد صيانة',
    outcome: 'تم التأكيد'
  },
  {
    id: 'inbound-001',
    type: 'inbound',
    customerName: 'محمد القحطاني',
    phoneNumber: '+966507654321',
    duration: '4:12',
    status: 'completed',
    timestamp: new Date('2025-09-16T15:45:00'),
    audioFile: '/audio/inbound_call_mohammed.mp3',
    transcript: [
      {
        role: 'agent',
        text: 'هلا حياك الله, معك خالد, ممثل خدمة العملاء في سَقيفَة, تفضل كيف اقدر اخدمك',
        timestamp: '00:00'
      },
      {
        role: 'user',
        text: 'السلام عليكم اخوي خالد. اخوي خالد انا ادور مشاريع اه عندكم قريبا لحين المصيف. هل في عندكم مشاريع هناك؟',
        timestamp: '00:08'
      },
      {
        role: 'agent',
        text: 'وعليكم السلام ورحمة الله، الله يحييك. أَبْشِرْ، مشروع سقيفة ٢٨ يقع في حي المرسلات بمدينة الرياض، وهو قريب من حي المصيف. يتكون المشروع من أربع مبانٍ تحتوي على اثنتي عشرة وحدة سكنية، بمساحة بناء ألف وخمسمائة وستة وثلاثين متر مربع. إذا حابب أساعدك في حجز زيارة أو تحتاج معلومات إضافية، تفضل خبرني.',
        timestamp: '00:25'
      },
      {
        role: 'user',
        text: 'ايه تكفى حجز لي موعد زيارة أبغى يوم الخميس الساعة وحدة الظهر إذا يناسب',
        timestamp: '01:10'
      },
      {
        role: 'agent',
        text: 'أَبْشِرْ، سأقوم بحجز موعد زيارة لك يوم الخميس الساعة واحدة الظهر. هل هناك أي شيء آخر يمكنني مساعدتك به؟',
        timestamp: '01:20'
      },
      {
        role: 'user',
        text: 'أبا شكرا لك يعطيك الفافية',
        timestamp: '01:35'
      },
      {
        role: 'agent',
        text: 'شكرًا لاتصالك، ونتمنى لك يوم سعيد. في أمان الله.',
        timestamp: '01:40'
      }
    ],
    summary: 'مكالمة واردة للاستفسار عن مشاريع قريبة من المصيف - تم حجز موعد زيارة',
    purpose: 'استفسار عن مشاريع',
    outcome: 'تم حجز موعد زيارة'
  },
  // Dummy data records
  {
    id: 'inbound-002',
    type: 'inbound',
    customerName: 'أحمد العلي',
    phoneNumber: '+966503456789',
    duration: '3:15',
    status: 'completed',
    timestamp: new Date('2025-09-16T10:20:00'),
    audioFile: '/audio/dummy_call_1.mp3',
    transcript: [
      {
        role: 'agent',
        text: 'أهلاً وسهلاً، معك سارة من فريق خدمة العملاء في سقيفة، كيف يمكنني مساعدتك؟',
        timestamp: '00:00'
      },
      {
        role: 'user',
        text: 'السلام عليكم، أريد الاستفسار عن أسعار الوحدات في مشروع سقيفة ٣٠',
        timestamp: '00:05'
      },
      {
        role: 'agent',
        text: 'وعليكم السلام، بكل سرور. مشروع سقيفة ٣٠ يقدم وحدات بمساحات مختلفة تبدأ من ٢٫٨ مليون ريال. هل تريد معلومات أكثر عن مساحة معينة؟',
        timestamp: '00:15'
      },
      {
        role: 'user',
        text: 'نعم، أريد وحدة بمساحة ١٨٠ متر مربع تقريباً',
        timestamp: '00:35'
      },
      {
        role: 'agent',
        text: 'ممتاز، لدينا وحدات بمساحة ١٨٥ متر مربع بسعر ٣٫٢ مليون ريال. يمكنني ترتيب زيارة لك لمعاينة الوحدة؟',
        timestamp: '00:45'
      }
    ],
    summary: 'استفسار عن أسعار الوحدات في مشروع سقيفة ٣٠',
    purpose: 'استفسار عن أسعار',
    outcome: 'تم تقديم المعلومات'
  },
  {
    id: 'outbound-002',
    type: 'outbound',
    customerName: 'فاطمة الشهري',
    phoneNumber: '+966509876543',
    duration: '1:45',
    status: 'completed',
    timestamp: new Date('2025-09-16T09:15:00'),
    audioFile: '/audio/dummy_call_2.mp3',
    transcript: [
      {
        role: 'agent',
        text: 'السلام عليكم أستاذة فاطمة، معك نورا من سقيفة، اتصل لتذكيرك بموعد تسليم المفاتيح غداً الساعة ٢ عصراً',
        timestamp: '00:00'
      },
      {
        role: 'user',
        text: 'وعليكم السلام، شكراً للتذكير. هل محتاجة أجيب معي أوراق معينة؟',
        timestamp: '00:12'
      },
      {
        role: 'agent',
        text: 'نعم، من فضلك أحضري الهوية الوطنية والعقد الأصلي وصورة من سند الملكية',
        timestamp: '00:20'
      },
      {
        role: 'user',
        text: 'تمام، شكراً لك',
        timestamp: '00:35'
      }
    ],
    summary: 'تذكير بموعد تسليم المفاتيح مع توضيح الأوراق المطلوبة',
    purpose: 'تذكير بموعد تسليم',
    outcome: 'تم التأكيد'
  },
  {
    id: 'inbound-003',
    type: 'inbound',
    customerName: 'عبدالرحمن النجار',
    phoneNumber: '+966512345678',
    duration: '5:30',
    status: 'escalated',
    timestamp: new Date('2025-09-15T16:45:00'),
    audioFile: '/audio/dummy_call_3.mp3',
    transcript: [
      {
        role: 'agent',
        text: 'مرحباً بك، معك يوسف من خدمة العملاء، كيف يمكنني مساعدتك؟',
        timestamp: '00:00'
      },
      {
        role: 'user',
        text: 'السلام عليكم، عندي مشكلة في التكييف المركزي في الوحدة الجديدة',
        timestamp: '00:05'
      },
      {
        role: 'agent',
        text: 'وعليكم السلام، أعتذر لهذه المشكلة. هل يمكنك وصف المشكلة بالتفصيل؟',
        timestamp: '00:12'
      },
      {
        role: 'user',
        text: 'التكييف لا يبرد بشكل جيد ويصدر أصوات غريبة',
        timestamp: '00:20'
      },
      {
        role: 'agent',
        text: 'سأقوم بتحويلك لفريق الصيانة التخصصي وسيتواصلون معك خلال ٢٤ ساعة لحل المشكلة',
        timestamp: '00:30'
      }
    ],
    summary: 'شكوى بخصوص مشكلة في التكييف المركزي - تم التحويل للفريق التخصصي',
    purpose: 'شكوى فنية',
    outcome: 'تم التحويل للفريق التخصصي'
  },
  {
    id: 'outbound-003',
    type: 'outbound',
    customerName: 'مشعل الدوسري',
    phoneNumber: '+966508765432',
    duration: '2:10',
    status: 'completed',
    timestamp: new Date('2025-09-15T11:30:00'),
    audioFile: '/audio/dummy_call_4.mp3',
    transcript: [
      {
        role: 'agent',
        text: 'السلام عليكم أستاذ مشعل، معك أحمد من إدارة المبيعات في سقيفة',
        timestamp: '00:00'
      },
      {
        role: 'user',
        text: 'وعليكم السلام أهلاً أحمد',
        timestamp: '00:06'
      },
      {
        role: 'agent',
        text: 'اتصل لأبلغك أن الوحدة التي طلبتها في مشروع سقيفة ٢٦ أصبحت متاحة للحجز',
        timestamp: '00:10'
      },
      {
        role: 'user',
        text: 'ممتاز! كيف يمكنني إتمام الحجز؟',
        timestamp: '00:22'
      },
      {
        role: 'agent',
        text: 'يمكنك زيارة المكتب غداً أو يمكنني إرسال العقد إلكترونياً للمراجعة',
        timestamp: '00:28'
      }
    ],
    summary: 'إشعار بتوفر الوحدة المطلوبة في مشروع سقيفة ٢٦',
    purpose: 'إشعار بتوفر وحدة',
    outcome: 'اهتمام بالحجز'
  }
]

const messagesData = [
  {
    id: 'msg-001',
    type: 'whatsapp',
    customerName: 'سعد المطيري',
    phoneNumber: '+966511223344',
    lastMessage: 'شكراً لكم على الخدمة الممتازة',
    timestamp: new Date('2025-09-16T13:20:00'),
    status: 'read',
    unreadCount: 0,
    summary: 'محادثة واتساب عن خدمة ما بعد البيع'
  },
  {
    id: 'msg-002',
    type: 'sms',
    customerName: 'منى الحربي',
    phoneNumber: '+966522334455',
    lastMessage: 'متى موعد التسليم المتوقع؟',
    timestamp: new Date('2025-09-16T12:10:00'),
    status: 'unread',
    unreadCount: 2,
    summary: 'استفسار عن موعد تسليم الوحدة'
  }
]

export default function ConversationsPage() {
  const [activeTab, setActiveTab] = useState<'calls' | 'messages' | 'all'>('calls')
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const tabs = [
    { id: 'calls', label: 'المكالمات', icon: Phone, count: phoneCallsData.length },
    { id: 'messages', label: 'الرسائل', icon: MessageSquare, count: messagesData.length },
    { id: 'all', label: 'الكل', icon: FileText, count: phoneCallsData.length + messagesData.length }
  ]

  const getFilteredData = () => {
    let data: any[] = []
    
    if (activeTab === 'calls') {
      data = phoneCallsData
    } else if (activeTab === 'messages') {
      data = messagesData
    } else {
      data = [...phoneCallsData, ...messagesData]
    }

    if (searchQuery) {
      return data.filter(item => 
        item.customerName.includes(searchQuery) || 
        item.phoneNumber.includes(searchQuery) ||
        item.summary.includes(searchQuery)
      )
    }
    
    return data
  }

  const filteredData = getFilteredData()

  const handlePlayAudio = (audioFile: string, callId: string) => {
    if (audioRef.current) {
      if (isPlaying === callId) {
        audioRef.current.pause()
        setIsPlaying(null)
      } else {
        audioRef.current.src = audioFile
        audioRef.current.play()
        setIsPlaying(callId)
      }
    }
  }

  const getCallTypeIcon = (type: string) => {
    return type === 'outbound' ? (
      <PhoneOutgoing className="w-4 h-4 text-blue-500" />
    ) : (
      <PhoneIncoming className="w-4 h-4 text-green-500" />
    )
  }

  const getCallTypeLabel = (type: string) => {
    return type === 'outbound' ? 'صادرة' : 'واردة'
  }

  const getCallTypeColor = (type: string) => {
    return type === 'outbound' ? 'text-blue-500' : 'text-green-500'
  }

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
            المحادثات
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            إدارة المكالمات والرسائل مع العملاء
          </p>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-2 mb-6 border border-white/20 dark:border-slate-700/20">
              <div className="flex space-x-1 space-x-reverse">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className="bg-white/20 dark:bg-slate-800/20 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Search */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="البحث في المحادثات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-all duration-200">
                <Filter className="w-4 h-4" />
                <span>فلترة</span>
              </button>
            </div>

            {/* Conversations List */}
            <div className="space-y-3">
              {filteredData.map((item) => {
                // Check if it's a call or message
                const isCall = item.hasOwnProperty('duration')
                
                if (isCall) {
                  const call = item as any
                  return (
                    <div
                      key={call.id}
                      onClick={() => setSelectedCallId(call.id)}
                      className={`p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        selectedCallId === call.id ? 'ring-2 ring-primary/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
                            {getCallTypeIcon(call.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {call.customerName}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {call.phoneNumber}
                            </p>
                            <div className="flex items-center space-x-2 space-x-reverse mt-1">
                              <span className={`text-xs font-medium ${getCallTypeColor(call.type)}`}>
                                {getCallTypeLabel(call.type)}
                              </span>
                              <span className="text-xs text-slate-500">•</span>
                              <span className="text-xs text-slate-500">{call.duration}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {call.timestamp.toLocaleDateString('ar-SA', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <div className="flex items-center space-x-2 space-x-reverse mt-1">
                              {call.status === 'escalated' ? (
                                <AlertCircle className="w-4 h-4 text-warning" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-success" />
                              )}
                              <span className={`text-xs font-medium ${call.status === 'escalated' ? 'text-warning' : 'text-success'}`}>
                                {call.status === 'escalated' ? 'محولة' : 'مكتملة'}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayAudio(call.audioFile, call.id)
                            }}
                            className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center transition-all duration-200"
                          >
                            {isPlaying === call.id ? (
                              <Pause className="w-5 h-5 text-primary" />
                            ) : (
                              <Play className="w-5 h-5 text-primary" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {call.summary}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                          {call.purpose}
                        </span>
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                          {call.outcome}
                        </span>
                      </div>
                    </div>
                  )
                } else {
                  // Message item
                  const message = item as any
                  return (
                    <div
                      key={message.id}
                      className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {message.customerName}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {message.phoneNumber}
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                              {message.lastMessage}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {message.timestamp.toLocaleDateString('ar-SA', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {message.unreadCount > 0 && (
                              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">
                                {message.unreadCount}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                            {message.type === 'whatsapp' ? 'واتساب' : 'رسالة نصية'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          </div>

          {/* Right Sidebar - Call Detail */}
          {selectedCallId && (
            <div className="w-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 h-fit sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">تفاصيل المكالمة</h3>
                <button
                  onClick={() => setSelectedCallId(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>

              {(() => {
                const call = phoneCallsData.find(c => c.id === selectedCallId)
                if (!call) return null

                return (
                  <div className="space-y-4">
                    {/* Call Info */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center space-x-3 space-x-reverse mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
                          {getCallTypeIcon(call.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{call.customerName}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{call.phoneNumber}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400">المدة</span>
                        </div>
                        <div className="text-slate-900 dark:text-slate-100">
                          {call.duration}
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400">النوع</span>
                        </div>
                        <div className={`${getCallTypeColor(call.type)} font-medium`}>
                          {getCallTypeLabel(call.type)}
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400">التاريخ</span>
                        </div>
                        <div className="text-slate-900 dark:text-slate-100">
                          {call.timestamp.toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                    </div>

                    {/* Audio Player */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <button
                          onClick={() => handlePlayAudio(call.audioFile, call.id)}
                          className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center transition-all duration-200"
                        >
                          {isPlaying === call.id ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Volume2 className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              تشغيل المكالمة الصوتية
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">المدة: {call.duration}</p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">ملخص المكالمة</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        {call.summary}
                      </p>
                    </div>

                    {/* Transcript */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">نص المحادثة</h4>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {call.transcript.map((message, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {message.timestamp}
                              </span>
                              {message.role === 'user' ? (
                                <User className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Bot className="w-4 h-4 text-primary" />
                              )}
                              <span className="text-xs font-medium text-slate-500">
                                {message.role === 'user' ? 'العميل' : 'المساعد'}
                              </span>
                            </div>
                            <div
                              className={`p-3 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-right border-r-2 border-blue-500'
                                  : 'bg-slate-50 dark:bg-slate-800/50 text-right border-r-2 border-primary'
                              }`}
                            >
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {message.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button className="w-full flex items-center justify-center space-x-2 space-x-reverse p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200">
                        <Plus className="w-4 h-4" />
                        <span>إنشاء حجز</span>
                      </button>
                      
                      <button className="w-full flex items-center justify-center space-x-2 space-x-reverse p-3 bg-warning text-white rounded-xl hover:bg-warning/90 transition-all duration-200">
                        <FileText className="w-4 h-4" />
                        <span>فتح تذكرة</span>
                      </button>
                      
                      <button className="w-full flex items-center justify-center space-x-2 space-x-reverse p-3 bg-info text-white rounded-xl hover:bg-info/90 transition-all duration-200">
                        <Send className="w-4 h-4" />
                        <span>إرسال واتساب</span>
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(null)}
        onError={() => setIsPlaying(null)}
      />
    </div>
  )
}