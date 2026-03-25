import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/supabase/database.types';

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

const SUPABASE_BROWSER_CLIENT_KEY = '__zattar_supabase_browser_client__';

type GlobalWithSupabaseClient = typeof globalThis & {
  [SUPABASE_BROWSER_CLIENT_KEY]?: BrowserSupabaseClient;
};

let browserClient: BrowserSupabaseClient | undefined;

function getGlobalBrowserClient() {
  return (globalThis as GlobalWithSupabaseClient)[SUPABASE_BROWSER_CLIENT_KEY];
}

function setGlobalBrowserClient(client: BrowserSupabaseClient) {
  (globalThis as GlobalWithSupabaseClient)[SUPABASE_BROWSER_CLIENT_KEY] = client;
}

/**
 * Cliente Supabase para Client Components / browser.
 *
 * Regra: prefira importar daqui ao invés de `@/lib/client` (legado).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL e Anon Key são obrigatórios. ' +
      'Verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY.'
    );
  }

  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(url, anonKey);
  }

  const globalBrowserClient = getGlobalBrowserClient();
  if (globalBrowserClient) {
    browserClient = globalBrowserClient;
    return globalBrowserClient;
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url, anonKey);
    setGlobalBrowserClient(browserClient);
  }

  return browserClient;
}
