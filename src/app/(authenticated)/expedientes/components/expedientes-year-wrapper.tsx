'use client';

/**
 * ExpedientesYearWrapper - Radar Estratégico Anual
 *
 * Redesign: GitHub-style heatmap 365 dias, KPI strip anual,
 * monthly breakdown cards com taxa de conclusão, e insights sazonais.
 */

import * as React from 'react';
import { startOfYear, endOfYear, format, eachDayOfInterval, getDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, BarChart3, AlertTriangle, CheckCircle2, Calendar, Timer } from 'lucide-react';

import {
  DataShell,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import {
  YearFilterPopover,
  TemporalViewLoading,
  TemporalViewError,
} from '@/components/shared';
import { GlassPanel } from '@/components/shared/glass-panel';
import {
  AnimatedNumber,
  InsightBanner,
  ProgressRing,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { Expediente } from '../domain';
import { useExpedientes } from '../hooks/use-expedientes';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';

import { ExpedientesListFilters, type StatusFilterType, type ResponsavelFilterType } from './expedientes-list-filters';
import { ExpedienteDialog } from './expediente-dialog';
import { ExpedienteDetalhesDialog } from './expediente-detalhes-dialog';

// =============================================================================
// TIPOS
// =============================================================================

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

interface ExpedientesYearWrapperProps {
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Slot para botões de ação adicionais (ex: Settings) */
  settingsSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: UsuarioData[];
  /** Dados de tipos de expediente pré-carregados (evita fetch duplicado) */
  tiposExpedientesData?: TipoExpedienteData[];
}

// =============================================================================
// MESES
// =============================================================================

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// =============================================================================
// ANNUAL HEATMAP (GitHub-style 365 dias)
// =============================================================================

interface HeatmapDay {
  date: Date;
  count: number;
  hasVencidos: boolean;
}

function AnnualHeatmap({
  year,
  expedientesPorDia,
  onDayClick,
}: {
  year: number;
  expedientesPorDia: Map<string, Expediente[]>;
  onDayClick: (date: Date) => void;
}) {
  const { weeks } = React.useMemo(() => {
    const inicio = startOfYear(new Date(year, 0, 1));
    const fim = endOfYear(new Date(year, 0, 1));
    const allDays = eachDayOfInterval({ start: inicio, end: fim });

    let max = 0;
    const dayData: HeatmapDay[] = allDays.map((date) => {
      const key = `${date.getMonth()}-${date.getDate()}`;
      const exps = expedientesPorDia.get(key) || [];
      const count = exps.length;
      if (count > max) max = count;
      const hasVencidos = exps.some((e) => !e.baixadoEm && e.prazoVencido === true);
      return { date, count, hasVencidos };
    });

    // Organizar em semanas (colunas)
    const weeksMap: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    // Preencher dias vazios no início da primeira semana
    const firstDayOfWeek = getDay(inicio); // 0=Sunday
    const adjustedFirst = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday=0
    for (let i = 0; i < adjustedFirst; i++) {
      currentWeek.push({ date: new Date(0), count: -1, hasVencidos: false }); // placeholder
    }

    dayData.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeksMap.push(currentWeek);
        currentWeek = [];
      }
    });

    // Preencher dias vazios no final
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), count: -1, hasVencidos: false });
      }
      weeksMap.push(currentWeek);
    }

    return { weeks: weeksMap, maxCount: max };
  }, [year, expedientesPorDia]);

  function getIntensity(count: number): string {
    if (count <= 0) return 'bg-muted/20';
    if (count <= 2) return 'bg-primary/15';
    if (count <= 5) return 'bg-primary/30';
    if (count <= 10) return 'bg-primary/50';
    return 'bg-primary/80';
  }

  const diasSemana = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  // Calcular labels de mês no topo
  const monthLabels = React.useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIdx) => {
      const validDay = week.find((d) => d.count >= 0);
      if (validDay) {
        const month = validDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ label: MESES_ABREV[month], col: weekIdx });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  return (
    <GlassPanel depth={1} className="p-4 overflow-x-auto">
      <div className="min-w-175">
        {/* Month labels */}
        <div className="flex gap-0.75 ml-6 mb-1">
          {monthLabels.map(({ label, col }, idx) => {
            const nextCol = idx < monthLabels.length - 1 ? monthLabels[idx + 1].col : weeks.length;
            const span = nextCol - col;
            return (
              <span
                key={`${label}-${col}`}
                className="text-[9px] text-muted-foreground/50"
                style={{ width: `${span * 15}px` }}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div className="flex gap-0.75">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-0.75 mr-1">
            {diasSemana.map((d, i) => (
              <div key={i} className="h-3 flex items-center justify-center text-[7px] text-muted-foreground/50 w-4">
                {i % 2 === 0 ? d : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <TooltipProvider delayDuration={100}>
            <div className="flex gap-0.75">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-0.75">
                  {week.map((day, dayIdx) => {
                    if (day.count < 0) {
                      return <div key={dayIdx} className="size-3" />;
                    }
                    return (
                      <Tooltip key={dayIdx}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'size-3 rounded-[2px] transition-colors duration-200 cursor-pointer hover:ring-1 hover:ring-primary/40',
                              getIntensity(day.count),
                              day.hasVencidos && 'ring-1 ring-inset ring-destructive/40',
                            )}
                            onClick={() => onDayClick(day.date)}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{format(day.date, "dd 'de' MMM, yyyy", { locale: ptBR })}</p>
                          <p className="text-muted-foreground">
                            {day.count} expediente{day.count !== 1 ? 's' : ''}
                            {day.hasVencidos && ' · com vencidos'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-6">
          <span className="text-[9px] text-muted-foreground/50">Menos</span>
          {['bg-muted/20', 'bg-primary/15', 'bg-primary/30', 'bg-primary/50', 'bg-primary/80'].map((cls, i) => (
            <div key={i} className={cn('size-2.5 rounded-[2px]', cls)} />
          ))}
          <span className="text-[9px] text-muted-foreground/50">Mais</span>
          <div className="ml-2 size-2.5 rounded-[2px] bg-muted/20 ring-1 ring-inset ring-destructive/40" />
          <span className="text-[9px] text-muted-foreground/50">Vencido</span>
        </div>
      </div>
    </GlassPanel>
  );
}

// =============================================================================
// MONTHLY BREAKDOWN CARDS (grid 3×4)
// =============================================================================

interface MonthStats {
  mes: number;
  label: string;
  total: number;
  baixados: number;
  pendentes: number;
  vencidos: number;
  taxaConclusao: number;
}

function MonthlyBreakdown({
  monthStats,
  onMonthClick,
}: {
  monthStats: MonthStats[];
  onMonthClick?: (mes: number) => void;
}) {
  const maxTotal = Math.max(...monthStats.map((m) => m.total), 1);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {monthStats.map((month) => (
        <button
          key={month.mes}
          type="button"
          className="text-left w-full"
          onClick={() => onMonthClick?.(month.mes)}
        >
        <GlassPanel
          depth={1}
          className={cn(
            'p-3 cursor-pointer hover:border-primary/20 transition-all group',
            month.vencidos > 0 && 'border-destructive/10',
          )}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
              {month.label}
            </span>
            <ProgressRing
              percent={Math.round(month.taxaConclusao)}
              size={28}
              color={month.taxaConclusao >= 80 ? 'var(--success)' : month.taxaConclusao >= 50 ? 'var(--warning)' : 'var(--destructive)'}
            />
          </div>

          <p className="font-display text-xl font-bold mt-1 tabular-nums group-hover:text-primary transition-colors">
            {month.total}
          </p>

          {/* Barra de proporção */}
          <div className="mt-2 h-1.5 rounded-full bg-muted/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/30 transition-all duration-500"
              style={{ width: `${(month.total / maxTotal) * 100}%` }}
            />
          </div>

          {month.vencidos > 0 && (
            <p className="text-[9px] text-destructive/70 mt-1.5 tabular-nums">
              {month.vencidos} vencido{month.vencidos !== 1 ? 's' : ''}
            </p>
          )}
        </GlassPanel>
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesYearWrapper({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  tiposExpedientesData,
}: ExpedientesYearWrapperProps) {
  // ---------- Navegação de Ano ----------
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const selectedDate = React.useMemo(() => new Date(selectedYear, 0, 1), [selectedYear]);

  // ---------- Estado de Filtros ----------
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterType>('pendentes');
  const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilterType>('todos');
  const [tribunalFilter, setTribunalFilter] = React.useState('');
  const [grauFilter, setGrauFilter] = React.useState('');
  const [tipoExpedienteFilter, setTipoExpedienteFilter] = React.useState('');
  const [origemFilter, setOrigemFilter] = React.useState('');

  // ---------- Dialog State ----------
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [expedientesDiaDialog, setExpedientesDiaDialog] = React.useState<Expediente[]>([]);
  const [isDiaDialogOpen, setIsDiaDialogOpen] = React.useState(false);

  // ---------- Dados Auxiliares ----------
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { tiposExpedientes: tiposFetched } = useTiposExpedientes({ limite: 100 });

  const usuarios = usuariosData ?? usuariosFetched;
  const tiposExpedientes = tiposExpedientesData ?? tiposFetched;

  // ---------- Montar params — TODOS (pendentes + baixados) ----------
  const hookParamsTodos = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: 1,
      limite: 2000,
      busca: globalFilter || undefined,
      dataPrazoLegalInicio: format(startOfYear(selectedDate), 'yyyy-MM-dd'),
      dataPrazoLegalFim: format(endOfYear(selectedDate), 'yyyy-MM-dd'),
      incluirSemPrazo: true,
    };

    // Sem filtro de baixado — queremos todos para KPIs anuais

    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (tipoExpedienteFilter) params.tipoExpedienteId = parseInt(tipoExpedienteFilter, 10);
    if (origemFilter) params.origem = origemFilter;

    return params;
  }, [globalFilter, selectedDate, responsavelFilter, tribunalFilter, grauFilter, tipoExpedienteFilter, origemFilter]);

  // ---------- Data Fetching ----------
  const { expedientes, isLoading, error, refetch } = useExpedientes(hookParamsTodos);

  // ---------- Expedientes por dia (mapa) ----------
  const expedientesPorDia = React.useMemo(() => {
    const mapa = new Map<string, Expediente[]>();
    expedientes.forEach((e) => {
      if (!e.dataPrazoLegalParte) return;
      const d = new Date(e.dataPrazoLegalParte);
      const key = `${d.getMonth()}-${d.getDate()}`;
      const existing = mapa.get(key) || [];
      existing.push(e);
      mapa.set(key, existing);
    });
    return mapa;
  }, [expedientes]);

  // ---------- KPIs Anuais ----------
  const annualKpis = React.useMemo(() => {
    const total = expedientes.length;
    const baixados = expedientes.filter((e) => e.baixadoEm).length;
    const pendentes = total - baixados;
    const vencidos = expedientes.filter((e) => !e.baixadoEm && e.prazoVencido === true).length;
    const taxa = total > 0 ? Math.round((baixados / total) * 100) : 0;

    // Tempo médio de baixa (em dias)
    const temposBaixa = expedientes
      .filter((e) => e.baixadoEm && e.dataPrazoLegalParte)
      .map((e) => {
        const prazo = new Date(e.dataPrazoLegalParte!);
        const baixa = new Date(e.baixadoEm!);
        return differenceInDays(baixa, prazo);
      })
      .filter((d) => d >= -30 && d <= 60); // outliers filter

    const tempoMedio = temposBaixa.length > 0
      ? (temposBaixa.reduce((a, b) => a + b, 0) / temposBaixa.length).toFixed(1)
      : '-';

    return { total, baixados, pendentes, vencidos, taxa, tempoMedio };
  }, [expedientes]);

  // ---------- Monthly Stats ----------
  const monthStats = React.useMemo<MonthStats[]>(() => {
    return Array.from({ length: 12 }, (_, mes) => {
      const doMes = expedientes.filter((e) => {
        if (!e.dataPrazoLegalParte) return false;
        return new Date(e.dataPrazoLegalParte).getMonth() === mes;
      });
      const total = doMes.length;
      const baixados = doMes.filter((e) => e.baixadoEm).length;
      const pendentes = total - baixados;
      const vencidos = doMes.filter((e) => !e.baixadoEm && e.prazoVencido === true).length;
      const taxaConclusao = total > 0 ? (baixados / total) * 100 : 0;

      return {
        mes,
        label: MESES_ABREV[mes],
        total,
        baixados,
        pendentes,
        vencidos,
        taxaConclusao,
      };
    });
  }, [expedientes]);

  // ---------- Seasonality Insights ----------
  const insights = React.useMemo(() => {
    const result: { type: 'alert' | 'info' | 'success' | 'warning'; text: string }[] = [];

    // Meses de pico
    const sorted = [...monthStats].sort((a, b) => b.total - a.total);
    const top3 = sorted.slice(0, 3).filter((m) => m.total > 0);
    if (top3.length >= 2) {
      const top3Total = top3.reduce((a, b) => a + b.total, 0);
      const pctTotal = annualKpis.total > 0 ? Math.round((top3Total / annualKpis.total) * 100) : 0;
      if (pctTotal >= 30) {
        result.push({
          type: 'info',
          text: `${top3.map((m) => m.label).join(', ')} concentram ${pctTotal}% do volume anual`,
        });
      }
    }

    // Meses com muitos vencidos
    const mesesComVencidos = monthStats.filter((m) => m.vencidos >= 3);
    if (mesesComVencidos.length > 0) {
      const piores = mesesComVencidos.sort((a, b) => b.vencidos - a.vencidos).slice(0, 2);
      result.push({
        type: 'alert',
        text: `${piores.map((m) => `${m.label} (${m.vencidos})`).join(' e ')} — meses com mais vencimentos`,
      });
    }

    // Taxa de conclusão geral
    if (annualKpis.taxa >= 80) {
      result.push({
        type: 'success',
        text: `Taxa de conclusão anual de ${annualKpis.taxa}% — excelente performance`,
      });
    } else if (annualKpis.taxa < 50 && annualKpis.total > 10) {
      result.push({
        type: 'warning',
        text: `Taxa de conclusão anual de ${annualKpis.taxa}% — atenção recomendada`,
      });
    }

    return result.slice(0, 2); // max 2 insights
  }, [monthStats, annualKpis]);

  // ---------- Helpers ----------
  const handleDiaClick = React.useCallback((date: Date) => {
    const key = `${date.getMonth()}-${date.getDate()}`;
    const doDia = expedientesPorDia.get(key) || [];

    if (doDia.length > 0) {
      setExpedientesDiaDialog(doDia);
      setIsDiaDialogOpen(true);
    }
  }, [expedientesPorDia]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsCreateDialogOpen(false);
  }, [refetch]);

  // ---------- KPI config ----------
  const kpiItems = [
    { label: 'Total', value: annualKpis.total, icon: BarChart3, color: 'text-primary', bgColor: 'bg-primary' },
    { label: 'Baixados', value: annualKpis.baixados, icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success' },
    { label: 'Pendentes', value: annualKpis.pendentes, icon: Calendar, color: 'text-amber-500', bgColor: 'bg-amber-500' },
    { label: 'Vencidos', value: annualKpis.vencidos, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive', highlight: annualKpis.vencidos > 0 },
    { label: 'Conclusão', value: annualKpis.taxa, icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary', suffix: '%' },
    { label: 'Tempo Médio', value: typeof annualKpis.tempoMedio === 'string' ? 0 : 0, icon: Timer, color: 'text-muted-foreground', bgColor: 'bg-muted', rawLabel: annualKpis.tempoMedio === '-' ? '-' : `${annualKpis.tempoMedio}d` },
  ];

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            title={`Radar Anual — ${selectedYear}`}
            searchValue={globalFilter}
            onSearchValueChange={setGlobalFilter}
            searchPlaceholder="Buscar expedientes..."
            actionButton={{
              label: 'Novo Expediente',
              onClick: () => setIsCreateDialogOpen(true),
            }}
            actionSlot={
              <>
                {viewModeSlot}
                {settingsSlot}
              </>
            }
            filtersSlot={
              <>
                <YearFilterPopover
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                />
                <ExpedientesListFilters
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  responsavelFilter={responsavelFilter}
                  onResponsavelChange={setResponsavelFilter}
                  tribunalFilter={tribunalFilter}
                  onTribunalChange={setTribunalFilter}
                  grauFilter={grauFilter}
                  onGrauChange={setGrauFilter}
                  tipoExpedienteFilter={tipoExpedienteFilter}
                  onTipoExpedienteChange={setTipoExpedienteFilter}
                  origemFilter={origemFilter}
                  onOrigemChange={setOrigemFilter}
                  usuarios={usuarios}
                  tiposExpedientes={tiposExpedientes}
                  hidePrazoFilter
                />
              </>
            }
          />
        }
      >
        {isLoading ? (
          <TemporalViewLoading message="Carregando expedientes..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar expedientes: ${error}`} onRetry={refetch} />
        ) : (
          <div className="space-y-6 p-6">
            {/* ─── Annual KPI Strip ──────────────────────────────────── */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {kpiItems.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <GlassPanel
                    key={kpi.label}
                    depth={1}
                    className={cn(
                      'px-3 py-3',
                      kpi.highlight && 'border-destructive/15',
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
                          {kpi.label}
                        </p>
                        <p className={cn(
                          'font-display text-xl font-bold mt-0.5 tabular-nums',
                          kpi.highlight && 'text-destructive/80',
                        )}>
                          {kpi.rawLabel ? (
                            kpi.rawLabel
                          ) : (
                            <>
                              <AnimatedNumber value={kpi.value} />
                              {kpi.suffix && <span className="text-sm font-medium text-muted-foreground/60">{kpi.suffix}</span>}
                            </>
                          )}
                        </p>
                      </div>
                      <div className={cn('size-7 rounded-lg flex items-center justify-center', `${kpi.bgColor}/8`)}>
                        <Icon className={cn('size-3.5', `${kpi.color}/60`)} />
                      </div>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>

            {/* ─── GitHub-style Heatmap ──────────────────────────────── */}
            <AnnualHeatmap
              year={selectedYear}
              expedientesPorDia={expedientesPorDia}
              onDayClick={handleDiaClick}
            />

            {/* ─── Seasonality Insights ─────────────────────────────── */}
            {insights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((insight, i) => (
                  <InsightBanner key={i} type={insight.type}>
                    {insight.text}
                  </InsightBanner>
                ))}
              </div>
            )}

            {/* ─── Monthly Breakdown Cards ───────────────────────────── */}
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50 mb-3">
                Detalhamento Mensal
              </h3>
              <MonthlyBreakdown monthStats={monthStats} />
            </div>
          </div>
        )}
      </DataShell>

      <ExpedienteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <ExpedienteDetalhesDialog
        expediente={null}
        expedientes={expedientesDiaDialog}
        open={isDiaDialogOpen}
        onOpenChange={setIsDiaDialogOpen}
        onSuccess={refetch}
      />
    </>
  );
}
