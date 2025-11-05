import { useState, useCallback } from 'react'
import { useConversation } from '@elevenlabs/react'

interface VoiceSession {
  backend_session: {
    session_id: string
    status?: string
    customer_id?: string
    created_at?: string
  }
  elevenlabs_conversation: {
    conversation_id: string
    agent_id: string
  }
  agent_type: 'support' | 'sales'
}

interface UseVoiceAgentOptions {
  onTranscript?: (text: string, isFinal: boolean) => void
  onResponse?: (text: string) => void
  onError?: (error: string) => void
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error') => void
}

export function useVoiceAgent(options: UseVoiceAgentOptions = {}) {
  const [currentSession, setCurrentSession] = useState<VoiceSession | null>(null)
  
  const conversation = useConversation({
    onConnect: () => {
      options.onStatusChange?.('connected')
    },
    onDisconnect: () => {
      options.onStatusChange?.('idle')
      setCurrentSession(null)
    },
    onMessage: (message) => {
      // Handle transcript updates based on the actual SDK message structure
      if (message.source === 'user') {
        options.onTranscript?.(message.message, true)
      } else if (message.source === 'ai') {
        options.onResponse?.(message.message)
      }
    },
    onError: (error) => {
      console.error('ElevenLabs conversation error:', error)
      options.onError?.(typeof error === 'string' ? error : 'Connection error')
      options.onStatusChange?.('error')
    },
  })

  const startVoiceSession = useCallback(async (agentType: 'support' | 'sales') => {
    try {
      options.onStatusChange?.('connecting')
      
      // Log the start attempt
      fetch('/api/logs', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          source: 'hook', 
          level: 'info', 
          message: 'startVoiceSession with ElevenLabs SDK', 
          meta: { agentType } 
        }) 
      }).catch(() => {})
      
      // Create backend voice session first
      const backendResponse = await fetch('/api/voice/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: agentType,
          customer_id: `customer_${Date.now()}`,
        }),
      })
      
      if (!backendResponse.ok) {
        const text = await backendResponse.text()
        fetch('/api/logs', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            source: 'hook', 
            level: 'error', 
            message: 'backend_session_failed', 
            meta: { status: backendResponse.status, error: text } 
          }) 
        }).catch(() => {})
        throw new Error(`Backend session creation failed: ${text}`)
      }

      const backendSession = await backendResponse.json()
      
      // Get agent configuration from environment variables
      const agentId = agentType === 'support' 
        ? process.env.NEXT_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID 
        : process.env.NEXT_PUBLIC_ELEVENLABS_SALES_AGENT_ID

      if (!agentId) {
        throw new Error(`Agent ID not configured for ${agentType}`)
      }

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Start ElevenLabs conversation using the SDK
      await conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket',
        userId: backendSession.session_id,
      })

      // Create session object
      const session: VoiceSession = {
        backend_session: backendSession,
        elevenlabs_conversation: {
          conversation_id: backendSession.session_id, // Use backend session ID
          agent_id: agentId
        },
        agent_type: agentType
      }
      
      setCurrentSession(session)
      
      fetch('/api/logs', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          source: 'hook', 
          level: 'info', 
          message: 'voice_session_started', 
          meta: { session_id: session.backend_session.session_id, agentType } 
        }) 
      }).catch(() => {})
      
    } catch (error: any) {
      console.error('Voice session start failed:', error)
      options.onError?.(error.message || 'Failed to start voice session')
      options.onStatusChange?.('error')
      
      fetch('/api/logs', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          source: 'hook', 
          level: 'error', 
          message: 'voice_session_start_failed', 
          meta: { error: error.message } 
        }) 
      }).catch(() => {})
    }
  }, [options, conversation])

  const stopVoiceSession = useCallback(async () => {
    try {
      // End ElevenLabs conversation
      await conversation.endSession()
      
      setCurrentSession(null)
      options.onStatusChange?.('idle')
      
      fetch('/api/logs', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          source: 'hook', 
          level: 'info', 
          message: 'voice_session_stopped' 
        }) 
      }).catch(() => {})
      
    } catch (error: any) {
      console.error('Stop voice session failed:', error)
      options.onError?.(error.message || 'Failed to stop voice session')
    }
  }, [conversation, options])

  return {
    startVoiceSession,
    stopVoiceSession,
    isConnected: conversation.status === 'connected',
    isListening: conversation.status === 'connected' && !conversation.isSpeaking,
    isSpeaking: conversation.isSpeaking,
    status: conversation.status === 'connected' ? 'connected' : 
            conversation.status === 'connecting' ? 'connecting' : 'idle',
    currentSession,
    conversation,
    // Aliases for backward compatibility
    startListening: async (agentType: 'support' | 'sales') => await startVoiceSession(agentType),
    stopListening: async () => await stopVoiceSession(),
  }
}
