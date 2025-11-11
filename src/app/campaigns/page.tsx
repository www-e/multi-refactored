'use client';

import { useState } from 'react';
import {
  Plus,
  BarChart3,
  TrendingUp,
  MoreVertical,
  Play,
  Pause,
  Eye,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { EnhancedCampaign } from '@/app/(shared)/types';

// Import Shared Components
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card, CardHeader, CardTitle } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Modal } from '@/components/shared/ui/Modal';

// Feature-specific Component for a single Campaign Card
function CampaignCard({ campaign, onSelect, onRun, onStop }: {
  campaign: EnhancedCampaign;
  onSelect: () => void;
  onRun: (e: React.MouseEvent) => void;
  onStop: (e: React.MouseEvent) => void;
}) {
  const getTypeIcon = (type: string) => (type === 'صوتية' ? '📞' : '💬');

  return (
    <Card onClick={onSelect} className="cursor-pointer hover:shadow-xl transition-shadow">
      <CardHeader className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(campaign.type)}</span>
          <StatusBadge status={campaign.status} />
        </div>
        <MoreVertical className="w-4 h-4 text-slate-400" />
      </CardHeader>

      <div className="space-y-3 mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{campaign.name}</h3>
        <div className="flex items-center gap-2">
          <StatusBadge status={campaign.objective} />
          <StatusBadge status={campaign.attribution} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{campaign.audienceQuery}</p>
      </div>
      
      {/* Metrics Grid could be its own component if it gets more complex */}
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

      <div className="flex gap-2">
        {campaign.status === 'نشطة' ? (
          <ActionButton icon={Pause} label="إيقاف" onClick={onStop} variant="secondary" className="flex-1 bg-warning hover:bg-warning/90 text-sm" />
        ) : (
          <ActionButton icon={Play} label="تشغيل" onClick={onRun} variant="primary" className="flex-1 bg-success hover:bg-success/90 text-sm" />
        )}
        <ActionButton icon={Eye} label="عرض" onClick={onSelect} variant="secondary" className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm" />
      </div>
    </Card>
  );
}

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<EnhancedCampaign | null>(null);
  const { campaigns, runCampaign, stopCampaign } = useAppStore();

  const filteredCampaigns = campaigns.filter(c => c.name.includes(searchQuery));

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="الحملات التسويقية"
          subtitle="إدارة الحملات التسويقية وتتبع الأداء"
        >
          <ActionButton
            icon={Plus}
            label="حملة جديدة"
            onClick={() => alert('New Campaign')}
          />
        </PageHeader>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث في الحملات..."
          onFilterClick={() => alert('Filter clicked')}
        />

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

        <Modal
          isOpen={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          title="تفاصيل الحملة"
        >
          {selectedCampaign && (
            <div className="space-y-4">
              <p>اسم الحملة: {selectedCampaign.name}</p>
              <p>الحالة: <StatusBadge status={selectedCampaign.status} /></p>
              <p>الإيرادات: {selectedCampaign.metrics.revenue.toLocaleString()} ر.س</p>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}