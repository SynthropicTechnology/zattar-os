'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import {
  getYear,
  getMonth,
  getDate,
  format,
  parseISO,
  differenceInDays,
  getDaysInMonth,
  startOfMonth,
  getDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import type { Expediente } from '../domain';

// =============================================================================
// TIPOS
// =============================================================================

interface ExpedientesYearHeatmapProps {
  expedientes: Expediente[];
  currentDate?: Date;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

// =============================================================================
// HELPERS
// =============================================================================

function getDayBg(count: number): string {
  if (count === 0) return 'bg-white/[0.05]';
  if (count <= 2) return 'bg-primary/[0.15]';
  if (count <= 5) return 'bg-primary/[0.35]';
  if (count <= 10) return 'bg-primary/[0.55]';
  return 'bg-primary/[0.80]';
}

// =============================================================================
// STAT CARD
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
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 px-5">
      <div className="flex items-center gap-2 mb-2">
        <IconContainer size="sm" className={iconBg}>
          <Icon className={cn('size-3.5', iconColor)} />
        </IconContainer>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// =============================================================================
// MONTH GRID
// =============================================================================

const MonthGrid = React.memo(function MonthGrid({
  monthIndex,
  year,
  dayMap,
  onDayClick,
}: {
  monthIndex: number;
  year: number;
  dayMap: Map<string, Expediente[]>;
  onDayClick: (month: number, day: number) => void;
}) {
  const monthName = format(new Date(year, monthIndex, 1), 'MMMM', {
    locale: ptBR,
  });
  const daysInMonth = getDaysInMonth(new Date(year, monthIndex));
  const firstDayOfWeek = getDay(startOfMonth(new Date(year, monthIndex)));
  const offset = (firstDayOfWeek + 6) % 7; // Monday-start

  let monthTotal = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    monthTotal += (dayMap.get(`${monthIndex}-${d}`) || []).length;
  }

  const now = new Date();
  const currentYear = getYear(now);
  const currentMonth = getMonth(now);
  const currentDay = getDate(now);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold capitalize text-foreground">
          {monthName}
        </span>
        <span className="text-[9px] tabular-nums text-muted-foreground/50">
          {monthTotal}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-[2px] mb-0.5">
        {WEEKDAY_LABELS.map((d, i) => (
          <span
            key={i}
            className="text-[7px] font-semibold text-center text-muted-foreground/30 uppercase"
          >
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`e${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const exps = dayMap.get(`${monthIndex}-${day}`) || [];
          const count = exps.length;
          const isToday =
            year === currentYear &&
            monthIndex === currentMonth &&
            day === currentDay;

          return (
            <Tooltip key={day}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => count > 0 && onDayClick(monthIndex, day)}
                  className={cn(
                    'aspect-square rounded-[2px] transition-all duration-100',
                    getDayBg(count),
                    count > 0 &&
                      'cursor-pointer hover:scale-[1.3] hover:opacity-80',
                    count === 0 && 'cursor-default',
                    isToday &&
                      'ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent',
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {format(new Date(year, monthIndex, day), "d 'de' MMMM", {
                  locale: ptBR,
                })}{' '}
                · {count} exp.
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
});

// =============================================================================
// DAY DETAIL DIALOG
// =============================================================================

function ExpedientesDayDialog({
  expedientes,
  date,
  open,
  onOpenChange,
}: {
  expedientes: Expediente[];
  date: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dateLabel = format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="capitalize">{dateLabel}</DialogTitle>
          <DialogDescription>
            {expedientes.length} expediente{expedientes.length !== 1 ? 's' : ''}{' '}
            neste dia
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 pr-2">
            {expedientes.map((exp) => (
              <div
                key={exp.id}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <IconContainer size="sm" className="bg-primary/15">
                    <FileText className="size-3.5 text-primary" />
                  </IconContainer>
                  <span className="text-xs font-medium tabular-nums truncate">
                    {exp.numeroProcesso}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="neutral" tone="soft">
                    {exp.trt}
                  </Badge>
                  {exp.prazoVencido && (
                    <Badge variant="destructive" tone="soft">
                      Vencido
                    </Badge>
                  )}
                  {exp.baixadoEm && (
                    <Badge variant="success" tone="soft">
                      Baixado
                    </Badge>
                  )}
                </div>
                {exp.classeJudicial && (
                  <p className="text-[10px] text-muted-foreground/60 truncate">
                    {exp.classeJudicial}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesYearHeatmap({
  expedientes,
  currentDate,
}: ExpedientesYearHeatmapProps) {
  const currentYear = getYear(currentDate ?? new Date());
  const [year, setYear] = useState(currentYear);

  // Dialog state
  const [selectedDayExps, setSelectedDayExps] = useState<Expediente[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  // Day map
  const dayMap = useMemo(() => {
    const map = new Map<string, Expediente[]>();
    for (const exp of expedientes) {
      const prazo = exp.dataPrazoLegalParte;
      if (!prazo) continue;
      const d = parseISO(prazo);
      if (getYear(d) !== year) continue;
      const key = `${getMonth(d)}-${getDate(d)}`;
      const arr = map.get(key) || [];
      arr.push(exp);
      map.set(key, arr);
    }
    return map;
  }, [expedientes, year]);

  // Stats
  const stats = useMemo(() => {
    const yearExps = expedientes.filter((e) => {
      const prazo = e.dataPrazoLegalParte;
      if (!prazo) return false;
      return getYear(parseISO(prazo)) === year;
    });
    const baixados = yearExps.filter((e) => e.baixadoEm);
    const pendentes = yearExps.filter((e) => !e.baixadoEm);
    const vencidos = pendentes.filter(
      (e) =>
        e.prazoVencido ||
        (e.dataPrazoLegalParte &&
          differenceInDays(parseISO(e.dataPrazoLegalParte), new Date()) < 0),
    );
    const hoje = pendentes.filter(
      (e) =>
        e.dataPrazoLegalParte &&
        differenceInDays(parseISO(e.dataPrazoLegalParte), new Date()) === 0,
    );
    const proximos = pendentes.filter((e) => {
      if (!e.dataPrazoLegalParte) return false;
      const d = differenceInDays(
        parseISO(e.dataPrazoLegalParte),
        new Date(),
      );
      return d > 0 && d <= 3;
    });

    const monthCounts = Array.from({ length: 12 }, (_, m) =>
      yearExps.filter(
        (e) =>
          e.dataPrazoLegalParte &&
          getMonth(parseISO(e.dataPrazoLegalParte)) === m,
      ).length,
    );
    const maxMonthIdx = monthCounts.indexOf(Math.max(...monthCounts));
    const maxMonthCount = monthCounts[maxMonthIdx] || 0;

    const weeksElapsed = Math.max(
      1,
      Math.ceil(differenceInDays(new Date(), new Date(year, 0, 1)) / 7),
    );
    const weekAvg = Math.round(yearExps.length / weeksElapsed);

    return {
      total: yearExps.length,
      baixados: baixados.length,
      pendentes: pendentes.length,
      vencidos: vencidos.length,
      hoje: hoje.length,
      proximos: proximos.length,
      taxa:
        yearExps.length > 0
          ? Math.round((baixados.length / yearExps.length) * 100)
          : 0,
      monthCounts,
      maxMonthIdx,
      maxMonthCount,
      weekAvg,
    };
  }, [expedientes, year]);

  // Top months ranking
  const topMonths = useMemo(() => {
    return stats.monthCounts
      .map((count, idx) => ({ idx, count }))
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [stats.monthCounts]);

  // Day click handler
  const handleDayClick = useCallback(
    (monthIndex: number, day: number) => {
      const exps = dayMap.get(`${monthIndex}-${day}`) || [];
      if (exps.length > 0) {
        setSelectedDayExps(exps);
        setSelectedDate(new Date(year, monthIndex, day));
        setDialogOpen(true);
      }
    },
    [dayMap, year],
  );

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col gap-5">
        {/* Year Navigator */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-white/[0.08] bg-white/[0.06] backdrop-blur-sm hover:bg-white/[0.12] rounded-xl"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Ano anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-section-title w-14 text-center tabular-nums">
            {year}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-white/[0.08] bg-white/[0.06] backdrop-blur-sm hover:bg-white/[0.12] rounded-xl"
            onClick={() => setYear((y) => y + 1)}
            aria-label="Próximo ano"
          >
            <ChevronRight className="size-4" />
          </Button>
          {year !== getYear(new Date()) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs border border-white/[0.08] bg-primary/8 text-primary hover:bg-primary/14 rounded-lg"
              onClick={() => setYear(getYear(new Date()))}
            >
              Hoje
            </Button>
          )}
        </div>

        {/* Main Layout */}
        <div className="flex gap-5 flex-wrap xl:flex-nowrap">
          {/* Stats Sidebar */}
          <GlassPanel
            depth={2}
            className="w-full xl:w-64 shrink-0 p-5 space-y-3"
          >
            {/* Total no Ano */}
            <StatCard
              icon={CalendarDays}
              iconBg="bg-primary/15"
              iconColor="text-primary"
              label="Total no Ano"
            >
              <Text variant="kpi-value">{stats.total}</Text>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                expedientes recebidos
              </p>
            </StatCard>

            {/* Baixados */}
            <StatCard
              icon={CheckCircle2}
              iconBg="bg-success/12"
              iconColor="text-success"
              label="Baixados"
            >
              <Text variant="kpi-value">{stats.baixados}</Text>
              <div className="mt-2 h-1 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-success transition-all duration-500"
                  style={{ width: `${stats.taxa}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                {stats.taxa}% conclusao
              </p>
            </StatCard>

            {/* Pendentes */}
            <StatCard
              icon={AlertTriangle}
              iconBg="bg-warning/12"
              iconColor="text-warning"
              label="Pendentes"
            >
              <Text variant="kpi-value" className="text-warning">
                {stats.pendentes}
              </Text>
              <div className="mt-2 space-y-1">
                {stats.vencidos > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-destructive" />
                    <span className="text-[10px] text-muted-foreground/60">
                      {stats.vencidos} vencido{stats.vencidos !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {stats.hoje > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-warning" />
                    <span className="text-[10px] text-muted-foreground/60">
                      {stats.hoje} hoje
                    </span>
                  </div>
                )}
                {stats.proximos > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-info" />
                    <span className="text-[10px] text-muted-foreground/60">
                      {stats.proximos} proximos 3 dias
                    </span>
                  </div>
                )}
              </div>
            </StatCard>

            {/* Media Semanal */}
            <StatCard
              icon={BarChart2}
              iconBg="bg-info/12"
              iconColor="text-info"
              label="Media Semanal"
            >
              <Text variant="kpi-value">{stats.weekAvg}</Text>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                expedientes / semana
              </p>
            </StatCard>

            {/* Top Months Ranking */}
            {topMonths.length > 0 && (
              <div className="mt-4">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                  Ranking por Volume
                </span>
                <div className="mt-2 space-y-1.5">
                  {topMonths.map((m, i) => (
                    <div key={m.idx} className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-muted-foreground/40 w-3 text-right">
                        {i + 1}
                      </span>
                      <span className="text-[11px] font-medium w-10">
                        {format(new Date(year, m.idx, 1), 'MMM', {
                          locale: ptBR,
                        })}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{
                            width: `${stats.maxMonthCount > 0 ? (m.count / stats.maxMonthCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold tabular-nums w-7 text-right">
                        {m.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassPanel>

          {/* Heatmap Panel */}
          <GlassPanel depth={1} className="flex-1 min-w-0 p-6">
            <div className="grid grid-cols-4 gap-x-6 gap-y-8">
              {Array.from({ length: 12 }, (_, i) => (
                <MonthGrid
                  key={i}
                  monthIndex={i}
                  year={year}
                  dayMap={dayMap}
                  onDayClick={handleDayClick}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1 justify-end mt-4">
              <span className="text-[9px] text-muted-foreground/40 mr-1">
                Menos
              </span>
              <div className="size-3 rounded-[2px] bg-white/[0.05]" />
              <div className="size-3 rounded-[2px] bg-primary/[0.15]" />
              <div className="size-3 rounded-[2px] bg-primary/[0.35]" />
              <div className="size-3 rounded-[2px] bg-primary/[0.55]" />
              <div className="size-3 rounded-[2px] bg-primary/[0.80]" />
              <span className="text-[9px] text-muted-foreground/40 ml-1">
                Mais
              </span>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Day Detail Dialog */}
      <ExpedientesDayDialog
        expedientes={selectedDayExps}
        date={selectedDate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </TooltipProvider>
  );
}
