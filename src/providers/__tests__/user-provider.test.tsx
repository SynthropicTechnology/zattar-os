import { render, waitFor } from '@testing-library/react';
import { UserProvider, useAuthSession } from '@/providers/user-provider';

const pushMock = jest.fn();
const refreshMock = jest.fn();
const signOutMock = jest.fn().mockResolvedValue({ error: null });
const getUserMock = jest.fn();
const getSessionMock = jest.fn();
const unsubscribeMock = jest.fn();
const onAuthStateChangeMock = jest.fn(() => ({
  data: {
    subscription: {
      unsubscribe: unsubscribeMock,
    },
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: refreshMock,
  }),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: signOutMock,
    },
  }),
}));

function Consumer() {
  const { isAuthenticated, isLoading } = useAuthSession();

  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="loading">{isLoading ? 'yes' : 'no'}</span>
    </div>
  );
}

describe('UserProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: 'stale-token',
        },
      },
      error: null,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    }) as jest.Mock;

    window.history.replaceState({}, '', '/app/processos');
  });

  it('forces logout when Supabase no longer returns an authenticated user', async () => {
    render(
      <UserProvider>
        <Consumer />
      </UserProvider>
    );

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    expect(pushMock).toHaveBeenCalledWith('/app/login');
    expect(refreshMock).toHaveBeenCalled();
  });
});