'use client';
import { EnhancedTicket } from '@/app/(shared)/types';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { formatTableDate, formatDateTime } from '@/lib/utils';
import { User, Calendar, Clock, AlertCircle, MessageSquare, CheckCircle, XCircle, FileText } from 'lucide-react';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: EnhancedTicket | null;
}

export default function TicketDetailModal({
  isOpen,
  onClose,
  ticket,
}: TicketDetailModalProps) {
  if (!ticket) return null;

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    med: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const priorityLabels = {
    low: 'منخفض',
    med: 'متوسط',
    high: 'عالٍ',
    urgent: 'عاجل',
  };

  const statusIcons = {
    open: <AlertCircle className="w-4 h-4" />,
    in_progress: <Clock className="w-4 h-4" />,
    resolved: <CheckCircle className="w-4 h-4" />,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تفاصيل التذكرة">
      <div className="space-y-5">
        {/* Header Section with Status & Priority */}
        <div className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${priorityColors[ticket.priority]}`}>
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">{priorityLabels[ticket.priority]}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            {statusIcons[ticket.status]}
            <span className="font-medium"><StatusBadge status={ticket.status} /></span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            معلومات العميل
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">اسم العميل</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{ticket.customerName || 'غير محدد'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">رقم الهاتف</p>
              <p className="font-medium text-slate-900 dark:text-slate-100" dir="ltr">{ticket.phone || 'غير متوفر'}</p>
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            تفاصيل التذكرة
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الفئة</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg inline-block">
                {ticket.category}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">المشروع</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                {ticket.project || 'غير محدد'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">وصف المشكلة</p>
              <p className="text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg leading-relaxed">
                {ticket.issue}
              </p>
            </div>
          </div>
        </div>

        {/* Assignment & Timeline */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            المهمة والتوقيت
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">المسؤول</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                {ticket.assignee || 'غير محدد'}
              </p>
            </div>
            {ticket.slaDueAt && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">موعد انتهاء SLA</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  {formatDateTime(ticket.slaDueAt)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ الإنشاء</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                {formatDateTime(ticket.createdAt)}
              </p>
            </div>
            {ticket.updatedAt && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">آخر تحديث</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {formatDateTime(ticket.updatedAt)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resolution Information */}
        {ticket.status === 'resolved' && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-lg mb-4 text-green-900 dark:text-green-100 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              معلومات الحل
            </h3>
            {ticket.resolutionNote && (
              <div className="mb-3">
                <p className="text-xs text-green-700 dark:text-green-400 mb-1">ملاحظات الحل</p>
                <p className="text-green-900 dark:text-green-100 bg-green-100 dark:bg-green-800/50 p-3 rounded-lg leading-relaxed">
                  {ticket.resolutionNote}
                </p>
              </div>
            )}
            {ticket.approvedBy && (
              <div>
                <p className="text-xs text-green-700 dark:text-green-400 mb-1">تم الاعتماد بواسطة</p>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {ticket.approvedBy}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Ticket ID Reference */}
        <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            رقم التذكرة: <span className="font-mono font-medium text-slate-700 dark:text-slate-300" dir="ltr">{ticket.id}</span>
          </p>
        </div>
      </div>

      {/* Close Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
        >
          إغلاق
        </button>
      </div>
    </Modal>
  );
}
