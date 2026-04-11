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
  isWeekend,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Monitor,
  Building2,
  User,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import type { Audiencia } from '../domain';
import {
  StatusAudiencia,
  STATUS_AUDIENCIA_LABELS,
  ModalidadeAudiencia,
} from '../domain';
import { AudienciaDetailDialog } from './audiencia-detail-dialog';

// =============================================================================
// HELPERS
// =============================================================================

const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getStatusDotClass(status: StatusAudiencia): string {
  switch (status) {
    case StatusAudiencia.Marcada: return 'bg-emerald-500';
    case StatusAudiencia.Finalizada: return 'bg-blue-400';
    case StatusAudiencia.Cancelada: return 'bg-red-400';
    default: return 'bg-muted-foreground';
  }
}

function getStatusBadgeClass(status: StatusAudiencia): string {
  switch (status) {
    case StatusAudiencia.Marcada:
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    case StatusAudiencia.Finalizada:
      return 'bg-blue-400/15 text-blue-300 border-blue-400/25';
    case StatusAudiencia.Cancelada:
      return 'bg-red-400/15 text-red-300 border-red-400/25';
    default:
      return 'bg-white/10 text-muted-foreground border-white/10';
  }
}

function groupByDay(audiencias: Audiencia[]): Map<string, Audiencia[]> {
  const map = new Map<string, Audiencia[]>();
  for (const aud of audiencias) {
    const key = format(parseISO(aud.dataInicio), 'yyyy-MM-dd');
    const list = map.get(key) || [];
    list.push(aud);
    map.set(key, list);
  }
  return map;
}

function computeSummary(audiencias: Audiencia[]) {
  const total = audiencias.length;
  const marcadas = audiencias.filter(a => a.status === StatusAudiencia.Marcada).length;
  const finalizadas = audiencias.filter(a => a.status === StatusAudiencia.Finalizada).length;
  const canceladas = audiencias.filter(a => a.status === StatusAudiencia.Cancelada).length;
  return { total, marcadas, finalizadas, canceladas };
}

// =============================================================================
// DAY CELL COMPONENT
// =============================================================================

function DayCell({
  day,
  audienciasDia,
  isCurrentMonth,
  onSelect,
}: {
  day: Date;
  audienciasDia: Audiencia[];
  isCurrentMonth: boolean;
  onSelect: (day: Date, audiencias: Audiencia[]) => void;
}) {
  const today = isToday(day);
  const weekend = isWeekend(day);
  const count = audienciasDia.length;

  return (
    <button
      type="button"
      onClick={() => count > 0 && onSelect(day, audienciasDia)}
      className={cn(
        'relative min-h-[88px] p-2 rounded-xl border border-transparent transition-all duration-150 text-left',
        'hover:bg-white/[0.06] hover:border-white/[0.08]',
        !isCurrentMonth && 'opacity-35',
        weekend && isCurrentMonth && 'opacity-55',
        count > 0 && 'cursor-pointer',
        count === 0 && 'cursor-default',
      )}
    >
      <div className={cn(
        'text-[0.8125rem] font-semibold w-[26px] h-[26px] flex items-center justify-center',
        today
          ? 'bg-primary text-primary-foreground rounded-full font-bold'
          : 'text-foreground/85',
      )}>
        {format(day, 'd')}
      </div>

      {count > 0 && count <= 3 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {audienciasDia.map((aud) => (
            <div
              key={aud.id}
              className={cn('w-[7px] h-[7px] rounded-full shrink-0', getStatusDotClass(aud.status))}
            />
          ))}
        </div>
      )}

      {count > 3 && (
        <div className="flex gap-1 mt-1.5">
          <span className="text-[0.65rem] font-bold text-foreground/70 bg-white/[0.10] border border-white/[0.10] rounded-full px-1.5 py-px inline-flex items-center justify-center">
            {count}
          </span>
        </div>
      )}
    </button>
  );
}

// =============================================================================
// POPOVER HEARING ITEM
// =============================================================================

