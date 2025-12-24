'use client';
import { EnhancedTicket } from '@/app/(shared)/types';
import { Customer } from '@/app/(shared)/types';
import { FormField } from './GenericModal';
import GenericModal from './GenericModal';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerId: string;
    category: string;
    priority: string;
    project: string;
    issue: string;
  }) => Promise<void>;
  ticket?: EnhancedTicket | null;
  title: string;
  customers: Customer[];
  isSubmitting?: boolean;
  error?: string;
  viewMode?: boolean;
}

export default function TicketModal({
  isOpen,
  onClose,
  onSubmit,
  ticket,
  title,
  customers,
  isSubmitting = false,
  error,
  viewMode = false
}: TicketModalProps) {
  // Define the form fields configuration
  const ticketFields: FormField[] = [
    {
      name: 'customerId',
      label: 'العميل',
      type: 'select',
      required: true,
      options: customers.map(c => ({
        value: c.id,
        label: `${c.name} - ${c.phone}`
      }))
    },
    {
      name: 'category',
      label: 'الفئة',
      type: 'select',
      required: true,
      options: [
        { value: 'سباكة', label: 'سباكة' },
        { value: 'كهرباء', label: 'كهرباء' },
        { value: 'مفاتيح', label: 'مفاتيح' },
        { value: 'تنظيف', label: 'تنظيف' },
        { value: 'أخرى', label: 'أخرى' }
      ],
      layout: 'half'
    },
    {
      name: 'priority',
      label: 'الأولوية',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'منخفض' },
        { value: 'med', label: 'متوسط' },
        { value: 'high', label: 'عالٍ' },
        { value: 'urgent', label: 'عاجل' }
      ],
      layout: 'half'
    },
    {
      name: 'project',
      label: 'المشروع/العقار',
      type: 'text',
      required: true,
      placeholder: 'e.g., MG13'
    },
    {
      name: 'issue',
      label: 'وصف المشكلة',
      type: 'textarea',
      required: true,
      rows: 3,
      placeholder: 'وصف تفصيلي للمشكلة...'
    }
  ];

  // For view mode, show the ticket details in read-only format
  if (viewMode && ticket) {
    const customer = customers.find(c => c.id === ticket.customerId);
    const customerName = customer ? `${customer.name} - ${customer.phone}` : ticket.customerName || 'Unknown';

    return (
      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onSubmit}
        title={title}
        fields={[]}
        initialData={null}
        isSubmitting={isSubmitting}
        error={error}
        maxWidth="lg"
        viewMode={true}
        customContent={
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العميل</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {customerName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الفئة</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {ticket.category}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الأولوية</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {ticket.priority === 'low' ? 'منخفض' :
                   ticket.priority === 'med' ? 'متوسط' :
                   ticket.priority === 'high' ? 'عالٍ' :
                   ticket.priority === 'urgent' ? 'عاجل' : ticket.priority}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الحالة</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {ticket.status === 'open' ? 'مفتوحة' :
                   ticket.status === 'in_progress' ? 'قيد المعالجة' :
                   ticket.status === 'resolved' ? 'محلولة' :
                   ticket.status}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المشروع/العقار</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {ticket.project || '-'}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">وصف المشكلة</label>
                <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg whitespace-pre-wrap">
                  {ticket.issue || '-'}
                </p>
              </div>
            </div>
          </div>
        }
      />
    );
  }

  // Format initial data for the ticket (edit/create mode)
  // Ensure only valid form fields are included in initial data
  const initialData = ticket ? {
    customerId: ticket.customerId || '',
    category: ticket.category || '',
    priority: ticket.priority || 'med',
    project: ticket.project || '',
    issue: ticket.issue || ''
  } : null;

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={title}
      fields={ticketFields}
      initialData={initialData}
      isSubmitting={isSubmitting}
      error={error}
      maxWidth="lg"
    />
  );
}