'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Edit, Trash2, Copy, Play, Star, TrendingUp, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { Script, SCRIPT_CATEGORIES } from '@/app/(shared)/types';
import { formatDate } from '@/lib/utils';
import { scriptsApi, BulkCallScript, extractVariables } from '@/lib/api/bulk-campaigns';
import { CreateScriptModal } from '@/components/scripts/CreateScriptModal';
import { EditScriptModal } from '@/components/scripts/EditScriptModal';

// Convert API script to UI script
const toUiScript = (apiScript: BulkCallScript): Script => ({
  id: apiScript.id,
  name: apiScript.name,
  description: apiScript.description,
  content: apiScript.content,
  variables: apiScript.variables || [],
  agentType: apiScript.agent_type as 'sales' | 'support',
  category: (apiScript.category || 'custom') as 'marketing' | 'support' | 'renewal' | 'general' | 'custom',
  tags: apiScript.tags || [],
  usageCount: apiScript.usage_count,
  lastUsedAt: apiScript.last_used_at,
  createdBy: apiScript.created_by,
  isActive: apiScript.is_active,
  createdAt: apiScript.created_at,
  updatedAt: apiScript.updated_at,
  isTemplate: apiScript.is_template,
});

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<Script[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('recent');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);

  // Load scripts from API
  const loadScripts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiScripts = await scriptsApi.getAll();
      const uiScripts = apiScripts.map(toUiScript);
      setScripts(uiScripts);
    } catch (err) {
      console.error('Failed to load scripts:', err);
      setError('فشل في تحميل السكريبتات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, []);

  // Filter and sort scripts
  useEffect(() => {
    let filtered = scripts;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'usage') return b.usageCount - a.usageCount;
      if (sortBy === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0;
    });

    setFilteredScripts(filtered);
  }, [scripts, searchQuery, selectedCategory, sortBy]);

  const handleDeleteScript = async (scriptId: string, scriptName: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${scriptName}"؟`)) {
      return;
    }

    setIsDeleting(scriptId);
    setError(null);

    try {
      await scriptsApi.delete(scriptId);
      setScripts(scripts.filter(s => s.id !== scriptId));
    } catch (err) {
      console.error('Failed to delete script:', err);
      setError('فشل في حذف السكريبت. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDuplicateScript = async (script: Script) => {
    setIsDuplicating(script.id);
    setError(null);

    try {
      const duplicated = await scriptsApi.duplicate(script.id);
      const uiScript = toUiScript(duplicated);
      setScripts([...scripts, uiScript]);
    } catch (err) {
      console.error('Failed to duplicate script:', err);
      setError('فشل في نسخ السكريبت. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleCreateScript = async (data: any) => {
    try {
      const variables = extractVariables(data.content);
      const newScript = await scriptsApi.create({
        ...data,
        variables,
      });
      const uiScript = toUiScript(newScript);
      setScripts([...scripts, uiScript]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create script:', err);
      throw err;
    }
  };

  const handleEditScript = async (data: any) => {
    if (!selectedScript) return;

    try {
      const variables = extractVariables(data.content);
      const updated = await scriptsApi.update(selectedScript.id, {
        ...data,
        variables,
      });
      const uiScript = toUiScript(updated);
      setScripts(scripts.map(s => s.id === selectedScript.id ? uiScript : s));
      setShowEditModal(false);
      setSelectedScript(null);
    } catch (err) {
      console.error('Failed to update script:', err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="السكريبتات" subtitle="إدارة مكتبة السكريبتات">
          <ActionButton
            icon={Plus}
            label="سكريبت جديد"
            onClick={() => setShowCreateModal(true)}
          />
        </PageHeader>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search, Filter, and Sort */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="بحث في السكريبتات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">جميع الفئات</option>
              {SCRIPT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.nameAr}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="recent">الأحدث استخداماً</option>
              <option value="usage">الأكثر استخداماً</option>
              <option value="name">الاسم</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="mr-3 text-slate-600 dark:text-slate-400">جاري تحميل السكريبتات...</span>
          </div>
        ) : filteredScripts.length === 0 ? (
          <div className="text-center py-16 bg-white/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-2">لا توجد سكريبتات</p>
            <p className="text-sm text-slate-400">
              {searchQuery || selectedCategory !== 'all'
                ? 'جرب تغيير الفلاتر أو البحث'
                : 'ابدأ بإنشاء سكريبت جديد'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                إنشاء سكريبت جديد
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScripts.map((script) => (
              <div
                key={script.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">
                        {SCRIPT_CATEGORIES.find(c => c.id === script.category)?.icon || '📄'}
                      </span>
                      {script.isTemplate && (
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 line-clamp-1">
                      {script.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    script.agentType === 'sales'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {script.agentType === 'sales' ? 'مبيعات' : 'دعم'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2 min-h-[2.5rem]">
                  {script.description || 'لا يوجد وصف'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {script.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                  {script.tags.length > 3 && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
                      +{script.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span>{script.usageCount} استخدام</span>
                  </div>
                  {script.lastUsedAt && (
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{formatDate(script.lastUsedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedScript(script);
                      setShowEditModal(true);
                    }}
                    disabled={isDeleting === script.id || isDuplicating === script.id}
                    className="flex-1 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit size={14} />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDuplicateScript(script)}
                    disabled={isDuplicating === script.id || isDeleting === script.id}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                  >
                    {isDuplicating === script.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  {!script.isTemplate && (
                    <button
                      onClick={() => handleDeleteScript(script.id, script.name)}
                      disabled={isDeleting === script.id || isDuplicating === script.id}
                      className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                    >
                      {isDeleting === script.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Script Modal */}
      {showCreateModal && (
        <CreateScriptModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateScript}
        />
      )}

      {/* Edit Script Modal */}
      {showEditModal && selectedScript && (
        <EditScriptModal
          script={selectedScript}
          onClose={() => {
            setShowEditModal(false);
            setSelectedScript(null);
          }}
          onSubmit={handleEditScript}
        />
      )}
    </div>
  );
}
