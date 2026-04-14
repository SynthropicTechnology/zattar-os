'use client';

import * as React from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  type Expediente,
  type UrgencyLevel,
  getExpedientePartyNames,
  getExpedienteUrgencyLevel,
} from '../domain';
import { URGENCY_BORDER, URGENCY_DOT, getExpedienteDiasRestantes } from './urgency-helpers';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';

// =============================================================================
// HELPERS
// =============================================================================

const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function groupByDay(expedientes: Expediente[]): Map<string, Expediente[]> {
  const map = new Map<string, Expediente[]>();
  for (const exp of expedientes) {
    if (!exp.dataPrazoLegalParte) continue;
    try {
      const key = format(parseISO(exp.dataPrazoLegalParte), 'yyyy-MM-dd');
      const list = map.get(key) || [];
      list.push(exp);
      map.set(key, list);
    } catch {
      // ignore invalid dates
    }
  }
  return map;
}

function computeSummary(expedientes: Expediente[]) {
  let total = 0;
  let vencidos = 0;
  let hoje = 0;
  let proximos = 0;
  for (const exp of expedientes) {
    if (!exp.dataPrazoLegalParte) continue;
    if (exp.baixadoEm) continue;
    total++;
    const dias = getExpedienteDiasRestantes(exp);
    if (dias === null) continue;
    if (dias < 0 || exp.prazoVencido) vencidos++;
    else if (dias === 0) hoje++;
    else if (dias <= 3) proximos++;
  }
  return { total, vencidos, hoje, proximos };
}

function getUrgencyLabel(level: UrgencyLevel): string {
  switch (level) {
    case 'critico': return 'Vencido';
    case 'alto': return 'Hoje';
    case 'medio': return 'Próximos';
    case 'baixo': return 'No prazo';
    case 'ok': return 'Outros';
  }
}

// =============================================================================
// DAY CELL COMPONENT
// =============================================================================

function DayCell({
  day,
  expedientesDia,
  isCurrentMonth,
  onSelect,
}: {
  day: Date;
  expedientesDia: Expediente[];
  isCurrentMonth: boolean;
  onSelect: (day: Date, expedientes: Expediente[]) => void;
}) {
  const today = isToday(day);
  const count = expedientesDia.length;
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

  return (
    <button
      type="button"
      onClick={() => count > 0 && onSelect(day, expedientesDia)}
      className={cn(
        'relative w-full min-h-25 sm:min-h-30 p-2.5 rounded-xl transition-all duration-150 text-left flex flex-col h-full',
        'border border-border/40',
        'hover:bg-accent/40 hover:border-border/60',
        'active:bg-accent/20 active:scale-[0.98]',
        isWeekend && 'bg-muted/25',
        !isCurrentMonth && 'opacity-45',
        count > 0 && 'cursor-pointer',
        count === 0 && 'cursor-default',
      )}
    >
      <div className={cn(
        'text-sm font-semibold w-7 h-7 flex items-center justify-center',
        today
          ? 'bg-primary text-primary-foreground rounded-full font-bold'
          : 'text-foreground/85',
      )}>
        {format(day, 'd')}
      </div>

      {count > 0 && count < 3 && (
        <div className="flex gap-1 mt-auto pt-1.5 flex-wrap">
          {expedientesDia.map((exp) => (
            <div
              key={exp.id}
              className={cn(
                'w-1.75 h-1.75 rounded-full shrink-0',
                URGENCY_DOT[getExpedienteUrgencyLevel(exp)],
              )}
            />
          ))}
        </div>
      )}

      {count >= 3 && (
        <div className="flex gap-1 mt-auto pt-1.5">
          <span className="text-[10px] font-bold text-primary bg-primary/15 rounded-full px-1.5 py-0.5 inline-flex items-center justify-center min-w-4.5">
            {count}
          </span>
        </div>
      )}
    </button>
  );
}

// =============================================================================
// POPOVER EXPEDIENTE ITEM
// =============================================================================

