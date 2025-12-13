'use client';
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, User, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import ActionMenu from '@/components/shared/ui/ActionMenu';
import TicketModal from '@/components/shared/modals/TicketModal';
import DeleteConfirmModal from '@/components/shared/modals/DeleteConfirmModal';
import { useModalState } from '@/hooks/useModalState';
import { formatDate } from '@/lib/utils';

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<any>(null);
  const [ticketToEdit, setTicketToEdit] = useState<any>(null);
  const [ticketToView, setTicketToView] = useState<any>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<Record<string, 'idle' | 'in_progress' | 'resolved'>>({});

  const { tickets, setTickets, setTicketsLoading, customers, setCustomers, addTicket, removeTicket, updateTicket: updateTicketInStore } = useAppStore();
  const { getTickets, getCustomers, createTicket, updateTicket, updateTicketStatus, deleteTicket, isAuthenticated } = useAuthApi();
  const { isSubmitting, handleModalSubmit } = useModalState();

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

  // Robust Name Resolution: Prefer snapshot name (AI extracted), fallback to lookup
  // FIX: Added safety check for null/undefined ticket to prevent build crashes
  const getCustomerName = (ticket: any) => {
    if (!ticket) return 'Unknown';
    if (ticket.customerName && ticket.customerName !== 'Unknown') return ticket.customerName;
    const c = customers.find(c => c.id === ticket.customerId);
    return c ? c.name : 'Unknown';
  };

  const handleEditTicket = (ticket: any) => {
    setTicketToEdit(ticket);
    setIsEditModalOpen(true);
  };

  const handleViewTicket = (ticket: any) => {
    setTicketToView(ticket);
    setIsViewModalOpen(true);
  };

  const filteredTickets = tickets.filter(t =>
    (t.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCustomerName(t).toLowerCase().includes(searchQuery.toLowerCase())) &&
    (statusFilter === 'all' || t.status === statusFilter)
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'مفتوحة';
      case 'in_progress': return 'قيد المعالجة';
      case 'resolved': return 'محلولة';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'منخفض';
      case 'med': return 'متوسط';
      case 'high': return 'عالٍ';
      case 'urgent': return 'عاجل';
      default: return priority;
    }
  };


  const statusOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'open', label: 'مفتوحة' },
    { value: 'in_progress', label: 'قيد المعالجة' },
    { value: 'resolved', label: 'محلولة' },
  ];

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
            {statusOptions.map(option => (
                <button
                  key={option.value}
                  className={`px-3 py-2 rounded-lg text-sm ${statusFilter === option.value ? 'bg-primary text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'}`}
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-12">#</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">العميل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">المشكلة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">الفئة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">الأولوية</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">المشروع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      لا توجد تذاكر
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket, index) => {
                    const customerName = getCustomerName(ticket);
                    return (
                      <tr
                        key={ticket.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-slate-400 ml-2" />
                            <span className="font-medium">{customerName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 dark:text-slate-100 line-clamp-2 max-w-xs">
                            {ticket.issue}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                          {ticket.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={ticket.priority} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ticket.status === 'open' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300' :
                            ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300'
                          }`}>
                            {getStatusLabel(ticket.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                          {ticket.project || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                          {formatDate(ticket.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <ActionMenu
                            position="left"
                            actions={[
                              // Status update actions based on current ticket status
                              ...(ticket.status === 'open' ? [
                                {
                                  label: statusUpdateLoading[ticket.id] === 'in_progress' ? 'جاري التحديث...' : 'بدء المعالجة',
                                  icon: <Edit size={16} />,
                                  onClick: async () => {
                                    setStatusUpdateLoading(prev => ({ ...prev, [ticket.id]: 'in_progress' }));
                                    try {
                                      await updateTicketStatus(ticket.id, 'in_progress');
                                      // Update the ticket in the store
                                      const updatedTicket = { ...ticket, status: 'in_progress' as const };
                                      updateTicketInStore(ticket.id, updatedTicket);
                                    } catch (error) {
                                      console.error('Failed to update ticket status:', error);
                                      alert('فشل تحديث حالة التذكرة. يرجى المحاولة مرة أخرى.');
                                    } finally {
                                      setStatusUpdateLoading(prev => ({ ...prev, [ticket.id]: 'idle' }));
                                    }
                                  },
                                  disabled: statusUpdateLoading[ticket.id] === 'in_progress',
                                  color: 'text-yellow-600 dark:text-yellow-400'
                                }
                              ] : []),
                              ...(ticket.status === 'in_progress' ? [
                                {
                                  label: statusUpdateLoading[ticket.id] === 'resolved' ? 'جاري التحديث...' : 'وضع كمحلولة',
                                  icon: <Edit size={16} />,
                                  onClick: async () => {
                                    setStatusUpdateLoading(prev => ({ ...prev, [ticket.id]: 'resolved' }));
                                    try {
                                      await updateTicketStatus(ticket.id, 'resolved');
                                      // Update the ticket in the store
                                      const updatedTicket = { ...ticket, status: 'resolved' as const };
                                      updateTicketInStore(ticket.id, updatedTicket);
                                    } catch (error) {
                                      console.error('Failed to update ticket status:', error);
                                      alert('فشل تحديث حالة التذكرة. يرجى المحاولة مرة أخرى.');
                                    } finally {
                                      setStatusUpdateLoading(prev => ({ ...prev, [ticket.id]: 'idle' }));
                                    }
                                  },
                                  disabled: statusUpdateLoading[ticket.id] === 'resolved',
                                  color: 'text-green-600 dark:text-green-400'
                                }
                              ] : []),
                              {
                                label: 'تعديل',
                                icon: <Edit size={16} />,
                                onClick: () => {
                                  handleEditTicket(ticket);
                                },
                                color: 'text-slate-600 dark:text-slate-400'
                              },
                              {
                                label: 'حذف',
                                icon: <Trash2 size={16} />,
                                onClick: () => {
                                  setTicketToDelete(ticket);
                                  setIsDeleteModalOpen(true);
                                },
                                color: 'text-destructive'
                              }
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredTickets.length > 0 && (
            <div className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
              تم العثور على {filteredTickets.length} تذكرة
            </div>
          )}
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
                    updateTicketInStore(ticketToEdit.id, res);
                    setIsEditModalOpen(false);
                    setTicketToEdit(null);
                });
            }}
            isSubmitting={isSubmitting}
        />

        <TicketModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setTicketToView(null);
            }}
            title="تفاصيل التذكرة"
            customers={customers}
            ticket={ticketToView}
            viewMode={true}
            onSubmit={async (data) => {}} // No submit needed for view mode
            isSubmitting={false}
        />

        <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={async () => {
              if (!ticketToDelete) return;
              try {
                await deleteTicket(ticketToDelete.id);
                removeTicket(ticketToDelete.id);
                setIsDeleteModalOpen(false);
                setTicketToDelete(null);
              } catch (error) {
                console.error('Error deleting ticket:', error);
                alert('فشل حذف التذكرة. يرجى المحاولة مرة أخرى.');
              }
            }}
            title="حذف التذكرة"
            message={`هل أنت متأكد من رغبتك في حذف التذكرة للعميل "${getCustomerName(ticketToDelete)}"؟`}
            itemName={getCustomerName(ticketToDelete)}
            isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}