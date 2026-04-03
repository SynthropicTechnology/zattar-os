'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Settings } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/shared/page-shell';
import { Typography } from '@/components/ui/typography';
import { FilterPopover } from '@/app/(authenticated)/partes';

import {
  useUsuarios,
  UsuarioCreateDialog,
  CargosManagementDialog,
  UsuariosGridView,
} from '@/app/(authenticated)/usuarios';

// =============================================================================
// COMPONENT
// =============================================================================

export function UsuariosPageContent() {
  const router = useRouter();

  // Search state
  const [busca, setBusca] = React.useState('');

  // Filter state
  const [ativoFiltro, setAtivoFiltro] = React.useState('true');

  // Dialogs state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [cargosManagementOpen, setCargosManagementOpen] = React.useState(false);

  // Debounce search
  const buscaDebounced = useDebounce(busca, 500);

  // Build params for API
  const params = React.useMemo(() => ({
    busca: buscaDebounced || undefined,
    ativo: ativoFiltro === 'all' ? undefined : ativoFiltro === 'true',
  }), [buscaDebounced, ativoFiltro]);

  const { usuarios, isLoading, refetch } = useUsuarios(params);

  // Handlers
  const refetchRef = React.useRef(refetch);
  React.useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const handleCreateSuccess = React.useCallback(() => {
    refetchRef.current();
  }, []);

  const handleView = React.useCallback(
    (usuario: { id: number }) => {
      router.push(`/app/usuarios/${usuario.id}`);
    },
    [router]
  );

  return (
    <PageShell
      className="space-y-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Typography.H1 className="text-2xl font-bold tracking-tight font-heading">Equipe</Typography.H1>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            className="h-9"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Membro
          </Button>
        </div>
      </div>

      {/* Toolbar: Search + Filters + Settings */}
      <div className="flex items-center gap-2">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membro da equipe..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 w-full pl-9 bg-card"
          />
        </div>
        <FilterPopover
          label="Status"
          options={[
            { value: 'true', label: 'Ativos' },
            { value: 'false', label: 'Inativos' },
          ]}
          value={ativoFiltro}
          onValueChange={setAtivoFiltro}
          defaultValue="all"
        />
        <div className="ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-card"
                onClick={() => setCargosManagementOpen(true)}
                aria-label="Gerenciar cargos"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Gerenciar cargos</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Grid de Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : (
        <UsuariosGridView
          usuarios={usuarios}
          onView={handleView}
        />
      )}

      {/* Dialogs */}
      <CargosManagementDialog
        open={cargosManagementOpen}
        onOpenChange={setCargosManagementOpen}
      />
      {createOpen && (
        <UsuarioCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={handleCreateSuccess}
        />
      )}
    </PageShell>
  );
}
