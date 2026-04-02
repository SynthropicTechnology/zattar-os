import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomMeetingUI } from '../../components/custom-meeting-ui';
import { useDyteSelector } from '@dytesdk/react-web-core';

// Mock hooks
jest.mock('@dytesdk/react-web-core', () => ({
  useDyteSelector: jest.fn(),
}));

jest.mock('../../hooks/use-responsive-layout', () => ({
  useResponsiveLayout: jest.fn(() => ({
    columns: 1,
    showSidebar: true,
    controlSize: 'md',
    gridClasses: 'grid-cols-1'
  })),
}));

jest.mock('../../hooks/use-network-quality', () => ({
  useNetworkQuality: jest.fn(() => ({
    quality: 'good',
    score: 100,
  })),
}));

jest.mock('@/hooks/use-local-storage', () => ({
  useLocalStorage: jest.fn((key: string, defaultValue: unknown) => [defaultValue, jest.fn()]),
}));

jest.mock('../../hooks/use-video-effects', () => ({
  useVideoEffects: jest.fn(() => ({
    activeEffect: null,
    applyEffect: jest.fn(),
  })),
}));

jest.mock('../../hooks/use-call-keyboard-shortcuts', () => ({
  useCallKeyboardShortcuts: jest.fn(() => ({
    showHelp: false,
    setShowHelp: jest.fn(),
  })),
}));

// Mock child components to avoid deep rendering issues and Dyte internals
jest.mock('../../components/custom-video-grid', () => ({
  CustomVideoGrid: () => <div data-testid="custom-video-grid">Video Grid</div>
}));

jest.mock('../../components/custom-audio-grid', () => ({
  CustomAudioGrid: () => <div data-testid="custom-audio-grid">Audio Grid</div>
}));

jest.mock('../../components/layout-switcher', () => ({
  LayoutSwitcher: () => <div data-testid="layout-switcher">Layout</div>
}));

jest.mock('../../components/meeting-error-boundary', () => ({
  MeetingErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

jest.mock('../../components/meeting-skeleton', () => ({
  MeetingSkeleton: () => <div data-testid="meeting-skeleton">Loading</div>
}));

jest.mock('../../components/meeting-theme-provider', () => ({
  MeetingThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

jest.mock('../../components/live-transcript-panel', () => ({
  LiveTranscriptPanel: () => <div data-testid="live-transcript">Transcript</div>
}));

jest.mock('../../components/keyboard-shortcuts-help', () => ({
  KeyboardShortcutsHelp: () => null
}));

jest.mock('../../components/custom-call-controls', () => ({
  CustomCallControls: ({ onLeave, onStartRecording }) => (
    <div data-testid="custom-call-controls">
      <button onClick={onLeave}>Leave</button>
      <button onClick={onStartRecording}>Record</button>
    </div>
  )
}));

jest.mock('../../components/custom-participant-list', () => ({
  CustomParticipantList: () => <div data-testid="custom-participant-list">Participant List</div>
}));

jest.mock('../../components/screenshare-banner', () => ({
  ScreenshareBanner: () => <div data-testid="screenshare-banner">Banner</div>
}));

jest.mock('../../components/recording-consent-dialog', () => ({
    RecordingConsentDialog: ({ open, onConsent }) => open ? (
        <div data-testid="recording-consent-dialog">
            <button onClick={onConsent}>Confirm Record</button>
        </div>
    ) : null
}));

describe('CustomMeetingUI', () => {
  const mockMeeting = {
    self: { name: 'Me', id: '1' },
    participants: {
        joined: { values: () => [] }
    }
  };
  const mockOnLeave = jest.fn();
  const mockOnStartRecording = jest.fn();
  const mockOnStopRecording = jest.fn();
  const mockOnStartScreenshare = jest.fn();
  const mockOnStopScreenshare = jest.fn();
  const mockOnToggleTranscript = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const mockJoinedParticipants = {
      size: 0,
      has: jest.fn(() => false),
      toArray: jest.fn(() => []),
      values: jest.fn(() => [].values())
    };
    // Mock useDyteSelector - use the selector function against a fake meeting object
    const fakeMeeting = {
      participants: { joined: mockJoinedParticipants },
      self: { id: 'mock-self-id' },
    };
    (useDyteSelector as jest.Mock).mockImplementation(
      (selector: (m: typeof fakeMeeting) => unknown) => selector(fakeMeeting)
    );
  });

  const defaultProps = {
    meeting: mockMeeting,
    onLeave: mockOnLeave,
    isRecording: false,
    onStartRecording: mockOnStartRecording,
    onStopRecording: mockOnStopRecording,
    isScreensharing: false,
    screenShareParticipant: null,
    onStartScreenshare: mockOnStartScreenshare,
    onStopScreenshare: mockOnStopScreenshare,
    transcripts: [],
    showTranscript: false,
    onToggleTranscript: mockOnToggleTranscript,
  };

  it('renders correctly', () => {
    render(<CustomMeetingUI {...defaultProps} />);
    
    expect(screen.getByTestId('custom-video-grid')).toBeInTheDocument();
    expect(screen.getByTestId('custom-call-controls')).toBeInTheDocument();
  });

  it('handles leave action', () => {
    render(<CustomMeetingUI {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Leave'));
    expect(mockOnLeave).toHaveBeenCalled();
  });

  it('handles recording consent flow', () => {
    // If single participant, it should call start directly (mocked logic in component)
    // But we mocked CustomCallControls to call onStartRecording directly.
    // The component wraps this call.
    
    render(<CustomMeetingUI {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Record'));
    // Since mockMeeting has 0 active participants + self = 1.
    // Logic: if count == 1, start immediately.
    expect(mockOnStartRecording).toHaveBeenCalled();
  });
});
