import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/supabase/database.types';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

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

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url, anonKey);
  }

  return browserClient;
}
