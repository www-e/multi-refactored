'use client';

import { useState, useEffect } from 'react';
import { Plus, User, Phone, Mail, MapPin, PhoneCall, MessageSquare, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import CustomerModal from '@/components/shared/modals/CustomerModal';
import { useModalState } from '@/hooks/useModalState';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { customers, setCustomers, setCustomersLoading, tickets, setTickets, bookings, setBookings, conversations, addCustomer } = useAppStore();
  const { getCustomers, getTickets, getBookings, createCustomer, isAuthenticated } = useAuthApi();
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
  }, [isAuthenticated, getCustomers, setCustomers, getTickets, setTickets, getBookings, setBookings, setCustomersLoading]);

  const getCustomerStats = (customerId: string) => {
    return {
        tickets: tickets.filter(t => t.customerId === customerId).length,
        bookings: bookings.filter(b => b.customerId === customerId).length,
        calls: conversations.filter(c => c.customerId === customerId).length
    };
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="العملاء" subtitle="قاعدة بيانات العملاء">
            <div className="flex gap-3">
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
                <ActionButton icon={Plus} label="عميل جديد" onClick={() => setIsAddModalOpen(true)} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map(customer => {
                    const stats = getCustomerStats(customer.id);
                    return (
                        <Card key={customer.id} className="hover:shadow-xl transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                    {customer.name.charAt(0)}
                                </div>
                                <StatusBadge status={customer.stage as any || 'جديد'} />
                            </div>
                            
                            <h3 className="text-lg font-bold mb-1">{customer.name}</h3>
                            <div className="text-sm text-slate-500 space-y-1 mb-4">
                                <div className="flex items-center gap-2"><Phone size={14}/> {customer.phone}</div>
                                {customer.email && <div className="flex items-center gap-2"><Mail size={14}/> {customer.email}</div>}
                                {customer.neighborhoods?.[0] && <div className="flex items-center gap-2"><MapPin size={14}/> {customer.neighborhoods[0]}</div>}
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-4 border-t border-b border-slate-100 dark:border-slate-700 py-4">
                                <div className="text-center">
                                    <span className="block font-bold">{stats.calls}</span>
                                    <span className="text-xs text-slate-500">محادثات</span>
                                </div>
                                <div className="text-center border-x border-slate-100 dark:border-slate-700">
                                    <span className="block font-bold">{stats.tickets}</span>
                                    <span className="text-xs text-slate-500">تذاكر</span>
                                </div>
                                <div className="text-center">
                                    <span className="block font-bold">{stats.bookings}</span>
                                    <span className="text-xs text-slate-500">حجوزات</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 bg-primary text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-primary/90">
                                    <PhoneCall size={16} /> اتصال
                                </button>
                                <button className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-200">
                                    <MessageSquare size={16} /> رسالة
                                </button>
                            </div>
                        </Card>
                    );
                })}
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
      </div>
    </div>
  );
}