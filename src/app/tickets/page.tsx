'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, RefreshCw, MapPin, User, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useModalState } from '@/hooks/useModalState';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Modal } from '@/components/shared/ui/Modal';
import TicketModal from '@/components/shared/modals/TicketModal';
import { EnhancedTicket } from '@/app/(shared)/types';
import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import ErrorBoundary from '@/components/shared/ui/ErrorBoundary';

const TICKET_COLUMNS = [
    { id: 'open', title: 'مفتوحة' },
    { id: 'in_progress', title: 'قيد المعالجة' },
    { id: 'pending_approval', title: 'بانتظار الموافقة' },
    { id: 'resolved', title: 'محلولة' },
];

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<EnhancedTicket | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { tickets, customers, properties, ticketsLoading, setTickets, setTicketsLoading, addTicket } = useAppStore();
  const { getTickets, createTicket, isAuthenticated } = useAuthApi();
  const { modalError, isSubmitting, handleModalSubmit } = useModalState();

  const handleRefresh = useCallback(async () => {
    if (isAuthenticated) {
      setTicketsLoading(true);
      try {
        const data = await getTickets();
        setTickets(data);
      } catch (error) {
        console.error("Failed to refresh tickets:", error);
      } finally {
        setTicketsLoading(false);
      }
    }
  }, [isAuthenticated, getTickets, setTickets, setTicketsLoading]);

  useEffect(() => {
    handleRefresh();
    window.addEventListener('focus', handleRefresh);
    return () => window.removeEventListener('focus', handleRefresh);
  }, [handleRefresh]);
  
  const handleCreateTicket = async (ticketData: {
    customerId: string;
    category: string;
    priority: string;
    project: string;
    issue: string;
  }) => {
    await handleModalSubmit(
      async () => {
        const newTicket = await createTicket(ticketData);
        addTicket(newTicket);
        setIsAddModalOpen(false);
      },
      () => setIsAddModalOpen(false)
    );
  };

  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const propertyMap = useMemo(() => new Map(properties.map(p => [p.id, p])), [properties]);

  const filteredTickets = useMemo(() => tickets.filter(ticket => {
    if (!searchQuery) return true;
    const customer = customerMap.get(ticket.customerId);
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      (customer && customer.name.toLowerCase().includes(lowerCaseQuery)) ||
      ticket.category.toLowerCase().includes(lowerCaseQuery)
    );
  }), [tickets, searchQuery, customerMap]);

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
          <ActionButton icon={RefreshCw} label="تحديث" onClick={handleRefresh} variant="secondary" />
          <ActionButton icon={Plus} label="تذكرة جديدة" onClick={() => setIsAddModalOpen(true)} />
        </PageHeader>
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث بالعميل أو الفئة..."
          onFilterClick={() => alert('Filter clicked')}
        />
        <ErrorBoundary>
          {ticketsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {TICKET_COLUMNS.map(column => (
                <div key={column.id}>
                  <div className="h-6 w-24 mb-4 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse"></div>
                  <div className="space-y-3">
                    <div className="h-24 p-4 bg-white/80 dark:bg-slate-800/80 rounded-2xl animate-pulse"></div>
                    <div className="h-24 p-4 bg-white/80 dark:bg-slate-800/80 rounded-2xl animate-pulse opacity-70"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {TICKET_COLUMNS.map(column => (
                <div key={column.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{column.title}</h3>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full text-sm font-medium">
                        {filteredTickets.filter(t => t.status === column.id).length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {filteredTickets
                      .filter(t => t.status === column.id)
                      .map(ticket => {
                        const customer = customerMap.get(ticket.customerId);
                        const property = ticket.propertyId ? propertyMap.get(ticket.propertyId) : null;
                        return (
                            <Card key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="p-4 cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all">
                                <div className="flex justify-between items-start">
                                    <p className="font-medium text-slate-800 dark:text-slate-200">{customer?.name || ticket.customerName}</p>
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
          )}
        </ErrorBoundary>
        
        <TicketModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateTicket}
          title="إنشاء تذكرة جديدة"
          customers={customers}
          isSubmitting={isSubmitting}
          error={modalError}
        />

        <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="تفاصيل التذكرة">
            {selectedTicket && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500">العميل</p>
                  <p className="font-semibold">{customerMap.get(selectedTicket.customerId)?.name}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500">المشكلة</p>
                  <p className="font-semibold">{selectedTicket.issue}</p>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-500">الحالة</p>
                      <StatusBadge status={selectedTicket.status} />
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-500">الأولوية</p>
                      <StatusBadge status={selectedTicket.priority} />
                    </div>
                </div>
              </div>
            )}
        </Modal>
      </div>
    </div>
  );
}