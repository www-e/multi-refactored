'use client';

import { useState, useEffect } from 'react';
import { X, PhoneCall, FileText, Trash2, Settings, Users, Clock, AlertCircle, ChevronRight, ChevronLeft, Info, Sparkles, Zap, Shield, BookOpen, Loader2 } from 'lucide-react';
import { Customer } from '@/app/(shared)/types';
import Tooltip, { HelpText, FieldHelp } from '../ui/Tooltip';
import { scriptsApi, campaignsApi, BulkCallScript } from '@/lib/api/bulk-campaigns';

interface BulkCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: Customer[];
  onStartCampaign: (campaignData: {
    scriptContent: string;
    agentType: 'support' | 'sales';
    scriptId?: string;
    concurrencyLimit: number;
    useKnowledgeBase: boolean;
    customSystemPrompt?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

// Script templates with detailed descriptions
const SCRIPT_TEMPLATES = [
  {
    id: 'template_marketing_new_project',
    name: 'ترويج مشروع جديد',
    description: 'التسويق لمشروع سكني جديد',
    content: `مرحباً {customer_name}،

أنا أتصل من شركة ناڤيا العقارية لإبلاغكم بمشروعنا السكني الجديد المتميز في حي {neighborhood}.

يتميز المشروع بـ:
- شقق فاخرة بتصاميم عصرية
- أسعار تنافسية تبدأ من {price} ريال
- مواقع استراتيجية قريبة من الخدمات

هل تود معرفة المزيد من التفاصيل أو حجز موعد لزيارة المشروع؟`,
    variables: ['customer_name', 'neighborhood', 'price'],
    agentType: 'sales' as const,
    icon: Sparkles
  },
  {
    id: 'template_renewal_reminder',
    name: 'تذكير التجديد',
    description: 'تذكير العملاء بتجديد العقود',
    content: `مرحباً {customer_name}،

نود تذكيركم بأن عقدهم الحالي سينتهي قريباً.

هل ترغبون في:
- تجديد العقد الحالي
- البحث عن عقار بديل
- معرفة العروض الجديدة

نحن هنا لمساعدتكم في أي اختيار ترغبون به.`,
    variables: ['customer_name'],
    agentType: 'support' as const,
    icon: Clock
  },
  {
    id: 'template_general_inquiry',
    name: 'استعلام عام',
    description: 'التحقق من احتياجات العملاء',
    content: `مرحباً {customer_name}،

نتصل للتحقق من رضاكم عن خدماتنا الحالية، وهل لديكم أي احتياجات إضافية نقدر نساعدكم فيها.

نشكر ثقتكم بنا.`,
    variables: ['customer_name'],
    agentType: 'support' as const,
    icon: Users
  }
];

// Available variables with examples
const AVAILABLE_VARIABLES = [
  { 
    name: 'customer_name', 
    label: 'اسم العميل', 
    example: 'أحمد محمد',
    description: 'سيتم استبداله تلقائياً باسم العميل'
  },
  { 
    name: 'neighborhood', 
    label: 'الحي', 
    example: 'حي الملقا',
    description: 'حي موقع العقار'
  },
  { 
    name: 'project', 
    label: 'المشروع', 
    example: 'ناڤيا رزيدانس',
    description: 'اسم المشروع العقاري'
  },
  { 
    name: 'price', 
    label: 'السعر', 
    example: '500,000 ريال',
    description: 'سعر العقار'
  },
  { 
    name: 'bedrooms', 
    label: 'عدد الغرف', 
    example: '3 غرف',
    description: 'عدد غرف النوم'
  }
];

export default function BulkCallModal({
  isOpen,
  onClose,
  selectedCustomers,
  onStartCampaign,
  isSubmitting = false
}: BulkCallModalProps) {
  const [step, setStep] = useState<'script' | 'settings' | 'confirm'>('script');
  const [scriptContent, setScriptContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [agentType, setAgentType] = useState<'support' | 'sales'>('sales');
  const [concurrencyLimit, setConcurrencyLimit] = useState(3);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [savedScripts, setSavedScripts] = useState<BulkCallScript[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [isLoadingScripts, setIsLoadingScripts] = useState(false);
  const [activeTab, setActiveTab] = useState<'saved' | 'template' | 'custom'>('template');

  // Detect variables used in script
  const usedVariables = AVAILABLE_VARIABLES.filter(variable => 
    scriptContent.includes(`{${variable.name}}`)
  );

  // Load saved scripts from database
  useEffect(() => {
    if (isOpen) {
      loadScripts();
    }
  }, [isOpen]);

  const loadScripts = async () => {
    setIsLoadingScripts(true);
    try {
      const scripts = await scriptsApi.getAll();
      setSavedScripts(scripts);
    } catch (error) {
      console.error('Failed to load scripts:', error);
    } finally {
      setIsLoadingScripts(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('script');
      setScriptContent('');
      setSelectedTemplate(null);
      setAgentType('sales');
      setConcurrencyLimit(Math.min(3, selectedCustomers.length));
      setUseKnowledgeBase(true);
      setCustomSystemPrompt('');
      setShowCustomPrompt(false);
      setSelectedScriptId(null);
      setActiveTab('template');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoadSavedScript = async (script: BulkCallScript) => {
    setScriptContent(script.content);
    setSelectedScriptId(script.id);
    setSelectedTemplate(null);
    setAgentType(script.agent_type as 'support' | 'sales');
    setActiveTab('saved');
  };

  const handleLoadTemplate = (template: typeof SCRIPT_TEMPLATES[0]) => {
    setScriptContent(template.content);
    setSelectedTemplate(template.id);
    setSelectedScriptId(null);
    setActiveTab('template');
    setAgentType(template.agentType);
  };

  const handleCustomScript = () => {
    setActiveTab('custom');
    setSelectedScriptId(null);
    setSelectedTemplate(null);
  };

  const handleInsertVariable = (variableName: string) => {
    const variable = `{${variableName}}`;
    setScriptContent(prev => prev + variable);
  };


  const validateScript = () => {
    if (!scriptContent.trim()) {
      alert('يرجى كتابة نص السكريبت أو تحديد قالب');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 'script') {
      if (validateScript()) {
        setStep('settings');
      }
    } else if (step === 'settings') {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'settings') {
      setStep('script');
    } else if (step === 'confirm') {
      setStep('settings');
    }
  };

  const handleStartCampaign = async () => {
    if (!validateScript()) return;

    const campaignData = {
      scriptId: selectedScriptId || undefined,
      scriptContent,
      agentType,
      concurrencyLimit,
      useKnowledgeBase,
      customSystemPrompt: showCustomPrompt ? customSystemPrompt : undefined
    };

    await onStartCampaign(campaignData);
  };

  const renderScriptStep = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText size={24} className="text-primary" />
            إنشاء سكريبت المكالمات
          </h3>
          <span className="text-sm text-slate-500">الخطوة 1 من 3</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          اختر قالب جاهز أو اكتب سكريبت مخصص لمكالمك التسويقية
        </p>
        
        {selectedCustomers.length === 0 && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>تنبيه:</strong> لم يتم تحديد أي عملاء. 
                <a href="/customers" className="underline font-semibold hover:text-amber-900">
                  اذهب إلى صفحة العملاء
                </a> لتحديدهم أولاً.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Script Source Tabs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            مصدر السكريبت
          </label>
          <FieldHelp
            text="اختر مصدر السكريبت: محفوظ، قالب، أو مخصص"
            example="استخدم السكريبتات المحفوظة للعودة إلى نصوص جاهزة"
          />
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-primary text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen size={18} />
            السكريبتات المحفوظة
            {savedScripts.length > 0 && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {savedScripts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'template'
                ? 'bg-primary text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles size={18} />
            قوالب جاهزة
          </button>
          <button
            onClick={handleCustomScript}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'bg-primary text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText size={18} />
            سكريبت مخصص
          </button>
        </div>
      </div>

      {/* Saved Scripts Section */}
      {activeTab === 'saved' && (
        <div>
          {isLoadingScripts ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="mr-3 text-slate-600 dark:text-slate-400">جاري تحميل السكريبتات...</span>
            </div>
          ) : savedScripts.length === 0 ? (
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-center">
              <FileText size={48} className="mx-auto mb-3 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                لا توجد سكريبتات محفوظة
              </p>
              <a
                href="/scripts"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <BookOpen size={18} />
                إنشاء سكريبت جديد
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedScripts.map((script) => {
                const isSelected = selectedScriptId === script.id;
                const Icon = script.category === 'marketing' ? Sparkles :
                             script.category === 'renewal' ? Clock : Users;

                return (
                  <button
                    key={script.id}
                    onClick={() => handleLoadSavedScript(script)}
                    className={`p-4 rounded-xl border-2 text-right transition-all group ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon size={20} className={`${
                        isSelected ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
                      } mt-1 flex-shrink-0 transition-colors`} />
                      <div className="text-right flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {script.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {script.description || 'لا يوجد وصف'}
                        </div>
                        {script.tags && script.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {script.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Template Selection */}
      {activeTab === 'template' && (
        <div>
          {scriptContent.trim() === '' && (
            <HelpText title="نصيحة">
              اختر قالباً جاهزاً للبدء، أو اكتب سكريبتك الخاص في المربع أدناه. 
              يمكنك تخصيص القوالب حسب احتياجك.
            </HelpText>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            {SCRIPT_TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
              <button
                key={template.id}
                onClick={() => handleLoadTemplate(template)}
                className={`p-4 rounded-xl border-2 text-right transition-all group ${
                  selectedTemplate === template.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Icon size={20} className={`${
                    selectedTemplate === template.id ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
                  } mt-1 flex-shrink-0 transition-colors`} />
                  <div className="text-right flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {template.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {template.description}
                    </div>
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Script Notice */}
      {activeTab === 'custom' && scriptContent.trim() === '' && (
        <HelpText title="سكريبت مخصص">
          اكتب سكريبتك الخاص في المربع أدناه. يمكنك استخدام المتغيرات المتاحة.
        </HelpText>
      )}

      {/* Script Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              نص السكريبت
            </label>
            <FieldHelp
              text="اكتب نص المكالمة الذي سيقوله الوكيل الذكي"
              example="مرحباً {customer_name}، نود إبلاغكم بعروضنا الجديدة..."
              warning="تأكد من اختبار السكريبت قبل البدء بحملة كبيرة"
            />
          </div>
          <button
            onClick={() => setScriptContent('')}
            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12} />
            مسح النص
          </button>
        </div>
        
        <div className="relative">
          <textarea
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            placeholder="اكتب نص المكالمة هنا... يمكنك استخدام المتغيرات مثل {customer_name} و {neighborhood}"
            className="w-full h-64 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-medium placeholder:text-slate-400"
            dir="rtl"
          />
          
          {scriptContent.trim() === '' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-400">
                <FileText size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">ابدأ بكتابة السكريبت أو اختر قالباً جاهزاً</p>
              </div>
            </div>
          )}
        </div>

        {/* Used variables badge */}
        {usedVariables.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Info size={14} className="text-primary" />
            <span>المتغيرات المستخدمة: {usedVariables.map(v => v.label).join('، ')}</span>
          </div>
        )}
      </div>

      {/* Variables Helper */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            متغيرات متاحة
          </label>
          <FieldHelp
            text="انقر لإدراج المتغير في السكريبت"
            example="انقر على {customer_name} لإدراج اسم العميل تلقائياً"
          />
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <button
                key={variable.name}
                onClick={() => handleInsertVariable(variable.name)}
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm hover:border-primary hover:text-primary hover:shadow-sm transition-all group"
                title={variable.description}
              >
                <div className="font-mono text-xs font-semibold">
                  {`{${variable.name}}`}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {variable.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsStep = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings size={24} className="text-primary" />
            إعدادات الحملة
          </h3>
          <span className="text-sm text-slate-500">الخطوة 2 من 3</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          خصص إعدادات المكالمات المتزامنة وشخصية الوكيل الذكي
        </p>
      </div>

      {/* Agent Type */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            نوع الوكيل
          </label>
          <FieldHelp
            text="اختر شخصية الوكيل بناءً على نوع الحملة"
            example="المبيعات: ودي ومقنع | الدعم: محترف ومتعاون"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setAgentType('sales')}
            className={`p-4 rounded-xl border-2 text-right transition-all ${
              agentType === 'sales'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                agentType === 'sales' ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                <Zap size={24} className={agentType === 'sales' ? 'text-primary' : 'text-slate-500'} />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">مبيعات</div>
                <div className="text-xs text-slate-500 mt-1">تركز على الإقناع والبيع</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setAgentType('support')}
            className={`p-4 rounded-xl border-2 text-right transition-all ${
              agentType === 'support'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                agentType === 'support' ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                <Shield size={24} className={agentType === 'support' ? 'text-primary' : 'text-slate-500'} />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">دعم</div>
                <div className="text-xs text-slate-500 mt-1">تركز على المساعدة والخدمة</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Concurrency Limit */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            عدد المكالمات المتزامنة
          </label>
          <FieldHelp
            text="عدد المكالمات التي يتم إجراؤها في نفس الوقت"
            example="3-5 مكالمات للتوزيع المتوازن"
            warning="زيادة العدد قد تؤثر على جودة المكالمات"
          />
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={concurrencyLimit}
              onChange={(e) => setConcurrencyLimit(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex-shrink-0 w-20 text-center">
              <span className="text-2xl font-bold text-primary">{concurrencyLimit}</span>
              <span className="text-sm text-slate-500 block">مكالمات</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>الوقت المتوقع للإكمال:</span>
              <span className="font-semibold">
                ~{Math.ceil(selectedCustomers.length / concurrencyLimit)} دقائق
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Base Toggle */}
      <div>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  تفعيل قاعدة المعرفة
                </label>
                <FieldHelp
                  text="السماح للوكيل بالوصول إلى معلومات العقارات والأسعار"
                  example="عندما يسأل العميل عن الأسعار، سيجيب الوكيل من قاعدة المعرفة"
                />
              </div>
              <p className="text-sm text-slate-500 mt-1">
                يُنصح بالتفعيل للحملات التسويقية للحصول على معلومات دقيقة
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setUseKnowledgeBase(!useKnowledgeBase)}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              useKnowledgeBase ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
              useKnowledgeBase ? 'right-1' : 'left-1'
            }`}>
              {useKnowledgeBase && (
                <svg className="w-full h-full text-primary p-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Custom System Prompt */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            تخصيص شخصية الوكيل (اختياري)
          </label>
          <FieldHelp
            text="حدد نبرة الصوت والأسلوب للوكيل مع الحفاظ على الوصول لقاعدة المعرفة"
            example="كن وكيلاً ودياً ومحترفاً في البيع العقاري، وركز على الاستماع لاحتياجات العميل"
          />
        </div>

        <button
          onClick={() => setShowCustomPrompt(!showCustomPrompt)}
          className="w-full p-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          {showCustomPrompt ? (
            <>
              <X size={18} />
              إخفاء تخصيص الشخصية
            </>
          ) : (
            <>
              <Sparkles size={18} />
              إضافة تعليمات مخصصة للوكيل
            </>
          )}
        </button>

        {showCustomPrompt && (
          <div className="mt-3">
            <textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              placeholder="اكتب تعليماتك هنا... مثال: كن ودياً ومحترفاً، وركز على الاستماع لاحتياجات العميل"
              className="w-full h-24 p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none text-sm"
              dir="rtl"
            />
            
            <HelpText title="ملاحظة مهمة">
              التعليمات المخصصة تُضاف إلى قاعدة المعرفة ولا تحل محلها. الوكيل سيظل قادراً على الوصول إلى معلومات العقارات والأسعار.
            </HelpText>
          </div>
        )}
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PhoneCall size={24} className="text-primary" />
            تأكيد بدء الحملة
          </h3>
          <span className="text-sm text-slate-500">الخطوة 3 من 3</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          راجع إعدادات الحملة قبل البدء
        </p>
      </div>

      {/* Campaign Summary */}
      <div className="space-y-4">
        {/* Customers Count */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Users size={24} className="text-primary" />
            </div>
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400">عدد العملاء</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {selectedCustomers.length}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">نوع الوكيل</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {agentType === 'sales' ? (
                <>
                  <Zap size={18} className="text-primary" />
                  مبيعات
                </>
              ) : (
                <>
                  <Shield size={18} className="text-primary" />
                  دعم
                </>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">المكالمات المتزامنة</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {concurrencyLimit} مكالمات
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">الوقت المتوقع</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              ~{Math.ceil(selectedCustomers.length / concurrencyLimit)} دقيقة
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">قاعدة المعرفة</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {useKnowledgeBase ? '✅ مفعلة' : '❌ معطلة'}
            </div>
          </div>
        </div>

        {/* Script Preview */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">نص السكريبت</div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
            <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
              {scriptContent.slice(0, 200)}
              {scriptContent.length > 200 && '...'}
            </pre>
          </div>
          {usedVariables.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {usedVariables.map(v => (
                <span key={v.name} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {v.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Custom Prompt Notice */}
        {showCustomPrompt && customSystemPrompt && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Sparkles size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  شخصية الوكيل المخصصة
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {customSystemPrompt.slice(0, 100)}
                  {customSystemPrompt.length > 100 && '...'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>تأكيد مهم:</strong> بعد البدء، سيتم الاتصال بـ {selectedCustomers.length} عميل بشكل متزامن. 
              تأكد من مراجعة جميع الإعدادات قبل المتابعة.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary/10 to-blue-500/10 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 z-10">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-lg shadow-lg">
                <PhoneCall size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  حملة الاتصال الجماعي
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {selectedCustomers.length} عميل محدد
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={24} className="text-slate-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-2 rounded-full transition-colors ${
                step === 'script' ? 'bg-primary' : 
                step === 'settings' ? 'bg-primary' : 
                step === 'confirm' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
              <div className={`flex-1 h-2 rounded-full transition-colors ${
                step === 'settings' || step === 'confirm' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
              <div className={`flex-1 h-2 rounded-full transition-colors ${
                step === 'confirm' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>السكريبت</span>
              <span>الإعدادات</span>
              <span>التأكيد</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 'script' && renderScriptStep()}
          {step === 'settings' && renderSettingsStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800/50 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 'script' || isSubmitting}
              className="px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronRight size={20} />
              {step === 'settings' ? 'السكريبت' : 'الإعدادات'}
            </button>

            {step !== 'confirm' ? (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                التالي
                <ChevronLeft size={20} />
              </button>
            ) : (
              <button
                onClick={handleStartCampaign}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري البدء...
                  </>
                ) : (
                  <>
                    <PhoneCall size={20} />
                    بدء الحملة الآن
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
