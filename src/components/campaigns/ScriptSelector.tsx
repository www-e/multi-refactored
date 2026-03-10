'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Play, Check, Loader2, AlertCircle } from 'lucide-react';
import { BulkCallScript } from '@/lib/api/bulk-campaigns';
import { useAuthApi } from '@/hooks/useAuthApi';

interface ScriptSelectorProps {
  selectedScriptId: string | null;
  onScriptSelect: (scriptId: string | null) => void;
  customScriptContent: string;
  onCustomScriptChange: (content: string) => void;
}

export function ScriptSelector({
  selectedScriptId,
  onScriptSelect,
  customScriptContent,
  onCustomScriptChange
}: ScriptSelectorProps) {

  const [scripts, setScripts] = useState<BulkCallScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomScript, setShowCustomScript] = useState(false);
  const [previewScript, setPreviewScript] = useState<BulkCallScript | null>(null);

  const { getScripts, createScript } = useAuthApi();

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      const data = await getScripts();
      setScripts(data);
    } catch (err) {
      console.error('Failed to load scripts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedScript = scripts.find(s => s.id === selectedScriptId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        <span className="text-slate-600 dark:text-slate-400">جاري تحميل السكريبتات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          اختر السكريبت
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          اختر سكريبت محفوظ أو اكتب سكريبت مخصص
        </p>
      </div>

      {/* Toggle between saved scripts and custom */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowCustomScript(false);
            onCustomScriptChange('');
          }}
          className={`
            flex-1 px-4 py-3 rounded-lg font-medium transition-all
            ${!showCustomScript
              ? 'bg-primary text-white shadow-lg'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <FileText size={18} />
            السكريبتات المحفوظة
          </div>
        </button>
        <button
          onClick={() => {
            setShowCustomScript(true);
            onScriptSelect(null);
          }}
          className={`
            flex-1 px-4 py-3 rounded-lg font-medium transition-all
            ${showCustomScript
              ? 'bg-primary text-white shadow-lg'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Plus size={18} />
            سكريبت مخصص
          </div>
        </button>
      </div>

      {!showCustomScript ? (
        /* Saved Scripts List */
        <div className="space-y-3">
          {scripts.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 mb-2">لا توجد سكريبتات محفوظة</p>
              <p className="text-sm text-slate-400">
                اكتب سكريبت مخصص أو أنشئ سكريبتات جديدة من صفحة السكريبتات
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {scripts.map((script) => {
                const isSelected = selectedScriptId === script.id;

                return (
                  <div
                    key={script.id}
                    onClick={() => {
                      onScriptSelect(script.id);
                      onCustomScriptChange('');
                    }}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            {script.name}
                          </h4>
                          {script.is_template && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
                              قالب
                            </span>
                          )}
                        </div>
                        {script.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {script.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                          <span>{script.agent_type === 'sales' ? 'مبيعات' : 'دعم'}</span>
                          <span>•</span>
                          <span>{script.category}</span>
                          {script.usage_count > 0 && (
                            <>
                              <span>•</span>
                              <span>استخدام {script.usage_count} مرة</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Custom Script Editor */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              محتوى السكريبت المخصص
            </label>
            <textarea
              value={customScriptContent}
              onChange={(e) => onCustomScriptChange(e.target.value)}
              placeholder={`اكتب السكريبت هنا...

مثال:
مرحباً {name}، نتصل بك من شركة نافعيا للعقارات. نود إبلاغك بعرض خاص على العقارات في {neighborhood} منطقة. هل يمكنك التحدث معنا لبضع دقائق؟`}
              rows={12}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono text-sm"
            />
          </div>

          {/* Variables detected */}
          {customScriptContent && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                🔤 المتغيرات المكتشفة:
              </div>
              <div className="flex flex-wrap gap-2">
                {extractVariables(customScriptContent).map(variable => (
                  <span
                    key={variable}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded"
                  >
                    {'{' + variable + '}'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedScript && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-late-800 dark:text-amber-200">
                التبديل إلى سكريبت مخصص سيلغي اختيار السكريبت "{selectedScript.name}"
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview of selected script */}
      {selectedScript && !showCustomScript && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-slate-900 dark:text-slate-100">معاينة السكريبت</h4>
            <button
              onClick={() => setPreviewScript(selectedScript)}
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <Play size={14} />
              عرض الكامل
            </button>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
            {selectedScript.content}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to extract variables from script content
function extractVariables(content: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const variables = new Set<string>();
  let match;
  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}