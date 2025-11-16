'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, User, Phone, Mail, MapPin, PhoneCall, MessageSquare, RefreshCw, Loader2, Edit, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useModalState } from '@/hooks/useModalState';
import { useAuthApi } from '@/hooks/useAuthApi';
import { Customer } from '@/app/(shared)/types';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Modal } from '@/components/shared/ui/Modal';
import CustomerModal from '@/components/shared/modals/CustomerModal';
import DeleteConfirmModal from '@/components/shared/modals/DeleteConfirmModal';

function CustomerCard({ customer, onEdit, onDelete }: { customer: Customer; onEdit: () => void; onDelete: () => void; }) {
  // Note: 'interactions' are hardcoded for now as per the original file.
  // In a real implementation, this data would come from an API lookup.
  const interactions = { conversations: 3, tickets: 1, bookings: 2 };
  return (
    <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        {customer.stage && <StatusBadge status={customer.stage} />}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{customer.name}</h3>
      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
        <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{customer.phone}</span></div>
        {customer.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{customer.email}</span></div>}
        {customer.neighborhoods && customer.neighborhoods.length > 0 && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{customer.neighborhoods[0]}</span></div>}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="text-sm font-semibold">{interactions.conversations}</div>
          <div className="text-xs text-slate-500">محادثات</div>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="text-sm font-semibold">{interactions.tickets}</div>
          <div className="text-xs text-slate-500">تذاكر</div>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="text-sm font-semibold">{interactions.bookings}</div>
          <div className="text-xs text-slate-500">حجوزات</div>
        </div>
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        <ActionButton icon={PhoneCall} label="اتصال" className="flex-1 text-sm" />
        <ActionButton icon={MessageSquare} label="رسالة" variant="secondary" className="flex-1 bg-info hover:bg-info/90 text-sm" />
      </div>
      <div className="flex gap-2 mt-2">
        <ActionButton icon={Edit} label="تعديل" onClick={onEdit} variant="secondary" className="flex-1 text-sm" />
        <ActionButton icon={Trash2} label="حذف" onClick={onDelete} variant="secondary" className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white" />
      </div>
    </Card>
  );
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { customers, customersLoading, setCustomers, setCustomersLoading, addCustomer, removeCustomer, updateCustomer: updateCustomerStore } = useAppStore();
  const { isAuthenticated, getCustomers, createCustomer, updateCustomer, deleteCustomer } = useAuthApi();
  const { modalError, isSubmitting, handleModalSubmit } = useModalState();

  const handleRefresh = useCallback(async () => {
    if (isAuthenticated) {
      setCustomersLoading(true);
      try {
        const data = await getCustomers();
        setCustomers(data as any[]);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setCustomersLoading(false);
      }
    }
  }, [isAuthenticated, getCustomers, setCustomers, setCustomersLoading]);

  useEffect(() => {
    if (customers.length === 0 && isAuthenticated) {
      handleRefresh();
    }
  }, [customers.length, isAuthenticated, handleRefresh]);

  const handleCreateCustomer = async (customerData: { name: string; phone: string; email?: string }) => {
    await handleModalSubmit(
      async () => {
        const newCustomer = await createCustomer(customerData);
        addCustomer(newCustomer);
        setIsAddModalOpen(false);
      },
      () => setIsAddModalOpen(false)
    );
  };

  const handleEditCustomer = async (customerData: { name: string; phone: string; email?: string }) => {
    if (!editingCustomer) return;
    await handleModalSubmit(
      async () => {
        const updatedCustomer = await updateCustomer(editingCustomer.id, customerData);
        updateCustomerStore(editingCustomer.id, updatedCustomer);
        setEditingCustomer(null);
      },
      () => setEditingCustomer(null)
    );
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    await handleModalSubmit(
      async () => {
        await deleteCustomer(customerToDelete.id);
        removeCustomer(customerToDelete.id);
        setCustomerToDelete(null);
        setIsDeleteModalOpen(false);
      },
      () => {
        setCustomerToDelete(null);
        setIsDeleteModalOpen(false);
      }
    );
  };

  const filteredCustomers = useMemo(() => customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  ), [customers, searchQuery]);

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="العملاء" subtitle="إدارة قاعدة بيانات العملاء ومراحل المبيعات">
          <ActionButton icon={RefreshCw} label="تحديث" onClick={handleRefresh} variant="secondary" />
          <ActionButton icon={Plus} label="عميل جديد" onClick={() => setIsAddModalOpen(true)} />
        </PageHeader>
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث بالاسم أو رقم الهاتف..."
          onFilterClick={() => alert('Filter clicked')}
        />
        {customersLoading ? (
          <Card className="text-center py-12"><p className="text-slate-500">جاري تحميل العملاء...</p></Card>
        ) : customers.length === 0 ? (
           <Card className="text-center py-12"><p className="text-slate-500">لا يوجد عملاء لعرضهم.</p></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={() => {
                  setEditingCustomer(customer);
                  setSelectedCustomer(customer);
                }}
                onDelete={() => {
                  setCustomerToDelete(customer);
                  setIsDeleteModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
        <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="تفاصيل العميل">
          {selectedCustomer && (
            <div className="space-y-2">
              <h4 className="text-xl font-semibold">{selectedCustomer.name}</h4>
              <p>الهاتف: {selectedCustomer.phone}</p>
              {selectedCustomer.stage && <p>المرحلة: <StatusBadge status={selectedCustomer.stage} /></p>}
              {selectedCustomer.budget && <p>الميزانية: {selectedCustomer.budget?.toLocaleString()} ر.س</p>}
            </div>
          )}
        </Modal>
        <CustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateCustomer}
          title="إضافة عميل جديد"
          customers={customers}
          isSubmitting={isSubmitting}
          error={modalError}
        />

        <CustomerModal
          isOpen={!!editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSubmit={handleEditCustomer}
          customer={editingCustomer}
          title="تعديل العميل"
          customers={customers}
          isSubmitting={isSubmitting}
          error={modalError}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
          }}
          onConfirm={handleDeleteCustomer}
          title="حذف العميل"
          message="هل أنت متأكد من رغبتك في حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء."
          itemName={customerToDelete?.name}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}