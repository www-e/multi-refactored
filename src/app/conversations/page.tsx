'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';

export default function ConversationsPage() {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // CORRECTED: Remove call to non-existent refreshAllData
  const { conversations, customers } = useAppStore();
  
  // NOTE: This page does not have its own loading state or data-fetching logic yet.
  // We will assume for now that the Dashboard has loaded the necessary customer data.
  // A full implementation would involve fetching conversations here.

  const customerMap = useMemo(() => 
    new Map(customers.map(c => [c.id, c.name])),
    [customers]
  );

  const filteredConversations = conversations.filter(conv => {
    const customerName = customerMap.get(conv.customerId) || '';
    return (
        conv.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  const selectedConv = conversations.find(c => c.id === selectedConvId);

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="المحادثات" subtitle="إدارة المكالمات والرسائل مع العملاء" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="البحث في المحادثات..."
              onFilterClick={() => alert('Filter')}
            />
            {conversations.length === 0 ? (
                <Card className="text-center py-12"><p className="text-slate-500">لا توجد محادثات لعرضها.</p></Card>
            ) : (
                <div className="space-y-3">
                {filteredConversations.map(conv => (
                    <Card
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-4 cursor-pointer transition-all ${selectedConvId === conv.id ? 'ring-2 ring-primary' : ''}`}
                    >
                    <div className="flex items-center justify-between">
                        <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{customerMap.get(conv.customerId) || 'عميل غير معروف'}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{conv.summary}</p>
                        </div>
                        <StatusBadge status={conv.type} type="icon" />
                    </div>
                    </Card>
                ))}
                </div>
            )}
          </div>
          
          <div className="hidden lg:block">
            {selectedConv ? (
              <Card className="sticky top-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">تفاصيل المحادثة</h3>
                <p><strong>العميل:</strong> {customerMap.get(selectedConv.customerId)}</p>
                <p><strong>الملخص:</strong> {selectedConv.summary}</p>
                <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-2">النص الكامل:</h4>
                    <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
                        {selectedConv.transcript.map((msg, idx) => (
                            <p key={idx} className={msg.role === 'user' ? 'text-blue-600' : ''}><strong>{msg.role}:</strong> {msg.text}</p>
                        ))}
                    </div>
                </div>
              </Card>
            ) : (
                 <Card className="sticky top-6 text-center py-12">
                    <p className="text-slate-500">اختر محادثة لعرض تفاصيلها</p>
                </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}