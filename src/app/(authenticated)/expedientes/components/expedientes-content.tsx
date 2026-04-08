'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared';
import { type ViewType } from '@/components/shared';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { useWeekNavigator } from '@/components/shared';
import { FileSearch } from 'lucide-react';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';
import { useExpedientes } from '../hooks/use-expedientes';
import { actionListarExpedientes } from '../actions';
import type { Expediente } from '../domain';
import { ExpedientesPulseStrip } from './expedientes-pulse-strip';
import { ExpedientesControlView } from './expedientes-control-view';
import { ExpedientesListWrapper } from './expedientes-list-wrapper';
import { ExpedientesMonthWrapper } from './expedientes-month-wrapper';
import { ExpedientesYearWrapper } from './expedientes-year-wrapper';
import { ExpedientesWeekMission } from './expedientes-week-mission';
import { ExpedienteDialog } from './expediente-dialog';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';
import { ExpedientesBaixarDialog } from './expedientes-baixar-dialog';
import { Heading } from '@/components/ui/typography';

// ─── Route constants ──────────────────────────────────────────────────────────

const APP_BASE_ROUTE = '/app/expedientes';

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/app/expedientes': 'quadro',
  '/app/expedientes/semana': 'semana',
  '/app/expedientes/mes': 'mes',
  '/app/expedientes/ano': 'ano',
  '/app/expedientes/lista': 'lista',
  '/app/expedientes/quadro': 'quadro',
};

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: `${APP_BASE_ROUTE}/semana`,
  mes: `${APP_BASE_ROUTE}/mes`,
  ano: `${APP_BASE_ROUTE}/ano`,
  lista: `${APP_BASE_ROUTE}/lista`,
  quadro: `${APP_BASE_ROUTE}/quadro`,
};

