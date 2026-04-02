import { test as base, expect } from '@playwright/test';

// Mock Dyte Meeting object
export const mockDyteMeeting = {
  self: {
    id: 'test-user',
    name: 'Test User',
    audioEnabled: true,
    videoEnabled: true,
    enableAudio: async () => {},
    disableAudio: async () => {},
    enableVideo: async () => {},
    disableVideo: async () => {},
    addListener: () => {},
    removeListener: () => {},
  },
  participants: {
    active: new Map(),
    pinned: new Map(),
  }
};

type CallFixtures = {
  setupCall: (options?: { isInitiator?: boolean }) => Promise<void>;
};

export const test = base.extend<CallFixtures>({
  setupCall: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- 'use' is from Playwright, not React
    await use(async (_options = {}) => {
      // Navigate to chat
      await page.goto('/chat');
      
      // Mock APIs or user interactions to enter a call
      // For now, we assume we can interact with the UI directly
      // Or we can expose a test-only way to inject state
      
      // Note: Real Dyte SDK might need mocking or specific environment setup
      // Here we focus on UI interactions assuming the app handles the rest
    });
  },
});

export { expect };
