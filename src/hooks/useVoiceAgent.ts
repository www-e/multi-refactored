import { useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';

interface AuthenticatedApiFunctions {
  createVoiceSession: (agentType: 'support' | 'sales', customerId?: string, customerPhone?: string) => Promise<any>;
  postLog: (level: 'info' | 'warn' | 'error', message: string, meta?: any) => Promise<null>;
}

interface UseVoiceAgentOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'error') => void;
}

export function useVoiceAgent(
  api: AuthenticatedApiFunctions,
  options: UseVoiceAgentOptions = {}
) {
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const { createVoiceSession, postLog } = api;

  const conversation = useConversation({
    onConnect: () => options.onStatusChange?.('connected'),
    onDisconnect: () => {
      console.log('Voice Agent Disconnected Normally');
      options.onStatusChange?.('idle');
      setCurrentSession(null);
    },
    onMessage: (message) => {
      if (message.source === 'user') {
        options.onTranscript?.(message.message, true);
      } else if (message.source === 'ai') {
        options.onResponse?.(message.message);
      }
    },
    onError: (error) => {
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      console.log('Voice Agent Socket Event:', errorStr);

      // 🟢 Logic to handle normal socket closures gracefully
      if (
        errorStr.includes('CLOSING') || 
        errorStr.includes('CLOSED') || 
        errorStr.includes('1000') ||
        errorStr.includes('1005')
      ) {
        console.log('Socket closed intentionally - resetting UI');
        options.onStatusChange?.('idle');
        setCurrentSession(null);
        return; 
      }

      console.error('Real Voice Error:', error);
      options.onError?.(errorStr);
      options.onStatusChange?.('error');
    },
  });

  const startVoiceSession = useCallback(async (agentType: 'support' | 'sales', customerId?: string, customerPhone?: string) => {
    try {
      options.onStatusChange?.('connecting');
      
      // 1. Create Backend Session First (Get the ID)
      const backendSession = await createVoiceSession(agentType, customerId, customerPhone);
      
      // 2. Get Agent ID based on type
      const agentId = agentType === 'support'
        ? process.env.NEXT_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID
        : process.env.NEXT_PUBLIC_ELEVENLABS_SALES_AGENT_ID;

      if (!agentId) throw new Error(`Agent ID not configured for ${agentType}`);

      // 3. Start Session (Websocket) with ID Linkage
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: agentId,
        // @ts-ignore - Ensures compatibility with different SDK versions
        clientReferenceId: backendSession.session_id, // 👈 CRITICAL: Links 11Labs call to our Backend Session
        // @ts-ignore
        connectionType: 'websocket', 
      });

      const session = {
        backend_session: backendSession,
        elevenlabs_conversation: {
          conversation_id: backendSession.session_id, 
          agent_id: agentId,
        },
        agent_type: agentType,
      };
      
      setCurrentSession(session);

    } catch (error: any) {
      console.error('Start failed:', error);
      options.onError?.(error.message || 'Failed to start');
      options.onStatusChange?.('error');
    }
  }, [options, conversation, createVoiceSession]);

  const stopVoiceSession = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error: any) {
      // Force UI reset even if SDK errors on stop
      console.warn('Force stopping UI:', error);
      options.onStatusChange?.('idle');
      setCurrentSession(null);
    }
  }, [conversation, options]);

  return {
    startVoiceSession,
    stopVoiceSession,
    isConnected: conversation.status === 'connected',
    isListening: conversation.status === 'connected' && !conversation.isSpeaking,
    isSpeaking: conversation.isSpeaking,
    status: conversation.status,
    currentSession,
  };
}