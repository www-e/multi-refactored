'use client';
import { EnhancedCampaign } from '@/app/(shared)/types';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDateTime } from '@/lib/utils';
import { Target, Users, Calendar, DollarSign, TrendingUp, BarChart3, Megaphone, CheckCircle } from 'lucide-react';

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: EnhancedCampaign | null;
}

export default function CampaignDetailModal({
  isOpen,
  onClose,
  campaign,
}: CampaignDetailModalProps) {
  if (!campaign) return null;

  const typeColors = {
    صوتية: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    رسائل: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const objectiveLabels = {
    حجوزات: 'حجوزات',
    تجديدات: 'تجديدات',
    ترويج: 'ترويج',
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-EG').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateConversionRate = (reached: number, engaged: number) => {
    if (reached === 0) return 0;
    return ((engaged / reached) * 100).toFixed(1);
  };

  const calculateQualifiedRate = (engaged: number, qualified: number) => {
    if (engaged === 0) return 0;
    return ((qualified / engaged) * 100).toFixed(1);
  };

  const calculateBookingRate = (qualified: number, booked: number) => {
    if (qualified === 0) return 0;
    return ((booked / qualified) * 100).toFixed(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تفاصيل الحملة">
      <div className="space-y-5">
        {/* Header Section */}
        <div className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${typeColors[campaign.type]}`}>
            <Megaphone className="w-4 h-4" />
            <span className="font-medium">{campaign.type === 'صوتية' ? 'حملة صوتية' : 'حملة رسائل'}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            <Target className="w-4 h-4" />
            <span className="font-medium">{objectiveLabels[campaign.objective]}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium"><StatusBadge status={campaign.status} /></span>
          </div>
        </div>

        {/* Campaign Information */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            معلومات الحملة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">اسم الحملة</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{campaign.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">نوع الحملة</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                {campaign.type}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الهدف</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                {objectiveLabels[campaign.objective]}
              </p>
            </div>
            {campaign.scheduledAt && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">موعد الجدولة</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {formatDateTime(campaign.scheduledAt)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">المنشئ</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                {campaign.attribution === 'AI' ? 'ذكاء اصطناعي' : 'بشري'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ الإنشاء</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                {formatDateTime(campaign.createdAt)}
              </p>
            </div>
            {campaign.updatedAt && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">آخر تحديث</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {formatDateTime(campaign.updatedAt)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            مؤشرات الأداء
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {/* Reach Metric */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">الوصول</p>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatNumber(campaign.metrics.reached)}
              </p>
            </div>

            {/* Engagement Metric */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">التفاعل</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatNumber(campaign.metrics.engaged)}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-400">
                  ({calculateConversionRate(campaign.metrics.reached, campaign.metrics.engaged)}%)
                </p>
              </div>
            </div>

            {/* Qualified Metric */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-amber-600" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">المؤهلون</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {formatNumber(campaign.metrics.qualified)}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  ({calculateQualifiedRate(campaign.metrics.engaged, campaign.metrics.qualified)}%)
                </p>
              </div>
            </div>

            {/* Bookings Metric */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">الحجوزات</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatNumber(campaign.metrics.booked)}
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  ({calculateBookingRate(campaign.metrics.qualified, campaign.metrics.booked)}%)
                </p>
              </div>
            </div>

            {/* Revenue Metric */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">الإيرادات</p>
              </div>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {formatCurrency(campaign.metrics.revenue)}
              </p>
            </div>

            {/* ROAS Metric */}
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 rounded-lg p-4 border border-rose-200 dark:border-rose-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-rose-600" />
                <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">ROAS</p>
              </div>
              <p className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                {campaign.metrics.roas.toFixed(2)}x
              </p>
            </div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            مسار التحويل
          </h3>
          
          <div className="space-y-3">
            {/* Funnel stages */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">الوصول</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatNumber(campaign.metrics.reached)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="relative pl-4">
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">التفاعل</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatNumber(campaign.metrics.engaged)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-purple-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${calculateConversionRate(campaign.metrics.reached, campaign.metrics.engaged)}%` }}
                ></div>
              </div>
            </div>

            <div className="relative pl-4">
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">مؤهل</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatNumber(campaign.metrics.qualified)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-amber-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${calculateQualifiedRate(campaign.metrics.engaged, campaign.metrics.qualified)}%` }}
                ></div>
              </div>
            </div>

            <div className="relative pl-4">
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">حجز</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatNumber(campaign.metrics.booked)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${calculateBookingRate(campaign.metrics.qualified, campaign.metrics.booked)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign ID Reference */}
        <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            رقم الحملة: <span className="font-mono font-medium text-slate-700 dark:text-slate-300" dir="ltr">{campaign.id}</span>
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
