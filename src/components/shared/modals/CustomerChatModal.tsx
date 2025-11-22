'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthApi } from '@/hooks/useAuthApi';
import { Modal } from '@/components/shared/ui/Modal';

interface CustomerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}

export interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'agent';
  timestamp: Date;
}

export default function CustomerChatModal({ isOpen, onClose, customer }: CustomerChatModalProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { sendCustomerMessage } = useAuthApi();

  // Load initial messages
  useEffect(() => {
    if (isOpen) {
      // In a real implementation, this would fetch existing messages
      // For now, we'll populate with some sample messages
      const sampleMessages: Message[] = [
        {
          id: '1',
          text: 'مرحباً، هل يمكنني مساعدتك؟',
          sender: 'agent',
          timestamp: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          id: '2',
          text: 'أرغب في معرفة معلومات عن مشروعكم الجديد',
          sender: 'customer',
          timestamp: new Date(Date.now() - 1800000) // 30 minutes ago
        }
      ];
      setMessages(sampleMessages);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'customer',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Actually send the message via API
      await sendCustomerMessage({
        customer_id: customer.id,
        message: message,
        channel: 'chat'
      });

      // Simulate agent response (in a real app, this would come from the backend)
      setTimeout(() => {
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'شكراً لرسالتك، سأقوم بمراجعة طلبك وسأعود إليك قريباً.',
          sender: 'agent',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentResponse]);
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message to UI
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'عذراً، فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.',
        sender: 'agent',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`محادثة مع ${customer.name}`}>
      <div className="flex flex-col h-[600px] max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold">{customer.name}</h3>
              <p className="text-sm text-slate-500">{customer.phone}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <Phone className="w-5 h-5" />
            </button>
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.sender === 'customer'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none'
                } shadow-sm`}
              >
                <p>{msg.text}</p>
                <span className="text-[10px] opacity-70 block mt-1 text-left">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none shadow-sm">
                <p>...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white dark:bg-slate-900">
          <div className="flex gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك..."
              className="flex-1 p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}