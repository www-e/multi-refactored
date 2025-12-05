'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { useAuthApi } from '@/hooks/useAuthApi';
import { Phone, PhoneOff, Ticket, Calendar, User, Clock, Check, X, RefreshCw, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/shared/ui/Card';
import { StatusBadge } from '@/components/shared/ui/StatusBadge';

interface BackendBooking { id: string; customer_name: string; phone: string; project: string; day_name: string; appointment_date: string; appointment_time: string; status: string; }
interface BackendTicket { id: string; customer_name: string; phone: string; issue: string; priority: 'high' | 'med' | 'low'; project: string; status: 'open' | 'in_progress' | 'closed'; created_at: string; }

export default function ClientOnlySupportAgent() {
  const [backendBookings, setBackendBookings] = useState<BackendBooking[]>([]);
  const [backendTickets, setBackendTickets] = useState<BackendTicket[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. Get all authenticated API functions.
  const { getBookings, getTickets, createVoiceSession, postLog, isAuthenticated } = useAuthApi();
  
  // 2. Pass the required functions to the voice agent hook.
  const { isConnected, startVoiceSession, stopVoiceSession } = useVoiceAgent({ createVoiceSession, postLog });

  const fetchBackendData = useCallback(async () => {
    if (isAuthenticated) {
      setIsLoadingData(true);
      try {
        const [bookingsData, ticketsData] = await Promise.all([
          getBookings(),
          getTickets(),
        ]);
        setBackendBookings(bookingsData as any[]);
        setBackendTickets(ticketsData as any[]);
      } catch (error) {
        console.error("Failed to fetch support agent data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }
  }, [isAuthenticated, getBookings, getTickets]);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

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
            <CardTitle>المساعد الصوتي</CardTitle>
          </CardHeader>
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500">جاري محادثة المساعد الصوتي...</p>
          </div>
        </Card>
      </div>
    </div>
  );
}