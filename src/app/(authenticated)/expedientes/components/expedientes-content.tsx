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
  Settings,
} from 'lucide-react';
import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { type ViewType, ViewModePopover, type ViewModeOption } from '@/components/shared';
import { useWeekNavigator } from '@/components/shared';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes, TiposExpedientesList } from '@/app/(authenticated)/tipos-expedientes';
import { useExpedientes } from '../hooks/use-expedientes';
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

// ─── View mode options (popover, como Audiências) ─────────────────────────────

const VIEW_MODE_OPTIONS: ViewModeOption[] = [
  { value: 'quadro', label: 'Quadro', icon: Sparkles },
  { value: 'semana', label: 'Semana', icon: CalendarDays },
  { value: 'mes', label: 'Mês', icon: CalendarRange },
  { value: 'ano', label: 'Ano', icon: Calendar },
  { value: 'lista', label: 'Lista', icon: List },
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'pendentes' | 'baixados'>('todos');

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

  const { expedientes: allExpedientes, isLoading, refetch } = useExpedientes({
    pagina: 1,
    limite: 500,
    incluirSemPrazo: true,
  });

  // ─── Derived metrics ────────────────────────────────────────────────────────

  const pendentes = useMemo(
    () => allExpedientes.filter((e) => !e.baixadoEm),
    [allExpedientes],
  );

  const baixados = useMemo(
    () => allExpedientes.filter((e) => !!e.baixadoEm),
    [allExpedientes],
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

  const tabSource = useMemo(() => {
    if (activeTab === 'pendentes') return pendentes;
    if (activeTab === 'baixados') return baixados;
    return allExpedientes;
  }, [activeTab, pendentes, baixados, allExpedientes]);

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
    { id: 'todos', label: 'Todos', count: allExpedientes.length },
    { id: 'pendentes', label: 'Pendentes', count: pendentes.length },
    { id: 'baixados', label: 'Baixados', count: baixados.length },
  ], [allExpedientes.length, pendentes.length, baixados.length]);

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const handleViewChange = useCallback((view: string) => {
    router.push(VIEW_ROUTES[view as ViewType]);
  }, [router]);

  // ─── ViewModePopover (slot passado para cada view wrapper) ──────────────────

  const viewModePopover = useMemo(() => (
    <ViewModePopover
      value={viewMode}
      onValueChange={(v) => handleViewChange(v)}
      options={VIEW_MODE_OPTIONS}
    />
  ), [viewMode, handleViewChange]);

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

  const showVencidosBanner = vencidos.length > 0;
  const showSemResponsavelBanner = semResponsavel.length > 3 && !showVencidosBanner;

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
  }, [refetch]);

  return (
    <div className="max-w-350 mx-auto space-y-5">

      {/* 1. Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">
            Expedientes
          </Heading>
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
                aria-label="Configurações de tipos de expediente"
              >
                <Settings className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tipos de expediente</TooltipContent>
          </Tooltip>

          <Button
            className="h-9 gap-2"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="size-4" />
            Novo Expediente
          </Button>
        </div>
      </div>

      {/* 2. KPI Strip */}
      {!isLoading && (
        <ExpedientesPulseStrip
          vencidos={vencidos.length}
          hoje={hoje.length}
          proximos={proximos.length}
          semDono={semResponsavel.length}
          total={pendentes.length}
        />
      )}

      {/* 3. Insight Banners */}
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

      {/* 4. View Controls — lista tem toolbar própria, então esconde TabPills + Search */}
      {viewMode !== 'lista' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <TabPills
            tabs={tabs}
            active={activeTab}
            onChange={(id) => setActiveTab(id as typeof activeTab)}
          />

          <div className="flex items-center gap-2 ml-auto">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar processo, parte..."
            />
            {viewModePopover}
          </div>
        </div>
      )}

      {/* 5. Content Switcher */}
      <main className="min-h-0 transition-opacity duration-300">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl border border-border/20 bg-muted-foreground/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && viewMode === 'quadro' && (
          <ExpedientesControlView
            expedientes={filteredExpedientes}
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
            onBaixar={handleBaixar}
            onViewDetail={handleViewDetail}
          />
        )}

        {viewMode === 'lista' && (
          <ExpedientesListWrapper viewModeSlot={viewModePopover} />
        )}

        {!isLoading && viewMode === 'semana' && (
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

        {!isLoading && viewMode === 'mes' && (
          <ExpedientesMonthWrapper
            expedientes={filteredExpedientes}
            onViewDetail={handleViewDetail}
          />
        )}

        {!isLoading && viewMode === 'ano' && (
          <ExpedientesYearWrapper
            expedientes={filteredExpedientes}
          />
        )}
      </main>

      {/* 6. Overlays */}
      <ExpedienteDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => { setIsCreateOpen(false); refetch(); }}
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

      <DialogFormShell
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        title="Tipos de Expediente"
        maxWidth="4xl"
        footer={
          <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
            Fechar
          </Button>
        }
      >
        <div className="flex-1 overflow-auto h-[60vh]">
          <TiposExpedientesList />
        </div>
      </DialogFormShell>

    </div>
  );
}
