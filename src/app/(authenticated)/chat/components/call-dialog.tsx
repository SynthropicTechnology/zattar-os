"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense, lazy } from "react";
import { useDyteClient, DyteProvider } from "@dytesdk/react-web-core";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { actionEntrarNaChamada, actionSairDaChamada } from "../actions/chamadas-actions";
import { SelectedDevices } from "../domain";
import { useScreenshare, useRecording } from "../hooks";
import { cn } from "@/lib/utils";
import { handleCallError } from "../utils/call-error-handler";
import { CallLoadingState, LoadingStage } from "./call-loading-state";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { MeetingSkeleton } from "./meeting-skeleton";

// Lazy load heavy meeting UI component
const CustomMeetingUI = lazy(() =>
  import('./custom-meeting-ui').then(m => ({ default: m.CustomMeetingUI }))
);

interface CallDialogProps {
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

export function CallDialog({
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
}: CallDialogProps) {
  const [meeting, initMeeting] = useDyteClient();
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const joinedRef = useRef(false);
  const roomJoinedRef = useRef(false);

  // Screenshare hook
  const {
    isScreensharing,
    startScreenshare,
    stopScreenshare,
    screenShareParticipant
  } = useScreenshare(meeting);

  // Recording hook
  const {
    isRecording,
    startRecording,
    stopRecording,
  } = useRecording(
    meeting,
    meeting?.meta?.meetingId,
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

  const showLarge = isScreensharing || !!screenShareParticipant;

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
          audio: true,
          video: false,
        },
      });

      setLoadingStage('joining');
      setInitialized(true);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Erro ao iniciar chamada.";
      setError(errorMessage);
      handleCallError(e);
    } finally {
      setLoading(false);
    }
  }, [chamadaId, initialAuthToken, initMeeting, initialized, loading]);

  // Apply selected devices after meeting initialization
  useEffect(() => {
    const applyDevices = async () => {
      if (meeting && selectedDevices && initialized) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const self = meeting.self as any;
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
    if (meeting) {
      meeting.leave();
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
  }, [meeting, chamadaId, isInitiator, onCallEnd]);

  useEffect(() => {
    if (!open) {
      handleExit();
    }
  }, [open, handleExit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "p-0 overflow-hidden bg-gray-900 border-none text-white transition-all duration-300",
        showLarge ? "max-w-4xl h-[80vh]" : "max-w-md h-125"
      )}>
        <VisuallyHidden>
          <DialogTitle>Audio Call: {salaNome}</DialogTitle>
        </VisuallyHidden>

        {loading && (
          <CallLoadingState
            stage={loadingStage}
            message="Iniciando chamada de áudio..."
            onCancel={() => onOpenChange(false)}
          />
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center bg-gray-900">
            <div className="bg-destructive/10 p-4 rounded-full">
              <RotateCcw className="w-12 h-12 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-white">Erro na Chamada</h3>
            <p className="text-gray-400 max-w-sm">{error}</p>
            <div className="flex gap-4 mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-700 hover:bg-gray-800">
                Cancelar
              </Button>
              <Button onClick={() => { setError(null); startCall(); }} className="bg-info hover:bg-info">
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
                transcripts={[]} // No transcription for audio calls for now
                showTranscript={false}
                onToggleTranscript={() => { }}
                audioOnly={true}
              />
            </Suspense>
          </DyteProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
