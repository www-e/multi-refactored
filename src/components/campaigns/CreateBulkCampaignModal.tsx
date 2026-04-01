'use client';

import { useState, useEffect } from 'react';
import { X, Phone, Users, Settings, Check, Loader2, AlertCircle } from 'lucide-react';
import { campaignsApi, CreateCampaignRequest } from '@/lib/api/bulk-campaigns';
import { useAuthApi } from '@/hooks/useAuthApi';
import { CustomerSelector } from './CustomerSelector';
import { ScriptSelector } from './ScriptSelector';

interface CreateBulkCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'customers' | 'script' | 'configure' | 'review';

export function CreateBulkCampaignModal({ isOpen, onClose, onSuccess }: CreateBulkCampaignModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('customers');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [campaignName, setCampaignName] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [customScriptContent, setCustomScriptContent] = useState('');
  const [agentType, setAgentType] = useState<'sales' | 'support'>('sales');
  const [concurrencyLimit, setConcurrencyLimit] = useState(3);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);

  // Preview data
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  const { getCustomers, getScripts, createCampaign } = useAuthApi();

  // Load customers and scripts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [customersData, scriptsData] = await Promise.all([
        getCustomers(),
        getScripts()
      ]);
      setFilteredCustomers(customersData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const handleSubmit = async () => {
    if (selectedCustomers.length === 0) {
      setError('يرجى اختيار عملاء للحملة');
      return;
    }

    if (!customScriptContent && !selectedScriptId) {
      setError('يرجى اختيار سكريبت أو كتابة محتوى مخصص');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const campaignData: CreateCampaignRequest = {
        name: campaignName || `حملة ${new Date().toLocaleDateString('ar-SA')}`,
        customer_ids: selectedCustomers,
        script_content: customScriptContent,
        agent_type: agentType,
        concurrency_limit: concurrencyLimit,
        use_knowledge_base: useKnowledgeBase,
        script_id: selectedScriptId || undefined,
      };

      await createCampaign(campaignData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحملة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 'customers', title: 'اختيار العملاء', icon: Users },
    { id: 'script', title: 'السكريبت', icon: Phone },
    { id: 'configure', title: 'الإعدادات', icon: Settings },
    { id: 'review', title: 'المراجعة', icon: Check },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              إنشاء حملة اتصال جماعي جديدة
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              قم بإعداد وتنفيذ حملة اتصال آلية للعملاء
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 p-6 border-b border-slate-200 dark:border-slate-700">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isActive ? 'bg-primary text-white' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400' : ''}
                    transition-colors
                  `}>
                    {isCompleted ? <Check size={18} /> : <StepIcon size={18} />}
                  </div>
                  <span className={`
                    text-xs mt-2 font-medium
                    ${isActive ? 'text-primary' : ''}
                    ${isCompleted ? 'text-green-600 dark:text-green-400' : ''}
                    ${!isActive && !isCompleted ? 'text-slate-600 dark:text-slate-400' : ''}
                  `}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-2
                    ${isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}
                  `} />
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Banner */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>ملاحظة مهمة:</strong> سيتم بدء تنفيذ الحملة تلقائياً فور إنشائها. تأكد من مراجعة جميع التفاصيل في خطوة المراجعة قبل المتابعة.
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {currentStep === 'customers' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  اسم الحملة
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="مثال: حملة المتابعة الشهرية"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <CustomerSelector
                selectedCustomers={selectedCustomers}
                onSelectionChange={setSelectedCustomers}
                customers={filteredCustomers}
              />
            </div>
          )}

          {currentStep === 'script' && (
            <ScriptSelector
              selectedScriptId={selectedScriptId}
              onScriptSelect={setSelectedScriptId}
              customScriptContent={customScriptContent}
              onCustomScriptChange={setCustomScriptContent}
            />
          )}

          {currentStep === 'configure' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  نوع الوكيل
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAgentType('sales')}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${agentType === 'sales'
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💼</div>
                      <div className="font-medium">مبيعات</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        التركيز على البيع والتحويل
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setAgentType('support')}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${agentType === 'support'
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎧</div>
                      <div className="font-medium">دعم</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        التركيز على المساعدة والخدمة
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  عدد المكالمات المتزامنة: {concurrencyLimit}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={concurrencyLimit}
                  onChange={(e) => setConcurrencyLimit(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <span>1 (أبطأ)</span>
                  <span>10 (أسرع)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    استخدام قاعدة المعرفة
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    السماح للوكيل بالوصول إلى معلومات إضافية
                  </div>
                </div>
                <button
                  onClick={() => setUseKnowledgeBase(!useKnowledgeBase)}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${useKnowledgeBase
                      ? 'bg-primary text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }
                  `}
                >
                  {useKnowledgeBase ? 'مفعل' : 'معطل'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  مراجعة الحملة
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  تأكد من تفاصيل الحملة قبل البدء
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">اسم الحملة</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {campaignName || `حملة ${new Date().toLocaleDateString('ar-SA')}`}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">العملاء المستهدفون</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {selectedCustomers.length} عميل
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">نوع الوكيل</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {agentType === 'sales' ? 'مبيعات' : 'دعم'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">المكالمات المتزامنة</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {concurrencyLimit} مكالمات
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">السكريبت</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100 text-sm line-clamp-3">
                    {customScriptContent || 'سكريبت محفوظ'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              const stepIndex = steps.findIndex(s => s.id === currentStep);
              if (stepIndex > 0) {
                setCurrentStep(steps[stepIndex - 1].id);
              }
            }}
            disabled={currentStep === 'customers'}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>

          {currentStep === 'review' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Phone size={16} />
                  بدء الحملة
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                const stepIndex = steps.findIndex(s => s.id === currentStep);
                if (stepIndex < steps.length - 1) {
                  setCurrentStep(steps[stepIndex + 1].id);
                }
              }}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              التالي
            </button>
          )}
        </div>
      </div>
    </div>
  );
}