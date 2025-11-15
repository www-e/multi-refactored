import { useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { createVoiceSession, postLog } from '@/lib/apiClient';

// CORRECTED AND COMPLETE VoiceSession INTERFACE
interface VoiceSession {
  backend_session: {
    session_id: string;
    status: 'created' | 'active' | 'completed' | 'error';
    customer_id: string;
    created_at: string; // ISO 8601 string
  };
  elevenlabs_conversation: {
    conversation_id: string;
    agent_id: string;
  };
  agent_type: 'support' | 'sales';
}

interface UseVoiceAgentOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'error') => void;
}

export function useVoiceAgent(options: UseVoiceAgentOptions = {}) {
  const [currentSession, setCurrentSession] = useState<VoiceSession | null>(null);
  
  const conversation = useConversation({
    onConnect: () => options.onStatusChange?.('connected'),
    onDisconnect: () => {
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
      console.error('ElevenLabs conversation error:', error);
      options.onError?.(typeof error === 'string' ? error : 'Connection error');
      options.onStatusChange?.('error');
    },
  });

  const startVoiceSession = useCallback(async (agentType: 'support' | 'sales') => {
    try {
      options.onStatusChange?.('connecting');
      postLog('info', 'startVoiceSession with ElevenLabs SDK', { agentType }).catch(() => {});
      
      const backendSession = await createVoiceSession(agentType);
      
      const agentId = agentType === 'support' 
        ? process.env.NEXT_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID 
        : process.env.NEXT_PUBLIC_ELEVENLABS_SALES_AGENT_ID;

      if (!agentId) throw new Error(`Agent ID not configured for ${agentType}`);

      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket',
        userId: backendSession.session_id,
      });

      const session: VoiceSession = {
        backend_session: backendSession,
        elevenlabs_conversation: {
          conversation_id: backendSession.session_id,
          agent_id: agentId,
        },
        agent_type: agentType,
      };
      
      setCurrentSession(session);
      postLog('info', 'voice_session_started', { session_id: session.backend_session.session_id, agentType }).catch(() => {});
      
    } catch (error: any) {
      console.error('Voice session start failed:', error);
      const errorMessage = error.message || 'Failed to start voice session';
      options.onError?.(errorMessage);
      options.onStatusChange?.('error');
      postLog('error', 'voice_session_start_failed', { error: errorMessage }).catch(() => {});
    }
  }, [options, conversation]);

  const stopVoiceSession = useCallback(async () => {
    try {
      await conversation.endSession();
postLog('info', 'voice_session_stopped', {}).catch(() => {});    } catch (error: any) {
      console.error('Stop voice session failed:', error);
      options.onError?.(error.message || 'Failed to stop voice session');
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