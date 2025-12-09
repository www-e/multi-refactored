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
      // 🟢 CRITICAL FIX: Ignore WebSocket closing errors
      // These happen naturally when the AI hangs up. We treat them as a normal disconnect.
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      
      if (
        errorStr.includes('CLOSING') || 
        errorStr.includes('CLOSED') || 
        errorStr.includes('1000') || // Normal closure code
        errorStr.includes('1005')    // No status code
      ) {
        console.log('Call ended naturally (WebSocket closed)');
        options.onStatusChange?.('idle');
        setCurrentSession(null);
        return; 
      }

      console.error('ElevenLabs conversation error:', error);
      options.onError?.(errorStr);
      options.onStatusChange?.('error');
    },
  });

  const startVoiceSession = useCallback(async (agentType: 'support' | 'sales', customerId?: string, customerPhone?: string) => {
    try {
      options.onStatusChange?.('connecting');
      await postLog('info', 'startVoiceSession initiated', { agentType, customerId });
      
      // 1. Create Backend Session (Get ID from DB)
      const backendSession = await createVoiceSession(agentType, customerId, customerPhone);
      
      // 2. Get Agent ID from Env
      const agentId = agentType === 'support'
        ? process.env.NEXT_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID
        : process.env.NEXT_PUBLIC_ELEVENLABS_SALES_AGENT_ID;

      if (!agentId) throw new Error(`Agent ID not configured for ${agentType}`);

      // 3. Request Microphone Access
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 4. Start ElevenLabs Session
      // FIX: Added 'connectionType' to satisfy TypeScript requirement
      await conversation.startSession({
        agentId: agentId,
        // @ts-ignore - 'websocket' is valid but sometimes types mismatch in older SDK versions
        connectionType: 'websocket', 
      });

      // 5. Store Session Data
      // Note: We map the backend session ID here so we know which DB row to update later if needed
      const session = {
        backend_session: backendSession,
        elevenlabs_conversation: {
          conversation_id: backendSession.session_id, 
          agent_id: agentId,
        },
        agent_type: agentType,
      };
      
      setCurrentSession(session);
      await postLog('info', 'voice_session_connected', { session_id: backendSession.session_id });

    } catch (error: any) {
      console.error('Voice session start failed:', error);
      const errorMessage = error.message || 'Failed to start voice session';
      
      options.onError?.(errorMessage);
      options.onStatusChange?.('error');
      
      await postLog('error', 'voice_session_start_failed', { error: errorMessage });
    }
  }, [options, conversation, createVoiceSession, postLog]);

  const stopVoiceSession = useCallback(async () => {
    try {
      await conversation.endSession();
      await postLog('info', 'voice_session_stopped_manually', {});
    } catch (error: any) {
      console.warn('Stop voice session warning:', error);
      options.onStatusChange?.('idle');
      setCurrentSession(null);
    }
  }, [conversation, currentSession, options, postLog]);

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