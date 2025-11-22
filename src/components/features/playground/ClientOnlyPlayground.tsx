'use client';

import { useState } from 'react';
import { Headphones, MessageSquare, Bot, Wifi, Phone, PhoneOff, Mic, Volume2 } from 'lucide-react';
import { useAuthApi } from '@/hooks/useAuthApi';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { Card } from '@/components/shared/ui/Card';

export default function ClientOnlyPlayground() {
  const [mode, setMode] = useState<'voice' | 'chat'>('voice');
  const [transcript, setTranscript] = useState('');
  const { createVoiceSession, postLog } = useAuthApi();
  
  const { 
    startVoiceSession, 
    stopVoiceSession, 
    isConnected, 
    isListening, 
    isSpeaking 
  } = useVoiceAgent({ createVoiceSession, postLog }, {
    onTranscript: (text) => setTranscript(text),
  });

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="ساحة التجربة" subtitle="اختبر المساعد الصوتي الذكي" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <h3 className="font-bold mb-4">الوضع</h3>
                    <div className="space-y-2">
                        <button 
                            onClick={() => setMode('voice')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${mode === 'voice' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <Headphones size={20} /> <span>صوتي</span>
                        </button>
                        <button 
                            onClick={() => setMode('chat')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${mode === 'chat' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <MessageSquare size={20} /> <span>نصي</span>
                        </button>
                    </div>
                </Card>

                <Card>
                    <h3 className="font-bold mb-4">الحالة</h3>
                    <div className="flex items-center gap-2 text-sm">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span>{isConnected ? 'متصل بالخادم' : 'غير متصل'}</span>
                    </div>
                </Card>
            </div>

            {/* Main Stage */}
            <div className="lg:col-span-3">
                <Card className="h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Background Pulse Animation */}
                    {isConnected && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                            <div className="w-96 h-96 bg-primary rounded-full animate-ping"></div>
                        </div>
                    )}

                    {mode === 'voice' ? (
                        <div className="text-center z-10">
                            <div className="mb-8 relative">
                                <button 
                                    onClick={() => isConnected ? stopVoiceSession() : startVoiceSession('support')}
                                    className={`w-32 h-32 rounded-full flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-105 ${
                                        isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {isConnected ? <PhoneOff size={48} /> : <Phone size={48} />}
                                </button>
                                {isSpeaking && (
                                    <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg animate-bounce">
                                        <Volume2 className="text-blue-500" />
                                    </div>
                                )}
                                {isListening && (
                                    <div className="absolute -top-4 -left-4 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg animate-pulse">
                                        <Mic className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            
                            <h2 className="text-2xl font-bold mb-2">
                                {isConnected ? 'المكالمة جارية...' : 'جاهز للاتصال'}
                            </h2>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                {transcript || 'اضغط على الزر لبدء محادثة صوتية مع المساعد الذكي'}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <MessageSquare size={64} className="mx-auto mb-4 opacity-20" />
                            <p>واجهة المحادثة النصية قيد التطوير</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}