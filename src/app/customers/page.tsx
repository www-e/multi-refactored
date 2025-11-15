import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, User, Phone, Mail, MapPin, PhoneCall, MessageSquare, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { Customer } from '@/app/(shared)/types';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Modal } from '@/components/shared/ui/Modal';
import { Button } from '@/components/ui/button';

function CustomerCard({ customer, onSelect }: { customer: Customer; onSelect: () => void; }) {
  const interactions = { conversations: 3, tickets: 1, bookings: 2 };

  return (
    <Card onClick={onSelect} className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        {/* The 'stage' property might not exist on your Customer model, so we conditionally render */}
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
    </Card>
  );
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { customers, setCustomers } = useAppStore();
  const { isAuthenticated, getCustomers, createCustomer } = useAuthApi();

  const handleRefresh = useCallback(async () => {
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        const data = await getCustomers();
        setCustomers(data as any[]); // Cast to any to match legacy type
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, getCustomers, setCustomers]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);
  
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    try {
      await createCustomer({ name: newCustomerName, phone: newCustomerPhone, email: newCustomerEmail || undefined });
      setIsAddModalOpen(false);
      handleRefresh();
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
    } catch (error: any) {
      console.error("Failed to create customer:", error);
      setApiError(error.message || "An unknown error occurred.");
    }
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
        
        {isLoading ? (
          <Card className="text-center py-12"><p className="text-slate-500">جاري تحميل العملاء...</p></Card>
        ) : customers.length === 0 ? (
           <Card className="text-center py-12"><p className="text-slate-500">لا يوجد عملاء لعرضهم.</p></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} onSelect={() => setSelectedCustomer(customer)} />
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

        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة عميل جديد">
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">الاسم الكامل</label>
              <input type="text" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} required className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">رقم الهاتف</label>
              <input type="tel" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} required className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">البريد الإلكتروني (اختياري)</label>
              <input type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md" />
            </div>
            {apiError && <p className="text-red-500 text-sm">{apiError}</p>}
            <div className="flex justify-end pt-4">
              <Button type="submit">إنشاء العميل</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}