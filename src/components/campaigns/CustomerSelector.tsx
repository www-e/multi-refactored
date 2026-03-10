'use client';

import { useState, useMemo } from 'react';
import { Search, Users, Check, X, Filter, ChevronDown } from 'lucide-react';
import { Customer } from '@/app/(shared)/types';

interface CustomerSelectorProps {
  selectedCustomers: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  customers: Customer[];
}

export function CustomerSelector({
  selectedCustomers,
  onSelectionChange,
  customers
}: CustomerSelectorProps) {

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all');

  // Get unique neighborhoods
  const neighborhoods = useMemo(() => {
    const hoods = new Set<string>();
    customers.forEach(c => {
      if (c.neighborhoods && Array.isArray(c.neighborhoods)) {
        c.neighborhoods.forEach(n => hoods.add(n));
      }
    });
    return Array.from(hoods).sort();
  }, [customers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          customer.name?.toLowerCase().includes(query) ||
          customer.phone?.includes(query) ||
          customer.email?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        // Assuming customers have a status field
        // Adjust this based on actual customer model
        const customerStatus = (customer as any).status || 'active';
        if (customerStatus !== statusFilter) return false;
      }

      // Neighborhood filter
      if (neighborhoodFilter !== 'all') {
        if (!customer.neighborhoods || !Array.isArray(customer.neighborhoods)) {
          return false;
        }
        if (!customer.neighborhoods.includes(neighborhoodFilter as any)) {
          return false;
        }
      }

      return true;
    });
  }, [customers, searchQuery, statusFilter, neighborhoodFilter]);

  const toggleCustomer = (customerId: string) => {
    if (selectedCustomers.includes(customerId)) {
      onSelectionChange(selectedCustomers.filter(id => id !== customerId));
    } else {
      onSelectionChange([...selectedCustomers, customerId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(filteredCustomers.map(c => c.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const selectedCount = selectedCustomers.length;
  const totalCount = customers.length;
  const filteredCount = filteredCustomers.length;

  return (
    <div className="space-y-4">
      {/* Selection Summary */}
      <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {selectedCount} من {totalCount} عميل
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {selectedCount === 0 ? 'لم يتم اختيار أي عملاء' : 'عملاء محددون للحملة'}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={selectAll}
            disabled={filteredCount === 0}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            اختيار الكل ({filteredCount})
          </button>
          <button
            onClick={clearAll}
            disabled={selectedCount === 0}
            className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء الكل
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="البحث بالاسم، الهاتف، أو البريد الإلكتروني..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="new">جديد</option>
        </select>

        {/* Neighborhood Filter */}
        {neighborhoods.length > 0 && (
          <select
            value={neighborhoodFilter}
            onChange={(e) => setNeighborhoodFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">جميع الأحياء</option>
            {neighborhoods.map(hood => (
              <option key={hood} value={hood}>{hood}</option>
            ))}
          </select>
        )}
      </div>

      {/* Customer List */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="max-h-80 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>لا يوجد عملاء مطابقين للفلاتر</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredCustomers.map((customer) => {
                const isSelected = selectedCustomers.includes(customer.id);
                const neighborhoods = customer.neighborhoods as string[] | undefined;
                const neighborhoodStr = neighborhoods && neighborhoods.length > 0
                  ? neighborhoods.join(', ')
                  : 'غير محدد';

                return (
                  <div
                    key={customer.id}
                    onClick={() => toggleCustomer(customer.id)}
                    className={`
                      p-4 cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                        ${isSelected
                          ? 'border-primary bg-primary'
                          : 'border-slate-300 dark:border-slate-600'
                        }
                      `}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>

                      {/* Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {customer.name}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                                {customer.email}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Check size={14} className="text-white" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {neighborhoodStr}
                          </span>
                          {customer.email && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                              له بريد إلكتروني
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            ✅ تم اختيار {selectedCount} عميل للحملة
          </div>
          <button
            onClick={() => onSelectionChange([])}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            إلغاء الاختيار
          </button>
        </div>
      )}
    </div>
  );
}