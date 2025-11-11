'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Modal } from '@/components/shared/ui/Modal';
import { EnhancedTicket } from '@/app/(shared)/types';
import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';

const TICKET_COLUMNS = [
    { id: 'مفتوحة', title: 'مفتوحة' },
    { id: 'قيد_المعالجة', title: 'قيد المعالجة' },
    { id: 'بانتظار_الموافقة', title: 'بانتظار الموافقة' },
    { id: 'محلولة', title: 'محلولة' },
];

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<EnhancedTicket | null>(null);
  const { tickets, customers, properties, refreshTickets } = useAppStore();

  useEffect(() => { refreshTickets(); }, [refreshTickets]);

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown';

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="التذاكر" subtitle="إدارة طلبات الدعم والصيانة">
          <ActionButton icon={RefreshCw} label="تحديث" onClick={refreshTickets} variant="secondary" />
          <ActionButton icon={Plus} label="تذكرة جديدة" onClick={() => alert('New Ticket')} />
        </PageHeader>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث في التذاكر..."
          onFilterClick={() => alert('Filter clicked')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {TICKET_COLUMNS.map(column => (
            <div key={column.id}>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{column.title}</h3>
              <div className="space-y-3">
                {tickets
                  .filter(t => t.status === column.id)
                  .filter(t => getCustomerName(t.customerId).includes(searchQuery))
                  .map(ticket => (
                    <Card
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-4 cursor-pointer hover:shadow-xl"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{getCustomerName(ticket.customerId)}</p>
                        <StatusBadge status={ticket.priority} />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{ticket.category}</p>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="تفاصيل التذكرة">
            {selectedTicket && <div><p>العميل: {getCustomerName(selectedTicket.customerId)}</p></div>}
        </Modal>
      </div>
    </div>
  );
}