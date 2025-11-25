'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Play, Pause, MoreVertical, Edit, Eye, RefreshCw, BarChart3, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthApi } from '@/hooks/useAuthApi';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { SearchFilterBar } from '@/components/shared/data/SearchFilterBar';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';
import { Card } from '@/components/shared/ui/Card';
import CampaignModal from '@/components/shared/modals/CampaignModal';
import DeleteConfirmModal from '@/components/shared/modals/DeleteConfirmModal';
import { useModalState } from '@/hooks/useModalState';
import { mapCampaignStatusToArabic } from '@/lib/statusMapper';

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<any>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);

  const { campaigns, setCampaigns, setCampaignsLoading, runCampaign, stopCampaign, addCampaign, removeCampaign, updateCampaign: updateCampaignInStore } = useAppStore();
  const { getCampaigns, createCampaign, updateCampaign, deleteCampaign, isAuthenticated } = useAuthApi();
  const { isSubmitting, handleModalSubmit } = useModalState();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setCampaignsLoading(true);
          const data = await getCampaigns();
          setCampaigns(data);
        } catch (error) {
          console.error('Error fetching campaigns:', error);
        } finally {
          setCampaignsLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, getCampaigns, setCampaigns, setCampaignsLoading]);

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Robust Status Check
  const isActive = (status: string) => ['active', 'نشطة'].includes(status.toLowerCase());

  const handleEditCampaign = (campaign: any) => {
    setCampaignToEdit(campaign);
    setIsEditModalOpen(true);
  };

  const handleDeleteCampaign = (campaign: any) => {
    setCampaignToDelete(campaign);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    try {
      await deleteCampaign(campaignToDelete.id);
      // Update the store to remove the campaign
      removeCampaign(campaignToDelete.id);
      setIsDeleteModalOpen(false);
      setCampaignToDelete(null);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('فشل حذف الحملة. يرجى المحاولة مرة أخرى.');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const active = isActive(currentStatus);
    const newStatus = active ? 'paused' : 'active';
    const action = active ? stopCampaign : runCampaign;
    
    try {
      await updateCampaign(id, { status: newStatus });
      action(id);
    } catch (error) {
      console.error('Toggle failed', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    return t === 'voice' || t === 'صوتية' ? '📞' : '💬';
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="الحملات التسويقية" subtitle="إدارة الحملات التسويقية وتتبع الأداء">
          <div className="flex gap-3">
            <ActionButton icon={RefreshCw} label="تحديث" variant="secondary" onClick={() => {
              const fetchData = async () => {
                try {
                  setCampaignsLoading(true);
                  const data = await getCampaigns();
                  setCampaigns(data);
                } catch (error) {
                  console.error('Error refreshing campaigns:', error);
                } finally {
                  setCampaignsLoading(false);
                }
              };
              fetchData();
            }} />
            <ActionButton icon={Plus} label="حملة جديدة" onClick={() => setIsAddModalOpen(true)} />
          </div>
        </PageHeader>

        <SearchFilterBar 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
            searchPlaceholder="البحث في الحملات..." 
            onFilterClick={() => {}} 
        />

        {filteredCampaigns.length === 0 ? (
            <div className="text-center py-16 bg-white/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">لا توجد حملات حالياً</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map(campaign => (
                <Card key={campaign.id} className="hover:shadow-lg transition-all">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{getTypeIcon(campaign.type)}</span>
                        <StatusBadge status={campaign.status as any} />
                    </div>
                    <MoreVertical className="text-slate-400 w-5 h-5" />
                </div>
                
                <div className="space-y-3 mb-6">
                    <h3 className="text-lg font-bold">{campaign.name}</h3>
                    <div className="flex gap-2">
                        <StatusBadge status={campaign.objective as any} />
                        <StatusBadge status={campaign.attribution as any} />
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">
                        {typeof campaign.audienceQuery === 'string' ? campaign.audienceQuery : JSON.stringify(campaign.audienceQuery)}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-sm font-bold">{campaign.metrics.reached}</div>
                        <div className="text-xs text-slate-500">تم الوصول</div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="text-sm font-bold text-primary">{campaign.metrics.roas}x</div>
                        <div className="text-xs text-slate-500">ROAS</div>
                    </div>
                </div>

                <div className="flex gap-1 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={() => toggleStatus(campaign.id, campaign.status)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm ${
                            isActive(campaign.status)
                            ? 'bg-warning hover:bg-warning/90'
                            : 'bg-success hover:bg-success/90'
                        }`}
                    >
                        {isActive(campaign.status) ? <Pause size={16} /> : <Play size={16} />}
                        {isActive(campaign.status) ? 'إيقاف' : 'تشغيل'}
                    </button>
                    <button
                        onClick={() => handleEditCampaign(campaign)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                        title="تعديل"
                    >
                        <Edit size={18}/>
                    </button>
                    <button
                        onClick={() => handleDeleteCampaign(campaign)}
                        className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200"
                        title="حذف"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>
                </Card>
            ))}
            </div>
        )}

        <CampaignModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="إنشاء حملة جديدة"
            onSubmit={async (data) => {
                await handleModalSubmit(async () => {
                    const res = await createCampaign(data);
                    addCampaign(res);
                    setIsAddModalOpen(false);
                });
            }}
            isSubmitting={isSubmitting}
        />

        <CampaignModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setCampaignToEdit(null);
            }}
            title="تعديل الحملة"
            campaign={campaignToEdit}
            onSubmit={async (data) => {
                if (!campaignToEdit) return;
                await handleModalSubmit(async () => {
                    const res = await updateCampaign(campaignToEdit.id, data);
                    // Update the campaign in the store
                    updateCampaignInStore(campaignToEdit.id, res);
                    setIsEditModalOpen(false);
                    setCampaignToEdit(null);
                });
            }}
            isSubmitting={isSubmitting}
        />

        <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDeleteCampaign}
            title="حذف الحملة"
            message={`هل أنت متأكد من رغبتك في حذف الحملة "${campaignToDelete?.name}"؟`}
            itemName={campaignToDelete?.name}
            isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}