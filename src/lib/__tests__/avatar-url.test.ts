import { resolveAvatarUrl } from '@/lib/avatar-url';

describe('resolveAvatarUrl', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  });

  it('returns full URLs unchanged', () => {
    const url = 'https://example.supabase.co/storage/v1/object/public/avatar/25.jpg';

    expect(resolveAvatarUrl(url)).toBe(url);
  });

  it('resolves relative avatar filenames to the Supabase public bucket URL', () => {
    expect(resolveAvatarUrl('25.jpg')).toBe(
      'https://example.supabase.co/storage/v1/object/public/avatar/25.jpg'
    );
  });
});