import { NotificacoesList } from "@/app/(authenticated)/notificacoes";

export const dynamic = "force-dynamic";

/**
 * Página de listagem de todas as notificações do usuário
 */
export default function NotificacoesPage() {
  return <NotificacoesList />;
}

