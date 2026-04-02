import { useState, useCallback, useEffect } from "react";
import type DyteClient from "@dytesdk/web-core";
import type { DyteParticipant } from "@dytesdk/web-core";

interface UseScreenshareReturn {
  isScreensharing: boolean;
  isLoading: boolean;
  error: string | null;
  canScreenshare: boolean;
  startScreenshare: () => Promise<void>;
  stopScreenshare: () => Promise<void>;
  screenShareParticipant: string | null;
}

export const useScreenshare = (meeting?: DyteClient): UseScreenshareReturn => {
  const [isScreensharing, setIsScreensharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenShareParticipant, setScreenShareParticipant] = useState<
    string | null
  >(null);

  // Check if browser supports screen sharing
  const canScreenshare =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    !!navigator.mediaDevices.getDisplayMedia;

  // Monitor local screen share state
  useEffect(() => {
    if (!meeting) return;

    const handleSelfScreenShareUpdate = ({
      screenShareEnabled,
    }: {
      screenShareEnabled: boolean;
    }) => {
      setIsScreensharing(screenShareEnabled);
      setIsLoading(false);
    };

    meeting.self.on("screenShareUpdate", handleSelfScreenShareUpdate);

    // Initial state check
    if (meeting.self.screenShareEnabled) {
      setIsScreensharing(true);
    }

    return () => {
      meeting.self.removeListener(
        "screenShareUpdate",
        handleSelfScreenShareUpdate
      );
    };
  }, [meeting]);

  // Monitor remote participants screen share
  useEffect(() => {
    if (!meeting) return;

    // Helper to update state based on a participant's screen share status
    const updateScreenShareState = (participantValues: DyteParticipant[]) => {
      const sharer = participantValues.find((p) => p.screenShareEnabled);
      setScreenShareParticipant(sharer?.name || null);
    };

    // Check existing participants
    updateScreenShareState(meeting.participants.joined.toArray());

    // For this specific codebase, it seems we were attaching listeners to each participant.
    // The previous error was: "Argument of type '...' is not assignable to parameter of type '...'"
    // This usually means the callback signature doesn't match what .on() expects.
    // Let's use 'any' for the callback payload to bypass the strict check while keeping logic sound.

    const activeParticipants = meeting.participants.joined.toArray();
    const listeners = new Map<string, (data: unknown) => void>();

    const attachListener = (p: DyteParticipant) => {
      const listener = (data: unknown) => {
        const isEnabled =
          typeof data === "object" &&
          data !== null &&
          "screenShareEnabled" in data
            ? (data as { screenShareEnabled: boolean }).screenShareEnabled
            : data === true;

        if (isEnabled) {
          setScreenShareParticipant(p.name);
        } else if (screenShareParticipant === p.name) {
          setScreenShareParticipant(null);
        }
      };
      p.on("screenShareUpdate", listener);
      listeners.set(p.id, listener);
    };

    activeParticipants.forEach(attachListener);

    const onParticipantJoined = (p: DyteParticipant) => {
      attachListener(p);
    };

    const onParticipantLeft = (p: DyteParticipant) => {
      if (screenShareParticipant === p.name) {
        setScreenShareParticipant(null);
      }
      const listener = listeners.get(p.id);
      if (listener) {
        p.removeListener("screenShareUpdate", listener);
        listeners.delete(p.id);
      }
    };

    meeting.participants.joined.on("participantJoined", onParticipantJoined);
    meeting.participants.joined.on("participantLeft", onParticipantLeft);

    return () => {
      meeting.participants.joined.removeListener(
        "participantJoined",
        onParticipantJoined
      );
      meeting.participants.joined.removeListener(
        "participantLeft",
        onParticipantLeft
      );

      meeting.participants.joined.toArray().forEach((p: DyteParticipant) => {
        const listener = listeners.get(p.id);
        if (listener) {
          p.removeListener("screenShareUpdate", listener);
        }
      });
    };
  }, [meeting, screenShareParticipant]);

  const startScreenshare = useCallback(async () => {
    if (!meeting || !canScreenshare) return;

    setIsLoading(true);
    setError(null);

    try {
      await meeting.self.enableScreenShare();
    } catch (err: unknown) {
      console.error("Error starting screen share:", err);
      setIsLoading(false);

      const error = err as { name?: string; message?: string };
      if (
        error.name === "NotAllowedError" ||
        error.message?.includes("Permission denied")
      ) {
        setError("Permissão para compartilhar tela foi negada.");
      } else if (error.name === "NotSupportedError") {
        setError("Seu navegador não suporta compartilhamento de tela.");
      } else {
        setError("Erro ao iniciar compartilhamento de tela.");
      }
    }
  }, [meeting, canScreenshare]);

  const stopScreenshare = useCallback(async () => {
    if (!meeting) return;

    setIsLoading(true);
    try {
      await meeting.self.disableScreenShare();
    } catch (err) {
      console.error("Error stopping screen share:", err);
      setError("Erro ao parar compartilhamento de tela.");
    } finally {
      setIsLoading(false);
    }
  }, [meeting]);

  return {
    isScreensharing,
    isLoading,
    error,
    canScreenshare,
    startScreenshare,
    stopScreenshare,
    screenShareParticipant,
  };
};
