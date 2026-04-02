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
  Settings,
} from 'lucide-react';
import { InsightBanner } from '@/app/app/dashboard/mock/widgets/primitives';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import {
  StatusAudiencia,
  calcPrepItems,
  calcPrepScore,
  MissionKpiStrip,
  AudienciaDetailSheet,
  TiposAudienciasList,
  AudienciasSemanaView,
  AudienciasMesView,
  AudienciasAnoView,
  AudienciasListaView,
  AudienciasMissaoContent,
  useAudienciasUnified,
} from '@/app/app/audiencias';
import type { Audiencia, TipoAudiencia, AudienciasViewMode } from '@/app/app/audiencias';

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
  const [activeTab, setActiveTab] = useState('todas');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Dialog state
  const [selectedAudiencia, setSelectedAudiencia] = useState<Audiencia | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // ── Data Fetching ───────────────────────────────────────────────────────

  const statusFilter = activeTab === 'todas' ? undefined :
    activeTab === 'marcada' ? StatusAudiencia.Marcada :
    activeTab === 'finalizada' ? StatusAudiencia.Finalizada :
    activeTab === 'cancelada' ? StatusAudiencia.Cancelada : undefined;

  const { audiencias, isLoading, error, total: _total, refetch } = useAudienciasUnified({
    viewMode,
    currentDate,
    search: search || undefined,
    status: statusFilter,
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
    () => audiencias.filter((a) => a.status === StatusAudiencia.Marcada).length,
    [audiencias],
  );
  const totalFinalizadas = useMemo(
    () => audiencias.filter((a) => a.status === StatusAudiencia.Finalizada).length,
    [audiencias],
  );
  const _totalCanceladas = useMemo(
    () => audiencias.filter((a) => a.status === StatusAudiencia.Cancelada).length,
    [audiencias],
  );

  const statusTabs: TabPillOption[] = useMemo(() => [
    { id: 'todas', label: 'Todas', count: audiencias.length },
    { id: 'marcada', label: 'Marcadas', count: totalMarcadas },
    { id: 'finalizada', label: 'Realizadas', count: totalFinalizadas },
  ], [audiencias.length, totalMarcadas, totalFinalizadas]);

  // Low prep warnings
  const lowPrepAudiencias = useMemo(
    () => audiencias.filter(
      (a) => a.status === StatusAudiencia.Marcada && calcPrepScore(calcPrepItems(a)) < 50,
    ),
    [audiencias],
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
    <div className="max-w-350 mx-auto space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Audiências</h1>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-card"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configurações</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────── */}
      <MissionKpiStrip audiencias={audiencias} />

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

      {/* ── Detail Sheet ───────────────────────────────────── */}
      {selectedAudiencia && (
        <AudienciaDetailSheet
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          audiencia={selectedAudiencia}
        />
      )}

      {/* ── Settings Dialog ────────────────────────────────── */}
      <DialogFormShell
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        title="Tipos de Audiências"
        maxWidth="4xl"
        footer={
          <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
            Fechar
          </Button>
        }
      >
        <div className="flex-1 overflow-auto h-[60vh]">
          <TiposAudienciasList />
        </div>
      </DialogFormShell>
    </div>
  );
}
