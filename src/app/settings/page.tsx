'use client'

import { useState } from 'react'
import { 
  Settings, 
  Clock, 
  Phone, 
  Save, 
  Calendar,
  Shield,
  Database,
  Users,
  Bell,
  Globe,
  Lock
} from 'lucide-react'

export default function SettingsPage() {
  const [workingHours, setWorkingHours] = useState({
    start: '08:00',
    end: '18:00',
    days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
  })
  
  const [transferPolicies, setTransferPolicies] = useState({
    autoTransfer: true,
    transferDelay: 30,
    transferMessage: 'سيتواصل معك ممثلنا حالاً، وإن لم يتم الرد سنعاود الاتصال بك.',
    transferReasons: ['طلب ممثل بشري', 'مشكلة معقدة', 'شكوى رسمية']
  })
  
  const [recordingSettings, setRecordingSettings] = useState({
    retentionDays: 30,
    autoDelete: true,
    backupEnabled: true,
    quality: 'high'
  })

  const [teamSettings, setTeamSettings] = useState({
    maxAgents: 10,
    autoAssignment: true,
    notificationEmail: 'manager@navaia.com'
  })

  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = () => {
    // Simulate saving settings
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const daysOfWeek = [
    { id: 'الأحد', label: 'الأحد' },
    { id: 'الاثنين', label: 'الاثنين' },
    { id: 'الثلاثاء', label: 'الثلاثاء' },
    { id: 'الأربعاء', label: 'الأربعاء' },
    { id: 'الخميس', label: 'الخميس' },
    { id: 'الجمعة', label: 'الجمعة' },
    { id: 'السبت', label: 'السبت' }
  ]

  const toggleDay = (day: string) => {
    setWorkingHours(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }))
  }

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
            الإعدادات
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            تخصيص النظام وإعداداته
          </p>
        </div>

        <div className="space-y-6">
          {/* Working Hours */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/20">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">ساعات العمل</h2>
                <p className="text-slate-600 dark:text-slate-400">تحديد أوقات العمل المتاحة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  وقت البداية
                </label>
                <input
                  type="time"
                  value={workingHours.start}
                  onChange={(e) => setWorkingHours(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  وقت النهاية
                </label>
                <input
                  type="time"
                  value={workingHours.end}
                  onChange={(e) => setWorkingHours(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                أيام العمل
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map((day) => (
                  <label key={day.id} className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={workingHours.days.includes(day.id)}
                      onChange={() => toggleDay(day.id)}
                      className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary/50"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Transfer Policies */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/20">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">سياسات التحويل</h2>
                <p className="text-slate-600 dark:text-slate-400">إعدادات التحويل للبشر</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">التحويل التلقائي</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">تفعيل التحويل التلقائي عند الحاجة</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transferPolicies.autoTransfer}
                    onChange={(e) => setTransferPolicies(prev => ({ ...prev, autoTransfer: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  تأخير التحويل (ثانية)
                </label>
                <input
                  type="number"
                  value={transferPolicies.transferDelay}
                  onChange={(e) => setTransferPolicies(prev => ({ ...prev, transferDelay: parseInt(e.target.value) }))}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  min="0"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  رسالة التحويل
                </label>
                <textarea
                  value={transferPolicies.transferMessage}
                  onChange={(e) => setTransferPolicies(prev => ({ ...prev, transferMessage: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="رسالة يتم عرضها عند التحويل للبشر"
                />
              </div>
            </div>
          </div>

          {/* Recording Settings */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/20">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">إعدادات التسجيل</h2>
                <p className="text-slate-600 dark:text-slate-400">إدارة المكالمات المسجلة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  مدة الحفظ (يوم)
                </label>
                <input
                  type="number"
                  value={recordingSettings.retentionDays}
                  onChange={(e) => setRecordingSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  min="1"
                  max="365"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  جودة التسجيل
                </label>
                <select
                  value={recordingSettings.quality}
                  onChange={(e) => setRecordingSettings(prev => ({ ...prev, quality: e.target.value }))}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">الحذف التلقائي</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">حذف التسجيلات تلقائياً بعد انتهاء المدة</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordingSettings.autoDelete}
                    onChange={(e) => setRecordingSettings(prev => ({ ...prev, autoDelete: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">النسخ الاحتياطي</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">تفعيل النسخ الاحتياطي للتسجيلات</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordingSettings.backupEnabled}
                    onChange={(e) => setRecordingSettings(prev => ({ ...prev, backupEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Team Settings */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/20">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">إعدادات الفريق</h2>
                <p className="text-slate-600 dark:text-slate-400">إدارة أعضاء الفريق</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  الحد الأقصى للممثلين
                </label>
                <input
                  type="number"
                  value={teamSettings.maxAgents}
                  onChange={(e) => setTeamSettings(prev => ({ ...prev, maxAgents: parseInt(e.target.value) }))}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  بريد الإشعارات
                </label>
                <input
                  type="email"
                  value={teamSettings.notificationEmail}
                  onChange={(e) => setTeamSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="manager@navaia.com"
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">التعيين التلقائي</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">تعيين التذاكر تلقائياً للممثلين المتاحين</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teamSettings.autoAssignment}
                    onChange={(e) => setTeamSettings(prev => ({ ...prev, autoAssignment: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200"
            >
              <Save className="w-5 h-5" />
              <span>حفظ الإعدادات</span>
            </button>
          </div>

          {/* Success Notification */}
          {saveSuccess && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50">
              ✓ تم حفظ الإعدادات بنجاح!
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 