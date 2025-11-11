'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { Phone, PhoneOff, Ticket, Calendar, User, Clock, Check, X, RefreshCw, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';

// Interfaces for backend data (kept from original file)
interface BackendBooking { id: string; customer_name: string; phone: string; project: string; day_name: string; appointment_date: string; appointment_time: string; status: string; }
interface BackendTicket { id: string; customer_name: string; phone: string; issue: string; priority: 'high' | 'med' | 'low'; project: string; status: 'open' | 'in_progress' | 'closed'; created_at: string; }

export default function SupportAgentPage() {
  const [backendBookings, setBackendBookings] = useState<BackendBooking[]>([]);
  const [backendTickets, setBackendTickets] = useState<BackendTicket[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { isConnected, startVoiceSession, stopVoiceSession } = useVoiceAgent({});

  const fetchBackendData = async () => {
    setIsLoadingData(true);
    // Simulating API calls from original file
    try {
      const bookingsRes = await fetch('/api/bookings');
      const ticketsRes = await fetch('/api/tickets');
      if (bookingsRes.ok) setBackendBookings(await bookingsRes.json());
      if (ticketsRes.ok) setBackendTickets(await ticketsRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBookingAction = (id: string, action: 'approve' | 'deny') => alert(`Booking ${id}: ${action}`);
  const handleTicketAction = (id: string, action: 'approve' | 'deny') => alert(`Ticket ${id}: ${action}`);

  return (
    <div className="min-h-screen gradient-bg p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="مساعد خدمة العملاء الذكي"
          subtitle="تحدث مع المساعد وراجع الإجراءات التي تم إنشاؤها تلقائياً"
        />

        <Card className="p-8 mb-8 text-center">
          <div className="mb-6">{ isConnected ? 'متصل' : 'غير متصل' }</div>
          <div className="mb-6">
            {isConnected ? (
              <Button onClick={() => stopVoiceSession()} size="lg" variant="destructive" className="h-16 px-8"><PhoneOff className="w-6 h-6 ml-2" /> إنهاء المكالمة</Button>
            ) : (
              <Button onClick={() => startVoiceSession('support')} size="lg" className="h-16 px-8 bg-green-600 hover:bg-green-700"><Phone className="w-6 h-6 ml-2" /> بدء مكالمة</Button>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            اضغط على "بدء مكالمة" وتحدث عن طلبك. سيقوم المساعد بإنشاء التذكرة أو الموعد المناسب أدناه.
          </p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>طلبات العملاء الجديدة</CardTitle>
            <Button onClick={fetchBackendData} variant="outline" size="sm" disabled={isLoadingData}>
              {isLoadingData ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <RefreshCw className="w-4 h-4 ml-2" />} تحديث
            </Button>
          </CardHeader>
          
          <div className="p-6 space-y-8">
            {isLoadingData && !backendBookings.length && !backendTickets.length ? (
                <div className="text-center py-8 text-slate-500">جاري تحميل الطلبات...</div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar /> طلبات المواعيد ({backendBookings.length})</h3>
                  {backendBookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {backendBookings.map(b => (
                        <Card key={b.id} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{b.project}</h4>
                            <StatusBadge status={b.status === 'pending' ? 'معلق' : 'مؤكد'} />
                          </div>
                          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <p><User size={14} className="inline ml-1" />{b.customer_name}</p>
                            <p><Phone size={14} className="inline ml-1" />{b.phone}</p>
                            <p><Clock size={14} className="inline ml-1" />{b.day_name} {b.appointment_date} - {b.appointment_time}</p>
                          </div>
                           {b.status === 'pending' && <div className="flex gap-2 pt-4 mt-4 border-t dark:border-slate-700"><Button onClick={() => handleBookingAction(b.id, 'approve')} size="sm" className="flex-1 bg-green-600"><Check size={16} /> موافقة</Button><Button onClick={() => handleBookingAction(b.id, 'deny')} size="sm" variant="outline" className="flex-1"><X size={16} /> رفض</Button></div>}
                        </Card>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-500">لا توجد طلبات مواعيد جديدة.</p>}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Ticket /> تذاكر الدعم ({backendTickets.length})</h3>
                  {backendTickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {backendTickets.map(t => (
                        <Card key={t.id} className="p-4">
                           <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{t.project}</h4>
                            <StatusBadge status={t.priority === 'high' ? 'عالٍ' : 'متوسط'} />
                          </div>
                           <p className="text-sm bg-slate-50 dark:bg-slate-700 p-2 rounded-md mb-2">{t.issue}</p>
                          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <p><User size={14} className="inline ml-1" />{t.customer_name}</p>
                          </div>
                          {t.status === 'open' && <div className="flex gap-2 pt-4 mt-4 border-t dark:border-slate-700"><Button onClick={() => handleTicketAction(t.id, 'approve')} size="sm" className="flex-1 bg-green-600"><Check size={16} /> قبول</Button><Button onClick={() => handleTicketAction(t.id, 'deny')} size="sm" variant="outline" className="flex-1"><X size={16} /> رفض</Button></div>}
                        </Card>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-500">لا توجد تذاكر دعم جديدة.</p>}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}