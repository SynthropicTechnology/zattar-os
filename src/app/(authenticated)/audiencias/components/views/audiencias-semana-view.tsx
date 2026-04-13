/**
 * AudienciasSemanaView — Week view com cards agrupados por dia
 * ============================================================================
 * Apresentação visual: cards em colunas por dia da semana, com GlassPanel.
 * Componente puramente presentacional — recebe dados e callbacks.
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  format,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Video,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import type { Audiencia } from '../../domain';
import { StatusAudiencia } from '../../domain';
import { calcPrepItems, calcPrepScore } from '../prep-score';
import { AudienciaResponsavelPopover, ResponsavelTriggerContent } from '../audiencia-responsavel-popover';

// ─── Types ────────────────────────────────────────────────────────────────

interface Usuario {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
  avatarUrl?: string | null;
}

export interface AudienciasSemanaViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (audiencia: Audiencia) => void;
  responsavelNomes?: Map<number, string>;
  usuarios?: Usuario[];
  onResponsavelChange?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  try {
    return format(parseISO(iso), 'HH:mm');
  } catch {
    return '—';
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasSemanaView({
  audiencias,
  currentDate,
  onDateChange,
  onViewDetail,
  responsavelNomes,
  usuarios,
  onResponsavelChange,
}: AudienciasSemanaViewProps) {
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }),
    [currentDate],
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }),
    [currentDate],
  );
  // Apenas dias úteis (seg-sex) — audiências não ocorrem no fim de semana
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd })
      .filter((d) => d.getDay() !== 0 && d.getDay() !== 6),
    [weekStart, weekEnd],
  );

  const audienciasByDay = useMemo(() => {
    const map = new Map<string, Audiencia[]>();
    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const dayAudiencias = audiencias
        .filter((a) => {
          try {
            return isSameDay(parseISO(a.dataInicio), day);
          } catch {
            return false;
          }
        })
        .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
      map.set(key, dayAudiencias);
    });
    return map;
  }, [audiencias, weekDays]);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    onDateChange(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    onDateChange(d);
  };

  const handleToday = () => onDateChange(new Date());

  const isCurrentWeek = weekDays.some((d) => isToday(d));
  // Label da semana: seg — sex (sem fim de semana)
  const friday = weekDays[weekDays.length - 1];
  const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: ptBR })} — ${format(friday, "d 'de' MMM", { locale: ptBR })}`;

  return (
    <div className="space-y-4">
      {/* Week Navigator */}
      <div className="flex items-center gap-2">
        <button onClick={handlePrevWeek} className="p-1.5 rounded-lg hover:bg-foreground/[0.04] transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleToday}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
            isCurrentWeek ? 'bg-primary/12 text-primary' : 'bg-border/8 text-muted-foreground/50 hover:bg-border/15',
          )}
        >
          Hoje
        </button>
        <button onClick={handleNextWeek} className="p-1.5 rounded-lg hover:bg-foreground/[0.04] transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronRight className="size-4" />
        </button>
        <span className="text-sm font-medium capitalize ml-1">{weekLabel}</span>
      </div>

      {/* Week Grid — 5 colunas (seg-sex), items-start permite alturas independentes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayAudiencias = audienciasByDay.get(key) ?? [];
          const today = isToday(day);

          return (
            <GlassPanel
              key={key}
              depth={today ? 2 : 1}
              className="p-4 min-h-40"
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider',
                    today ? 'text-primary' : 'text-muted-foreground/55',
                  )}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span className={cn(
                    'text-sm font-bold tabular-nums',
                    today
                      ? 'bg-primary text-primary-foreground size-6 rounded-full flex items-center justify-center text-[11px]'
                      : 'text-foreground/80',
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                {dayAudiencias.length > 0 && (
                  <span className="text-[10px] tabular-nums text-muted-foreground/45 font-medium">
                    {dayAudiencias.length}
                  </span>
                )}
              </div>

              {/* Audiencias */}
              {dayAudiencias.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-6">
                  <span className="text-xs text-muted-foreground/30">—</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayAudiencias.map((a) => (
                    <WeekDayCard key={a.id} audiencia={a} onClick={() => onViewDetail(a)} responsavelNomes={responsavelNomes} usuarios={usuarios} onResponsavelChange={onResponsavelChange} />
                  ))}
                </div>
              )}
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}

// ─── Internal: Week Day Card ──────────────────────────────────────────────

