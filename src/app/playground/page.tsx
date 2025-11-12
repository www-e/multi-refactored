'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bot, Phone, MessageSquare, Send, User,
  Zap, Loader2,  Headphones, PhoneOff,
   Smartphone,  Monitor
} from 'lucide-react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { Card, CardTitle } from '@/components/shared/ui/Card';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const agentTypes = [
  { id: 'support', name: 'دعم العملاء', description: 'مساعد خدمة العملاء', color: 'from-blue-500 to-purple-600', icon: User },
  { id: 'sales', name: 'المبيعات', description: 'مساعد المبيعات والتسويق', color: 'from-green-500 to-emerald-600', icon: Zap }
];

export default function PlaygroundPage() {
  const [mode, setMode] = useState<'voice' | 'chat'>('voice');
  const [selectedAgent, setSelectedAgent] = useState(agentTypes[0]);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'agent', content: 'يمكنني مساعدتك في الاستفسارات وحجز المواعيد ورفع الشكاوى.', timestamp: new Date() }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { startVoiceSession, stopVoiceSession, isConnected: voiceConnected, isListening, isSpeaking, status } = useVoiceAgent({
    onTranscript: (text, isFinal) => { setTranscript(text); if (isFinal) { addMessage('user', text); setTranscript(''); } },
    onResponse: (text) => addMessage('agent', text),
    onError: (errorMsg) => { setError(errorMsg); setTimeout(() => setError(null), 5000); },
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 1024) setDeviceType('mobile'); else setDeviceType('desktop');
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (type: 'user' | 'agent', content: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), type, content, timestamp: new Date() }]);
  };
  
  const DeviceIcon = deviceType === 'mobile' ? Smartphone : Monitor;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="ساحة التجربة"
          subtitle="اختبر قدرات المساعد الصوتي الذكي بالذكاء الاصطناعي"
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <Card>
              <CardTitle className="mb-4">نوع المحادثة</CardTitle>
              <div className="space-y-3">
                <button onClick={() => setMode('voice')} className={`w-full flex items-center space-x-3 space-x-reverse p-4 rounded-xl transition-all duration-300 ${mode === 'voice' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'border'}`}>
                  <Headphones className="w-5 h-5" /><span>المحادثة الصوتية</span>
                </button>
                <button onClick={() => setMode('chat')} className={`w-full flex items-center space-x-3 space-x-reverse p-4 rounded-xl transition-all duration-300 ${mode === 'chat' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'border'}`}>
                  <MessageSquare className="w-5 h-5" /><span>المحادثة النصية</span>
                </button>
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-4">نوع المساعد</CardTitle>
              <div className="space-y-3">
                {agentTypes.map(agent => (
                  <button key={agent.id} onClick={() => setSelectedAgent(agent)} className={`w-full flex items-center space-x-3 space-x-reverse p-4 rounded-xl transition-all duration-300 ${selectedAgent.id === agent.id ? `bg-gradient-to-r ${agent.color} text-white` : 'border'}`}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20"><agent.icon className="w-5 h-5" /></div>
                    <div className="text-right"><div>{agent.name}</div><div className="text-sm opacity-80">{agent.description}</div></div>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-4">حالة الاتصال</CardTitle>
              <div className="space-y-4">
                <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${voiceConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} /><span>{voiceConnected ? 'متصل' : 'غير متصل'}</span></div>
                <div className="flex items-center gap-3"><Bot className="w-4 h-4 text-blue-500" /><span>AI جاهز للعمل</span></div>
                <div className="flex items-center gap-3"><DeviceIcon className="w-4 h-4 text-purple-500" /><span>{deviceType} Device</span></div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="min-h-[600px] flex flex-col">
              {mode === 'voice' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r ${selectedAgent.color} flex items-center justify-center shadow-lg`}><selectedAgent.icon className="w-12 h-12 text-white" /></div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{selectedAgent.name}</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-8">{selectedAgent.description}</p>
                  
                  <button
                    onClick={() => voiceConnected ? stopVoiceSession() : startVoiceSession(selectedAgent.id as 'support' | 'sales')}
                    disabled={status === 'connecting'}
                    className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 ${voiceConnected ? 'bg-red-500' : 'bg-blue-500'}`}
                  >
                    {status === 'connecting' ? <Loader2 className="w-12 h-12 animate-spin" /> : voiceConnected ? <PhoneOff className="w-12 h-12" /> : <Phone className="w-12 h-12" />}
                  </button>
                  <p className="mt-4">{status === 'connecting' ? 'جاري الاتصال...' : voiceConnected ? 'المكالمة نشطة' : 'انقر لبدء المكالمة'}</p>
                  {transcript && <p className="mt-2 text-sm text-blue-500">"{transcript}"</p>}
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.type === 'agent' ? 'bg-slate-200' : 'bg-blue-500 text-white'}`}>
                                {/* FIX: Replaced invalid <msg.type> syntax with a standard ternary operator */}
                                {msg.type === 'agent' ? <Bot size={18} /> : <User size={18} />}
                            </div>
                            <div className={`max-w-md p-3 rounded-lg ${msg.type === 'agent' ? 'bg-slate-100 dark:bg-slate-800' : 'bg-blue-500 text-white'}`}>{msg.content}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 border-t dark:border-slate-700 flex gap-2">
                      <input type="text" placeholder="اكتب رسالة..." className="flex-1 p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                      <button className="p-3 bg-primary text-white rounded-lg"><Send size={18} /></button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}