'use client';

/**
 * AudienciasClient — Componente unificado do módulo Audiências
 * ============================================================================
 * Segue o padrão ContratosClient: single-column Glass Briefing layout com
 * header, KPI strip, insight banners, view controls e content switcher.
 *
 * Substitui o antigo AudienciasContent + 5 wrappers separados.
 * ============================================================================
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAgentContext } from '@copilotkit/react-core/v2';
import {
  CalendarDays,
  CalendarRange,
  Calendar,
  List,
  Sparkles,
  Plus,
} from 'lucide-react';
import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { Button } from '@/components/ui/button';

import {
  StatusAudiencia,
  calcPrepItems,
  calcPrepScore,
  MissionKpiStrip,
  AudienciaDetailDialog,
  NovaAudienciaDialog,
  AudienciasSemanaView,
  AudienciasMesView,
  AudienciasAnoView,
  AudienciasListaView,
  AudienciasMissaoContent,
  useAudienciasUnified,
  AudienciasFilterBar,
} from '@/app/(authenticated)/audiencias';
import type { Audiencia, TipoAudiencia, AudienciasViewMode } from '@/app/(authenticated)/audiencias';
import type { AudienciasFilterBarFilters } from '@/app/(authenticated)/audiencias/components';
import { Heading } from '@/components/ui/typography';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VIEW_ROUTES: Record<AudienciasViewMode, string> = {
  quadro: '/audiencias/quadro',
  semana: '/audiencias/semana',
  mes: '/audiencias/mes',
  ano: '/audiencias/ano',
  lista: '/audiencias/lista',
};

const ROUTE_TO_VIEW: Record<string, AudienciasViewMode> = {
  '/audiencias': 'quadro',
  '/audiencias/quadro': 'quadro',
  '/audiencias/semana': 'semana',
  '/audiencias/mes': 'mes',
  '/audiencias/ano': 'ano',
  '/audiencias/lista': 'lista',
};

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'quadro', icon: Sparkles, label: 'Missão' },
  { id: 'semana', icon: CalendarDays, label: 'Semana' },
  { id: 'mes', icon: CalendarRange, label: 'Mês' },
  { id: 'ano', icon: Calendar, label: 'Ano' },
  { id: 'lista', icon: List, label: 'Lista' },
];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AudienciasClientProps {
  initialView?: AudienciasViewMode;
  initialUsuarios?: { id: number; nomeExibicao?: string; nomeCompleto?: string; avatarUrl?: string | null }[];
  initialTiposAudiencia?: TipoAudiencia[];
  currentUserId?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AudienciasClient({
  initialView = 'quadro',
  initialUsuarios = [],
  initialTiposAudiencia: _initialTiposAudiencia = [],
  currentUserId = 0,
}: AudienciasClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  // ── View State ──────────────────────────────────────────────────────────

  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;
  const [viewMode, setViewMode] = useState<AudienciasViewMode>(viewFromUrl);

  useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== viewMode) setViewMode(newView);
  }, [pathname, viewMode]);

  const handleViewChange = useCallback((value: string) => {
    const target = value as AudienciasViewMode;
    const route = VIEW_ROUTES[target];
    if (route && route !== pathname) router.push(route);
    setViewMode(target);
  }, [pathname, router]);

  // ── Shared State ────────────────────────────────────────────────────────

  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AudienciasFilterBarFilters>({
    status: null,
    responsavel: null,
    trt: [],
    modalidade: null,
  });
  const [isNovaAudienciaOpen, setIsNovaAudienciaOpen] = useState(false);

  // Dialog state
  const [selectedAudiencia, setSelectedAudiencia] = useState<Audiencia | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // ── Data Fetching ───────────────────────────────────────────────────────
  // Fetch sem filtro de status — filtragem client-side para manter KPIs e
  // contadores de tabs precisos independente da aba ativa.

  const { audiencias: allAudiencias, isLoading, error, total: _total, refetch } = useAudienciasUnified({
    viewMode,
    currentDate,
    search: search || undefined,
  });

  // ── Derived Data ────────────────────────────────────────────────────────

  const responsavelNomesMap = useMemo(() => {
    const map = new Map<number, string>();
    initialUsuarios.forEach((u) => {
      map.set(u.id, u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`);
    });
    return map;
  }, [initialUsuarios]);

  const filterCounts = useMemo(() => ({
    total: allAudiencias.length,
    marcadas: allAudiencias.filter((a) => a.status === StatusAudiencia.Marcada).length,
    finalizadas: allAudiencias.filter((a) => a.status === StatusAudiencia.Finalizada).length,
    canceladas: allAudiencias.filter((a) => a.status === StatusAudiencia.Cancelada).length,
    semResponsavel: allAudiencias.filter((a) => !a.responsavelId).length,
  }), [allAudiencias]);

  const totalMarcadas = filterCounts.marcadas;
  const totalFinalizadas = filterCounts.finalizadas;

  // Audiências filtradas pelos filtros ativos
  const audiencias = useMemo(() => {
    let filtered = allAudiencias;
    if (filters.status) {
      filtered = filtered.filter((a) => a.status === filters.status);
    }
    if (filters.responsavel === 'sem_responsavel') {
      filtered = filtered.filter((a) => !a.responsavelId);
    } else if (filters.responsavel === 'meus') {
      filtered = filtered.filter((a) => a.responsavelId === currentUserId);
    } else if (typeof filters.responsavel === 'number') {
      filtered = filtered.filter((a) => a.responsavelId === filters.responsavel);
    }
    if (filters.trt.length > 0) {
      filtered = filtered.filter((a) => a.trt && filters.trt.includes(a.trt));
    }
    if (filters.modalidade) {
      filtered = filtered.filter((a) => a.modalidade === filters.modalidade);
    }
    return filtered;
  }, [allAudiencias, filters, currentUserId]);

  // Low prep warnings (sempre sobre marcadas, independente da tab)
  const lowPrepAudiencias = useMemo(
    () => allAudiencias.filter(
      (a) => a.status === StatusAudiencia.Marcada && calcPrepScore(calcPrepItems(a)) < 50,
    ),
    [allAudiencias],
  );

  // Subtitle
  const subtitle = isLoading
    ? 'Carregando...'
    : `${audiencias.length} audiência${audiencias.length !== 1 ? 's' : ''} · ${totalMarcadas} marcada${totalMarcadas !== 1 ? 's' : ''}`;

  // ── Copilot Context ─────────────────────────────────────────────────────

  useAgentContext({
    description: 'Contexto da tela de audiências: visualização atual e dados carregados',
    value: {
      visualizacao_atual: viewMode,
      total_audiencias: audiencias.length,
      total_marcadas: totalMarcadas,
      total_finalizadas: totalFinalizadas,
      data_atual: currentDate.toISOString(),
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleViewDetail = useCallback((audiencia: Audiencia) => {
    setSelectedAudiencia(audiencia);
    setIsDetailOpen(true);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      {viewMode !== 'quadro' && (
        <div className="flex items-end justify-between gap-4">
          <div>
            <Heading level="page">Audiências</Heading>
            <p className="text-sm text-muted-foreground/50 mt-0.5">{subtitle}</p>
          </div>
          <Button size="sm" className="rounded-xl" onClick={() => setIsNovaAudienciaOpen(true)}>
            <Plus className="size-3.5" />
            Nova Audiência
          </Button>
        </div>
      )}

      {/* ── KPI Strip ──────────────────────────────────────── */}
      <MissionKpiStrip audiencias={allAudiencias} />

      {/* ── Insight Banners ────────────────────────────────── */}
      {!isLoading && lowPrepAudiencias.length > 0 && (
        <InsightBanner type="warning">
          {lowPrepAudiencias.length} audiência{lowPrepAudiencias.length > 1 ? 's' : ''} com
          preparo abaixo de 50% — revise antes do horário
        </InsightBanner>
      )}

      {error && (
        <InsightBanner type="alert">{error}</InsightBanner>
      )}

      {/* ── View Controls ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <AudienciasFilterBar
          filters={filters}
          onChange={setFilters}
          usuarios={initialUsuarios.map((u) => ({
            id: u.id,
            nomeExibicao: u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`,
          }))}
          currentUserId={currentUserId}
          counts={filterCounts}
        />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar parte, processo, tipo..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={handleViewChange}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-border/20 bg-muted-foreground/5 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && viewMode === 'quadro' && (
        <AudienciasMissaoContent
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onViewDetail={handleViewDetail}
          responsavelNomes={responsavelNomesMap}
        />
      )}

      {!isLoading && viewMode === 'semana' && (
        <AudienciasSemanaView
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onViewDetail={handleViewDetail}
          responsavelNomes={responsavelNomesMap}
        />
      )}

      {!isLoading && viewMode === 'mes' && (
        <AudienciasMesView
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          refetch={refetch}
        />
      )}

      {!isLoading && viewMode === 'ano' && (
        <AudienciasAnoView
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          refetch={refetch}
        />
      )}

      {!isLoading && viewMode === 'lista' && (
        <AudienciasListaView
          audiencias={audiencias}
          onViewDetail={handleViewDetail}
          search={search}
        />
      )}

      {/* ── Detail Dialog ──────────────────────────────────── */}
      {selectedAudiencia && (
        <AudienciaDetailDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          audiencia={selectedAudiencia}
        />
      )}

      {/* ── Nova Audiência Dialog ──────────────────────────── */}
      <NovaAudienciaDialog
        open={isNovaAudienciaOpen}
        onOpenChange={setIsNovaAudienciaOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
