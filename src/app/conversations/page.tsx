'use client';

import { useState } from 'react';
import {
  Phone,
  MessageSquare,
  FileText,
  PhoneOutgoing,
  PhoneIncoming,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';

// NOTE: The hardcoded data has been kept for this refactor.
// In a real app, this would come from the useAppStore hook.
const phoneCallsData = [
    { id: '1', type: 'outbound', customerName: 'ناصر الزامل', summary: 'مكالمة صادرة لتأكيد موعد صيانة التكييف' },
    { id: '2', type: 'inbound', customerName: 'محمد القحطاني', summary: 'مكالمة واردة للاستفسار عن مشاريع قريبة' },
];

export default function ConversationsPage() {
  const [activeTab, setActiveTab] = useState<'calls' | 'messages' | 'all'>('calls');
  const [selectedCallId, setSelectedCallId] = useState<string | null>('1');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCall = phoneCallsData.find(c => c.id === selectedCallId);

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="المحادثات" subtitle="إدارة المكالمات والرسائل مع العملاء" />
        
        <div className="flex gap-6">
          <div className="flex-1">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="البحث في المحادثات..."
              onFilterClick={() => alert('Filter')}
            />
            <div className="space-y-3">
              {phoneCallsData.map(call => (
                <Card
                  key={call.id}
                  onClick={() => setSelectedCallId(call.id)}
                  className={`p-4 cursor-pointer transition-all ${selectedCallId === call.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{call.customerName}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{call.summary}</p>
                    </div>
                    {call.type === 'inbound' ? <PhoneIncoming className="w-5 h-5 text-green-500" /> : <PhoneOutgoing className="w-5 h-5 text-blue-500" />}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="w-96 hidden lg:block">
            {selectedCall && (
              <Card className="sticky top-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">تفاصيل المكالمة</h3>
                <p>العميل: {selectedCall.customerName}</p>
                <p>الملخص: {selectedCall.summary}</p>
                {/* Transcript and other details would go here */}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}