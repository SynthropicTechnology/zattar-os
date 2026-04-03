import { Suspense } from 'react';
import { AssistentesListWrapper, actionListarAssistentes, requireAuth } from '@/app/(authenticated)/assistentes/feature';
import { checkMultiplePermissions } from '@/lib/auth/authorization';
import { PageShell } from '@/components/shared/page-shell';
import { listDifyAppsAction } from '@/lib/dify/actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Assistentes | Sinesys',
  description: 'Gerencie os assistentes de IA do sistema.',
};

export default async function AssistentesPage() {
  const { userId } = await requireAuth(['assistentes:listar']);

  const [canCreate, canEdit, canDelete] = await Promise.all([
    checkMultiplePermissions(userId, [['assistentes', 'criar']], false),
    checkMultiplePermissions(userId, [['assistentes', 'editar']], false), // assuming editar exists or mapping to criar if not
    checkMultiplePermissions(userId, [['assistentes', 'deletar']], false),
  ]);

  // Fetch initial data (only active assistants)
  const result = await actionListarAssistentes();

  if (!result.success || !result.data) {
    // Handle error state gracefully
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar dados: {result.error}
      </div>
    );
  }

  const initialData = result.data;

  // Carregar mapa de tipos dos apps Dify para badges nos cards
  let difyAppTypes: Record<string, string> = {};
  try {
    const difyApps = await listDifyAppsAction();
    difyAppTypes = Object.fromEntries(
      difyApps.map(app => [app.id, app.app_type])
    );
  } catch {
    // Silently ignore - badges won't show but list still works
  }

  return (
    <PageShell>
      <Suspense fallback={<div>Carregando...</div>}>
        <AssistentesListWrapper
          initialData={initialData}
          difyAppTypes={difyAppTypes}
          permissions={{
            canCreate,
            canEdit,
            canDelete
          }}
        />
      </Suspense>
    </PageShell>
  );
}
