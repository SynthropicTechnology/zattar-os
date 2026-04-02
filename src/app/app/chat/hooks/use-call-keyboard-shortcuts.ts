import { useEffect, useState } from "react";

interface UseCallKeyboardShortcutsProps {
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenshare: () => void;
  onToggleRecording: () => void;
  onToggleTranscript: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
}

export function useCallKeyboardShortcuts({
  onToggleMic,
  onToggleVideo,
  onToggleScreenshare,
  onToggleRecording,
  onToggleTranscript,
  onToggleParticipants,
  onLeave,
}: UseCallKeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input/textarea is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Map actions
      if (key === "m" || (ctrl && key === "d")) {
        e.preventDefault();
        onToggleMic();
      } else if (key === "v" || (ctrl && key === "e")) {
        e.preventDefault();
        onToggleVideo();
      } else if (key === "s" || (ctrl && shift && key === "s")) {
        e.preventDefault();
        onToggleScreenshare();
      } else if (key === "r" || (ctrl && shift && key === "r")) {
        e.preventDefault();
        onToggleRecording();
      } else if (key === "t" || (ctrl && shift && key === "t")) {
        e.preventDefault();
        onToggleTranscript();
      } else if (key === "p" || (ctrl && shift && key === "p")) {
        e.preventDefault();
        onToggleParticipants();
      } else if (key === "escape") {
        // Only if help is closed, otherwise help handles escape
        if (!showHelp) {
          // Optional: confirm before leaving?
          // For now just trigger onLeave which should probably ask confirmation or just leave
          onLeave();
        }
      } else if (key === "?" || (ctrl && key === "/")) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onToggleMic,
    onToggleVideo,
    onToggleScreenshare,
    onToggleRecording,
    onToggleTranscript,
    onToggleParticipants,
    onLeave,
    showHelp,
  ]);

  return { showHelp, setShowHelp };
}
