"use client";

import { useState } from "react";
import { useDyteSelector } from "@dytesdk/react-web-core";
import { CustomVideoGrid } from "./custom-video-grid";
import { CustomAudioGrid } from "./custom-audio-grid";
import { CustomCallControls } from "./custom-call-controls";
import { CustomParticipantList } from "./custom-participant-list";
import { LayoutSwitcher, LayoutType } from "./layout-switcher";
import { MeetingErrorBoundary } from "./meeting-error-boundary";
import { MeetingSkeleton } from "./meeting-skeleton";
import { MeetingThemeProvider } from "./meeting-theme-provider";
import { ScreenshareBanner } from "./screenshare-banner";
import { LiveTranscriptPanel } from "./live-transcript-panel";
import { RecordingConsentDialog } from "./recording-consent-dialog";
import { useResponsiveLayout } from "../hooks/use-responsive-layout";
import { useNetworkQuality } from "../hooks/use-network-quality";
import { useCallKeyboardShortcuts } from "../hooks/use-call-keyboard-shortcuts";
import { useVideoEffects } from "../hooks/use-video-effects";
import { KeyboardShortcutsHelp } from "./keyboard-shortcuts-help";
import "./custom-meeting-styles.css";
import type DyteClient from "@dytesdk/web-core";

import { type TranscriptSegment } from "../hooks/use-transcription";
import { useLocalStorage } from "@/hooks/use-local-storage";


interface DyteParticipant {
  id: string;
  name?: string;
}

interface CustomMeetingUIProps {
  meeting: DyteClient | null;
  onLeave: () => void;
  chamadaId?: number;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isScreensharing: boolean;
  screenShareParticipant: string | null;
  onStartScreenshare: () => void;
  onStopScreenshare: () => void;
  transcripts: TranscriptSegment[];
  showTranscript: boolean;
  onToggleTranscript: () => void;
  audioOnly?: boolean;
  canRecord?: boolean;
}

export function CustomMeetingUI({
  meeting,
  onLeave,
  chamadaId: _chamadaId,
  isRecording,
  onStartRecording,
  onStopRecording,
  isScreensharing,
  screenShareParticipant,
  onStartScreenshare,
  onStopScreenshare,
  transcripts,
  showTranscript,
  onToggleTranscript,
  audioOnly = false,
  canRecord = false,
}: CustomMeetingUIProps) {
  const [layout, setLayout] = useLocalStorage<LayoutType>('call-layout-pref', 'grid');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  // Use Dyte selector to get participant count for responsive logic
  // Check if participants.active already includes self, otherwise add 1
  const activeParticipants = useDyteSelector((m) => m.participants.active);
  const selfId = useDyteSelector((m) => m.self.id);
  const participantCount = activeParticipants.has(selfId)
    ? activeParticipants.size
    : activeParticipants.size + 1;
  const { showSidebar: shouldShowSidebarDesktop } = useResponsiveLayout(participantCount);
  const { quality, score } = useNetworkQuality(meeting ?? undefined);

  const { activeEffect, applyEffect } = useVideoEffects(meeting ?? undefined);

  const { showHelp, setShowHelp } = useCallKeyboardShortcuts({
    // @ts-expect-error - Methods missing in types
    onToggleMic: () => meeting?.self.toggleAudio(),
    // @ts-expect-error - Methods missing in types
    onToggleVideo: () => meeting?.self.toggleVideo(),
    onToggleScreenshare: () => isScreensharing ? onStopScreenshare() : onStartScreenshare(),
    onToggleRecording: () => handleStartRecordingRequest(),
    onToggleTranscript: onToggleTranscript,
    onToggleParticipants: () => setShowParticipants(prev => !prev),
    onLeave: onLeave
  });

  // Derive sidebar visibility based on screen size
  const effectiveShowParticipants = shouldShowSidebarDesktop || showParticipants;

  const handleStartRecordingRequest = () => {
    if (!meeting) return;

    // Filter out self from active participants to avoid double counting
    const otherParticipants = Array.from(meeting.participants.active.values() as Iterable<DyteParticipant>)
      .filter((p) => p.id !== meeting.self.id)
      .map((p) => p.name);

    const participantNames = [meeting.self.name, ...otherParticipants].filter((n): n is string => !!n);

    if (participantNames.length === 1) {
      onStartRecording();
    } else {
      setShowConsentDialog(true);
    }
  };

  if (!meeting) return <MeetingSkeleton />;

  return (
    <MeetingErrorBoundary>
      <MeetingThemeProvider>
        <div className="relative w-full h-full bg-gray-950 overflow-hidden flex flex-col font-sans text-white">

          <RecordingConsentDialog
            open={showConsentDialog}
            onOpenChange={setShowConsentDialog}
            onConsent={onStartRecording}
            participantNames={
              meeting
                ? [
                  meeting.self.name,
                  ...Array.from(meeting.participants.active.values() as Iterable<DyteParticipant>)
                    .filter((p) => p.id !== meeting.self.id)
                    .map((p) => p.name)
                ].filter((n): n is string => !!n)
                : []
            }
          />

          <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />

          {/* Top Bar / Layout Switcher */}
          {!audioOnly && (
            <LayoutSwitcher currentLayout={layout} onLayoutChange={setLayout} />
          )}

          {/* Screenshare Banner */}
          <ScreenshareBanner
            isScreensharing={isScreensharing}
            participantName={screenShareParticipant}
            onStop={onStopScreenshare}
            isSelf={meeting?.self?.id === screenShareParticipant || isScreensharing} // Logic might need adjustment depending on how screenShareParticipant is passed (id vs name)
          />

          {/* Main Content Area */}
          <div className="flex-1 relative flex overflow-hidden">
            {/* Video/Audio Grid */}
            <div className="flex-1 relative">
              {audioOnly ? (
                <CustomAudioGrid />
              ) : (
                <CustomVideoGrid
                  layout={layout}
                />
              )}
            </div>

            {/* Sidebars (Participants / Transcript) */}
            {(effectiveShowParticipants || showTranscript) && (
              <div className="hidden md:flex flex-col w-80 h-full border-l border-gray-800 bg-gray-900/50 backdrop-blur-sm relative z-20">
                {effectiveShowParticipants && !showTranscript && (
                  <CustomParticipantList
                    isVisible={true}
                    className="static w-full h-full border-none shadow-none bg-transparent"
                  />
                )}

                {showTranscript && (
                  <LiveTranscriptPanel
                    transcripts={transcripts}
                    isVisible={true}
                    onClose={onToggleTranscript}
                  // Assuming LiveTranscriptPanel handles its own styling or fits here
                  />
                )}
              </div>
            )}

            {/* Mobile/Overlay Participant List */}
            <CustomParticipantList
              isVisible={showParticipants && !shouldShowSidebarDesktop}
              className="md:hidden"
            />
          </div>

          {/* Bottom Controls */}
          <CustomCallControls
            meeting={meeting}
            onLeave={onLeave}
            isRecording={isRecording}
            onStartRecording={handleStartRecordingRequest}
            onStopRecording={onStopRecording}
            isScreensharing={isScreensharing}
            onStartScreenshare={onStartScreenshare}
            onStopScreenshare={onStopScreenshare}
            showTranscript={showTranscript}
            onToggleTranscript={onToggleTranscript}
            showParticipants={showParticipants}
            onToggleParticipants={() => setShowParticipants(!showParticipants)}
            canRecord={canRecord}
            networkQuality={quality}
            networkScore={score}
            activeEffect={activeEffect}
            onApplyEffect={applyEffect}
          />
        </div>
      </MeetingThemeProvider>
    </MeetingErrorBoundary>
  );
}