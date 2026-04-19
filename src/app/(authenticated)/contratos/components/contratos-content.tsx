'use client';

/**
 * ContratosContent — Orquestrador Glass Briefing da página de contratos.
 * ============================================================================
 * Shell único que alterna entre Lista e Kanban sem navegar. Preserva toda a
 * moldura visual (Header → PulseStrip → InsightBanners → PipelineStepper →
 * ToolbarFilters) entre as duas views. O toggle muda apenas o conteúdo abaixo
 * da toolbar.
 *
 *   Header → PulseStrip → InsightBanners → PipelineStepper
 *          → [ContratosFilterBar · SearchInput · ViewToggle+Settings]
 *          → ContratosListWrapper   (view=lista)
 *          → ContratosKanbanView    (view=kanban)
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import { Plus, List, Kanban, SlidersHorizontal } from 'lucide-react';
import { Heading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { SearchInput } from '@/components/dashboard/search-input';
import type { ViewToggleOption } from '@/components/dashboard/view-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  actionContratosPulseStats,
  type ContratosPulseStats,
} from '../actions/contratos-actions';
import { useSegmentos } from '../hooks';
import { ContratosPulseStrip } from './contratos-pulse-strip';
import { ContratosPipelineStepper } from './contratos-pipeline-stepper';
import { ContratosListWrapper } from './contratos-list-wrapper';
import { ContratosKanbanView } from './contratos-kanban-view';
import {
  ContratosFilterBar,
  DEFAULT_CONTRATOS_SORT,
  type ContratosFilters,
  type ContratosSort,
} from './contratos-filter-bar';

// ─── Constants ──────────────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'lista', icon: List, label: 'Lista' },
  { id: 'kanban', icon: Kanban, label: 'Kanban' },
];

export type ContratosViewMode = 'lista' | 'kanban';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface ContratosContentProps {
  /** View inicial — permite que a rota /kanban abra direto no quadro. */
  initialView?: ContratosViewMode;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ContratosContent({ initialView = 'lista' }: ContratosContentProps = {}) {
  const [stats, setStats] = React.useState<ContratosPulseStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const [viewMode, setViewMode] = React.useState<ContratosViewMode>(initialView);
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<ContratosFilters>({
    segmentoId: '',
    tipoContrato: '',
    tipoCobranca: '',
  });
  const [sort, setSort] = React.useState<ContratosSort>(DEFAULT_CONTRATOS_SORT);

  // ── Segmentos (necessário para auto-select no modo Kanban) ────────────────
  const { segmentos } = useSegmentos();

  // ── Fetch stats on mount ──────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await actionContratosPulseStats();
        if (!cancelled && result.success) setStats(result.data);
      } catch {
        // stats non-critical
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Auto-select primeiro segmento ao entrar em Kanban sem seleção ────────
  React.useEffect(() => {
    if (viewMode !== 'kanban') return;
    if (filters.segmentoId) return;
    if (segmentos.length === 0) return;
    setFilters((prev) => ({ ...prev, segmentoId: String(segmentos[0]!.id) }));
  }, [viewMode, filters.segmentoId, segmentos]);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalContratos = stats
    ? Object.values(stats.porStatus).reduce((sum, n) => sum + n, 0)
    : 0;

  const currentSegmentoId = filters.segmentoId ? Number(filters.segmentoId) : null;
  const currentSegmentoNome = segmentos.find((s) => s.id === currentSegmentoId)?.nome ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStatusClick = React.useCallback((status: string) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  }, []);

  const handleViewChange = React.useCallback((value: string) => {
    setViewMode(value as ContratosViewMode);
  }, []);

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

      {/* ── View Controls (FilterBar + Search + ViewToggle + Settings) ─────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <ContratosFilterBar
          filters={filters}
          onChange={setFilters}
          sort={viewMode === 'lista' ? sort : undefined}
          onSortChange={viewMode === 'lista' ? setSort : undefined}
        />
        <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              viewMode === 'kanban'
                ? 'Buscar cliente no quadro...'
                : 'Buscar cliente, parte, processo...'
            }
          />
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-border/6">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleViewChange(opt.id)}
                aria-label={opt.label}
                className={cn(
                  'p-1.5 rounded-md transition-all cursor-pointer',
                  viewMode === opt.id
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground/55 hover:text-muted-foreground',
                )}
              >
                <opt.icon className="size-3.5" />
              </button>
            ))}
            <span className="mx-0.5 h-4 w-px bg-border/40" aria-hidden="true" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Configurações de contratos"
                  className="p-1.5 rounded-md text-muted-foreground/55 hover:text-muted-foreground transition-all cursor-pointer"
                >
                  <SlidersHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
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
          </div>
        </div>
      </div>

      {/* ── Conteúdo por view ───────────────────────────────────── */}
      {viewMode === 'lista' ? (
        <ContratosListWrapper
          statusFilter={statusFilter}
          createOpen={createOpen}
          onCreateOpenChange={setCreateOpen}
          busca={search}
          segmentoId={filters.segmentoId}
          tipoContrato={filters.tipoContrato}
          tipoCobranca={filters.tipoCobranca}
          ordenarPor={sort.campo}
          ordem={sort.ordem}
        />
      ) : (
        <ContratosKanbanView
          segmentoId={currentSegmentoId}
          segmentoNome={currentSegmentoNome}
          search={search}
        />
      )}
    </div>
  );
}
