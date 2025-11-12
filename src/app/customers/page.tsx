'use client';

import { useState, useEffect} from 'react';
import { Plus, User, Phone, Mail, MapPin, PhoneCall, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Customer } from '@/app/(shared)/types';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Modal } from '@/components/shared/ui/Modal';

function CustomerCard({ customer, onSelect }: { customer: Customer; onSelect: () => void; }) {
  // In a real app, this interaction data would be calculated or fetched.
  const interactions = { conversations: 3, tickets: 1, bookings: 2 };

  return (
    <Card onClick={onSelect} className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <StatusBadge status={customer.stage} />
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{customer.name}</h3>

      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
        <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{customer.phone}</span></div>
        {customer.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{customer.email}</span></div>}
        <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{customer.neighborhoods[0]}</span></div>
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
  
  // FIX: Connect to the live data store
  const { customers, refreshAllData } = useAppStore();

  // Fetch initial data
  useEffect(() => {
    // In a real app, this would be refreshCustomers()
    if (customers.length === 0) {
        refreshAllData(); 
    }
  }, [customers, refreshAllData]);
  
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="العملاء" subtitle="إدارة قاعدة بيانات العملاء ومراحل المبيعات">
          <ActionButton icon={Plus} label="عميل جديد" onClick={() => alert('New Customer')} />
        </PageHeader>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث بالاسم أو رقم الهاتف..."
          onFilterClick={() => alert('Filter clicked')}
        />
        
        {customers.length === 0 ? (
           <Card className="text-center py-12"><p className="text-slate-500">جاري تحميل العملاء...</p></Card>
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
              <p>المرحلة: <StatusBadge status={selectedCustomer.stage} /></p>
              <p>الميزانية: {selectedCustomer.budget?.toLocaleString()} ر.س</p>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}