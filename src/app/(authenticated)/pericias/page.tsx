import { PericiasClient } from '@/app/(authenticated)/pericias/components/pericias-client';

export const dynamic = 'force-dynamic';

/**
 * Página raiz de Perícias
 * Renderiza visualização unificada baseada no Neon Magistrate.
 */
export default function PericiasPage() {
  return <PericiasClient />;
}


