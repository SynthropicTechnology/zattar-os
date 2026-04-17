'use client';

/**
 * ContratosContent — Orquestrador Glass Briefing da página de contratos.
 * ============================================================================
 * Segue o mesmo vocabulário visual de `AudienciasClient` e `ExpedientesContent`:
 *
 *   Header → PulseStrip → InsightBanners → PipelineStepper
 *          → [ContratosFilterBar · SearchInput · ViewToggle]
 *          → ContratosTableWrapper (sem toolbar interno)
 *
 * Gerencia estado de filtros, busca, view mode e redireciona para /kanban.
 * O wrapper de tabela recebe filtros/busca via props controladas.
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, List, Kanban, Settings } from 'lucide-react';
import { Heading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  actionContratosPulseStats,
  type ContratosPulseStats,
} from '../actions/contratos-actions';
import { ContratosPulseStrip } from './contratos-pulse-strip';
import { ContratosPipelineStepper } from './contratos-pipeline-stepper';
import { ContratosTableWrapper } from './contratos-table-wrapper';
import { ContratosFilterBar, type ContratosFilters } from './contratos-filter-bar';

// ─── Constants ──────────────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'lista', icon: List, label: 'Lista' },
  { id: 'kanban', icon: Kanban, label: 'Kanban' },
];

type ViewMode = 'lista' | 'kanban';

// ─── Component ──────────────────────────────────────────────────────────────

export function ContratosContent() {
  const router = useRouter();

  const [stats, setStats] = React.useState<ContratosPulseStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  // View / Search / Filters (Glass Briefing controls)
  const [viewMode, setViewMode] = React.useState<ViewMode>('lista');
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<ContratosFilters>({
    segmentoId: '',
    tipoContrato: '',
    tipoCobranca: '',
  });

  // ── Fetch stats on mount ──────────────────────────────────────────────────

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await actionContratosPulseStats();
        if (!cancelled && result.success) {
          setStats(result.data);
        }
      } catch {
        // Stats are non-critical — table still works
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const totalContratos = stats
    ? Object.values(stats.porStatus).reduce((sum, n) => sum + n, 0)
    : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStatusClick = React.useCallback((status: string) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  }, []);

  const handleViewChange = React.useCallback((value: string) => {
    const next = value as ViewMode;
    setViewMode(next);
    if (next === 'kanban') {
      router.push('/app/contratos/kanban');
    }
  }, [router]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Contratos</Heading>
          {isLoading ? (
            <Skeleton className="h-4 w-36 mt-1" />
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats?.ativos ?? 0} ativos &middot; {totalContratos} total
            </p>
          )}
        </div>
        <Button size="sm" className="rounded-xl" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />
          Novo Contrato
        </Button>
      </div>

      {/* ── Pulse Strip (KPIs) ──────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <ContratosPulseStrip
          ativos={stats.ativos}
          valorTotal={stats.valorTotal}
          vencendo30d={stats.vencendo30d}
          novosMes={stats.novosMes}
          total={totalContratos}
          trendMensal={stats.trendMensal}
        />
      ) : null}

      {/* ── Insight Banners ─────────────────────────────────────── */}
      <div role="status" aria-live="polite" className="space-y-2 empty:hidden">
        {!isLoading && stats && stats.vencendo30d > 0 && (
          <InsightBanner type="warning">
            {stats.vencendo30d} contrato{stats.vencendo30d !== 1 ? 's' : ''} vence
            {stats.vencendo30d !== 1 ? 'm' : ''} nos próximos 30 dias
          </InsightBanner>
        )}

        {!isLoading && stats && stats.semResponsavel > 0 && (
          <InsightBanner type="info">
            {stats.semResponsavel} contrato{stats.semResponsavel !== 1 ? 's' : ''} sem
            responsável atribuído
          </InsightBanner>
        )}
      </div>

      {/* ── Pipeline Stepper ────────────────────────────────────── */}
      {!isLoading && stats ? (
        <ContratosPipelineStepper
          porStatus={stats.porStatus}
          activeStatus={statusFilter}
          onStatusClick={handleStatusClick}
        />
      ) : isLoading ? (
        <Skeleton className="h-12 rounded-xl" />
      ) : null}

      {/* ── View Controls (FilterBar + Search + ViewToggle) ─────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <ContratosFilterBar filters={filters} onChange={setFilters} />
        <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar cliente, parte, processo..."
          />
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl"
                    aria-label="Configurações de contratos"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Configurações</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/app/contratos/tipos">Tipos de Contrato</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/contratos/tipos-cobranca">Tipos de Cobrança</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/contratos/pipelines">Pipelines</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ViewToggle
            mode={viewMode}
            onChange={handleViewChange}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <ContratosTableWrapper
        initialData={[]}
        initialPagination={null}
        clientesOptions={[]}
        partesContrariasOptions={[]}
        statusFilter={statusFilter}
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
        hideToolbar
        externalBusca={search}
        externalSegmentoId={filters.segmentoId}
        externalTipoContrato={filters.tipoContrato}
        externalTipoCobranca={filters.tipoCobranca}
      />
    </div>
  );
}
