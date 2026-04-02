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

  const logDyteDebug = useCallback((message: string, extra?: Record<string, unknown>) => {
    console.log('[Dyte UI]', {
      message,
      chamadaId,
      tipo,
      isInitiator,
      salaNome,
      meetingId: meeting?.meta?.meetingId || meetingId || null,
      roomJoined: Boolean((meeting?.self as { roomJoined?: boolean } | undefined)?.roomJoined),
      ...extra,
    });
  }, [chamadaId, tipo, isInitiator, salaNome, meeting, meetingId]);

  // Read authToken from sessionStorage (initiator flow) or postMessage (acceptor flow)
  useEffect(() => {
    // Ler sessionStorage somente no fluxo do iniciador.
    // Para quem aceita a chamada, o token chega via postMessage e o sessionStorage
    // do popup pode conter cópia stale do tab pai.
    if (isInitiator) {
      const token = sessionStorage.getItem("call_auth_token");
      const devicesJson = sessionStorage.getItem("call_selected_devices");

      if (token) {
        setAuthToken(token);
        sessionStorage.removeItem("call_auth_token");
        console.log('[Dyte UI]', {
          message: 'authToken carregado do sessionStorage',
          chamadaId,
          isInitiator,
          tokenPrefix: `${token.slice(0, 12)}...`,
        });
      }
      if (devicesJson) {
        try {
          setSelectedDevices(JSON.parse(devicesJson));
        } catch { /* ignore */ }
        sessionStorage.removeItem("call_selected_devices");
      }
    }

    // Escutar postMessage para receber token (funciona para AMBOS: iniciador e receptor).
    // Para o iniciador, sessionStorage é a primeira tentativa, mas postMessage é o fallback confiável.
    // Para o receptor, postMessage é o único mecanismo.
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "call_auth_token" && event.data.authToken) {
        setAuthToken(event.data.authToken);
        // Aceitar devices do postMessage (enviado pelo iniciador via openCallWindow)
        if (event.data.devices) {
          setSelectedDevices(event.data.devices);
        }
        console.log('[Dyte UI]', {
          message: 'authToken recebido via postMessage',
          chamadaId,
          isInitiator,
          tokenPrefix: `${event.data.authToken.slice(0, 12)}...`,
          hasDevices: !!event.data.devices,
        });
        // Enviar ACK para a janela pai parar o retry
        if (event.source && typeof (event.source as Window).postMessage === "function") {
          (event.source as Window).postMessage(
            { type: "call_auth_token_ack" },
            window.location.origin
          );
        }
      }
    };
    window.addEventListener("message", handleMessage);

    // Update page title
    document.title = `${tipo === "video" ? "Video" : "Audio"} - ${salaNome}`;

    return () => window.removeEventListener("message", handleMessage);
  }, [chamadaId, tipo, salaNome, isInitiator]);

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
        logDyteDebug('entrada da chamada registrada no backend');
      }

      setLoadingStage("initializing");
      logDyteDebug('inicializando SDK', {
        authTokenPrefix: `${authToken.slice(0, 12)}...`,
        selectedDevices,
      });

      await initMeeting({
        authToken,
        defaults: {
          // Quando selectedDevices não está definido (ex: receiver), usar true como padrão
          audio: selectedDevices ? !!selectedDevices.audioInput : true,
          video: isVideo ? (selectedDevices ? !!selectedDevices.videoDevice : true) : false,
        },
      });

      setLoadingStage("joining");
      setInitialized(true);
      logDyteDebug('SDK inicializado');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Erro ao iniciar chamada.";
      setError(errorMessage);
      handleCallError(e);
    } finally {
      setLoading(false);
    }
  }, [chamadaId, authToken, initMeeting, initialized, loading, selectedDevices, isVideo, logDyteDebug]);

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

  // Join the Dyte room after SDK initialization.
  // initMeeting() only configures the client; joinRoom() actually connects to WebRTC.
  // CRITICAL: joinRoom() pode "engatar" silenciosamente sem resolver nem rejeitar
  // (ex: WebSocket bloqueado, preset inválido, problema de rede). Por isso adicionamos
  // timeout de 20s e handler de sucesso explícito.
  const roomJoinedRef = useRef(false);
  useEffect(() => {
    if (!meeting || !initialized || roomJoinedRef.current) return;

    roomJoinedRef.current = true;
    logDyteDebug('executando joinRoom');

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const joinPromise = meeting.joinRoom();
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Timeout: não foi possível entrar na sala em 20 segundos. Verifique sua conexão.')),
        20_000
      );
    });

    Promise.race([joinPromise, timeoutPromise])
      .then(() => {
        clearTimeout(timeoutId);
        logDyteDebug('joinRoom completou com sucesso', {
          joinedParticipants: meeting.participants.joined.size,
          activeParticipants: meeting.participants.active.size,
        });
      })
      .catch((err: unknown) => {
        clearTimeout(timeoutId);
        roomJoinedRef.current = false;
        setInitialized(false);
        handleCallError(err);
        setError(err instanceof Error ? err.message : "Erro ao entrar na sala.");
        logDyteDebug('joinRoom falhou ou timeout', {
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [meeting, initialized, logDyteDebug]);

  useEffect(() => {
    if (!meeting) return;

    const self = meeting.self as {
      roomJoined?: boolean;
      on?: (event: string, cb: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
    };

    const onRoomJoined = () => {
      logDyteDebug('roomJoined emitido', {
        joinedParticipants: meeting.participants.joined.size,
      });
    };

    const onRoomLeft = () => {
      logDyteDebug('roomLeft emitido');
    };

    const onParticipantJoined = (participant: unknown) => {
      const parsedParticipant = participant as { id?: string; name?: string };
      logDyteDebug('participantJoined emitido', {
        participantId: parsedParticipant.id || null,
        participantName: parsedParticipant.name || null,
        joinedParticipants: meeting.participants.joined.size,
      });
    };

    const onParticipantLeft = (participant: unknown) => {
      const parsedParticipant = participant as { id?: string; name?: string };
      logDyteDebug('participantLeft emitido', {
        participantId: parsedParticipant.id || null,
        participantName: parsedParticipant.name || null,
        joinedParticipants: meeting.participants.joined.size,
      });
    };

    self.on?.('roomJoined', onRoomJoined);
    self.on?.('roomLeft', onRoomLeft);
    meeting.participants.joined.on('participantJoined', onParticipantJoined);
    meeting.participants.joined.on('participantLeft', onParticipantLeft);

    logDyteDebug('listeners Dyte registrados', {
      initialJoinedParticipants: meeting.participants.joined.size,
      selfRoomJoined: Boolean(self.roomJoined),
    });

    return () => {
      self.removeListener?.('roomJoined', onRoomJoined);
      self.removeListener?.('roomLeft', onRoomLeft);
      meeting.participants.joined.removeListener('participantJoined', onParticipantJoined);
      meeting.participants.joined.removeListener('participantLeft', onParticipantLeft);
    };
  }, [meeting, logDyteDebug]);

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
      <div className="h-screen w-screen bg-black text-white relative">
        <CallLoadingState
          stage="connecting"
          message="Aguardando conexão..."
          onCancel={() => window.close()}
        />
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
