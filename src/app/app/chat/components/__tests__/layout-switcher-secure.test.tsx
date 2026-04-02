import { webcrypto } from 'crypto';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

import { LayoutSwitcher } from '../layout-switcher';

jest.mock('@/providers/user-provider', () => ({
  useAuthSession: () => ({
    user: { id: 'test-user-123' },
    isLoading: false,
    isAuthenticated: true,
    sessionToken: 'test-token',
    logout: jest.fn(),
  }),
  useUser: () => null,
  usePermissoes: () => ({ temPermissao: jest.fn(() => true), permissoes: [] }),
}));

function createLocalStorageMock(initial?: Record<string, string>) {
  const store = new Map<string, string>(Object.entries(initial ?? {}));

  return {
    getItem: jest.fn((k: string) => (store.has(k) ? store.get(k)! : null)),
    setItem: jest.fn((k: string, v: string) => {
      store.set(k, v);
    }),
    removeItem: jest.fn((k: string) => {
      store.delete(k);
    }),
    clear: jest.fn(() => store.clear()),
    key: jest.fn((i: number) => Array.from(store.keys())[i] ?? null),
    get length() {
      return store.size;
    },
  };
}

describe('LayoutSwitcher secure storage', () => {
  beforeAll(() => {
    const real = webcrypto as unknown as Crypto;
    const mockCrypto = {
      subtle: {
        importKey: jest.fn(real.subtle.importKey.bind(real.subtle)),
        deriveKey: jest.fn(real.subtle.deriveKey.bind(real.subtle)),
        encrypt: jest.fn(real.subtle.encrypt.bind(real.subtle)),
        decrypt: jest.fn(real.subtle.decrypt.bind(real.subtle)),
      },
      getRandomValues: jest.fn(real.getRandomValues.bind(real)),
    } as unknown as Crypto;

    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      configurable: true,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock(),
      writable: true,
      configurable: true,
    });
  });

  it('saves layout preference encrypted', async () => {
    const onLayoutChange = jest.fn();

    render(
      <LayoutSwitcher currentLayout="grid" onLayoutChange={onLayoutChange} />
    );

    const allButtons = document.querySelectorAll('button');
    expect(allButtons.length).toBeGreaterThanOrEqual(3);
    // Click Spotlight button (second)
    fireEvent.click(allButtons[1]!);

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    const lastCall = (window.localStorage.setItem as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('call-layout');
    expect(String(lastCall?.[1] ?? '')).toMatch(/^enc:/);
  });

  it('migrates plaintext preference and applies it', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock({ 'call-layout': 'sidebar' }),
      writable: true,
      configurable: true,
    });

    const onLayoutChange = jest.fn();

    render(<LayoutSwitcher currentLayout="grid" onLayoutChange={onLayoutChange} />);

    await waitFor(() => {
      expect(onLayoutChange).toHaveBeenCalledWith('sidebar');
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    const lastCall = (window.localStorage.setItem as jest.Mock).mock.calls.at(-1);
    expect(String(lastCall?.[1] ?? '')).toMatch(/^enc:/);
  });
});
