'use client';

import { useState, useEffect } from 'react';
import { Plus, PhoneCall, Users, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Filter, Download, Search, MoreVertical, Play, Pause, Loader2, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { Card } from '@/components/shared/ui/Card';
import { BulkCallCampaign as ApiCampaign, BulkCallResult as ApiCallResult } from '@/lib/api/bulk-campaigns';
import { formatDate } from '@/lib/utils';
import { CreateBulkCampaignModal } from '@/components/campaigns/CreateBulkCampaignModal';
import { CampaignResultsDrawer } from '@/components/campaigns/CampaignResultsDrawer';
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_BADGES, getCampaignStatusLabel } from '@/lib/campaignStatus';
import { useAuthApi } from '@/hooks/useAuthApi';

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
  scriptPreview: apiCampaign.script_content?.substring(0, 100) + '...' || '',
  useKnowledgeBase: apiCampaign.use_knowledge_base,
  progress: apiCampaign.total_calls > 0 
    ? (apiCampaign.completed_calls / apiCampaign.total_calls) * 100 
    : 0,
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

export default function CampaignsPage() {
  const { getCampaigns, deleteCampaign, getCampaignResults } = useAuthApi();
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

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load campaigns from API
  const loadCampaigns = async () => {
    try {
      const apiCampaigns = await getCampaigns();
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
      const apiResults = await getCampaignResults(campaignId);
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
      queued: { bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: CAMPAIGN_STATUS_LABELS.queued, icon: Clock },
      running: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: CAMPAIGN_STATUS_LABELS.running, icon: Play },
      paused: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: CAMPAIGN_STATUS_LABELS.paused, icon: Pause },
      completed: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: CAMPAIGN_STATUS_LABELS.completed, icon: CheckCircle2 },
      failed: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: CAMPAIGN_STATUS_LABELS.failed, icon: XCircle },
      cancelled: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', label: CAMPAIGN_STATUS_LABELS.cancelled, icon: XCircle },
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

  const handleDeleteCampaign = async (campaign: BulkCallCampaign) => {
    if (!confirm(`هل أنت متأكد من حذف الحملة "${campaign.name}"؟`)) return;

    try {
      // Call the delete API via hook
      await deleteCampaign(campaign.id);

      // Remove from local state
      setCampaigns(campaigns.filter(c => c.id !== campaign.id));
      if (selectedCampaign?.id === campaign.id) {
        setSelectedCampaign(null);
        setCallResults([]);
      }

      // Show success message
      alert('تم حذف الحملة بنجاح');
    } catch (error: any) {
      console.error('Failed to delete campaign:', error);
      // Show specific error message from API if available
      const errorMessage = error?.message || 'فشل حذف الحملة. يرجى المحاولة مرة أخرى.';
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="حملات الاتصال الجماعي"
          subtitle="إدارة وتنفيذ حملات الاتصال الآلي للعملاء"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA')}
            </div>
            <ActionButton
              icon={RefreshCw}
              label="تحديث"
              variant="secondary"
              onClick={() => {
                loadCampaigns();
                setLastRefresh(new Date());
              }}
            />
            <ActionButton
              icon={Plus}
              label="حملة جديدة"
              onClick={() => setShowCreateModal(true)}
            />
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
                placeholder="البحث في الحملات..."
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
              <option value="queued">{CAMPAIGN_STATUS_LABELS.queued}</option>
              <option value="running">{CAMPAIGN_STATUS_LABELS.running}</option>
              <option value="paused">{CAMPAIGN_STATUS_LABELS.paused}</option>
              <option value="completed">{CAMPAIGN_STATUS_LABELS.completed}</option>
              <option value="failed">{CAMPAIGN_STATUS_LABELS.failed}</option>
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
            <p className="text-sm text-slate-400 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'جرب تغيير الفلاتر أو البحث'
                : 'ابدأ بإنشاء حملة جديدة'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              إنشاء حملة جديدة
            </button>
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
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCampaign(campaign);
                        }}
                        className="p-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200"
                        title="حذف"
                      >
                        <Trash2 size={16}/>
                      </button>
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
                      <span>{Math.round(campaign.progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${campaign.progress}%` }}
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
              <CampaignResultsDrawer
                campaign={selectedCampaign}
                results={callResults}
                isLoading={isLoadingResults}
                onClose={() => {
                  setSelectedCampaign(null);
                  setCallResults([]);
                }}
              />
            )}
          </div>
        )}

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <CreateBulkCampaignModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadCampaigns();
            }}
          />
        )}
      </div>
    </div>
  );
}