'use client';

import { useState, useRef, useEffect } from 'react';
import { Phone, MessageSquare, Search, Filter, Play, Pause, User, Bot, RefreshCw, Volume2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { conversations, setConversations, setConversationsLoading, customers, setCustomers, setCustomersLoading } = useAppStore();
  const { getConversations, getCustomers, isAuthenticated } = useAuthApi();

  // CRITICAL: Fetch Customers and Conversations
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          // Fetch both customers and conversations
          setConversationsLoading(true);
          setCustomersLoading(true);

          const [conversationsData, customersData] = await Promise.all([
            getConversations(),
            getCustomers()
          ]);

          setConversations(conversationsData);
          setCustomers(customersData);
        } catch (error) {
          console.error('Error fetching conversations and customers:', error);
        } finally {
          setConversationsLoading(false);
          setCustomersLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, getConversations, getCustomers, setConversations, setCustomers, setConversationsLoading, setCustomersLoading]);

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'عميل غير معروف';

  const filteredConversations = conversations.filter(c => {
    const name = getCustomerName(c.customerId).toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || c.summary.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConversation = conversations.find(c => c.id === selectedId);

  const handlePlay = (url: string | undefined, id: string) => {
    if (url && audioRef.current) {
      if (isPlaying === id) {
        audioRef.current.pause();
        setIsPlaying(null);
      } else {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(id);
      }
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="المحادثات" subtitle="سجل التواصل مع العملاء">
            <ActionButton icon={RefreshCw} label="تحديث" variant="secondary" onClick={() => {
              const fetchData = async () => {
                try {
                  setConversationsLoading(true);
                  setCustomersLoading(true);

                  const [conversationsData, customersData] = await Promise.all([
                    getConversations(),
                    getCustomers()
                  ]);

                  setConversations(conversationsData);
                  setCustomers(customersData);
                } catch (error) {
                  console.error('Error refreshing conversations and customers:', error);
                } finally {
                  setConversationsLoading(false);
                  setCustomersLoading(false);
                }
              };
              fetchData();
            }} />
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 space-y-4">
                <SearchFilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="بحث..." onFilterClick={() => {}} />
                <div className="space-y-2 h-[600px] overflow-y-auto">
                    {filteredConversations.map(conv => (
                        <Card 
                            key={conv.id} 
                            className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedId === conv.id ? 'border-primary ring-1 ring-primary' : ''}`}
                            onClick={() => setSelectedId(conv.id)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${conv.type === 'صوت' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                        {conv.type === 'صوت' ? <Phone size={18} /> : <MessageSquare size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">{getCustomerName(conv.customerId)}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-1">{conv.summary}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">{new Date(conv.createdAt).toLocaleDateString('ar-SA')}</span>
                            </div>
                        </Card>
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="text-center p-8 text-slate-500">لا توجد محادثات</div>
                    )}
                </div>
            </div>

            {/* Detail / Chat View */}
            <div className="lg:col-span-2">
                {selectedConversation ? (
                    <Card className="h-[600px] flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
                            <div>
                                <h3 className="font-bold">{getCustomerName(selectedConversation.customerId)}</h3>
                                <span className="text-xs text-slate-500">{selectedConversation.id}</span>
                            </div>
                            {selectedConversation.recordingUrl && (
                                <button 
                                    onClick={() => handlePlay(selectedConversation.recordingUrl!, selectedConversation.id)}
                                    className="flex items-center gap-2 bg-white dark:bg-slate-700 px-3 py-1 rounded-full text-sm shadow-sm hover:bg-slate-100"
                                >
                                    {isPlaying === selectedConversation.id ? <Pause size={14}/> : <Play size={14}/>}
                                    <span>تسجيل المكالمة</span>
                                </button>
                            )}
                        </div>

                        {/* Chat Area */}
                        <div 
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5] dark:bg-[#0b141a]"
                            style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'overlay' }}
                        >
                            {(!selectedConversation.transcript || selectedConversation.transcript.length === 0) && (
                                <div className="text-center p-4 text-slate-500 bg-white/80 dark:bg-slate-900/80 rounded-lg">
                                    لا يوجد نص متوفر لهذه المحادثة
                                </div>
                            )}
                            {selectedConversation.transcript?.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-lg text-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tl-none' 
                                        : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-white rounded-tr-none'
                                    } shadow-sm`}>
                                        <p>{msg.text}</p>
                                        <span className="text-[10px] opacity-50 block text-left mt-1">
                                            {msg.ts ? new Date(msg.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed">
                        <div className="text-center">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>اختر محادثة لعرض التفاصيل</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
        <audio ref={audioRef} onEnded={() => setIsPlaying(null)} className="hidden" />
      </div>
    </div>
  );
}