'use client';

import { useState, useEffect } from 'react';
import { Plus, User, Phone, Mail, MapPin, PhoneCall, RefreshCw, X, Check, Edit, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import ActionMenu from '@/components/shared/ui/ActionMenu';
import CustomerModal from '@/components/shared/modals/CustomerModal';
import DeleteConfirmModal from '@/components/shared/modals/DeleteConfirmModal';
import CustomerDetailModal from '@/components/shared/modals/CustomerDetailModal';
import { useModalState } from '@/hooks/useModalState';
import { Customer} from '@/app/(shared)/types';
import { formatDate } from '@/lib/utils';
import { mapCallStatusToArabic } from '@/lib/statusMapper';
import ResponsiveTableCard from '@/components/shared/data/ResponsiveTableCard';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);

  const { customers, setCustomers, setCustomersLoading, tickets, setTickets, bookings, setBookings, campaigns, setCampaigns, calls, addCustomer, addTicket, addBooking, removeCustomer, updateCustomer: updateCustomerInStore } = useAppStore();
  const { getCustomers, getTickets, getBookings, getCampaigns, createCustomer, updateCustomer: apiUpdateCustomer, deleteCustomer: apiDeleteCustomer, createTicket, createBooking, makeCall, makeBulkCalls, isAuthenticated } = useAuthApi();
  const { isSubmitting, handleModalSubmit } = useModalState();

  // CRITICAL: Fetch ALL data to ensure stats are correct on this page
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setCustomersLoading(true);
          await Promise.all([
            getCustomers().then(setCustomers),
            getTickets().then(setTickets),
            getBookings().then(setBookings),
            getCampaigns().then(setCampaigns),
            // Note: Conversations are usually fetched via a different endpoint if needed,
            // here we assume they might be pre-loaded or we accept 0 if not.
          ]);
        } catch (error) {
          console.error('Error fetching customer data:', error);
        } finally {
          setCustomersLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, getCustomers, setCustomers, getTickets, setTickets, getBookings, setBookings, getCampaigns, setCampaigns, setCustomersLoading]);

  const getCustomerStats = (customerId: string) => {
    return {
        tickets: tickets.filter(t => t.customerId === customerId).length,
        bookings: bookings.filter(b => b.customerId === customerId).length,
        calls: calls.filter(c => c.customerId === customerId).length
    };
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomerIds(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomerIds.length === filteredCustomers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredCustomers.map(c => c.id));
    }
  };

  const handleBulkCall = async () => {
    if (selectedCustomerIds.length === 0) return;

    if (confirm(`هل ترغب في الاتصال بـ ${selectedCustomerIds.length} عميل؟`)) {
      try {
        const result = await makeBulkCalls(selectedCustomerIds);
        alert(`تم بدء الاتصال الجماعي. ${result.initiated_calls} من ${result.created_calls} تم البدء بها.`);
        // Reset selection after successful bulk operation
        setSelectedCustomerIds([]);
        setIsSelectMode(false);
      } catch (error) {
        console.error('Error making bulk calls:', error);
        alert('فشل في بدء الاتصال الجماعي. يرجى المحاولة مرة أخرى.');
      }
    }
  };


  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleCustomerCall = async (phone: string, customerId: string) => {
    // Confirm with user before making call
    if (confirm(`هل ترغب في الاتصال بالعميل على الرقم ${phone}?`)) {
      try {
        const result = await makeCall({ customer_id: customerId, phone });
        alert(`تم بدء الاتصال بالعميل. الحالة: ${mapCallStatusToArabic(result.status)}`);
      } catch (error) {
        console.error('Error making call:', error);
        alert('فشل في الاتصال بالعميل. يرجى المحاولة مرة أخرى.');
      }
    }
  };


  const handleDeleteCustomer = (customer: { id: string; name: string }) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      await apiDeleteCustomer(customerToDelete.id);
      // Update the store to remove the customer
      removeCustomer(customerToDelete.id);
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('فشل حذف العميل. يرجى المحاولة مرة أخرى.');
    }
  };

  const showCustomerDetails = (customer: Customer) => {
    setSelectedCustomerDetail(customer);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="العملاء" subtitle="قاعدة بيانات العملاء">
            <div className="flex gap-3">
                {isSelectMode ? (
                    <>
                        <ActionButton
                            icon={PhoneCall}
                            label={`اتصال (${selectedCustomerIds.length})`}
                            onClick={handleBulkCall}
                            disabled={selectedCustomerIds.length === 0}
                        />
                        <ActionButton
                            icon={User}
                            label="تحديد الكل"
                            variant="secondary"
                            onClick={toggleSelectAll}
                        />
                        <ActionButton
                            icon={X}
                            label="إلغاء التحديد"
                            variant="secondary"
                            onClick={() => {
                                setSelectedCustomerIds([]);
                                setIsSelectMode(false);
                            }}
                        />
                    </>
                ) : (
                    <>
                        <ActionButton icon={RefreshCw} label="تحديث" variant="secondary" onClick={() => {
                          const fetchData = async () => {
                            try {
                              setCustomersLoading(true);
                              const data = await getCustomers();
                              setCustomers(data);
                            } catch (error) {
                              console.error('Error refreshing customers:', error);
                            } finally {
                              setCustomersLoading(false);
                            }
                          };
                          fetchData();
                        }} />
                        <ActionButton
                            icon={User}
                            label="تحديد العملاء"
                            variant="secondary"
                            onClick={() => setIsSelectMode(true)}
                        />
                        <ActionButton icon={Plus} label="عميل جديد" onClick={() => setIsAddModalOpen(true)} />
                    </>
                )}
            </div>
        </PageHeader>

        <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="بحث بالاسم أو الهاتف..."
            onFilterClick={() => {}}
        />

        {filteredCustomers.length === 0 ? (
            <div className="text-center py-16 bg-white/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">لا يوجد عملاء</p>
            </div>
        ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                    {filteredCustomers.map((customer, index) => {
                        const stats = getCustomerStats(customer.id);
                        const isSelected = selectedCustomerIds.includes(customer.id);

                        // Prepare customer data for the card component
                        const customerData = {
                            ...customer,
                            type: 'customer' as const,
                            stats
                        };

                        return (
                            <ResponsiveTableCard
                                key={customer.id}
                                item={customerData}
                                actions={[
                                    {
                                        label: 'اتصال',
                                        icon: <PhoneCall size={16} />,
                                        onClick: () => handleCustomerCall(customer.phone, customer.id),
                                        color: 'text-primary'
                                    },
                                    {
                                        label: 'تعديل',
                                        icon: <Edit size={16} />,
                                        onClick: () => {
                                          setCustomerToEdit(customer);
                                          setIsEditModalOpen(true);
                                        },
                                        color: 'text-slate-600 dark:text-slate-400'
                                    },
                                    {
                                        label: 'حذف',
                                        icon: <Trash2 size={16} />,
                                        onClick: () => handleDeleteCustomer({id: customer.id, name: customer.name}),
                                        color: 'text-destructive'
                                    }
                                ]}
                                onCardClick={() => showCustomerDetails(customer)}
                                customers={customers}
                            />
                        );
                    })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="p-4 w-12 text-center font-semibold text-slate-900 dark:text-slate-100">#</th>
                                {isSelectMode && (
                                    <th className="p-4 w-12">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="w-6 h-6 rounded-full border flex items-center justify-center border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                            aria-label="تحديد الكل"
                                        >
                                            {selectedCustomerIds.length === filteredCustomers.length && <Check size={14} />}
                                        </button>
                                    </th>
                                )}
                                <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">العميل</th>
                                <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">الهاتف</th>
                                <th className="hidden md:table-cell text-right p-4 font-semibold text-slate-900 dark:text-slate-100">البريد الإلكتروني</th>
                                <th className="hidden md:table-cell text-right p-4 font-semibold text-slate-900 dark:text-slate-100">المنطقة</th>
                                <th className="hidden md:table-cell text-right p-4 font-semibold text-slate-900 dark:text-slate-100">الحالة</th>
                                <th className="hidden md:table-cell text-right p-4 font-semibold text-slate-900 dark:text-slate-100">المحادثات</th>
                                <th className="hidden md:table-cell text-right p-4 font-semibold text-slate-900 dark:text-slate-100">التذاكر</th>
                                <th className="hidden md:table-cell text-right p-4 font-semibold text-slate-900 dark:text-slate-100">الحجوزات</th>
                                <th className="hidden md:table-cell text-right p-4 font-semibold text-slate-900 dark:text-slate-100">تاريخ الإنشاء</th>
                                <th className="text-right p-4 font-semibold text-slate-900 dark:text-slate-100">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredCustomers.map((customer, index) => {
                                const stats = getCustomerStats(customer.id);
                                const isSelected = selectedCustomerIds.includes(customer.id);
                                return (
                                    <tr
                                        key={customer.id}
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelected ? 'bg-primary/10' : ''}`}
                                    >
                                        <td className="p-4 text-center text-slate-500 dark:text-slate-400">{index + 1}</td>
                                        {isSelectMode && (
                                            <td className="p-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleCustomerSelection(customer.id);
                                                    }}
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                                                        isSelected
                                                            ? 'bg-primary border-primary text-white'
                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                                    }`}
                                                    aria-label={isSelected ? `إلغاء تحديد ${customer.name}` : `تحديد ${customer.name}`}
                                                >
                                                    {isSelected && <Check size={14} />}
                                                </button>
                                            </td>
                                        )}
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="font-medium">{customer.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Phone size={16}/>
                                                {customer.phone}
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell p-4">
                                            {customer.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail size={16}/>
                                                    {customer.email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="hidden md:table-cell p-4">
                                            {customer.neighborhoods?.[0] && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16}/>
                                                    {customer.neighborhoods[0]}
                                                </div>
                                            )}
                                        </td>
                                        <td className="hidden md:table-cell p-4">
                                            <StatusBadge status={customer.stage as any || 'جديد'} />
                                        </td>
                                        <td className="hidden md:table-cell p-4 text-center font-bold">{stats.calls}</td>
                                        <td className="hidden md:table-cell p-4 text-center font-bold">{stats.tickets}</td>
                                        <td className="hidden md:table-cell p-4 text-center font-bold">{stats.bookings}</td>
                                        <td className="hidden md:table-cell p-4 text-sm text-slate-500">
                                            {formatDate(customer.createdAt)}
                                        </td>
                                        <td className="p-4">
                                            <ActionMenu
                                                actions={[
                                                    {
                                                        label: 'اتصال',
                                                        icon: <PhoneCall size={16} />,
                                                        onClick: () => handleCustomerCall(customer.phone, customer.id),
                                                        color: 'text-primary'
                                                    },
                                                    {
                                                        label: 'تعديل',
                                                        icon: <Edit size={16} />,
                                                        onClick: () => {
                                                          setCustomerToEdit(customer);
                                                          setIsEditModalOpen(true);
                                                        },
                                                        color: 'text-slate-600 dark:text-slate-400'
                                                    },
                                                    {
                                                        label: 'حذف',
                                                        icon: <Trash2 size={16} />,
                                                        onClick: () => handleDeleteCustomer({id: customer.id, name: customer.name}),
                                                        color: 'text-destructive'
                                                    }
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        <CustomerModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="إضافة عميل"
            customers={customers}
            onSubmit={async (data) => {
                await handleModalSubmit(async () => {
                    const res = await createCustomer(data);
                    addCustomer(res);
                    setIsAddModalOpen(false);
                });
            }}
            isSubmitting={isSubmitting}
        />

        <CustomerModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setCustomerToEdit(null);
            }}
            title="تعديل العميل"
            customers={customers}
            customer={customerToEdit}
            onSubmit={async (data) => {
                if (!customerToEdit) return;
                await handleModalSubmit(async () => {
                    const res = await apiUpdateCustomer(customerToEdit.id, data);
                    // Update the customer in the store
                    updateCustomerInStore(customerToEdit.id, res);
                    setIsEditModalOpen(false);
                    setCustomerToEdit(null);
                });
            }}
            isSubmitting={isSubmitting}
        />

        <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDeleteCustomer}
            title="حذف العميل"
            message={`هل أنت متأكد من رغبتك في حذف العميل "${customerToDelete?.name}"؟`}
            itemName={customerToDelete?.name}
            isSubmitting={isSubmitting}
        />


        {selectedCustomerDetail && (
          <CustomerDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            customer={selectedCustomerDetail}
            tickets={tickets}
            bookings={bookings}
            createTicket={createTicket}
            createBooking={createBooking}
            updateCustomer={apiUpdateCustomer}
            deleteCustomer={apiDeleteCustomer}
            addTicket={addTicket}
            addBooking={addBooking}
            updateCustomerInStore={updateCustomerInStore}
            removeCustomerFromStore={removeCustomer}
          />
        )}
      </div>
    </div>
  );
}