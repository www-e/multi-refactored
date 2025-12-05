'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, MapPin, User, Clock, Edit, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import TicketModal from '@/components/shared/modals/TicketModal';
import DeleteConfirmModal from '@/components/shared/modals/DeleteConfirmModal';
import { useModalState } from '@/hooks/useModalState';
import { mapTicketStatusToArabic } from '@/lib/statusMapper';
import { formatDate } from '@/lib/utils';

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Added status filter
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<any>(null);
  const [ticketToEdit, setTicketToEdit] = useState<any>(null);

  const { tickets, setTickets, setTicketsLoading, customers, setCustomers, addTicket, removeTicket, updateTicket: updateTicketInStore } = useAppStore();
  const { getTickets, getCustomers, createTicket, updateTicket, updateTicketStatus, deleteTicket, isAuthenticated } = useAuthApi();
  const { isSubmitting, handleModalSubmit } = useModalState();

  // CRITICAL FIX: Fetch Customers AND Tickets
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setTicketsLoading(true);
          await Promise.all([
            getTickets().then(setTickets),
            getCustomers().then(setCustomers)
          ]);
        } catch (error) {
          console.error('Error fetching tickets and customers:', error);
        } finally {
          setTicketsLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, getTickets, setTickets, getCustomers, setCustomers, setTicketsLoading]);

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown';

  const handleEditTicket = (ticket: any) => {
    setTicketToEdit(ticket);
    setIsEditModalOpen(true);
  };

  const columns = [
    { id: 'open', label: 'مفتوحة', color: 'bg-blue-500' },
    { id: 'in_progress', label: 'قيد المعالجة', color: 'bg-yellow-500' },
    { id: 'pending_approval', label: 'بانتظار الموافقة', color: 'bg-orange-500' },
    { id: 'resolved', label: 'محلولة', color: 'bg-green-500' },
  ];

  const filteredTickets = tickets.filter(t =>
    (t.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCustomerName(t.customerId).toLowerCase().includes(searchQuery.toLowerCase())) &&
    (statusFilter === 'all' || t.status === statusFilter)
  );

  const matchesStatus = (ticketStatus: string, colId: string) => {
    const s = ticketStatus.toLowerCase();
    if (colId === 'open') return s === 'open' || s === 'مفتوحة';
    if (colId === 'in_progress') return s === 'in_progress' || s === 'قيد_المعالجة';
    if (colId === 'pending_approval') return s === 'pending_approval' || s === 'بانتظار_الموافقة';
    if (colId === 'resolved') return s === 'resolved' || s === 'محلولة' || s === 'closed';
    return false;
  };

  const getNextStatus = (currentStatus: string): string => {
    if (matchesStatus(currentStatus, 'open')) return 'قيد المعالجة';
    if (matchesStatus(currentStatus, 'in_progress')) return 'محلولة';
    return 'مغلقة'; // fallback
  };

  const handleNextStatus = async (id: string, currentStatus: string) => {
    // Simple flow: open -> in_progress -> resolved
    let nextStatus: 'in_progress' | 'resolved' | null = null;
    if (matchesStatus(currentStatus, 'open')) nextStatus = 'in_progress';
    else if (matchesStatus(currentStatus, 'in_progress')) nextStatus = 'resolved';

    if (nextStatus) {
        try {
            await updateTicketStatus(id, nextStatus);
            updateTicketInStore(id, { status: nextStatus });
        } catch (error) { console.error(error); }
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="التذاكر" subtitle="لوحة متابعة الطلبات">
            <div className="flex gap-3">
                <ActionButton icon={RefreshCw} label="تحديث" variant="secondary" onClick={() => {
                  const fetchData = async () => {
                    try {
                      setTicketsLoading(true);
                      const data = await getTickets();
                      setTickets(data);
                    } catch (error) {
                      console.error('Error refreshing tickets:', error);
                    } finally {
                      setTicketsLoading(false);
                    }
                  };
                  fetchData();
                }} />
                <ActionButton icon={Plus} label="تذكرة جديدة" onClick={() => setIsAddModalOpen(true)} />
            </div>
        </PageHeader>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <SearchFilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="بحث بالعميل أو المشكلة..." onFilterClick={() => {}} />
          <div className="flex gap-2">
            <button
              className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setStatusFilter('all')}
            >
              الكل
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'open' ? 'bg-blue-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setStatusFilter('open')}
            >
              مفتوحة
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'in_progress' ? 'bg-yellow-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setStatusFilter('in_progress')}
            >
              قيد المعالجة
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'pending_approval' ? 'bg-orange-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setStatusFilter('pending_approval')}
            >
              بانتظار الموافقة
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm ${statusFilter === 'resolved' ? 'bg-green-500 text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setStatusFilter('resolved')}
            >
              محلولة
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
            {columns.map(col => {
                const colTickets = filteredTickets.filter(t => matchesStatus(t.status, col.id));
                return (
                    <div key={col.id} className="min-w-[280px]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                                <h3 className="font-bold">{col.label}</h3>
                            </div>
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-xs">{colTickets.length}</span>
                        </div>
                        
                        <div className="space-y-3">
                            {colTickets.map(ticket => {
                                const customerName = getCustomerName(ticket.customerId) === 'Unknown' ? ticket.customerName || 'عميل' : getCustomerName(ticket.customerId);
                                return (
                                    <Card key={ticket.id} className="p-4 hover:shadow-md cursor-pointer border-l-4" style={{ borderLeftColor: col.color.replace('bg-', '') }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <StatusBadge status={ticket.priority} />
                                            <div className="flex gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); handleNextStatus(ticket.id, ticket.status); }} className="p-1 hover:bg-slate-100 rounded" title={`الانتقال إلى الحالة: ${getNextStatus(ticket.status)}`}>
                                                    <Clock size={14} className="text-slate-400 hover:text-primary" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setTicketToDelete(ticket); setIsDeleteModalOpen(true); }} className="p-1 hover:bg-red-50 rounded">
                                                    <Trash2 size={14} className="text-slate-400 hover:text-red-500" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleEditTicket(ticket); }} className="p-1 hover:bg-slate-100 rounded">
                                                    <Edit size={14} className="text-slate-400 hover:text-primary" />
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className="font-semibold text-sm mb-1">{customerName}</h4>
                                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{ticket.issue}</p>
                                        
                                        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <span className="flex items-center gap-1"><User size={12} /> {ticket.category}</span>
                                            <span>{formatDate(ticket.createdAt)}</span>
                                        </div>
                                    </Card>
                                );
                            })}
                            {colTickets.length === 0 && (
                                <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed text-sm">
                                    لا يوجد تذاكر
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        <TicketModal 
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="إنشاء تذكرة"
            customers={customers}
            onSubmit={async (data) => {
                await handleModalSubmit(async () => {
                    const res = await createTicket(data);
                    addTicket(res);
                    setIsAddModalOpen(false);
                });
            }}
            isSubmitting={isSubmitting}
        />

        <TicketModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setTicketToEdit(null);
            }}
            title="تعديل التذكرة"
            customers={customers}
            ticket={ticketToEdit}
            onSubmit={async (data) => {
                if (!ticketToEdit) return;
                await handleModalSubmit(async () => {
                    const res = await updateTicket(ticketToEdit.id, data);
                    // Update the ticket in the store
                    updateTicketInStore(ticketToEdit.id, res);
                    setIsEditModalOpen(false);
                    setTicketToEdit(null);
                });
            }}
            isSubmitting={isSubmitting}
        />

        <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={async () => {
              if (!ticketToDelete) return;

              try {
                await deleteTicket(ticketToDelete.id);
                // Update the store to remove the ticket
                removeTicket(ticketToDelete.id);
                setIsDeleteModalOpen(false);
                setTicketToDelete(null);
              } catch (error) {
                console.error('Error deleting ticket:', error);
                alert('فشل حذف التذكرة. يرجى المحاولة مرة أخرى.');
              }
            }}
            title="حذف التذكرة"
            message={`هل أنت متأكد من رغبتك في حذف التذكرة للعميل "${getCustomerName(ticketToDelete?.customerId) || ticketToDelete?.customerName || 'عميل'}"؟`}
            itemName={getCustomerName(ticketToDelete?.customerId) || ticketToDelete?.customerName || 'تذكرة'}
            isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}