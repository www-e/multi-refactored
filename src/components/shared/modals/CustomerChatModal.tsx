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

  // Load initial messages when modal opens
  useEffect(() => {
    if (isOpen) {
      // In a real implementation, this would fetch existing messages from the conversation
      // For now, we'll start with an empty array and load conversation history later
      setMessages([]);
      loadConversationHistory();
    }
  }, [isOpen, customer.id]);

  // Load conversation history
  const loadConversationHistory = async () => {
    try {
      // In a real implementation, we would fetch conversation history here
      // For now, we'll just continue with empty messages
      // const response = await getConversationHistory(customer.id);
      // const conversationMessages = response.messages.map(msg => ({
      //   id: msg.id.toString(),
      //   text: msg.text,
      //   sender: msg.role === 'user' ? 'customer' : 'agent',
      //   timestamp: new Date(msg.ts)
      // }));
      // setMessages(conversationMessages);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

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
      // Use the sendCustomerMessage function from useAuthApi hook which handles auth properly
      const data = await sendCustomerMessage({
        customer_id: customer.id,
        message: message,
        channel: 'chat',
        agentType: 'support' // Default to support agent
      });

      // Add the AI's response to the messages
      const agentResponse: Message = {
        id: `ai-${Date.now()}`,
        text: data.response,
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentResponse]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message to UI
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
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
                <p className="flex items-center">
                  <span className="animate-pulse">جاري الكتابة</span>
                  <span className="ml-1">...</span>
                </p>
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
              disabled={isLoading}
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