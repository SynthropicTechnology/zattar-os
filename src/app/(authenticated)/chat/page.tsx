import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatLayout } from '@/app/(authenticated)/chat';
import type { ChatItem } from '@/app/(authenticated)/chat';
import { createChatService } from '@/app/(authenticated)/chat/service';

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('usuarios')
    .select('id, nome_completo, nome_exibicao')
    .eq('auth_user_id', user.id)
    .single();

  return data;
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ channelId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/app/login');
  
  const usuarioId = user.id;
  const currentUserName = user.nome_exibicao || user.nome_completo || 'Usuário';

  // Criar instância do service
  const chatService = await createChatService();

  // Buscar lista de salas
  const salasResult = await chatService.listarSalasDoUsuario(usuarioId, { limite: 50 });
  if (salasResult.isErr()) {
    return <div>Erro ao carregar salas: {salasResult.error.message}</div>;
  }

  const salas = salasResult.value.data;

  // Determinar sala ativa (via URL ou Sala Geral)
  const params = await searchParams;
  const channelId = params.channelId ? parseInt(params.channelId) : null;
  let salaAtiva: ChatItem | null = null;
  
  if (channelId) {
    salaAtiva = salas.find((s) => s.id === channelId) || null;
  }

  if (!salaAtiva) {
    const salaGeralResult = await chatService.buscarSalaGeral();
    if (salaGeralResult.isOk() && salaGeralResult.value) {
      // Adaptar SalaChat para ChatItem
      const sg = salaGeralResult.value;
      salaAtiva = {
        ...sg,
        name: sg.nome,
        image: undefined, // Default icon
        tipo: sg.tipo
      } as ChatItem;
    } else if (salas.length > 0) {
      salaAtiva = salas[0];
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Suspense fallback={<Skeleton className="h-full w-full" />}>
        <ChatLayout 
          salas={salas} 
          currentUserId={usuarioId}
          currentUserName={currentUserName}
          initialSelectedChat={salaAtiva}
        />
      </Suspense>
    </div>
  );
}
