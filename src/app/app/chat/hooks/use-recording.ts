import { useState, useCallback, useEffect, useRef } from 'react';
import type DyteClient from '@dytesdk/web-core';

interface UseRecordingReturn {
  isRecording: boolean;
  isLoading: boolean;
  error: string | null;
  canRecord: boolean;
  recordingId: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

export const useRecording = (
  meeting?: DyteClient,
  meetingId?: string,
  onRecordingStarted?: (recordingId: string) => void,
  onRecordingStopped?: (recordingId: string) => void
): UseRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const recordingIdRef = useRef<string | null>(null);

  // Check if recording is enabled in config
  // Note: This is client-side, but actual check happens on server action too
  const canRecord = typeof window !== 'undefined' && !!meetingId;

  // Monitor recording state via Dyte events (if available)
  useEffect(() => {
    if (!meeting) return;

    // Dyte SDK might emit recording events
    const handleRecordingUpdate = (state: string) => {
      if (state === 'RECORDING') {
        setIsRecording(true);
        setIsLoading(false);
      } else if (state === 'STOPPING' || state === 'IDLE') {
        setIsRecording(false);
        setIsLoading(false);
      }
    };

    // Check if meeting has recording events
    if (meeting.recording) {
      meeting.recording.on('recordingUpdate', handleRecordingUpdate);
    }

    return () => {
      if (meeting.recording) {
        meeting.recording.removeListener('recordingUpdate', handleRecordingUpdate);
      }
    };
  }, [meeting]);

  const startRecording = useCallback(async () => {
    if (!meetingId || isRecording) return;

    setIsLoading(true);
    setError(null);

    try {
      // Call Server Action to start recording
      const { actionIniciarGravacao } = await import('../actions/chamadas-actions');
      const result = await actionIniciarGravacao(meetingId);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao iniciar gravação');
      }

      const recId = result.data?.recordingId;
      if (recId) {
        setRecordingId(recId);
        recordingIdRef.current = recId;
        setIsRecording(true);
        onRecordingStarted?.(recId);
      }
    } catch (err: unknown) {
      console.error('Error starting recording:', err);
      const error = err as { message?: string };
      setError(error.message || 'Erro ao iniciar gravação');
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, isRecording, onRecordingStarted]);

  const stopRecording = useCallback(async () => {
    const recId = recordingIdRef.current;
    if (!recId || !isRecording) return;

    setIsLoading(true);
    try {
      // Call Server Action to stop recording
      const { actionPararGravacao } = await import('../actions/chamadas-actions');
      const result = await actionPararGravacao(recId);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao parar gravação');
      }

      setIsRecording(false);
      onRecordingStopped?.(recId);
    } catch (err: unknown) {
      console.error('Error stopping recording:', err);
      const error = err as { message?: string };
      setError(error.message || 'Erro ao parar gravação');
    } finally {
      setIsLoading(false);
    }
  }, [isRecording, onRecordingStopped]);

  return {
    isRecording,
    isLoading,
    error,
    canRecord,
    recordingId,
    startRecording,
    stopRecording,
  };
};
