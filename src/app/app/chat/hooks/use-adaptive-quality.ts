import { useEffect, useRef, useState } from "react";
import type DyteClient from "@dytesdk/web-core";
import { toast } from "sonner";
import { useNetworkQuality } from "./use-network-quality";

interface AdaptiveQualityConfig {
  autoSwitch?: boolean;
  threshold?: number; // Score 0-5. Default 2 (Poor)
  duration?: number; // Seconds to wait before action. Default 10
}

interface AdaptiveQualityState {
  suggestion: "none" | "disable-video" | "enable-video";
  isVideoDisabledByAdaptive: boolean;
  audioOnlyMode: boolean; // Alias for isVideoDisabledByAdaptive for clearer UI consumption
}

/**
 * Hook to adapt call quality based on network conditions
 *
 * @param meeting - DyteClient instance
 * @param config - Configuration options
 *
 * @example
 * ```tsx
 * const { suggestion, applySuggestion, audioOnlyMode } = useAdaptiveQuality(meeting);
 * ```
 */
export function useAdaptiveQuality(
  meeting: DyteClient | undefined,
  config: AdaptiveQualityConfig = {}
) {
  const { autoSwitch = false, threshold = 2, duration = 10 } = config;

  const { score } = useNetworkQuality(meeting);
  const [isVideoDisabledByAdaptive, setIsVideoDisabledByAdaptive] =
    useState(false);
  const [suggestion, setSuggestion] =
    useState<AdaptiveQualityState["suggestion"]>("none");

  const poorConnectionTimer = useRef<NodeJS.Timeout | null>(null);
  const goodConnectionTimer = useRef<NodeJS.Timeout | null>(null);
  const toastIdRef = useRef<string | number | null>(null);

  const applySuggestion = async () => {
    if (!meeting?.self) return;

    if (suggestion === "disable-video") {
      await meeting.self.disableVideo();
      setIsVideoDisabledByAdaptive(true);
      setSuggestion("none");
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
    } else if (suggestion === "enable-video") {
      await meeting.self.enableVideo();
      setIsVideoDisabledByAdaptive(false);
      setSuggestion("none");
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
    }
  };

  useEffect(() => {
    if (!meeting?.self) return;

    const isVideoEnabled = meeting.self.videoEnabled;

    // Detect poor connection
    if (score !== -1 && score < threshold && isVideoEnabled) {
      // Clear good connection timer
      if (goodConnectionTimer.current) {
        clearTimeout(goodConnectionTimer.current);
        goodConnectionTimer.current = null;
      }

      if (!poorConnectionTimer.current) {
        poorConnectionTimer.current = setTimeout(() => {
          if (autoSwitch) {
            meeting.self.disableVideo();
            setIsVideoDisabledByAdaptive(true);
            toast.warning("Vídeo desativado automaticamente", {
              description: "Conexão instável detectada. Modo áudio ativado.",
              duration: 5000,
            });
          } else {
            setSuggestion("disable-video");
            toastIdRef.current = toast.warning("Conexão lenta detectada", {
              description:
                "Desativar vídeo pode melhorar a qualidade do áudio.",
              action: {
                label: "Desativar Vídeo",
                onClick: async () => {
                  await meeting.self.disableVideo();
                  setIsVideoDisabledByAdaptive(true);
                  setSuggestion("none");
                },
              },
              duration: 10000,
              onDismiss: () => setSuggestion("none"),
            });
          }
        }, duration * 1000);
      }
    }
    // Detect good connection recovery
    else if (score >= 3 && isVideoDisabledByAdaptive && !isVideoEnabled) {
      // Clear poor connection timer
      if (poorConnectionTimer.current) {
        clearTimeout(poorConnectionTimer.current);
        poorConnectionTimer.current = null;
      }

      if (!goodConnectionTimer.current) {
        goodConnectionTimer.current = setTimeout(() => {
          setSuggestion("enable-video");
          toastIdRef.current = toast.info("Conexão estabilizada", {
            description: "Sua conexão melhorou. Deseja reativar o vídeo?",
            action: {
              label: "Reativar Vídeo",
              onClick: async () => {
                await meeting.self.enableVideo();
                setIsVideoDisabledByAdaptive(false);
                setSuggestion("none");
              },
            },
            duration: 8000,
            onDismiss: () => setSuggestion("none"),
          });
        }, duration * 1000);
      }
    }
    // Reset timers if conditions not met
    else {
      if (poorConnectionTimer.current) {
        clearTimeout(poorConnectionTimer.current);
        poorConnectionTimer.current = null;
      }
      if (goodConnectionTimer.current) {
        clearTimeout(goodConnectionTimer.current);
        goodConnectionTimer.current = null;
      }
      // If user manually toggles video, reset our tracking flag
      // Use setTimeout to avoid calling setState synchronously in effect
      if (isVideoEnabled && isVideoDisabledByAdaptive) {
        setTimeout(() => setIsVideoDisabledByAdaptive(false), 0);
      }
    }

    return () => {
      if (poorConnectionTimer.current)
        clearTimeout(poorConnectionTimer.current);
      if (goodConnectionTimer.current)
        clearTimeout(goodConnectionTimer.current);
    };
  }, [
    meeting,
    score,
    threshold,
    duration,
    autoSwitch,
    isVideoDisabledByAdaptive,
  ]);

  return {
    suggestion,
    applySuggestion,
    audioOnlyMode: isVideoDisabledByAdaptive,
  };
}
