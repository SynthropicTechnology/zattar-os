import { useEffect, useState, useMemo } from "react";
import type DyteClient from "@dytesdk/web-core";
import { debounce } from "lodash-es";

export interface NetworkQualityState {
  quality: "excellent" | "good" | "poor" | "unknown";
  score: number; // 0-5
  isMonitoring: boolean;
}

/**
 * Hook to monitor network quality during a call
 *
 * @param meeting - DyteClient instance
 * @returns Network quality state and score
 *
 * @example
 * ```tsx
 * const { quality, score } = useNetworkQuality(meeting);
 * ```
 */
export function useNetworkQuality(meeting?: DyteClient) {
  const [networkState, setNetworkState] = useState<NetworkQualityState>({
    quality: "unknown",
    score: -1,
    isMonitoring: false,
  });

  const debouncedQualityUpdate = useMemo(
    () =>
      debounce((score: number) => {
        let quality: NetworkQualityState["quality"] = "unknown";

        if (score >= 4) quality = "excellent";
        else if (score >= 2) quality = "good";
        else if (score >= 0) quality = "poor";

        setNetworkState((prev) => ({
          ...prev,
          quality,
          score,
        }));
      }, 500),
    []
  );

  useEffect(() => {
    if (!meeting?.self) return;

    // Use setTimeout to avoid calling setState synchronously in effect
    setTimeout(() => {
      setNetworkState((prev) => ({ ...prev, isMonitoring: true }));
    }, 0);

    // Initial check
    // @ts-expect-error - Property missing in types
    const initialScore = meeting.self.networkQuality?.score ?? -1;
    debouncedQualityUpdate(initialScore);

    const handleNetworkUpdate = ({ score }: { score: number }) => {
      debouncedQualityUpdate(score);
    };

    // Em alguns cenários (mocks/testes), o objeto pode não expor os métodos de eventos.
    // Nesses casos, não registramos listeners para evitar crash.
    const selfWithListeners = meeting.self as { addListener?: (event: string, handler: (data: { score: number }) => void) => void; removeListener?: (event: string, handler: (data: { score: number }) => void) => void };
    if (typeof selfWithListeners.addListener !== "function") {
      return () => {
        debouncedQualityUpdate.cancel();
        setNetworkState((prev) => ({ ...prev, isMonitoring: false }));
      };
    }

    // Dyte emits 'networkQualityUpdate' on self
    // @ts-expect-error - Event name missing in types
    meeting.self.addListener("networkQualityUpdate", handleNetworkUpdate);

    return () => {
      if (typeof selfWithListeners.removeListener === "function") {
        // @ts-expect-error - Event name missing in types
        meeting.self.removeListener("networkQualityUpdate", handleNetworkUpdate);
      }
      debouncedQualityUpdate.cancel();
      setNetworkState((prev) => ({ ...prev, isMonitoring: false }));
    };
  }, [meeting, debouncedQualityUpdate]);

  return networkState;
}
