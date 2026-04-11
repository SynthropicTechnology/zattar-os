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
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';


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
} from '@/app/(authenticated)/audiencias';
import type { Audiencia, TipoAudiencia, AudienciasViewMode } from '@/app/(authenticated)/audiencias';
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
  initialUsuarios?: { id: number; nomeExibicao?: string; nomeCompleto?: string }[];
  initialTiposAudiencia?: TipoAudiencia[];
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AudienciasClient({
  initialView = 'quadro',
  initialUsuarios = [],
  initialTiposAudiencia: _initialTiposAudiencia = [],
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
  const [activeTab, setActiveTab] = useState('marcada');
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

  const totalMarcadas = useMemo(
    () => allAudiencias.filter((a) => a.status === StatusAudiencia.Marcada).length,
    [allAudiencias],
  );
  const totalFinalizadas = useMemo(
    () => allAudiencias.filter((a) => a.status === StatusAudiencia.Finalizada).length,
    [allAudiencias],
  );

  const statusTabs: TabPillOption[] = useMemo(() => [
    { id: 'todas', label: 'Todas', count: allAudiencias.length },
    { id: 'marcada', label: 'Marcadas', count: totalMarcadas },
    { id: 'finalizada', label: 'Realizadas', count: totalFinalizadas },
  ], [allAudiencias.length, totalMarcadas, totalFinalizadas]);

  // Audiências filtradas pela aba ativa — usadas nas views
  const audiencias = useMemo(() => {
    if (activeTab === 'todas') return allAudiencias;
    const statusMap: Record<string, StatusAudiencia> = {
      marcada: StatusAudiencia.Marcada,
      finalizada: StatusAudiencia.Finalizada,
      cancelada: StatusAudiencia.Cancelada,
    };
    const target = statusMap[activeTab];
    return target ? allAudiencias.filter((a) => a.status === target) : allAudiencias;
  }, [allAudiencias, activeTab]);

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
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Audiências</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{subtitle}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsNovaAudienciaOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="size-3.5" />
            Nova Audiência
          </button>
        </div>
      </div>

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
        <TabPills tabs={statusTabs} active={activeTab} onChange={setActiveTab} />
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
        />
      )}

      {!isLoading && viewMode === 'mes' && (
        <AudienciasMesView
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onViewDetail={handleViewDetail}
          refetch={refetch}
        />
      )}

      {!isLoading && viewMode === 'ano' && (
        <AudienciasAnoView
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onViewDetail={handleViewDetail}
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
