'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Play, Pause, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useModalState } from '@/hooks/useModalState';
import { useAuthApi } from '@/hooks/useAuthApi';
import { EnhancedCampaign } from '@/app/(shared)/types';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card, CardHeader } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Modal } from '@/components/shared/ui/Modal';
import CampaignModal from '@/components/shared/modals/CampaignModal';

function CampaignCard({
  campaign,
  onSelect,
  onRun,
  onStop
}: {
  campaign: EnhancedCampaign;
  onSelect: () => void;
  onRun: (e: React.MouseEvent) => void;
  onStop: (e: React.MouseEvent) => void;
}) {
  const getTypeIcon = (type: string) => (type === 'voice' ? '📞' : '💬');

  return (
    <Card onClick={onSelect} className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
      <CardHeader className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(campaign.type)}</span>
          <StatusBadge status={campaign.status as any} />
        </div>
      </CardHeader>

      <div className="space-y-3 mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{campaign.name}</h3>
        <div className="flex items-center gap-2">
          <StatusBadge status={campaign.objective as any} />
          <StatusBadge status={campaign.attribution as any} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 min-h-[40px]">
          {JSON.stringify(campaign.audienceQuery)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="text-sm font-semibold text-primary">{campaign.metrics.roas.toFixed(1)}x</div>
          <div className="text-xs text-slate-500">ROAS</div>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="text-sm font-semibold text-emerald-600">{campaign.metrics.revenue.toLocaleString()}</div>
          <div className="text-xs text-slate-500">ر.س</div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        {campaign.status === 'نشطة' ? (
          <ActionButton
            icon={Pause}
            label="إيقاف"
            onClick={onStop}
            variant="secondary"
            className="flex-1 bg-warning hover:bg-warning/90 text-sm"
          />
        ) : (
          <ActionButton
            icon={Play}
            label="تشغيل"
            onClick={onRun}
            variant="primary"
            className="flex-1 bg-success hover:bg-success/90 text-sm"
          />
        )}
        <ActionButton
          icon={Eye}
          label="عرض"
          onClick={onSelect}
          variant="secondary"
          className="flex-1"
        />
      </div>
    </Card>
  );
}

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<EnhancedCampaign | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    campaigns,
    campaignsLoading,
    setCampaigns,
    setCampaignsLoading,
    addCampaign,
    runCampaign,
    stopCampaign
  } = useAppStore();

  const { getCampaigns, createCampaign, isAuthenticated } = useAuthApi();
  const { modalError, isSubmitting, handleModalSubmit } = useModalState();

  const handleRefresh = useCallback(async () => {
    if (isAuthenticated) {
      setCampaignsLoading(true);
      try {
        const data = await getCampaigns();
        setCampaigns(data);
      } catch (error) {
        console.error("Failed to refresh campaigns:", error);
      } finally {
        setCampaignsLoading(false);
      }
    }
  }, [isAuthenticated, getCampaigns, setCampaigns, setCampaignsLoading]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleCreateCampaign = async (campaignData: {
    name: string;
    type: string;
    objective: string;
    audienceQuery?: any;
  }) => {
    await handleModalSubmit(
      async () => {
        const newCampaign = await createCampaign(campaignData);
        addCampaign(newCampaign);
        setIsAddModalOpen(false);
      },
      () => setIsAddModalOpen(false)
    );
  };

  const filteredCampaigns = useMemo(
    () => campaigns.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [campaigns, searchQuery]
  );

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="الحملات التسويقية" subtitle="إدارة الحملات التسويقية وتتبع الأداء">
          <ActionButton icon={RefreshCw} label="تحديث" onClick={handleRefresh} variant="secondary" />
          <ActionButton icon={Plus} label="حملة جديدة" onClick={() => setIsAddModalOpen(true)} />
        </PageHeader>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث في الحملات..."
          onFilterClick={() => alert('Filter clicked')}
        />

        {campaignsLoading ? (
          <div className="text-center py-12">
            <Card>
              <p className="text-slate-500">جاري تحميل الحملات...</p>
            </Card>
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-500">لا توجد حملات لعرضها. انقر على "حملة جديدة" للبدء.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onSelect={() => setSelectedCampaign(campaign)}
                onRun={(e) => { e.stopPropagation(); runCampaign(campaign.id); }}
                onStop={(e) => { e.stopPropagation(); stopCampaign(campaign.id); }}
              />
            ))}
          </div>
        )}

        <CampaignModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateCampaign}
          title="إنشاء حملة جديدة"
          isSubmitting={isSubmitting}
          error={modalError}
        />

        <Modal isOpen={!!selectedCampaign} onClose={() => setSelectedCampaign(null)} title="تفاصيل الحملة">
          {selectedCampaign && (
            <div className="space-y-4">
              {/* Details view for a selected campaign */}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