function WeekDayCard({ audiencia, onClick, responsavelNomes, usuarios, onResponsavelChange }: { audiencia: Audiencia; onClick: () => void; responsavelNomes?: Map<number, string>; usuarios?: Usuario[]; onResponsavelChange?: () => void }) {
  const now = new Date();
  let isPast = false;
  let isOngoing = false;
  const isFinalizada = audiencia.status === StatusAudiencia.Finalizada;
  try {
    isPast = parseISO(audiencia.dataFim) < now;
    isOngoing = parseISO(audiencia.dataInicio) <= now && parseISO(audiencia.dataFim) >= now;
  } catch { /* skip */ }

  const prepScore = calcPrepScore(calcPrepItems(audiencia));
  const prepStatus = prepScore >= 80 ? 'good' : prepScore >= 50 ? 'warning' : 'danger';
  const isVirtual = audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer',
        'bg-card/80 border-border/40 hover:border-border/60 hover:shadow-sm hover:scale-[1.01]',
        (isPast || isFinalizada) && 'opacity-60',
        isOngoing && 'ring-1 ring-success/30 border-success/25 bg-success/3',
      )}
    >
      {/* 1. Hora + Status */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs tabular-nums font-semibold text-foreground/80">
          {fmtTime(audiencia.dataInicio)} – {fmtTime(audiencia.dataFim)}
        </span>
        <div className="flex items-center gap-1.5">
          {isOngoing && <span className="size-2 rounded-full bg-success animate-pulse" />}
          {isFinalizada && <span className="text-[9px] font-semibold text-success px-1.5 py-0.5 rounded-full bg-success/15">OK</span>}
          <span className={cn(
            'text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full',
            prepStatus === 'good' ? 'bg-success/15 text-success' : prepStatus === 'warning' ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive',
          )}>
            {prepScore}%
          </span>
        </div>
      </div>

      {/* 2. Tipo + Modalidade (mesma linha) */}
      <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
        <p className="text-xs font-medium text-foreground break-words leading-snug truncate">
          {audiencia.tipoDescricao || 'Audiência'}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          {isVirtual ? <Video className="size-2.5 text-info/60" /> : audiencia.modalidade === 'presencial' ? <Building2 className="size-2.5 text-warning/60" /> : null}
          <span className="text-[9px] text-muted-foreground/55">
            {audiencia.modalidade === 'virtual' ? 'Virtual' : audiencia.modalidade === 'presencial' ? 'Presencial' : audiencia.modalidade === 'hibrida' ? 'Híbrida' : ''}
          </span>
        </div>
        {audiencia.urlAudienciaVirtual && isVirtual && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-info/15 text-info/70 shrink-0">Sala</span>
        )}
      </div>

      {/* 3. Partes */}
      {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
        <p className="text-[10px] text-muted-foreground/55 mt-1 break-words leading-snug">
          {audiencia.poloAtivoNome || '—'} <span className="text-muted-foreground/35">vs</span> {audiencia.poloPassivoNome || '—'}
        </p>
      )}

      {/* 4. TRT badge + Número do processo (mesma linha, TRT na frente) */}
      {audiencia.numeroProcesso && (
        <div className="flex items-center gap-1.5 mt-1 min-w-0">
          {audiencia.trt && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary/70 shrink-0">{audiencia.trt}</span>
          )}
          <span className="text-[10px] text-muted-foreground/60 tabular-nums truncate">
            {audiencia.numeroProcesso}
          </span>
        </div>
      )}

      {/* 9. Responsável — footer, alinhado à direita */}
      <div className="flex justify-end mt-2">
        {usuarios ? (
          <AudienciaResponsavelPopover
            audienciaId={audiencia.id}
            responsavelId={audiencia.responsavelId}
            usuarios={usuarios}
            onSuccess={onResponsavelChange}
            align="end"
          >
            <ResponsavelTriggerContent
              responsavelId={audiencia.responsavelId}
              usuarios={usuarios}
              size="sm"
            />
          </AudienciaResponsavelPopover>
        ) : (
          audiencia.responsavelId && responsavelNomes?.get(audiencia.responsavelId) ? (
            <span className="text-[9px] text-muted-foreground/55">
              {responsavelNomes.get(audiencia.responsavelId)}
            </span>
          ) : (
            <span className="text-[9px] italic text-warning/60">Sem resp.</span>
          )
        )}
      </div>
    </button>
  );
}
