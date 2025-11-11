'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCw, Edit, Eye } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { DataTable } from '@/components/shared/data/DataTable';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Modal } from '@/components/shared/ui/Modal';
import { EnhancedBooking } from '@/app/(shared)/types';

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<EnhancedBooking | null>(null);

  const { bookings, customers, properties, refreshBookings, approveBooking, rejectBooking } = useAppStore();

  useEffect(() => {
    // We can expand this to fetch customers and properties if they are not present
    refreshBookings();
  }, [refreshBookings]);

  // --- PERFORMANCE OPTIMIZATION ---
  // Create efficient lookup maps for customers and properties.
  // useMemo ensures these maps are only recreated when the underlying data changes.
  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const propertyMap = useMemo(() => new Map(properties.map(p => [p.id, p])), [properties]);

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;
    const customer = customerMap.get(booking.customerId);
    const property = propertyMap.get(booking.propertyId);
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      customer?.name.toLowerCase().includes(lowerCaseQuery) ||
      customer?.phone.includes(searchQuery) || // Phone search should be exact
      property?.code.toLowerCase().includes(lowerCaseQuery)
    );
  });

  const TABLE_HEADERS = ['العميل', 'العقار', 'التاريخ', 'السعر', 'المصدر', 'الحالة', 'الإجراءات'];

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="الحجوزات والمواعيد" subtitle="إدارة حجوزات العملاء والمواعيد">
          <ActionButton icon={RefreshCw} label="تحديث" onClick={refreshBookings} variant="secondary" />
          <ActionButton icon={Plus} label="حجز جديد" onClick={() => alert('New Booking Modal')} />
        </PageHeader>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث في الحجوزات..."
          onFilterClick={() => alert('Filter clicked')}
        />

        <DataTable headers={TABLE_HEADERS}>
          {filteredBookings.map((booking) => {
            // O(1) instant lookup instead of O(n) .find()
            const customer = customerMap.get(booking.customerId);
            const property = propertyMap.get(booking.propertyId);
            
            // Render nothing if related data is missing to prevent crashes
            if (!customer || !property) return null;

            return (
              <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-4">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{customer.name}</div>
                  <div className="text-sm text-slate-500">{customer.phone}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{property.code}</div>
                  <div className="text-sm text-slate-500">{property.neighborhood}</div>
                </td>
                <td className="p-4 text-sm text-slate-900 dark:text-slate-100">
                  {new Date(booking.startDate).toLocaleDateString('ar-SA')}
                </td>
                <td className="p-4 font-semibold text-primary">{booking.price.toLocaleString()} ر.س</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={booking.source} type="icon" />
                    <StatusBadge status={booking.createdBy} />
                  </div>
                </td>
                <td className="p-4">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedBooking(booking)} className="p-2 text-slate-400 hover:text-primary rounded-lg"><Eye className="w-4 h-4" /></button>
                    <button className="p-2 text-slate-400 hover:text-primary rounded-lg"><Edit className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            );
})}
        </DataTable>

        <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="تفاصيل الحجز">
          {selectedBooking && (
            <div>
              <p>العميل: {customerMap.get(selectedBooking.customerId)?.name}</p>
              <p>العقار: {propertyMap.get(selectedBooking.propertyId)?.code}</p>
              <p>السعر: {selectedBooking.price.toLocaleString()} ر.س</p>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}