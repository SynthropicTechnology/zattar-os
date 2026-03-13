import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase/client';

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}));

describe('supabase browser client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY = 'anon-key';
  });

  it('reuses the same browser client instance', () => {
    const mockClient = { auth: {} };
    (createBrowserClient as jest.Mock).mockReturnValue(mockClient);

    const firstClient = createClient();
    const secondClient = createClient();

    expect(firstClient).toBe(mockClient);
    expect(secondClient).toBe(mockClient);
    expect(createBrowserClient).toHaveBeenCalledTimes(1);
    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key'
    );
  });
});