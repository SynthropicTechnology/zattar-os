import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './v2/client';
import * as service from './service';
import type { DashboardData } from './domain';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Dashboard',
    description: 'Dashboard personalizado com widgets configuráveis por módulo.',
  };
}

/**
 * Dashboard Page — Server Component
 *
 * OTIMIZAÇÃO: Pré-busca dados da dashboard server-side para eliminar o
 * waterfall client-side (antes: render shell → hydrate → useEffect → fetch).
 * Agora os dados já chegam no primeiro render.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUserId = 0;
  let currentUserName = 'Usuário';
  let initialData: DashboardData | null = null;

  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nome_exibicao, nome_completo, is_super_admin')
      .eq('auth_user_id', user.id)
      .single();

    if (usuario) {
      currentUserId = usuario.id;
      currentUserName = usuario.nome_exibicao || usuario.nome_completo || 'Usuário';

      // Pré-buscar dados da dashboard server-side (elimina waterfall)
      try {
        initialData = usuario.is_super_admin === true
          ? await service.obterDashboardAdmin(usuario.id)
          : await service.obterDashboardUsuario(usuario.id);
      } catch (error) {
        console.error('[Dashboard] Erro ao pré-buscar dados:', error);
        // Falha silenciosa — o client component fará o fetch via useEffect
      }
    }
  }

  return (
    <DashboardClient
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      initialData={initialData}
    />
  );
}
