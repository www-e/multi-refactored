'use client';

import { useState, useEffect } from 'react';
import { PhoneCall, Users, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Filter, Download, Search, MoreVertical, Play, Pause, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { Card } from '@/components/shared/ui/Card';
import { campaignsApi, BulkCallCampaign as ApiCampaign, BulkCallResult as ApiCallResult } from '@/lib/api/bulk-campaigns';
import { formatDate } from '@/lib/utils';

// UI Types
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

// Convert API campaign to UI campaign
const toUiCampaign = (apiCampaign: ApiCampaign): BulkCallCampaign => ({
  id: apiCampaign.id,
  name: apiCampaign.name,
  status: apiCampaign.status,
  totalCalls: apiCampaign.total_calls,
  completedCalls: apiCampaign.completed_calls,
  failedCalls: apiCampaign.failed_calls,
  successfulCalls: apiCampaign.successful_calls,
  agentType: apiCampaign.agent_type as 'sales' | 'support',
  concurrencyLimit: apiCampaign.concurrency_limit,
  createdAt: apiCampaign.created_at,
  startedAt: apiCampaign.started_at,
  completedAt: apiCampaign.completed_at,
  scriptPreview: apiCampaign.script_content.substring(0, 100) + '...',
  useKnowledgeBase: apiCampaign.use_knowledge_base,
});

// Convert API result to UI result
const toUiCallResult = (apiResult: ApiCallResult): CallResult => ({
  callId: apiResult.id,
  customerId: apiResult.customer_id,
  customerName: apiResult.customer_name,
  phone: apiResult.customer_phone,
  status: apiResult.status,
  duration: apiResult.duration_seconds,
  outcome: apiResult.outcome,
  recordingUrl: apiResult.recording_url,
  timestamp: apiResult.created_at,
});

export default function BulkCampaignProgressPage() {
  const [campaigns, setCampaigns] = useState<BulkCallCampaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<BulkCallCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<BulkCallCampaign | null>(null);
  const [callResults, setCallResults] = useState<CallResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load campaigns from API
  const loadCampaigns = async () => {
    try {
      const apiCampaigns = await campaignsApi.getAll();
      const uiCampaigns = apiCampaigns.map(toUiCampaign);
      setCampaigns(uiCampaigns);
      setError(null);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('فشل في تحميل الحملات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load call results for a campaign
  const loadCallResults = async (campaignId: string) => {
    setIsLoadingResults(true);
    try {
      const apiResults = await campaignsApi.getResults(campaignId);
      const uiResults = apiResults.map(toUiCallResult);
      setCallResults(uiResults);
    } catch (err) {
      console.error('Failed to load call results:', err);
      setError('فشل في تحميل نتائج المكالمات.');
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    loadCampaigns();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      loadCampaigns();
      setLastRefresh(new Date());
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter campaigns
  useEffect(() => {
    let filtered = campaigns;

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    const badges = {
      queued: { bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'في قائمة الانتظار', icon: Clock },
      running: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'قيد التشغيل', icon: Play },
      paused: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'متوقف مؤقتاً', icon: Pause },
      completed: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'مكتمل', icon: CheckCircle2 },
      failed: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'فشل', icon: XCircle },
      cancelled: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', label: 'ملغي', icon: XCircle },
    };
    const badge = badges[status as keyof typeof badges] || badges.queued;
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${badge.bg}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  const getCallStatusBadge = (status: string) => {
    const badges = {
      success: { bg: 'bg-green-100 text-green-700', label: 'نجح' },
      failed: { bg: 'bg-red-100 text-red-700', label: 'فشل' },
      voicemail: { bg: 'bg-purple-100 text-purple-700', label: 'بريد صوتي' },
      no_answer: { bg: 'bg-amber-100 text-amber-700', label: 'لا إجابة' },
      busy: { bg: 'bg-orange-100 text-orange-700', label: 'مشغول' },
      queued: { bg: 'bg-slate-100 text-slate-700', label: 'في الانتظار' },
      in_progress: { bg: 'bg-blue-100 text-blue-700', label: 'قيد التنفيذ' },
      cancelled: { bg: 'bg-gray-100 text-gray-700', label: 'ملغي' },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${badge?.bg || 'bg-slate-100 text-slate-700'}`}>
        {badge?.label || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="حملات الاتصال الجماعي" 
          subtitle="تتبع وإدارة حملات الاتصال الآلي"
        >
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA')}
          </div>
        </PageHeader>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="بحث في الحملات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">جميع الحالات</option>
              <option value="queued">في الانتظار</option>
              <option value="running">قيد التشغيل</option>
              <option value="paused">متوقف</option>
              <option value="completed">مكتمل</option>
              <option value="failed">فشل</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
            <span className="text-slate-600 dark:text-slate-400">جاري تحميل الحملات...</span>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-white/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <PhoneCall className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-2">لا توجد حملات</p>
            <p className="text-sm text-slate-400">
              {searchQuery || statusFilter !== 'all'
                ? 'جرب تغيير الفلاتر أو البحث'
                : 'ابدأ بإنشاء حملة جديدة'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaigns List */}
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    loadCallResults(campaign.id);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                          {campaign.name}
                        </h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {campaign.scriptPreview}
                      </p>
                    </div>
                  </div>

                  {/* Progress Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {campaign.completedCalls}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        مكتمل
                      </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {campaign.failedCalls}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        فشل
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {campaign.totalCalls}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        الإجمالي
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                      <span>التقدم</span>
                      <span>{Math.round((campaign.completedCalls / campaign.totalCalls) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${(campaign.completedCalls / campaign.totalCalls) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{formatDate(campaign.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{campaign.agentType === 'sales' ? 'مبيعات' : 'دعم'}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Call Results Drawer */}
            {selectedCampaign && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                      نتائج المكالمات
                    </h3>
                    <button
                      onClick={() => setSelectedCampaign(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedCampaign.name}
                  </p>
                </div>

                <div className="p-4 max-h-[600px] overflow-y-auto">
                  {isLoadingResults ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                      <span className="text-slate-600 dark:text-slate-400">جاري التحميل...</span>
                    </div>
                  ) : callResults.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      لا توجد نتائج بعد
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {callResults.map((result) => (
                        <div
                          key={result.callId}
                          className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                                {result.customerName}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {result.phone}
                              </div>
                            </div>
                            {getCallStatusBadge(result.status)}
                          </div>

                          {result.duration && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              المدة: {Math.floor(result.duration / 60)}:{(result.duration % 60).toString().padStart(2, '0')}
                            </div>
                          )}

                          {result.outcome && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              النتيجة: {result.outcome}
                            </div>
                          )}

                          {result.recordingUrl && (
                            <audio
                              controls
                              className="w-full mt-2"
                              src={result.recordingUrl}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
