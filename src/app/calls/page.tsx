'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Search, Filter, Play, Pause, User, Clock, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { calls, setCalls, setCallsLoading, customers, setCustomers, setCustomersLoading } = useAppStore();
  const { getCalls, getCustomers, isAuthenticated } = useAuthApi();

  // Fetch calls and customers
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setCallsLoading(true);
          setCustomersLoading(true);
          
          const [callsData, customersData] = await Promise.all([
            getCalls(),
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
    const customerName = getCustomerName(call.customer_id || call.customerId || '').toLowerCase();
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
                    getCalls(),
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
                        call.direction === 'outbound' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <Phone size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">
                          {getCustomerName(call.customer_id || call.customerId || '')}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{call.direction === 'outbound' ? 'صادر' : 'وارد'}</span>
                          <span>•</span>
                          <span>{call.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={call.status || 'unknown'} />
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(call.created_at || call.createdAt).toLocaleDateString('ar-SA')}
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
                    <h3 className="font-bold">
                      {getCustomerName(selectedCall.customer_id || selectedCall.customerId || '')}
                    </h3>
                    <p className="text-sm text-slate-500">مكالمة {selectedCall.direction === 'outbound' ? 'صادرية' : 'واردة'}</p>
                  </div>
                  <StatusBadge status={selectedCall.status || 'unknown'} />
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
                      <p className="font-medium">{selectedCall.direction === 'outbound' ? 'صادر' : 'وارد'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">النوع</h4>
                      <p className="font-medium">
                        {selectedCall.ai_or_human === 'AI' ? 'ذكاء اصطناعي' : ' بشري'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">تاريخ البدء</h4>
                      <p className="font-medium">
                        {new Date(selectedCall.created_at || selectedCall.createdAt).toLocaleString('ar-SA')}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">مدة المكالمة</h4>
                      <p className="font-medium">
                        {selectedCall.handle_sec ? `${selectedCall.handle_sec} ثانية` : 'غير متوفرة'}
                      </p>
                    </div>
                  </div>

                  {selectedCall.outcome && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">النتيجة</h4>
                      <p className="font-medium">{selectedCall.outcome}</p>
                    </div>
                  )}

                  {selectedCall.recording_url && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-1">تسجيل المكالمة</h4>
                      <button className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-sm">
                        <Play size={14} />
                        <span>استمع للتسجيل</span>
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
      </div>
    </div>
  );
}