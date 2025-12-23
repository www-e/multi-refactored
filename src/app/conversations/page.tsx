'use client';

import { useState, useRef, useEffect } from 'react';
import { Phone, MessageSquare, Search, Filter, Play, Pause, User, Bot, RefreshCw, Volume2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { formatDate } from '@/lib/utils';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';
import { AudioPlayer } from '@/components/features/calls/AudioPlayer';
import { TranscriptModal } from '@/components/features/calls/TranscriptModal';

interface Message {
  id: number;
  role: string;
  text: string;
  ts: string | Date;
}

interface Conversation {
  id: string;
  type: 'صوت' | 'رسالة';
  customerId: string;
  transcript: Message[];
  summary: string;
  entities: any;
  sentiment: 'إيجابي' | 'محايد' | 'سلبي';
  recordingUrl?: string;
  status: 'مفتوحة' | 'مغلقة' | 'محولة_للبشر';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Update the store to use the new conversation type with transcript
  const { conversations, setConversations, setConversationsLoading, customers, setCustomers, setCustomersLoading } = useAppStore();
  const { getConversations, getCustomers, getConversation, getTranscript, isAuthenticated } = useAuthApi();

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

          // Update conversations to include transcripts (this will get full conversation details with transcript)
          const detailedConversations = conversationsData; // The API now returns conversations with transcript included

          setConversations(detailedConversations);
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
  }, [isAuthenticated, getConversations, getCustomers, getConversation, setConversations, setCustomers, setConversationsLoading, setCustomersLoading]);

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'عميل غير معروف';

  const filteredConversations = conversations.filter(c => {
    const name = getCustomerName(c.customerId).toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || c.summary.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConversation: any = conversations.find(c => c.id === selectedId);

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

                  // Update conversations to include transcripts (this will get full conversation details with transcript)
                  const detailedConversations = conversationsData; // The API now returns conversations with transcript included

                  setConversations(detailedConversations);
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

        <div className="grid grid-cols-1 gap-6">
            {/* List */}
            <div className="space-y-4">
                <SearchFilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="بحث..." onFilterClick={() => {}} />
                <div className="space-y-2">
                    {filteredConversations.map((conv, index) => {
                        const isSelected = selectedId === conv.id;
                        return (
                            <div key={conv.id}>
                                <Card
                                    key={conv.id}
                                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-primary ring-1 ring-primary' : ''}`}
                                    onClick={() => setSelectedId(isSelected ? null : conv.id)}
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="flex gap-3 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${conv.type === 'صوت' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                {conv.type === 'صوت' ? <Phone size={18} /> : <MessageSquare size={18} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-semibold text-sm">{getCustomerName(conv.customerId)}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                                                    <span>محادثة {index + 1} من {filteredConversations.length}</span>
                                                    <span>•</span>
                                                    <p className="text-xs text-slate-500 line-clamp-1 truncate">{conv.summary}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 self-start sm:self-auto">{formatDate(conv.createdAt)}</span>
                                    </div>
                                </Card>

                                {/* Inline Details Panel */}
                                {isSelected && selectedConversation && (
                                    <div className="mt-2 overflow-hidden transition-all duration-300 ease-in-out">
                                        <Card className="p-0 overflow-hidden">
                                            {/* Header */}
                                            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
                                                <div className="min-w-0">
                                                    <h3 className="font-bold">{getCustomerName(selectedConversation.customerId)}</h3>
                                                    <span className="text-xs text-slate-500">{selectedConversation.id}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 sm:mt-0">
                                                  {/* Always show AudioPlayer for debugging - it will show appropriate message if no URL */}
                                                  <AudioPlayer src={selectedConversation.recordingUrl || ''} />
                                                  {selectedConversation.id && (
                                                      <button
                                                          onClick={() => setTranscriptModalOpen(true)}
                                                          className="flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-full text-xs"
                                                      >
                                                          <MessageSquare size={12} />
                                                          <span>عرض النص</span>
                                                      </button>
                                                  )}
                                                </div>
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
                                                {selectedConversation.transcript?.map((msg: Message, idx: number) => (
                                                    <div key={`${msg.id}-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[70%] p-3 rounded-lg text-sm ${
                                                            msg.role === 'user' || msg.role === 'customer'
                                                            ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tl-none'
                                                            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-white rounded-tr-none'
                                                        } shadow-sm`}>
                                                            <p>{msg.text}</p>
                                                            <span className="text-[10px] opacity-50 block text-left mt-1">
                                                                {typeof msg.ts === 'string' ? new Date(msg.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) :
                                                                 msg.ts instanceof Date ? msg.ts.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) :
                                                                 new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filteredConversations.length === 0 && (
                        <div className="text-center p-8 text-slate-500">لا توجد محادثات</div>
                    )}
                </div>
            </div>
        </div>

        {/* Transcript Modal */}
        {selectedConversation && selectedConversation.id && (
          <TranscriptModal
            open={transcriptModalOpen}
            onOpenChange={setTranscriptModalOpen}
            conversationId={selectedConversation.id}
          />
        )}
      </div>
    </div>
  );
}