import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TipoChamada, actionResponderChamada } from '@/app/app/chat';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

export interface IncomingCallData {
  chamadaId: number;
  meetingId: string;
  tipo: TipoChamada;
  iniciadorNome: string;
  iniciadorId: number;
  iniciadorAvatar?: string;
  salaId: number;
  timestamp: number;
}

interface UseCallNotificationsProps {
  salaId: number;
  currentUserId: number;
  currentUserName: string;
  enabled?: boolean;
}

interface UseCallNotificationsReturn {
  incomingCall: IncomingCallData | null;
  acceptCall: () => Promise<{ meetingId: string; authToken: string } | null>;
  rejectCall: () => Promise<void>;
  notifyCallStart: (chamadaId: number, tipo: TipoChamada, meetingId: string) => Promise<void>;
  notifyCallEnded: (chamadaId: number) => Promise<void>;
  notifyScreenshareStart: (chamadaId: number) => Promise<void>;
  notifyScreenshareStop: (chamadaId: number) => Promise<void>;
  isProcessing: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useCallNotifications({
  salaId,
  currentUserId,
  currentUserName,
  enabled = true
}: UseCallNotificationsProps): UseCallNotificationsReturn {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // Reset call state safely
  const clearCall = useCallback(() => {
    setIncomingCall(null);
    setIsProcessing(false);
  }, []);

  // Listen to call events
  useEffect(() => {
    if (!enabled || !salaId) return;

    // Unique channel per room for calls
    const channelName = `room_calls:${salaId}`;
    
    // Clean up previous channel if exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'call_started' }, (payload) => {
        // Ignore own calls
        if (payload.payload.iniciadorId === currentUserId) return;

        console.log('Recebendo chamada:', payload);
        
        setIncomingCall({
          chamadaId: payload.payload.chamadaId,
          meetingId: payload.payload.meetingId,
          tipo: payload.payload.tipo,
          iniciadorNome: payload.payload.iniciadorNome,
          iniciadorId: payload.payload.iniciadorId,
          iniciadorAvatar: payload.payload.iniciadorAvatar,
          salaId: payload.payload.salaId,
          timestamp: Date.now(),
        });
      })
      .on('broadcast', { event: 'call_ended' }, (payload) => {
        // If current incoming call ended/cancelled elsewhere
        setIncomingCall(prev => {
          if (prev && prev.chamadaId === payload.payload.chamadaId) {
            return null;
          }
          return prev;
        });
      })
      .on('broadcast', { event: 'call_accepted' }, (payload) => {
         // Log or Toast
         console.log('Chamada aceita por:', payload.payload.usuarioId);
      })
      .on('broadcast', { event: 'call_rejected' }, (payload) => {
         // Log or Toast
         console.log('Chamada recusada por:', payload.payload.usuarioId);
      })
      .on('broadcast', { event: 'screenshare_started' }, (payload) => {
         if (payload.payload.usuarioId === currentUserId) return;
         toast.info(`${payload.payload.usuarioNome} está compartilhando a tela`);
      })
      .on('broadcast', { event: 'screenshare_stopped' }, (payload) => {
         if (payload.payload.usuarioId === currentUserId) return;
         // toast.info(`${payload.payload.usuarioNome} parou de compartilhar a tela`);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log(`Subscribed to calls in room ${salaId}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [salaId, currentUserId, enabled, supabase]);

  // Actions
  const notifyCallStart = useCallback(async (chamadaId: number, tipo: TipoChamada, meetingId: string) => {
    if (!channelRef.current) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'call_started',
      payload: {
        chamadaId,
        meetingId,
        tipo,
        salaId,
        iniciadorId: currentUserId,
        iniciadorNome: currentUserName,
      },
    });
  }, [currentUserId, currentUserName, salaId]);

  const notifyCallEnded = useCallback(async (chamadaId: number) => {
    if (!channelRef.current) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'call_ended',
      payload: {
        chamadaId,
      },
    });
  }, []);

  const notifyScreenshareStart = useCallback(async (chamadaId: number) => {
    if (!channelRef.current) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'screenshare_started',
      payload: {
        chamadaId,
        usuarioId: currentUserId,
        usuarioNome: currentUserName,
        timestamp: Date.now(),
      },
    });
  }, [currentUserId, currentUserName]);

  const notifyScreenshareStop = useCallback(async (chamadaId: number) => {
    if (!channelRef.current) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'screenshare_stopped',
      payload: {
        chamadaId,
        usuarioId: currentUserId,
        usuarioNome: currentUserName,
        timestamp: Date.now(),
      },
    });
  }, [currentUserId, currentUserName]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return null;
    setIsProcessing(true);

    try {
      const result = await actionResponderChamada(incomingCall.chamadaId, true);
      
      if (!result.success || !result.data.authToken) {
        console.error('Erro ao aceitar chamada:', result.message);
        clearCall();
        return null;
      }

      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'call_accepted',
          payload: {
            chamadaId: incomingCall.chamadaId,
            usuarioId: currentUserId
          }
        });
      }

      const data = {
        meetingId: result.data.meetingId || incomingCall.meetingId,
        authToken: result.data.authToken
      };
      
      clearCall();
      return data;
      
    } catch (e) {
      console.error(e);
      clearCall();
      return null;
    }
  }, [incomingCall, currentUserId, clearCall]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;
    setIsProcessing(true);

    try {
      await actionResponderChamada(incomingCall.chamadaId, false);
      
      // Notify rejection
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'call_rejected',
          payload: {
            chamadaId: incomingCall.chamadaId,
            usuarioId: currentUserId
          }
        });
        
        // Also emit call ended locally/remotely to close modal if needed
        // Assuming rejection ends the call attempt for this user
        // But if it's the only user, maybe end for everyone?
        // For 1:1, rejection ends the call.
        // Let's emit call_ended too if we want to be sure.
        await channelRef.current.send({
            type: 'broadcast',
            event: 'call_ended',
            payload: {
              chamadaId: incomingCall.chamadaId,
            },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      clearCall();
    }
  }, [incomingCall, currentUserId, clearCall]);

  return {
    incomingCall,
    acceptCall,
    rejectCall,
    notifyCallStart,
    notifyCallEnded,
    notifyScreenshareStart,
    notifyScreenshareStop,
    isProcessing,
  };
}