function ExpedienteItem({ expediente }: { expediente: Expediente }) {
  const urgency = getExpedienteUrgencyLevel(expediente);
  const dias = getExpedienteDiasRestantes(expediente);
  const partes = getExpedientePartyNames(expediente);
  const tipoExpediente =
    (expediente as Expediente & { tipoExpediente?: { tipoExpediente?: string } })
      .tipoExpediente?.tipoExpediente ?? 'Expediente';

  let diasLabel = '—';
  if (dias !== null) {
    if (dias < 0) diasLabel = `${Math.abs(dias)}d atraso`;
    else if (dias === 0) diasLabel = 'Hoje';
    else diasLabel = `${dias}d restantes`;
  }

  return (
    <div
      className={cn(
        'rounded-lg p-2.5 border border-border/30 bg-muted/15',
        'hover:bg-accent/40 transition-colors cursor-pointer',
        URGENCY_BORDER[urgency],
      )}
    >
      {/* Linha principal: tempo + tipo */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground/85 truncate">
          {tipoExpediente}
        </span>
        <span className="text-[10px] font-semibold tracking-[0.03em] px-1.75 py-0.5 rounded-full border border-border/30 bg-muted/20 text-foreground/60 shrink-0">
          {diasLabel}
        </span>
      </div>

      {/* Processo */}
      <div className="mt-1.5 text-xs text-foreground/45 tabular-nums truncate">
        {expediente.numeroProcesso}
      </div>

      {/* Partes */}
      <div className="mt-1 text-[11px] text-foreground/45 truncate">
        {(partes.autora || '—')}
        <span className="text-foreground/25"> vs </span>
        {(partes.re || '—')}
      </div>

      {/* Órgão Julgador */}
      {expediente.orgaoJulgadorOrigem && (
        <div className="mt-1 text-[11px] text-foreground/35 truncate">
          {expediente.orgaoJulgadorOrigem}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export interface ExpedientesMonthWrapperProps {
  expedientes: Expediente[];
  onViewDetail?: (expediente: Expediente) => void;
}

export function ExpedientesMonthWrapper({
  expedientes,
  onViewDetail,
}: ExpedientesMonthWrapperProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => startOfMonth(new Date()));
  const [popoverDay, setPopoverDay] = React.useState<Date | null>(null);
  const [detailExpediente, setDetailExpediente] = React.useState<Expediente | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const dayMap = React.useMemo(() => groupByDay(expedientes), [expedientes]);
  const summary = React.useMemo(() => computeSummary(expedientes), [expedientes]);

  // Build calendar grid (Monday-start)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const handleDaySelect = React.useCallback((day: Date) => {
    setPopoverDay(day);
  }, []);

  const handleViewDetail = React.useCallback((exp: Expediente) => {
    setPopoverDay(null);
    if (onViewDetail) {
      onViewDetail(exp);
    } else {
      setDetailExpediente(exp);
      setDetailOpen(true);
    }
  }, [onViewDetail]);

  return (
    <>
      <GlassPanel depth={1} className="p-4 sm:p-6 flex flex-col">
        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="w-4 h-4 text-foreground/60" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="w-4 h-4 text-foreground/60" />
            </Button>
            <Button
              size="sm"
              className="ml-1 rounded-full px-4 text-xs font-semibold"
              onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            >
              Hoje
            </Button>
          </div>

          <span className="text-base font-bold tracking-tight text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
          </span>

          <div className="flex-1" />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 px-1 flex-wrap">
          {(['critico', 'alto', 'medio', 'baixo'] as UrgencyLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <div className={cn('w-1.75 h-1.75 rounded-full', URGENCY_DOT[level])} />
              <span className="text-[11px] text-foreground/45">{getUrgencyLabel(level)}</span>
            </div>
          ))}
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {WEEKDAY_HEADERS.map((label, idx) => (
            <div
              key={label}
              className={cn(
                'text-center py-2 text-xs font-semibold uppercase tracking-widest',
                idx >= 5 ? 'text-foreground/35' : 'text-foreground/50',
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 flex-1" style={{ gridAutoRows: '1fr' }}>
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const exps = dayMap.get(key) || [];
            const isPopoverOpen = popoverDay && isSameDay(day, popoverDay);

            return (
              <div key={key} className="relative h-full">
                {exps.length > 0 ? (
                  <Popover
                    open={!!isPopoverOpen}
                    onOpenChange={(open) => {
                      if (!open) setPopoverDay(null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <div className="h-full">
                        <DayCell
                          day={day}
                          expedientesDia={exps}
                          isCurrentMonth={isSameMonth(day, currentMonth)}
                          onSelect={handleDaySelect}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-80 p-4 bg-background/95 backdrop-blur-3xl border-border/50 rounded-2xl shadow-2xl"
                      side="bottom"
                      align="start"
                      sideOffset={6}
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-bold capitalize">
                            {format(day, "d 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-foreground/40 mt-0.5 capitalize">
                            {format(day, 'EEEE', { locale: ptBR })} · {exps.length} expediente{exps.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPopoverDay(null)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent/50 border border-border/30 transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-foreground/50" />
                        </button>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                        {exps.map((exp) => (
                          <button
                            key={exp.id}
                            type="button"
                            onClick={() => handleViewDetail(exp)}
                            className="w-full text-left"
                          >
                            <ExpedienteItem expediente={exp} />
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <DayCell
                    day={day}
                    expedientesDia={[]}
                    isCurrentMonth={isSameMonth(day, currentMonth)}
                    onSelect={() => {}}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Strip */}
        <div className="mt-5 pt-4 border-t border-border/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-lg font-bold">{summary.total}</p>
              <p className="text-xs text-foreground/40 mt-0.5">Pendentes</p>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className="text-lg font-bold text-destructive">{summary.vencidos}</p>
              <p className="text-xs text-foreground/40 mt-0.5">Vencidos</p>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className="text-lg font-bold text-warning">{summary.hoje}</p>
              <p className="text-xs text-foreground/40 mt-0.5">Hoje</p>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className="text-lg font-bold text-info">{summary.proximos}</p>
              <p className="text-xs text-foreground/40 mt-0.5">Próximos 3d</p>
            </div>
          </div>
        </div>
      </GlassPanel>

      {detailExpediente && (
        <ExpedienteVisualizarDialog
          expediente={detailExpediente}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </>
  );
}
