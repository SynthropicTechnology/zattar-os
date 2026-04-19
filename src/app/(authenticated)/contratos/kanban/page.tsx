/**
 * Página Kanban de Contratos (Server Component)
 *
 * Mantida para preservar deep-link a `/app/contratos/kanban`. Agora delega
 * ao mesmo `ContratosContent` usado em `/app/contratos`, apenas abrindo
 * inicialmente com a view Kanban.
 */

import type { Metadata } from 'next';
import { ContratosContent } from '../components/contratos-content';

export const metadata: Metadata = {
  title: 'Contratos · Kanban',
  description: 'Quadro Kanban de contratos organizado por estágio do pipeline.',
};

export default function ContratosKanbanPage() {
  return <ContratosContent initialView="kanban" />;
}
