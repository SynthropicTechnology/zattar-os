"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense, lazy } from "react";
import { useDyteClient, DyteProvider } from "@dytesdk/react-web-core";
import { actionEntrarNaChamada, actionSairDaChamada, actionSalvarTranscricao } from "../actions/chamadas-actions";
import { useScreenshare, useTranscription, useRecording, useAdaptiveQuality } from "../hooks";
import { handleCallError } from "../utils/call-error-handler";
import { CallLoadingState, LoadingStage } from "./call-loading-state";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { MeetingSkeleton } from "./meeting-skeleton";
import type { SelectedDevices } from "../domain";

const CustomMeetingUI = lazy(() =>
  import("./custom-meeting-ui").then((m) => ({ default: m.CustomMeetingUI }))
);

interface CallWindowContentProps {
  chamadaId?: number;
  tipo: "audio" | "video";
  salaNome: string;
  isInitiator: boolean;
}

export function CallWindowContent({
  chamadaId,
  tipo,
  salaNome,
  isInitiator,
}: CallWindowContentProps) {
  const [meeting, initMeeting] = useDyteClient();
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [meetingId, setMeetingId] = useState<string | undefined>(undefined);
  const joinedRef = useRef(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedDevices, setSelectedDevices] = useState<SelectedDevices | undefined>(undefined);

  // Read authToken and devices from sessionStorage on mount
  useEffect(() => {
    const token = sessionStorage.getItem("call_auth_token");
    const devicesJson = sessionStorage.getItem("call_selected_devices");

    if (token) {
      setAuthToken(token);
      sessionStorage.removeItem("call_auth_token");
    }
    if (devicesJson) {
      try {
        setSelectedDevices(JSON.parse(devicesJson));
      } catch { /* ignore */ }
      sessionStorage.removeItem("call_selected_devices");
    }

    // Update page title
    document.title = `${tipo === "video" ? "Video" : "Audio"} - ${salaNome}`;
  }, [tipo, salaNome]);

  const isVideo = tipo === "video";

  // Screenshare hook
  const { isScreensharing, startScreenshare, stopScreenshare, screenShareParticipant } =
    useScreenshare(meeting);

  // Transcription hook (video only)
  const { transcripts } = useTranscription(isVideo ? meeting || null : null);
  const [showTranscript, setShowTranscript] = useState(false);
  const transcriptsRef = useRef(transcripts);

  // Get meetingId
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
  const { isRecording, startRecording, stopRecording } = useRecording(
    meeting,
    meetingId,
    () => {},
    async (recId: string | undefined) => {
      if (chamadaId && recId) {
        setTimeout(async () => {
          const { actionSalvarUrlGravacao } = await import("../actions/chamadas-actions");
          await actionSalvarUrlGravacao(chamadaId, recId);
        }, 5000);
      }
    }
  );

  // Adaptive Quality Hook (video only)
  const { audioOnlyMode } = useAdaptiveQuality(isVideo ? meeting || undefined : undefined, {
    autoSwitch: false,
    threshold: 2,
  });

  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  const startCall = useCallback(async () => {
    if (initialized || loading || !authToken) return;

    setLoading(true);
    setLoadingStage("connecting");
    setError(null);
    try {
      if (chamadaId && !joinedRef.current) {
        await actionEntrarNaChamada(chamadaId);
        joinedRef.current = true;
      }

      setLoadingStage("initializing");

      await initMeeting({
        authToken,
        defaults: {
          audio: isVideo ? !!selectedDevices?.audioInput : true,
          video: isVideo ? !!selectedDevices?.videoDevice : false,
        },
      });

      setLoadingStage("joining");
      setInitialized(true);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Erro ao iniciar chamada.";
      setError(errorMessage);
      handleCallError(e);
    } finally {
      setLoading(false);
    }
  }, [chamadaId, authToken, initMeeting, initialized, loading, selectedDevices, isVideo]);

  // Apply selected devices after meeting initialization
  useEffect(() => {
    const applyDevices = async () => {
      if (meeting && selectedDevices && initialized) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const self = meeting.self as any;
          if (isVideo && selectedDevices.videoDevice && self.setDevice) {
            await self.setDevice("video", selectedDevices.videoDevice);
          }
          if (selectedDevices.audioInput && self.setDevice) {
            await self.setDevice("audio", selectedDevices.audioInput);
          }
          if (selectedDevices.audioOutput && self.setDevice) {
            await self.setDevice("speaker", selectedDevices.audioOutput);
          }
        } catch (err) {
          handleCallError(err);
        }
      }
    };
    applyDevices();
  }, [meeting, selectedDevices, initialized, isVideo]);

  // Start call when authToken is available
  useEffect(() => {
    if (authToken && !initialized) {
      startCall();
    }
  }, [authToken, initialized, startCall]);

  const handleExit = useCallback(async () => {
    if (isRecording) {
      try {
        await stopRecording();
      } catch (err) {
        handleCallError(err);
      }
    }

    if (meeting) {
      meeting.leave();
    }

    // Save transcription (video only)
    if (isVideo && chamadaId && transcriptsRef.current.length > 0) {
      const fullTranscript = transcriptsRef.current
        .filter((t) => t.isFinal)
        .map((t) => {
          const time = new Date(t.timestamp).toLocaleTimeString();
          return `[${time}] ${t.participantName}: ${t.text}`;
        })
        .join("\n");

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

    // Notify parent window that call ended
    if (window.opener) {
      try {
        window.opener.postMessage(
          { type: "call_ended", chamadaId, isInitiator },
          window.location.origin
        );
      } catch { /* cross-origin, ignore */ }
    }

    // Close the window
    window.close();
  }, [meeting, chamadaId, isInitiator, isVideo, isRecording, stopRecording]);

  // Handle window close/beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (chamadaId && joinedRef.current) {
        // Fire-and-forget exit
        actionSairDaChamada(chamadaId).catch(() => {});
      }
      if (window.opener) {
        try {
          window.opener.postMessage(
            { type: "call_ended", chamadaId, isInitiator },
            window.location.origin
          );
        } catch { /* ignore */ }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [chamadaId, isInitiator]);

  if (!authToken && !error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <p className="text-lg text-gray-400">Token de autenticação não encontrado.</p>
          <Button variant="outline" onClick={() => window.close()}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white relative">
      {loading && (
        <CallLoadingState
          stage={loadingStage}
          message={isVideo ? undefined : "Iniciando chamada de áudio..."}
          onCancel={() => window.close()}
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
            <Button
              variant="outline"
              onClick={() => window.close()}
              className="border-gray-700 hover:bg-gray-800"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setError(null);
                startCall();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
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
              transcripts={isVideo ? transcripts : []}
              showTranscript={showTranscript}
              onToggleTranscript={() => setShowTranscript(!showTranscript)}
              audioOnly={isVideo ? audioOnlyMode : true}
              canRecord={isInitiator}
            />
          </Suspense>
        </DyteProvider>
      )}
    </div>
  );
}
