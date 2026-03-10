'use client';

import { X, Phone, Loader2, Clock, Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface BulkCallCampaign {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  successfulCalls: number;
  agentType: 'sales' | 'support';
  concurrencyLimit: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scriptPreview: string;
  useKnowledgeBase: boolean;
  progress: number;
}

interface CallResult {
  callId: string;
  customerId: string;
  customerName: string;
  phone: string;
  status: 'success' | 'failed' | 'voicemail' | 'no_answer' | 'busy' | 'queued' | 'in_progress' | 'cancelled';
  duration?: number;
  outcome?: string;
  recordingUrl?: string;
  timestamp: string;
}

interface CampaignResultsDrawerProps {
  campaign: BulkCallCampaign;
  results: CallResult[];
  isLoading: boolean;
  onClose: () => void;
}

export function CampaignResultsDrawer({
  campaign,
  results,
  isLoading,
  onClose
}: CampaignResultsDrawerProps) {

  const getCallStatusBadge = (status: string) => {
    const badges = {
      success: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'نجح', icon: CheckCircle2 },
      failed: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'فشل', icon: XCircle },
      voicemail: { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'بريد صوتي', icon: AlertCircle },
      no_answer: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'لا إجابة', icon: XCircle },
      busy: { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'مشغول', icon: XCircle },
      queued: { bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'في الانتظار', icon: Clock },
      in_progress: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'قيد التنفيذ', icon: Loader2 },
      cancelled: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', label: 'ملغي', icon: XCircle },
    };
    const badge = badges[status as keyof typeof badges] || badges.queued;
    const Icon = badge.icon;
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${badge?.bg || 'bg-slate-100 text-slate-700'}`}>
        <Icon size={12} className={status === 'in_progress' ? 'animate-spin' : ''} />
        {badge?.label || status}
      </span>
    );
  };

  const getOutcomeLabel = (outcome?: string) => {
    if (!outcome) return null;
    const labels = {
      interested: 'مهتم',
      not_interested: 'غير مهتم',
      follow_up_requested: 'طلب متابعة',
      appointment_booked: 'حجز موعد',
      information_only: 'معلومات فقط',
      wrong_number: 'رقم خاطئ',
      do_not_call: 'لا يتصل',
    };
    return labels[outcome as keyof typeof labels] || outcome;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
            نتائج المكالمات
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {campaign.name}
        </p>
      </div>

      {/* Campaign Summary */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {campaign.totalCalls}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">الإجمالي</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {campaign.successfulCalls}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">ناجح</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {campaign.failedCalls}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">فشل</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(campaign.progress)}%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">التقدم</div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <span className="text-slate-600 dark:text-slate-400">جاري التحميل...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Phone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>لا توجد نتائج بعد</p>
            <p className="text-sm mt-1">ستظهر نتائج المكالمات هنا عند بدء الحملة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result) => (
              <div
                key={result.callId}
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users size={14} className="text-primary" />
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {result.customerName}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mr-10">
                      {result.phone}
                    </div>
                  </div>
                  {getCallStatusBadge(result.status)}
                </div>

                {/* Outcome */}
                {result.outcome && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 mr-10">
                    النتيجة: <span className="font-medium">{getOutcomeLabel(result.outcome)}</span>
                  </div>
                )}

                {/* Duration */}
                {result.duration && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1 mr-10">
                    <Clock size={12} />
                    المدة: {Math.floor(result.duration / 60)}:{(result.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}

                {/* Recording */}
                {result.recordingUrl && (
                  <div className="mt-2 mr-10">
                    <audio
                      controls
                      className="w-full h-8"
                      src={result.recordingUrl}
                    />
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 mr-10">
                  {formatDate(result.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}