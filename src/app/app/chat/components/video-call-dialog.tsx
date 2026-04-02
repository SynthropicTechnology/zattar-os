"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense, lazy } from "react";
import { useDyteClient, DyteProvider } from "@dytesdk/react-web-core";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { actionEntrarNaChamada, actionSairDaChamada, actionSalvarTranscricao } from "../actions/chamadas-actions";
import { SelectedDevices } from "../domain";
import { useScreenshare, useTranscription, useRecording, useAdaptiveQuality } from "../hooks";
import { handleCallError } from "../utils/call-error-handler";
import { CallLoadingState, LoadingStage } from "./call-loading-state";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { MeetingSkeleton } from "./meeting-skeleton";

// Lazy load heavy meeting UI component
const CustomMeetingUI = lazy(() =>
  import('./custom-meeting-ui').then(m => ({ default: m.CustomMeetingUI }))
);

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salaId: number;
  salaNome: string;
  chamadaId?: number;
  initialAuthToken?: string;
  isInitiator?: boolean;
  selectedDevices?: SelectedDevices;
  onCallEnd?: () => Promise<void>;
  onScreenshareStart?: () => void;
  onScreenshareStop?: () => void;
}

export function VideoCallDialog({
  open,
  onOpenChange,
  salaId: _salaId,
  salaNome,
  chamadaId,
  initialAuthToken,
  isInitiator,
  selectedDevices,
  onCallEnd,
  onScreenshareStart,
  onScreenshareStop
}: VideoCallDialogProps) {
  const [meeting, initMeeting] = useDyteClient();
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [meetingId, setMeetingId] = useState<string | undefined>(undefined);
  const joinedRef = useRef(false);
  const roomJoinedRef = useRef(false);

  // Screenshare hook
  const {
    isScreensharing,
    startScreenshare,
    stopScreenshare,
    screenShareParticipant
  } = useScreenshare(meeting);

  // Transcription hook
  const { transcripts } = useTranscription(meeting || null);
  const [showTranscript, setShowTranscript] = useState(false);
  // Store transcripts in ref to access them in cleanup/unmount
  const transcriptsRef = useRef(transcripts);

  // Get meetingId from meeting.meta when available, or fetch from server
  useEffect(() => {
    if (meeting?.meta?.meetingId) {
      setMeetingId(meeting.meta.meetingId);
    } else if (chamadaId && !meetingId) {
      (async () => {
        try {
          const { actionBuscarChamadaPorId } = await import("../actions/chamadas-actions");
          const result = await actionBuscarChamadaPorId(chamadaId);
          if (result.success && result.data?.meetingId) {
            setMeetingId(result.data.meetingId);
          }
        } catch (err) {
          handleCallError(err);
        }
      })();
    }
  }, [meeting, chamadaId, meetingId]);

  // Recording hook
  const {
    isRecording,
    recordingId,
    startRecording,
    stopRecording,
  } = useRecording(
    meeting,
    meetingId,
    () => { },
    async (recId: string | undefined) => {
      if (chamadaId && recId) {
        setTimeout(async () => {
          const { actionSalvarUrlGravacao } = await import("../actions/chamadas-actions");
          await actionSalvarUrlGravacao(chamadaId, recId);
        }, 5000);
      }
    }
  );

  // Adaptive Quality Hook
  const { audioOnlyMode } = useAdaptiveQuality(meeting || undefined, {
    autoSwitch: false,
    threshold: 2 // Poor connection
  });

  // Update ref whenever transcripts change
  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  // Notify parent about screenshare events
  useEffect(() => {
    if (isScreensharing) {
      onScreenshareStart?.();
    } else {
      onScreenshareStop?.();
    }
  }, [isScreensharing, onScreenshareStart, onScreenshareStop]);

  const startCall = useCallback(async () => {
    if (initialized || loading) return;
    if (!initialAuthToken) {
      setError("Token de autenticação não fornecido.");
      return;
    }

    setLoading(true);
    setLoadingStage('connecting');
    setError(null);
    try {
      if (chamadaId && !joinedRef.current) {
        await actionEntrarNaChamada(chamadaId);
        joinedRef.current = true;
      }

      setLoadingStage('initializing');

      await initMeeting({
        authToken: initialAuthToken,
        defaults: {
          audio: !!selectedDevices?.audioInput,
          video: !!selectedDevices?.videoDevice,
        },
      });

      setLoadingStage('joining');
      setInitialized(true);

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Erro ao iniciar chamada.";
      setError(errorMessage);
      handleCallError(e); // Also show toast
    } finally {
      setLoading(false);
    }
  }, [chamadaId, initialAuthToken, initMeeting, initialized, loading, selectedDevices]);

  // Apply selected devices after meeting initialization
  useEffect(() => {
    const applyDevices = async () => {
      if (meeting && selectedDevices && initialized) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const self = meeting.self as any;
          if (selectedDevices.videoDevice && self.setDevice) {
            await self.setDevice('video', selectedDevices.videoDevice);
          }
          if (selectedDevices.audioInput && self.setDevice) {
            await self.setDevice('audio', selectedDevices.audioInput);
          }
          if (selectedDevices.audioOutput && self.setDevice) {
            await self.setDevice('speaker', selectedDevices.audioOutput);
          }
        } catch (err) {
          handleCallError(err);
        }
      }
    };

    applyDevices();
  }, [meeting, selectedDevices, initialized]);

  useEffect(() => {
    if (open && !initialized && initialAuthToken) {
      startCall();
    }
  }, [open, initialized, initialAuthToken, startCall]);

  // Join the Dyte room after SDK initialization
  // initMeeting() only configures the client; joinRoom() actually connects to the meeting.
  useEffect(() => {
    if (meeting && initialized && !roomJoinedRef.current) {
      roomJoinedRef.current = true;
      meeting.joinRoom().catch((err: unknown) => {
        roomJoinedRef.current = false;
        setInitialized(false);
        handleCallError(err);
        setError(err instanceof Error ? err.message : "Erro ao entrar na sala.");
      });
    }
  }, [meeting, initialized]);

  const handleExit = useCallback(async () => {
    if (isRecording && recordingId) {
      try {
        await stopRecording();
      } catch (err) {
        handleCallError(err);
      }
    }

    if (meeting) {
      meeting.leave();
    }

    if (chamadaId && transcriptsRef.current.length > 0) {
      const fullTranscript = transcriptsRef.current
        .filter(t => t.isFinal)
        .map(t => {
          const time = new Date(t.timestamp).toLocaleTimeString();
          return `[${time}] ${t.participantName}: ${t.text}`;
        })
        .join('\n');

      if (fullTranscript.trim()) {
        try {
          await actionSalvarTranscricao(chamadaId, fullTranscript);
        } catch (err) {
          handleCallError(err);
        }
      }
    }

    if (chamadaId && joinedRef.current) {
      await actionSairDaChamada(chamadaId);
      joinedRef.current = false;
    }

    if (isInitiator && onCallEnd) {
      await onCallEnd();
    }

    setInitialized(false);
    roomJoinedRef.current = false;
    setError(null);
    setShowTranscript(false);
  }, [meeting, chamadaId, isInitiator, onCallEnd, isRecording, recordingId, stopRecording]);

  useEffect(() => {
    if (!open) {
      handleExit();
    }
  }, [open, handleExit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-3xl md:max-w-5xl lg:max-w-7xl h-[calc(100dvh-4rem)] sm:h-[90vh] p-0 overflow-hidden bg-black border-none text-white relative">
        <VisuallyHidden>
          <DialogTitle>Video Call: {salaNome}</DialogTitle>
        </VisuallyHidden>

        {loading && (
          <CallLoadingState
            stage={loadingStage}
            onCancel={() => onOpenChange(false)}
          />
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center bg-gray-900">
            <div className="bg-red-500/10 p-4 rounded-full">
              <RotateCcw className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">Erro na Chamada</h3>
            <p className="text-gray-400 max-w-sm">{error}</p>
            <div className="flex gap-4 mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-700 hover:bg-gray-800">
                Cancelar
              </Button>
              <Button onClick={() => { setError(null); startCall(); }} className="bg-blue-600 hover:bg-blue-700">
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && meeting && (
          <DyteProvider value={meeting}>
            <Suspense fallback={<MeetingSkeleton />}>
              <CustomMeetingUI
                meeting={meeting}
                onLeave={handleExit}
                chamadaId={chamadaId}
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                isScreensharing={isScreensharing}
                screenShareParticipant={screenShareParticipant}
                onStartScreenshare={startScreenshare}
                onStopScreenshare={stopScreenshare}
                transcripts={transcripts}
                showTranscript={showTranscript}
                onToggleTranscript={() => setShowTranscript(!showTranscript)}
                audioOnly={audioOnlyMode} // Pass audioOnlyMode from adaptive hook
                canRecord={isInitiator ?? false}
              />
            </Suspense>
          </DyteProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}