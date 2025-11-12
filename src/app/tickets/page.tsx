'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCw, MapPin, User} from 'lucide-react';
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
  
  const { tickets, customers, properties, refreshTickets, assignTicket, resolveTicket, approveTicket } = useAppStore();

  useEffect(() => { refreshTickets(); }, [refreshTickets]);

  // --- PERFORMANCE OPTIMIZATION ---
  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const propertyMap = useMemo(() => new Map(properties.map(p => [p.id, p])), [properties]);

  const filteredTickets = tickets.filter(ticket => {
    if (!searchQuery) return true;
    const customer = customerMap.get(ticket.customerId);
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      customer?.name.toLowerCase().includes(lowerCaseQuery) ||
      ticket.category.toLowerCase().includes(lowerCaseQuery)
    );
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'كهرباء': return '⚡';
      case 'سباكة': return '🚰';
      case 'مفاتيح': return '🔑';
      case 'تنظيف': return '🧹';
      default: return '📋';
    }
  };

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
          searchPlaceholder="البحث بالعميل أو الفئة..."
          onFilterClick={() => alert('Filter clicked')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {TICKET_COLUMNS.map(column => (
            <div key={column.id}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{column.title}</h3>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full text-sm">
                    {filteredTickets.filter(t => t.status === column.id).length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredTickets
                  .filter(t => t.status === column.id)
                  .map(ticket => {
                    const customer = customerMap.get(ticket.customerId);
                    const property = ticket.propertyId ? propertyMap.get(ticket.propertyId) : null;
                    if (!customer) return null;

                    return (
                        <Card key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="p-4 cursor-pointer hover:shadow-xl">
                            <div className="flex justify-between items-start">
                                <p className="font-medium text-slate-800 dark:text-slate-200">{customer.name}</p>
                                <StatusBadge status={ticket.priority} />
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                <span>{getCategoryIcon(ticket.category)}</span>
                                <span>{ticket.category}</span>
                            </div>
                            {property && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12} />{property.code}</p>}
                            {ticket.assignee && <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1"><User size={12} />{ticket.assignee}</p>}
                        </Card>
                    )
                })}
              </div>
            </div>
          ))}
        </div>

        <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="تفاصيل التذكرة">
            {selectedTicket && <div><p>العميل: {customerMap.get(selectedTicket.customerId)?.name}</p></div>}
        </Modal>
      </div>
    </div>
  );
}