// ─── View mode options ────────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'quadro', label: 'Quadro', icon: Sparkles },
  { id: 'semana', label: 'Semana', icon: CalendarDays },
  { id: 'mes', label: 'Mês', icon: CalendarRange },
  { id: 'ano', label: 'Ano', icon: Calendar },
  { id: 'lista', label: 'Lista', icon: List },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizarData(dataISO: string | null | undefined): Date | null {
  if (!dataISO) return null;
  const data = new Date(dataISO);
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function calcularDiasRestantes(expediente: Expediente): number | null {
  const prazo = normalizarData(expediente.dataPrazoLegalParte);
  if (!prazo) return null;
  const hoje = new Date();
  const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((prazo.getTime() - hojeZerado.getTime()) / 86400000);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpedientesContent({ visualizacao: initialView = 'quadro' }: { visualizacao?: ViewType }) {
  const router = useRouter();
  const pathname = usePathname();

  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;
  const [viewMode, setViewMode] = useState<ViewType>(viewFromUrl);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'pendentes' | 'baixados'>('pendentes');
  const [globalCounts, setGlobalCounts] = useState({ todos: 0, pendentes: 0, baixados: 0 });
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Fetch real global counts once on mount
  useEffect(() => {
    type PaginatedData = { pagination?: { total?: number } };
    const extractTotal = (res: Awaited<ReturnType<typeof actionListarExpedientes>>): number => {
      if (!res.success) return 0;
      return (res.data as PaginatedData).pagination?.total ?? 0;
    };
    Promise.all([
      actionListarExpedientes({ limite: 1, baixado: false, incluirSemPrazo: true }),
      actionListarExpedientes({ limite: 1, baixado: true, incluirSemPrazo: true }),
    ]).then(([pend, baix]) => {
      const p = extractTotal(pend);
      const b = extractTotal(baix);
      setGlobalCounts({
        pendentes: p,
        baixados: b,
        todos: p + b,
      });
    }).catch(console.error);
  }, [refreshCounter]);

  // Detail/baixa dialog state
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [baixarExpediente, setBaixarExpediente] = useState<Expediente | null>(null);

  // Sync view mode with URL
  useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView) setViewMode(newView);
  }, [pathname]);

  // Data fetching
  const { usuarios } = useUsuarios();
  const { tiposExpedientes } = useTiposExpedientes({ limite: 100 });
  const weekNav = useWeekNavigator();

  const { expedientes: rotuloExpedientes, isLoading, refetch } = useExpedientes({
    pagina: 1,
    limite: 500,
    incluirSemPrazo: true,
    baixado: activeTab === 'pendentes' ? false : activeTab === 'baixados' ? true : undefined,
  });

  // ─── Derived metrics ────────────────────────────────────────────────────────

  const pendentes = useMemo(
    () => rotuloExpedientes.filter((e) => !e.baixadoEm),
    [rotuloExpedientes],
  );

  const vencidos = useMemo(
    () => pendentes.filter((e) => {
      if (e.prazoVencido) return true;
      const dias = calcularDiasRestantes(e);
      return dias !== null && dias < 0;
    }),
    [pendentes],
  );

  const hoje = useMemo(
    () => pendentes.filter((e) => calcularDiasRestantes(e) === 0),
    [pendentes],
  );

  const proximos = useMemo(
    () => pendentes.filter((e) => {
      const dias = calcularDiasRestantes(e);
      return dias !== null && dias > 0 && dias <= 3;
    }),
    [pendentes],
  );

  const semResponsavel = useMemo(
    () => pendentes.filter((e) => !e.responsavelId),
    [pendentes],
  );

  // ─── Tab filtering ───────────────────────────────────────────────────────────

  const tabSource = useMemo(() => rotuloExpedientes, [rotuloExpedientes]);

  const filteredExpedientes = useMemo(() => {
    if (!search.trim()) return tabSource;
    const q = search.toLowerCase();
    return tabSource.filter(
      (e) =>
        e.numeroProcesso.toLowerCase().includes(q) ||
        (e.nomeParteAutora?.toLowerCase().includes(q) ?? false) ||
        (e.nomeParteRe?.toLowerCase().includes(q) ?? false) ||
        (e.classeJudicial?.toLowerCase().includes(q) ?? false),
    );
  }, [tabSource, search]);

  const tabs: TabPillOption[] = useMemo(() => [
    { id: 'pendentes', label: 'Pendentes', count: globalCounts.pendentes },
    { id: 'baixados', label: 'Baixados', count: globalCounts.baixados },
    { id: 'todos', label: 'Todos', count: globalCounts.todos },
  ], [globalCounts]);

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const handleViewChange = useCallback((view: string) => {
    router.push(VIEW_ROUTES[view as ViewType]);
  }, [router]);

  // ─── Dynamic subtitle ─────────────────────────────────────────────────────────

  const subtitle = useMemo(() => {
    if (isLoading) return 'Carregando...';
    const p = pendentes.length;
    const v = vencidos.length;
    const pendLabel = `${p} pendente${p !== 1 ? 's' : ''}`;
    const vencLabel = `${v} vencido${v !== 1 ? 's' : ''}`;
    return `${pendLabel} · ${vencLabel}`;
  }, [isLoading, pendentes.length, vencidos.length]);

  // ─── Insight banners ─────────────────────────────────────────────────────────

  const showVencidosBanner = vencidos.length > 0 && activeTab !== 'baixados';
  const showSemResponsavelBanner = semResponsavel.length > 3 && !showVencidosBanner && activeTab !== 'baixados';

  // ─── Detail/action handlers ──────────────────────────────────────────────────

  const handleViewDetail = useCallback((expediente: Expediente) => {
    setSelectedExpediente(expediente);
    setIsDetailOpen(true);
  }, []);

  const handleBaixar = useCallback((expediente: Expediente) => {
    setBaixarExpediente(expediente);
  }, []);

  const handleBaixaSuccess = useCallback(() => {
    setBaixarExpediente(null);
    refetch();
    setRefreshCounter((c) => c + 1);
  }, [refetch]);

  return (
    <div className="space-y-5">

      {/* 1. Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">
            Expedientes
          </Heading>
          <p className="text-sm text-muted-foreground mt-0.5" aria-live="polite">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="size-3.5" />
            Novo Expediente
          </button>
        </div>
      </div>

      {/* 2. KPI Strip */}
      {!isLoading && activeTab !== 'baixados' && (
        <ExpedientesPulseStrip
          vencidos={vencidos.length}
          hoje={hoje.length}
          proximos={proximos.length}
          semDono={semResponsavel.length}
          total={pendentes.length}
        />
      )}

      {/* 3. Insight Banners */}
      <div role="status" aria-live="polite" aria-atomic="true" className="space-y-2 empty:hidden">
        {!isLoading && showVencidosBanner && (
          <InsightBanner type="alert">
            {vencidos.length} expediente{vencidos.length !== 1 ? 's' : ''} com prazo vencido —
            atenção imediata necessária.
          </InsightBanner>
        )}
        {!isLoading && showSemResponsavelBanner && (
          <InsightBanner type="warning">
            {semResponsavel.length} expedientes pendentes sem responsável atribuído.
          </InsightBanner>
        )}
      </div>

      {/* 4. View Controls — sempre visível conforme Glass Briefing */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills
          tabs={tabs}
          active={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
        />

        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar processo, parte..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={(v) => handleViewChange(v)}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* 5. Content Switcher */}
      <main className="min-h-0 transition-opacity duration-300">
        {isLoading && (
          <div className="space-y-3" aria-busy="true" aria-label="Carregando expedientes">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty state — só para views que renderizam a lista filtrada (quadro/semana/mes/ano).
            `lista` tem empty state próprio dentro do DataShell/DataTable. */}
        {!isLoading &&
          viewMode !== 'lista' &&
          filteredExpedientes.length === 0 && (
            <EmptyState
              icon={FileSearch}
              title={search.trim() ? 'Nenhum expediente encontrado' : 'Nada por aqui ainda'}
              description={
                search.trim()
                  ? 'Tente ajustar os filtros ou limpar a busca para ver mais resultados.'
                  : 'Crie o primeiro expediente ou troque de aba para conferir os baixados.'
              }
              action={
                search.trim() ? (
                  <Button variant="outline" onClick={() => setSearch('')}>
                    Limpar busca
                  </Button>
                ) : (
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="size-4" />
                    Novo Expediente
                  </Button>
                )
              }
            />
          )}

        {!isLoading && viewMode === 'quadro' && filteredExpedientes.length > 0 && (
          <ExpedientesControlView
            expedientes={filteredExpedientes}
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
            onBaixar={handleBaixar}
            onViewDetail={handleViewDetail}
          />
        )}

        {viewMode === 'lista' && (
          <ExpedientesListWrapper
            search={search}
            activeTab={activeTab}
            refreshCounter={refreshCounter}
          />
        )}

        {!isLoading && viewMode === 'semana' && filteredExpedientes.length > 0 && (
          <ExpedientesWeekMission
            weekNavigatorProps={{
              weekDays: weekNav.weekDays,
              selectedDate: weekNav.selectedDate,
              onDateSelect: weekNav.setSelectedDate,
              onPreviousWeek: weekNav.goToPreviousWeek,
              onNextWeek: weekNav.goToNextWeek,
              onToday: weekNav.goToToday,
              isCurrentWeek: weekNav.isCurrentWeek,
            }}
            expedientes={filteredExpedientes}
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
          />
        )}

        {!isLoading && viewMode === 'mes' && filteredExpedientes.length > 0 && (
          <ExpedientesMonthWrapper
            expedientes={filteredExpedientes}
            onViewDetail={handleViewDetail}
          />
        )}

        {!isLoading && viewMode === 'ano' && filteredExpedientes.length > 0 && (
          <ExpedientesYearWrapper
            expedientes={filteredExpedientes}
          />
        )}
      </main>

      {/* 6. Overlays */}
      <ExpedienteDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          refetch();
          setRefreshCounter((c) => c + 1);
        }}
      />

      <ExpedienteVisualizarDialog
        expediente={selectedExpediente}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {baixarExpediente && (
        <ExpedientesBaixarDialog
          expediente={baixarExpediente}
          open={!!baixarExpediente}
          onOpenChange={(open) => { if (!open) setBaixarExpediente(null); }}
          onSuccess={handleBaixaSuccess}
        />
      )}

    </div>
  );
}
