'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/ui/Modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/shared/ui/Card';
import { useAuthApi } from '@/hooks/useAuthApi';
import { Loader2, Download, MessageSquare } from 'lucide-react';

interface TranscriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId?: string;
}

interface TranscriptEntry {
  role: string;
  text: string;
  timestamp: number;
}

export const TranscriptModal: React.FC<TranscriptModalProps> = ({
  open,
  onOpenChange,
  conversationId
}) => {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { getTranscript, isTranscriptLoading } = useAuthApi();

  const fetchTranscript = React.useCallback(async () => {
    if (!conversationId) return;

    setError(null);

    try {
      const data = await getTranscript(conversationId);
      setTranscript(data.transcript || []);

      // If transcript is not available, set appropriate state
      if (!data.is_available && data.transcript.length === 0) {
        setError('النص غير متوفر لهذه المكالمة');
      }
    } catch (err: any) {
      console.error('Error fetching transcript:', err);
      // Provide more specific error message based on error type
      if (err.statusCode === 404) {
        setError('النص غير متوفر لهذه المكالمة');
      } else {
        setError('فشل تحميل النص');
      }
    }
  }, [conversationId, getTranscript]);

  useEffect(() => {
    if (open && conversationId) {
      fetchTranscript();
    }
  }, [open, conversationId, fetchTranscript]);

  const downloadTranscript = () => {
    if (!transcript.length) return;
    
    const textContent = transcript
      .map(entry => `[${Math.floor(entry.timestamp)}s] ${entry.role === 'user' ? 'العميل' : 'الوكيل'}: ${entry.text}`)
      .join('\n\n');
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${conversationId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const closeModal = () => {
    onOpenChange(false);
    setTranscript([]);
    setError(null);
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="نص المكالمة"
    >
      <div className="max-h-[60vh] overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[50vh]">
          {isTranscriptLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40 text-red-500">
              {error}
            </div>
          ) : transcript.length > 0 ? (
            <div className="space-y-4">
              {transcript.map((entry, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entry.role === 'user'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {entry.role === 'user' ? 'العميل' : 'الوكيل'}
                    </span>
                    <span className="text-xs text-slate-500">
                      [{Math.floor(entry.timestamp)}s]
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {entry.text}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500">
              لا يوجد نص متاح لهذه المكالمة
            </div>
          )}
        </div>

        {transcript.length > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={downloadTranscript}
              disabled={isTranscriptLoading}
            >
              <Download size={16} className="ml-2" />
              تحميل النص
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};