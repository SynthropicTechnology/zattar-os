/**
 * Mock para Dyte Client
 * Usado em testes unitários para simular operações de chamadas de vídeo/áudio
 */
import { jest } from '@jest/globals';
import type { DyteMeetingDetails } from '@/app/app/chat';

// Mock default responses
export const mockMeetingId = 'meeting-123-abc';
export const mockAuthToken = 'token-xyz-789';

export const mockMeetingDetails: DyteMeetingDetails = {
  id: mockMeetingId,
  status: 'LIVE',
  participantCount: 2,
  startedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
  endedAt: undefined,
  duration: undefined,
};

export const mockRecordingDetails = {
  id: 'recording-123',
  status: 'UPLOADED',
  downloadUrl: 'https://dyte.example.com/recording.mp4',
  duration: 3600,
  size: 1024000,
};

type RecordingResponse = { success: boolean };
type TranscriptionPresetResponse = { presetId: string };

export const mockDyteClient = {
  createMeeting: jest.fn<() => Promise<string>>(),
  addParticipant: jest.fn<() => Promise<string>>(),
  getMeetingDetails: jest.fn<() => Promise<DyteMeetingDetails>>(),
  getActiveMeetings: jest.fn<() => Promise<never[]>>(),
  startRecording: jest.fn<() => Promise<RecordingResponse>>(),
  stopRecording: jest.fn<() => Promise<RecordingResponse>>(),
  getRecordingDetails: jest.fn<() => Promise<typeof mockRecordingDetails>>(),
  ensureTranscriptionPreset: jest.fn<() => Promise<TranscriptionPresetResponse>>(),
};

// Setup default mock implementations
export function setupDyteMocks() {
  mockDyteClient.createMeeting.mockResolvedValue(mockMeetingId);
  mockDyteClient.addParticipant.mockResolvedValue(mockAuthToken);
  mockDyteClient.getMeetingDetails.mockResolvedValue(mockMeetingDetails);
  mockDyteClient.getActiveMeetings.mockResolvedValue([]);
  mockDyteClient.startRecording.mockResolvedValue({ success: true });
  mockDyteClient.stopRecording.mockResolvedValue({ success: true });
  mockDyteClient.getRecordingDetails.mockResolvedValue(mockRecordingDetails);
  mockDyteClient.ensureTranscriptionPreset.mockResolvedValue({ presetId: 'preset-123' });
}

// Reset all mocks
export function resetDyteMocks() {
  Object.values(mockDyteClient).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
}

// Jest mock modules
jest.mock('@/lib/dyte/client', () => mockDyteClient);

// Mock Dyte Config
export const mockDyteConfig = {
  isDyteRecordingEnabled: jest.fn(() => true),
  isDyteTranscriptionEnabled: jest.fn(() => true),
  getDyteTranscriptionLanguage: jest.fn(() => 'pt-BR'),
};

jest.mock('@/lib/dyte/config', () => mockDyteConfig);

// Mock Dyte Utils
export const mockDyteUtils = {
  generateMeetingTitle: jest.fn((salaId: number, salaNome: string, tipo: string) =>
    `${salaNome} - ${tipo}`
  ),
};

jest.mock('@/lib/dyte/utils', () => mockDyteUtils);
