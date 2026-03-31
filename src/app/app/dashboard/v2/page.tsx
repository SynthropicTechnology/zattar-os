import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Dashboard',
    description: 'Dashboard personalizado com widgets configuráveis por módulo.',
  };
}

export default async function DashboardV2Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUserId = 0;
  let currentUserName = 'Usuário';

  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nome_exibicao, nome_completo')
      .eq('auth_user_id', user.id)
      .single();

    if (usuario) {
      currentUserId = usuario.id;
      currentUserName = usuario.nome_exibicao || usuario.nome_completo || 'Usuário';
    }
  }

  return (
    <DashboardClient
      currentUserId={currentUserId}
      currentUserName={currentUserName}
    />
  );
}
