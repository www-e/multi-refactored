'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Search, Filter, Play, Pause, User, Clock, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { formatDate } from '@/lib/utils';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { AudioPlayer } from '@/components/features/calls/AudioPlayer';
import { TranscriptModal } from '@/components/features/calls/TranscriptModal';

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);

  const { calls, setCalls, setCallsLoading, customers, setCustomers, setCustomersLoading } = useAppStore();
  const { getCalls, getCustomers, getTranscript, isAuthenticated } = useAuthApi();

  // Fetch calls and customers (calls API now includes voice session data)
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setCallsLoading(true);
          setCustomersLoading(true);

          const [callsData, customersData] = await Promise.all([
            getCalls(), // This now includes voice session data from backend
            getCustomers()
          ]);

          setCalls(callsData);
          setCustomers(customersData);
        } catch (error) {
          console.error('Error fetching calls and customers:', error);
        } finally {
          setCallsLoading(false);
          setCustomersLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, getCalls, getCustomers, setCalls, setCustomers, setCallsLoading, setCustomersLoading]);

  const getCustomerName = (id: string) => {
    // Find customer by id in the customers array
    const customer = customers.find(c => c.id === id);
    return customer ? customer.name : 'عميل غير معروف';
  };

  // Filter calls based on search query
  const filteredCalls = calls.filter(call => {
    const customerName = getCustomerName(call.customerId || '').toLowerCase();
    const callId = call.id.toLowerCase();
    return customerName.includes(searchQuery.toLowerCase()) ||
           callId.includes(searchQuery.toLowerCase()) ||
           call.status?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get selected call details
  const selectedCall = calls.find(c => c.id === selectedId);

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="المكالمات" subtitle="سجل المكالمات الصادرة والواردة">
          <ActionButton
            icon={RefreshCw}
            label="تحديث"
            variant="secondary"
            onClick={() => {
              const fetchData = async () => {
                try {
                  setCallsLoading(true);
                  setCustomersLoading(true);

                  const [callsData, customersData] = await Promise.all([
                    getCalls(), // This now includes voice session data from backend
                    getCustomers()
                  ]);

                  setCalls(callsData);
                  setCustomers(customersData);
                } catch (error) {
                  console.error('Error refreshing calls and customers:', error);
                } finally {
                  setCallsLoading(false);
                  setCustomersLoading(false);
                }
              };
              fetchData();
            }}
          />
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calls List */}
          <div className="lg:col-span-1 space-y-4">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="البحث في المكالمات..."
              onFilterClick={() => {}}
            />
            <div className="space-y-2 h-[600px] overflow-y-auto">
              {filteredCalls.map(call => (
                <Card
                  key={call.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedId === call.id ? 'border-primary ring-1 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedId(call.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        call.direction === 'صادر' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <Phone size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          {getCustomerName(call.customerId || '')}
                          {(() => {
                            // Find the original customer data to see if name was updated from "Unknown Customer"
                            const originalCustomer = customers.find(c => c.id === call.customerId);
                            if (originalCustomer &&
                                (originalCustomer.name.toLowerCase().includes('unknown') ||
                                 originalCustomer.name === 'Unknown Customer' ||
                                 originalCustomer.name === 'عميل غير معروف') &&
                                !getCustomerName(call.customerId).toLowerCase().includes('unknown')) {
                              return (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  محدث من المكالمة
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{call.direction}</span>
                          <span>•</span>
                          <span>{call.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={call.status as any || 'unknown' as any} />
                        {call.outcome && (
                          <StatusBadge
                            status={(() => {
                              // Map outcome to a status that has proper styling
                              switch(call.outcome) {
                                case 'booked':
                                case 'qualified':
                                  return 'booked';
                                case 'ticket':
                                  return 'ticket';
                                case 'info':
                                  return 'info';
                                default:
                                  return 'info'; // Default to info for unknown outcomes
                              }
                            })()}
                            type="pill"
                          />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(call.createdAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              {filteredCalls.length === 0 && (
                <div className="text-center p-8 text-slate-500">لا توجد مكالمات</div>
              )}
            </div>
          </div>

          {/* Call Detail View */}
          <div className="lg:col-span-2">
            {selectedCall ? (
              <Card className="h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {getCustomerName(selectedCall.customerId || '')}
                      {(() => {
                        // Find the original customer data to see if name was updated from "Unknown Customer"
                        const originalCustomer = customers.find(c => c.id === selectedCall.customerId);
                        if (originalCustomer &&
                            (originalCustomer.name.toLowerCase().includes('unknown') ||
                             originalCustomer.name === 'Unknown Customer' ||
                             originalCustomer.name === 'عميل غير معروف') &&
                            !getCustomerName(selectedCall.customerId).toLowerCase().includes('unknown')) {
                          return (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              محدث من المكالمة
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </h3>
                    <p className="text-sm text-slate-500">مكالمة {selectedCall.direction === 'صادر' ? 'صادرية' : 'واردة'}</p>
                  </div>
                  <StatusBadge status={selectedCall.status as any || 'unknown' as any} />
                </div>

                {/* Details */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">رقم المكالمة</h4>
                      <p className="font-medium">{selectedCall.id}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">الحالة</h4>
                      <p className="font-medium">{selectedCall.status}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">الاتجاه</h4>
                      <p className="font-medium">{selectedCall.direction}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">النوع</h4>
                      <p className="font-medium">
                        {selectedCall.aiOrHuman === 'AI' ? 'ذكاء اصطناعي' : ' بشري'}
                      </p>
                    </div>
                    {selectedCall.voiceSessionId && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">رقم الجلسة الصوتية</h4>
                        <p className="font-medium">{selectedCall.voiceSessionId}</p>
                      </div>
                    )}
                    {selectedCall.conversationId && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">رقم المحادثة</h4>
                        <p className="font-medium">{selectedCall.conversationId}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">تاريخ البدء</h4>
                      <p className="font-medium">
                        {new Date(selectedCall.createdAt).toLocaleString('ar-EG')}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">مدة المكالمة</h4>
                      <p className="font-medium">
                        {selectedCall.handleSec ? `${selectedCall.handleSec} ثانية` : 'غير متوفرة'}
                      </p>
                    </div>
                    {selectedCall.agentName && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">نوع العميل</h4>
                        <p className="font-medium">{selectedCall.agentName}</p>
                      </div>
                    )}
                    {selectedCall.sessionStatus && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">حالة الجلسة</h4>
                        <p className="font-medium capitalize">{selectedCall.sessionStatus}</p>
                      </div>
                    )}
                    {selectedCall.extractedIntent && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium text-slate-500 mb-1">النوع المستخرج</h4>
                        <p className="font-medium">{selectedCall.extractedIntent}</p>
                      </div>
                    )}
                    {selectedCall.sessionSummary && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium text-slate-500 mb-1">ملخص الجلسة</h4>
                        <p className="font-medium">{selectedCall.sessionSummary}</p>
                      </div>
                    )}
                  </div>

                  {selectedCall.outcome && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">النتيجة</h4>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={(() => {
                            // Map outcome to a status that has proper styling
                            switch(selectedCall.outcome) {
                              case 'booked':
                              case 'qualified':
                                return 'booked';
                              case 'ticket':
                                return 'ticket';
                              case 'info':
                                return 'info';
                              default:
                                return 'info'; // Default to info for unknown outcomes
                            }
                          })()}
                        />
                        <span className="font-medium">
                          {(() => {
                            // Map outcome to better display text
                            switch(selectedCall.outcome) {
                              case 'booked':
                                return 'تم الحجز';
                              case 'ticket':
                                return 'تم رفع تذكرة';
                              case 'qualified':
                                return 'عميل مؤهل';
                              case 'info':
                                return 'استفسار معلوماتي';
                              default:
                                return selectedCall.outcome;
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Show extracted intent if available, prioritizing it over outcome */}
                  {selectedCall.extractedIntent && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">نوع المكالمة</h4>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={(() => {
                            switch(selectedCall.extractedIntent) {
                              case 'raise_ticket':
                                return 'ticket';
                              case 'book_appointment':
                                return 'booked';
                              case 'none':
                                return 'info';
                              default:
                                return 'info';
                            }
                          })()}
                        />
                        <span className="font-medium">
                          {(() => {
                            switch(selectedCall.extractedIntent) {
                              case 'raise_ticket':
                                return 'رفع تذكرة';
                              case 'book_appointment':
                                return 'حجز موعد';
                              case 'none':
                                return 'غير مصنفة';
                              default:
                                return selectedCall.extractedIntent;
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-1">تسجيل المكالمة</h4>
                    <AudioPlayer src={selectedCall.recordingUrl || ''} />
                  </div>

                  {/* Transcript button if conversation ID is available */}
                  {selectedCall.conversationId && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">النص</h4>
                      <button
                        onClick={() => setTranscriptModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-sm"
                      >
                        <MessageSquare size={14} />
                        <span>عرض النص</span>
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed">
                <div className="text-center">
                  <Phone className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>اختر مكالمة لعرض التفاصيل</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transcript Modal */}
        {selectedCall && selectedCall.conversationId && (
          <TranscriptModal
            open={transcriptModalOpen}
            onOpenChange={setTranscriptModalOpen}
            conversationId={selectedCall.conversationId}
          />
        )}
      </div>
    </div>
  );
}