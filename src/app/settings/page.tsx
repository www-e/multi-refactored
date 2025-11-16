'use client';

import { useState } from 'react';
import { Clock, Phone, Database, Users, Save, LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/shared/ui/Card';
import { ActionButton } from '@/components/shared/ui/ActionButton';
import { ToggleSwitch } from '@/components/shared/ui/ToggleSwitch';

// Settings Section Wrapper Component for consistency
function SettingsSection({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  iconBg: string;
  title:string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <div className="space-y-6">{children}</div>
    </Card>
  );
}

export default function SettingsPage() {
  // Default configuration values - these should ideally be fetched from backend API
  const [workingHours, setWorkingHours] = useState({
    start: '08:00',
    end: '18:00',
    days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  });
  // Default configuration values - these should ideally be fetched from backend API
  const [transferPolicies, setTransferPolicies] = useState({
    autoTransfer: true,
    transferDelay: 30,
    transferMessage: 'سيتواصل معك ممثلنا حالاً، وإن لم يتم الرد سنعاود الاتصال بك.',
  });
  // Default configuration values - these should ideally be fetched from backend API
  const [recordingSettings, setRecordingSettings] = useState({
    retentionDays: 30,
    autoDelete: true,
    backupEnabled: true,
    quality: 'high',
  });
  // Default configuration values - these should ideally be fetched from backend API
  const [teamSettings, setTeamSettings] = useState({
    maxAgents: 10,
    autoAssignment: true,
    notificationEmail: 'manager@navaia.com',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const daysOfWeek = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];

  const toggleDay = (day: string) => {
    setWorkingHours(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader title="الإعدادات" subtitle="تخصيص النظام وإعداداته" />

        <div className="space-y-6">
          <SettingsSection
            icon={Clock}
            iconBg="bg-gradient-to-r from-blue-500 to-indigo-600"
            title="ساعات العمل"
            subtitle="تحديد أوقات العمل المتاحة"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">وقت البداية</label>
                <input type="time" value={workingHours.start} onChange={e => setWorkingHours(p => ({ ...p, start: e.target.value }))} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">وقت النهاية</label>
                <input type="time" value={workingHours.end} onChange={e => setWorkingHours(p => ({ ...p, end: e.target.value }))} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">أيام العمل</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map(day => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={workingHours.days.includes(day)} onChange={() => toggleDay(day)} className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary/50" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Phone}
            iconBg="bg-gradient-to-r from-orange-500 to-red-600"
            title="سياسات التحويل"
            subtitle="إعدادات التحويل للبشر"
          >
            <ToggleSwitch
              label="التحويل التلقائي"
              description="تفعيل التحويل التلقائي عند الحاجة"
              checked={transferPolicies.autoTransfer}
              onChange={checked => setTransferPolicies(p => ({ ...p, autoTransfer: checked }))}
            />
          </SettingsSection>

          <SettingsSection
            icon={Database}
            iconBg="bg-gradient-to-r from-purple-500 to-pink-600"
            title="إعدادات التسجيل"
            subtitle="إدارة المكالمات المسجلة"
          >
            <ToggleSwitch
              label="الحذف التلقائي"
              description="حذف التسجيلات تلقائياً بعد انتهاء المدة"
              checked={recordingSettings.autoDelete}
              onChange={checked => setRecordingSettings(p => ({ ...p, autoDelete: checked }))}
            />
             <ToggleSwitch
              label="النسخ الاحتياطي"
              description="تفعيل النسخ الاحتياطي للتسجيلات"
              checked={recordingSettings.backupEnabled}
              onChange={checked => setRecordingSettings(p => ({ ...p, backupEnabled: checked }))}
            />
          </SettingsSection>

          <SettingsSection
            icon={Users}
            iconBg="bg-gradient-to-r from-emerald-500 to-teal-600"
            title="إعدادات الفريق"
            subtitle="إدارة أعضاء الفريق"
          >
            <ToggleSwitch
              label="التعيين التلقائي"
              description="تعيين التذاكر تلقائياً للممثلين المتاحين"
              checked={teamSettings.autoAssignment}
              onChange={checked => setTeamSettings(p => ({ ...p, autoAssignment: checked }))}
            />
          </SettingsSection>

          <div className="flex justify-end">
            <ActionButton icon={Save} label="حفظ الإعدادات" onClick={handleSave} />
          </div>
        </div>

        {saveSuccess && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            ✓ تم حفظ الإعدادات بنجاح!
          </div>
        )}
      </div>
    </div>
  );
}