function HearingItem({ audiencia }: { audiencia: Audiencia }) {
  return (
    <div className="rounded-lg p-2 px-2.5 bg-white/[0.04] border border-white/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-foreground/30 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground/85">
              {audiencia.horaInicio || '—'} · {audiencia.tipoDescricao || 'Audiência'}
            </p>
            <p className="text-xs text-foreground/35 mt-0.5 font-mono">
              {audiencia.numeroProcesso}
            </p>
          </div>
        </div>
        <span className={cn(
          'text-[0.625rem] font-semibold tracking-[0.03em] px-[7px] py-0.5 rounded-full border shrink-0',
          getStatusBadgeClass(audiencia.status),
        )}>
          {STATUS_AUDIENCIA_LABELS[audiencia.status]}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-2 ml-5">
        <div className="flex items-center gap-1 text-foreground/30">
          {audiencia.modalidade === ModalidadeAudiencia.Virtual
            ? <Monitor className="w-3 h-3" />
            : <Building2 className="w-3 h-3" />}
          <span className="text-xs">
            {audiencia.modalidade === ModalidadeAudiencia.Virtual
              ? 'Virtual'
              : audiencia.modalidade === ModalidadeAudiencia.Hibrida
                ? 'Híbrida'
                : 'Presencial'}
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasGlassMonth({
  audiencias,
  currentMonth,
  onMonthChange,
  refetch,
}: {
  audiencias: Audiencia[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  refetch: () => void;
}) {
  const [popoverDay, setPopoverDay] = React.useState<Date | null>(null);
  const [popoverAuds, setPopoverAuds] = React.useState<Audiencia[]>([]);
  const [detailAudiencia, setDetailAudiencia] = React.useState<Audiencia | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const dayMap = React.useMemo(() => groupByDay(audiencias), [audiencias]);
  const summary = React.useMemo(() => computeSummary(audiencias), [audiencias]);

  // Build calendar grid (Monday-start)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const handleDaySelect = React.useCallback((day: Date, auds: Audiencia[]) => {
    setPopoverDay(day);
    setPopoverAuds(auds);
  }, []);

  const handleViewDetail = React.useCallback((aud: Audiencia) => {
    setDetailAudiencia(aud);
    setDetailOpen(true);
    setPopoverDay(null);
  }, []);

  return (
    <>
      <div className="p-4 sm:p-6 flex flex-col h-full overflow-y-auto">
        <GlassPanel depth={1} className="p-5 md:p-6 flex-1">
          {/* Month Navigator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 border border-white/[0.08] bg-white/[0.07] backdrop-blur-sm hover:bg-white/[0.12]"
                onClick={() => onMonthChange(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4 text-foreground/60" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 border border-white/[0.08] bg-white/[0.07] backdrop-blur-sm hover:bg-white/[0.12]"
                onClick={() => onMonthChange(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4 text-foreground/60" />
              </Button>
              <Button
                size="sm"
                className="ml-1 rounded-full px-4 text-xs font-semibold"
                onClick={() => onMonthChange(new Date())}
              >
                Hoje
              </Button>
            </div>

            <span className="text-base font-bold tracking-tight">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
            </span>

            <div />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 px-1">
            {[
              { color: 'bg-emerald-500', label: 'Marcada' },
              { color: 'bg-blue-400', label: 'Finalizada' },
              { color: 'bg-red-400', label: 'Cancelada' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={cn('w-[7px] h-[7px] rounded-full', color)} />
                <span className="text-[0.7rem] text-foreground/45">{label}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {WEEKDAY_HEADERS.map(label => (
              <div key={label} className="text-center py-2 text-xs font-semibold uppercase tracking-widest text-foreground/25">
                {label}
              </div>
            ))}

            {/* Day cells */}
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const auds = dayMap.get(key) || [];
              const isPopoverOpen = popoverDay && isSameDay(day, popoverDay);

              return (
                <div key={key} className="relative">
                  {auds.length > 0 ? (
                    <Popover
                      open={!!isPopoverOpen}
                      onOpenChange={(open) => {
                        if (!open) setPopoverDay(null);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <div>
                          <DayCell
                            day={day}
                            audienciasDia={auds}
                            isCurrentMonth={isSameMonth(day, currentMonth)}
                            onSelect={handleDaySelect}
                          />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-72 p-3.5 bg-background/95 backdrop-blur-3xl border-white/[0.12] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
                        side="bottom"
                        align="center"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-bold">
                              {format(day, "d 'de' MMMM, yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-foreground/35 mt-0.5">
                              {format(day, 'EEEE', { locale: ptBR })} · {auds.length} audiência{auds.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPopoverDay(null)}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-foreground/40" />
                          </button>
                        </div>
                        <div className="space-y-1.5 max-h-64 overflow-y-auto">
                          {auds.map(aud => (
                            <button
                              key={aud.id}
                              type="button"
                              onClick={() => handleViewDetail(aud)}
                              className="w-full text-left"
                            >
                              <HearingItem audiencia={aud} />
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <DayCell
                      day={day}
                      audienciasDia={[]}
                      isCurrentMonth={isSameMonth(day, currentMonth)}
                      onSelect={() => {}}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Strip */}
          <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="text-lg font-bold">{summary.total}</p>
                <p className="text-xs text-foreground/30 mt-0.5">Total no mês</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400/80">{summary.marcadas}</p>
                <p className="text-xs text-foreground/30 mt-0.5">Marcadas</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400/80">{summary.finalizadas}</p>
                <p className="text-xs text-foreground/30 mt-0.5">Finalizadas</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-red-400/80">{summary.canceladas}</p>
                <p className="text-xs text-foreground/30 mt-0.5">Canceladas</p>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Detail Dialog */}
      {detailAudiencia && (
        <AudienciaDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          audiencia={detailAudiencia}
        />
      )}
    </>
  );
}
