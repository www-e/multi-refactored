'use client';
import { useState } from 'react';
import { Headphones, MessageSquare, Phone, PhoneOff, Mic, Volume2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthApi } from '@/hooks/useAuthApi';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { Card } from '@/components/shared/ui/Card';

export default function ClientOnlyPlayground() {
  const [mode, setMode] = useState<'voice' | 'chat'>('voice');
  const [transcript, setTranscript] = useState('');
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  const { createVoiceSession, postLog } = useAuthApi();
  const { 
    startVoiceSession, 
    stopVoiceSession, 
    isConnected, 
    isListening, 
    isSpeaking,
    currentSession
  } = useVoiceAgent({ createVoiceSession, postLog }, {
    onTranscript: (text) => setTranscript(text),
    onStatusChange: (status) => {
        if (status === 'connected' && currentSession?.backend_session?.session_id) {
            setLastSessionId(currentSession.backend_session.session_id);
            setSyncStatus('idle'); // Reset sync status on new call
        }
    }
  });

  // Manual Sync Function
  const handleManualSync = async () => {
    // Use the session ID from state or the current session object
    const targetId = lastSessionId || currentSession?.backend_session?.session_id;
    
    if (!targetId) {
        alert("No recent session to sync.");
        return;
    }

    setSyncStatus('syncing');
    try {
        const response = await fetch('/api/voice/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: targetId })
        });
        
        if (response.ok) {
            setSyncStatus('success');
            // Force a page refresh or data reload here if desired
            setTimeout(() => setSyncStatus('idle'), 3000);
        } else {
            setSyncStatus('error');
            const err = await response.json();
            console.error("Sync failed:", err);
        }
    } catch (e) {
        console.error("Sync error:", e);
        setSyncStatus('error');
    }
  };

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

                {/* Status Card */}
                <Card>
                    <h3 className="font-bold mb-4">الحالة</h3>
                    <div className="flex items-center gap-2 text-sm mb-4">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span>{isConnected ? 'متصل بالخادم' : 'غير متصل'}</span>
                    </div>
                    
                    {/* Manual Sync Button - Only shows if we have a session ID */}
                    {(lastSessionId || isConnected) && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 mb-2">في حال عدم ظهور البيانات:</p>
                            <button 
                                onClick={handleManualSync}
                                disabled={syncStatus === 'syncing'}
                                className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-all ${
                                    syncStatus === 'success' ? 'bg-green-100 text-green-700' :
                                    syncStatus === 'error' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800'
                                }`}
                            >
                                {syncStatus === 'syncing' && <RefreshCw size={16} className="animate-spin" />}
                                {syncStatus === 'success' && <CheckCircle size={16} />}
                                {syncStatus === 'error' && <AlertCircle size={16} />}
                                {syncStatus === 'idle' && <RefreshCw size={16} />}
                                <span>
                                    {syncStatus === 'syncing' ? 'جاري التحديث...' : 
                                     syncStatus === 'success' ? 'تم التحديث' : 
                                     syncStatus === 'error' ? 'فشل التحديث' : 'تحديث البيانات يدوياً'}
                                </span>
                            </button>
                        </div>
                    )}
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
                            
                            {lastSessionId && !isConnected && (
                                <p className="text-xs text-slate-400 font-mono mt-4">
                                    Session ID: {lastSessionId}
                                </p>
                            )}
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