'use client';

import * as React from 'react';
import { getYear, getMonth, getDate, format, parseISO, isToday as checkIsToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarDays,
  Flame,
  BarChart2,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { Audiencia } from '../domain';
import { StatusAudiencia } from '../domain';
import { AudienciasDiaDialog } from './audiencias-dia-dialog';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasYearHeatmapProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  refetch: () => void;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

// =============================================================================
// HELPERS
// =============================================================================

function getDayIntensity(count: number): string {
  if (count === 0) return 'bg-white/[0.05]';
  if (count === 1) return 'bg-primary/30';
  if (count === 2) return 'bg-primary/55';
  return 'bg-primary/85';
}

function buildDayMap(audiencias: Audiencia[], year: number) {
  const map = new Map<string, Audiencia[]>();
  for (const aud of audiencias) {
    const d = parseISO(aud.dataInicio);
    if (getYear(d) === year) {
      const key = `${getMonth(d)}-${getDate(d)}`;
      const list = map.get(key) || [];
      list.push(aud);
      map.set(key, list);
    }
  }
  return map;
}

function computeStats(audiencias: Audiencia[], year: number) {
  const yearAuds = audiencias.filter(a => getYear(parseISO(a.dataInicio)) === year);
  const total = yearAuds.length;
  const realizadas = yearAuds.filter(a => a.status === StatusAudiencia.Finalizada).length;
  const taxa = total > 0 ? Math.round((realizadas / total) * 100) : 0;

  // Mês mais intenso
  const monthCounts = new Array(12).fill(0);
  for (const a of yearAuds) {
    monthCounts[getMonth(parseISO(a.dataInicio))]++;
  }
  const maxMonth = monthCounts.indexOf(Math.max(...monthCounts));
  const maxMonthCount = monthCounts[maxMonth];

  // Média semanal (52 semanas)
  const weekAvg = total > 0 ? (total / 52).toFixed(1) : '0';

  // Próxima audiência
  const now = new Date();
  const futuras = yearAuds
    .filter(a => parseISO(a.dataInicio) > now && a.status === StatusAudiencia.Marcada)
    .sort((a, b) => parseISO(a.dataInicio).getTime() - parseISO(b.dataInicio).getTime());
  const proxima = futuras[0] || null;

  return { total, realizadas, taxa, maxMonth, maxMonthCount, weekAvg, proxima };
}

// =============================================================================
// MONTH GRID COMPONENT
// =============================================================================

const MonthGrid = React.memo(function MonthGrid({
  monthIndex,
  year,
  dayMap,
  onDayClick,
}: {
  monthIndex: number;
  year: number;
  dayMap: Map<string, Audiencia[]>;
  onDayClick: (month: number, day: number) => void;
}) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDow = new Date(year, monthIndex, 1).getDay(); // 0=Dom

  const cells: React.ReactNode[] = [];

  // Empty cells before first day
  for (let i = 0; i < firstDow; i++) {
    cells.push(<div key={`e-${i}`} className="w-[10px] h-[10px]" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${monthIndex}-${d}`;
    const auds = dayMap.get(key) || [];
    const count = auds.length;
    const today = checkIsToday(new Date(year, monthIndex, d));
    const dateLabel = format(new Date(year, monthIndex, d), "dd 'de' MMM", { locale: ptBR });
    const tooltipText = count
      ? `${dateLabel} · ${count} audiência${count > 1 ? 's' : ''}`
      : `${dateLabel} · Nenhuma`;

    cells.push(
      <TooltipTrigger asChild key={d}>
        <button
          type="button"
          onClick={() => count > 0 && onDayClick(monthIndex, d)}
          className={cn(
            'w-[10px] h-[10px] rounded-[2px] transition-all duration-100 shrink-0',
            getDayIntensity(count),
            today && 'ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent',
            count > 0 && 'cursor-pointer hover:opacity-80 hover:scale-[1.3]',
            count === 0 && 'cursor-default',
          )}
          aria-label={tooltipText}
        >
          <TooltipContent side="top" className="text-[10px] px-2 py-1">
            {tooltipText}
          </TooltipContent>
        </button>
      </TooltipTrigger>
    );
  }

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70 mb-[5px]">
        {MONTH_NAMES[monthIndex]}
      </div>
      <div className="flex gap-[2px] mb-[3px]">
        {WEEKDAY_LABELS.map((lbl, i) => (
          <div key={i} className="text-[8px] text-muted-foreground/60 text-center w-[10px] shrink-0">
            {lbl}
          </div>
        ))}
      </div>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(7, 10px)' }}>
        {cells}
      </div>
    </div>
  );
});

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[0.875rem] border border-white/[0.07] bg-white/[0.04] p-4 px-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-3.5 h-3.5', iconColor)} />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasYearHeatmap({
  audiencias,
  currentDate,
  onDateChange,
  refetch,
}: AudienciasYearHeatmapProps) {
  const year = getYear(currentDate);
  const dayMap = React.useMemo(() => buildDayMap(audiencias, year), [audiencias, year]);
  const stats = React.useMemo(() => computeStats(audiencias, year), [audiencias, year]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [audienciasDia, setAudienciasDia] = React.useState<Audiencia[]>([]);
  const [dataSelecionada, setDataSelecionada] = React.useState<Date>(new Date());

  const handleDayClick = React.useCallback(
    (month: number, day: number) => {
      const key = `${month}-${day}`;
      const auds = dayMap.get(key) || [];
      if (auds.length > 0) {
        setAudienciasDia(auds);
        setDataSelecionada(new Date(year, month, day));
        setDialogOpen(true);
      }
    },
    [dayMap, year],
  );

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-6">
        {/* Year Navigator */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-white/[0.08] bg-white/[0.06] backdrop-blur-sm hover:bg-white/[0.12]"
              onClick={() => onDateChange(new Date(year - 1, 0, 1))}
              aria-label="Ano anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold tracking-tight w-14 text-center select-none">
              {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-white/[0.08] bg-white/[0.06] backdrop-blur-sm hover:bg-white/[0.12]"
              onClick={() => onDateChange(new Date(year + 1, 0, 1))}
              aria-label="Próximo ano"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="ml-2 rounded-full px-4"
              onClick={() => onDateChange(new Date())}
            >
              Hoje
            </Button>
          </div>
        </div>

        {/* Main Layout: Heatmap + Stats Sidebar */}
        <div className="flex gap-5 flex-wrap xl:flex-nowrap">
          {/* Heatmap Panel */}
          <GlassPanel depth={1} className="p-6 flex-1 min-w-0">
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {Array.from({ length: 12 }, (_, i) => (
                <Tooltip key={i}>
                  <MonthGrid
                    monthIndex={i}
                    year={year}
                    dayMap={dayMap}
                    onDayClick={handleDayClick}
                  />
                </Tooltip>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-8 flex items-center gap-3">
              <span className="text-xs text-muted-foreground/60">Menos</span>
              <div className="flex items-center gap-1">
                <div className="w-[10px] h-[10px] rounded-[2px] bg-white/[0.05]" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/30" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/55" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/[0.65]" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/85" />
              </div>
              <span className="text-xs text-muted-foreground/60">Mais</span>
              <span className="text-muted-foreground/40 mx-2 text-xs">·</span>
              <div className="flex items-center gap-1.5">
                <div className="w-[10px] h-[10px] rounded-[2px] bg-white/[0.05] ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent" />
                <span className="text-xs text-muted-foreground/60">Hoje</span>
              </div>
            </div>
          </GlassPanel>

          {/* Stats Sidebar */}
          <div className="flex flex-col gap-4 w-full xl:w-64 shrink-0">
            {/* Total no Ano */}
            <StatCard icon={CalendarDays} iconBg="bg-primary/15" iconColor="text-primary" label="Total no Ano">
              <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
            </StatCard>

            {/* Mês Mais Intenso */}
            <StatCard icon={Flame} iconBg="bg-orange-500/12" iconColor="text-orange-400" label="Mês Mais Intenso">
              <div className="text-xl font-bold">{MONTH_NAMES[stats.maxMonth]}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {stats.maxMonthCount} audiências
              </div>
              <div className="mt-3 h-1 rounded-full bg-white/[0.06]">
                <div
                  className="h-1 rounded-full bg-orange-400/70"
                  style={{ width: `${stats.total > 0 ? Math.round((stats.maxMonthCount / stats.total) * 100) : 0}%` }}
                />
              </div>
            </StatCard>

            {/* Média Semanal */}
            <StatCard icon={BarChart2} iconBg="bg-emerald-500/12" iconColor="text-emerald-400" label="Média Semanal">
              <div className="text-3xl font-bold tracking-tight">{stats.weekAvg}</div>
              <div className="text-xs text-muted-foreground mt-1">audiências / semana</div>
            </StatCard>

            {/* Taxa de Realização */}
            <StatCard icon={CheckCircle2} iconBg="bg-primary/15" iconColor="text-primary" label="Taxa de Realização">
              <div className="text-3xl font-bold tracking-tight">
                {stats.taxa}
                <span className="text-lg text-muted-foreground font-medium">%</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80"
                  style={{ width: `${stats.taxa}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                {stats.realizadas} de {stats.total} realizadas
              </div>
            </StatCard>

            {/* Próxima Audiência */}
            {stats.proxima && (
              <StatCard icon={Clock} iconBg="bg-sky-500/12" iconColor="text-sky-400" label="Próxima">
                <div className="text-sm font-semibold">
                  {format(parseISO(stats.proxima.dataInicio), "dd MMM · HH'h'mm", { locale: ptBR })}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {stats.proxima.numeroProcesso.substring(0, 15)}
                </div>
                {stats.proxima.tipoDescricao && (
                  <div className="mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-500/12 text-sky-300 border border-sky-500/20">
                      {stats.proxima.tipoDescricao}
                    </span>
                  </div>
                )}
              </StatCard>
            )}
          </div>
        </div>
      </div>

      {/* Dialog */}
      <AudienciasDiaDialog
        audiencias={audienciasDia}
        data={dataSelecionada}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />
    </TooltipProvider>
  );
}
