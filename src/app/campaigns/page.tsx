'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Pause, Eye } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { EnhancedCampaign } from '@/app/(shared)/types';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { Card, CardHeader, CardTitle } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Modal } from '@/components/shared/ui/Modal';

// A dedicated component for rendering a single campaign card.
// This keeps the main page component clean.
function CampaignCard({
  campaign,
  onSelect,
  onRun,
  onStop,
}: {
  campaign: EnhancedCampaign;
  onSelect: () => void;
  onRun: (e: React.MouseEvent) => void;
  onStop: (e: React.MouseEvent) => void;
}) {
  const getTypeIcon = (type: string) => (type === 'صوتية' ? '📞' : '💬');

  return (
    <Card
      onClick={onSelect}
      className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <CardHeader className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(campaign.type)}</span>
          <StatusBadge status={campaign.status} />
        </div>
      </CardHeader>

      <div className="space-y-3 mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{campaign.name}</h3>
        <div className="flex items-center gap-2">
          <StatusBadge status={campaign.objective as any} />
          <StatusBadge status={campaign.attribution} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 min-h-[40px]">{campaign.audienceQuery}</p>
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
          <ActionButton icon={Pause} label="إيقاف" onClick={onStop} variant="secondary" className="flex-1 bg-warning hover:bg-warning/90 text-sm" />
        ) : (
          <ActionButton icon={Play} label="تشغيل" onClick={onRun} variant="primary" className="flex-1 bg-success hover:bg-success/90 text-sm" />
        )}
        <ActionButton icon={Eye} label="عرض" onClick={onSelect} variant="secondary" className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm" />
      </div>
    </Card>
  );
}

// Main page component
export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<EnhancedCampaign | null>(null);
  
  // Connect to the live data store
  const { campaigns, runCampaign, stopCampaign } = useAppStore();

  // In a real app, you would fetch campaigns on mount:
  // useEffect(() => { refreshCampaigns(); }, [refreshCampaigns]);

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            onClick={() => alert('إنشاء حملة جديدة')}
          />
        </PageHeader>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="البحث في الحملات..."
          onFilterClick={() => alert('Filter clicked')}
        />

        {campaigns.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-500">لا توجد حملات لعرضها.</p>
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

        <Modal
          isOpen={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          title="تفاصيل الحملة"
        >
          {selectedCampaign && (
            <div className="space-y-4">
              <h4 className="text-xl font-semibold">{selectedCampaign.name}</h4>
              <p>الحالة: <StatusBadge status={selectedCampaign.status} /></p>
              <p>الهدف: <StatusBadge status={selectedCampaign.objective as any} /></p>
              <p>النوع: {selectedCampaign.type}</p>
              <p className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                <strong>الجمهور المستهدف:</strong> {selectedCampaign.audienceQuery}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div><p className="text-sm text-slate-500">الإيرادات</p><p className="font-bold text-lg text-success">{selectedCampaign.metrics.revenue.toLocaleString()} ر.س</p></div>
                  <div><p className="text-sm text-slate-500">ROAS</p><p className="font-bold text-lg text-primary">{selectedCampaign.metrics.roas.toFixed(1)}x</p></div>
                  <div><p className="text-sm text-slate-500">الحجوزات</p><p className="font-bold text-lg">{selectedCampaign.metrics.booked}</p></div>
                  <div><p className="text-sm text-slate-500">تم الوصول</p><p className="font-bold text-lg">{selectedCampaign.metrics.reached}</p></div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}