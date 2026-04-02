/**
 * AudienciasMissaoContent — Conteúdo da view Missão (content-only)
 * ============================================================================
 * Versão "embeddable" da MissionView: renderiza apenas o conteúdo
 * (hero card + timeline + sidebar), sem header, KPI strip ou view controls.
 * Esses elementos vivem no AudienciasClient pai.
 * ============================================================================
 */

'use client';

import { useMemo, useCallback } from 'react';
import {
  parseISO,
  isSameDay,
  format,
  differenceInMinutes,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Gavel,
  Clock,
  Sun,
  Sunset,
  Moon,
  Video,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/app/app/dashboard/mock/widgets/primitives';

import type { Audiencia } from '../../domain';
import { StatusAudiencia } from '../../domain';
import { MissionCard } from '../mission-card';
import { PostHearingFlow } from '../post-hearing-flow';
import { RhythmStrip } from '../rhythm-strip';
import { LoadHeatmap } from '../load-heatmap';
import { calcPrepItems, calcPrepScore } from '../prep-score';
import { HearingCountdown } from '../hearing-countdown';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AudienciasMissaoContentProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (audiencia: Audiencia) => void;
  responsavelNomes?: Map<number, string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  try { return format(parseISO(iso), 'HH:mm'); } catch { return '—'; }
}

function getBufferMinutes(prevEnd: string, nextStart: string): number {
  try { return differenceInMinutes(parseISO(nextStart), parseISO(prevEnd)); } catch { return 0; }
}

function getBufferLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasMissaoContent({
  audiencias,
  currentDate,
  onDateChange,
  onViewDetail,
  responsavelNomes,
}: AudienciasMissaoContentProps) {
  const now = useMemo(() => new Date(), []);

  // Day audiencias
  const dayAudiencias = useMemo(
    () =>
      audiencias
        .filter((a) => { try { return isSameDay(parseISO(a.dataInicio), currentDate); } catch { return false; } })
        .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)),
    [audiencias, currentDate],
  );

  const marcadas = dayAudiencias.filter((a) => a.status === StatusAudiencia.Marcada);
  const finalizadas = dayAudiencias.filter((a) => a.status === StatusAudiencia.Finalizada);

  // Time sections
  const morning = marcadas.filter((a) => { try { return parseISO(a.dataInicio).getHours() < 12; } catch { return false; } });
  const afternoon = marcadas.filter((a) => { try { const h = parseISO(a.dataInicio).getHours(); return h >= 12 && h < 18; } catch { return false; } });
  const evening = marcadas.filter((a) => { try { return parseISO(a.dataInicio).getHours() >= 18; } catch { return false; } });

  // Next upcoming / last completed
  const nextAudiencia = useMemo(
    () => marcadas.find((a) => { try { return parseISO(a.dataFim) > now; } catch { return false; } }) ?? null,
    [marcadas, now],
  );

  const lastCompleted = useMemo(() => {
    const past = dayAudiencias
      .filter((a) => { try { return parseISO(a.dataFim) <= now && a.status !== StatusAudiencia.Cancelada; } catch { return false; } })
      .sort((a, b) => b.dataFim.localeCompare(a.dataFim));
    return past[0] ?? null;
  }, [dayAudiencias, now]);

  // Date nav
  const handlePrev = useCallback(() => {
    const d = new Date(currentDate); d.setDate(d.getDate() - 1); onDateChange(d);
  }, [currentDate, onDateChange]);
  const handleNext = useCallback(() => {
    const d = new Date(currentDate); d.setDate(d.getDate() + 1); onDateChange(d);
  }, [currentDate, onDateChange]);
  const handleToday = useCallback(() => onDateChange(new Date()), [onDateChange]);

  const isCurrentDay = isToday(currentDate);
  const dateLabel = format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-4">
      {/* Date Navigator */}
      <div className="flex items-center gap-2">
        <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronLeft className="size-4" />
        </button>
        <button onClick={handleToday} className={cn(
          'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
          isCurrentDay ? 'bg-primary/12 text-primary' : 'bg-border/8 text-muted-foreground/50 hover:bg-border/15',
        )}>
          Hoje
        </button>
        <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronRight className="size-4" />
        </button>
        <span className="text-sm font-medium capitalize ml-1">{dateLabel}</span>
      </div>

      {/* Hero Card */}
      {nextAudiencia && (
        <MissionCard
          audiencia={nextAudiencia}
          onOpenProcess={(id) => { window.location.href = `/app/processos/${id}`; }}
          onViewChecklist={(a) => onViewDetail(a)}
        />
      )}

      {!nextAudiencia && lastCompleted && lastCompleted.status !== StatusAudiencia.Finalizada && (
        <PostHearingFlow audiencia={lastCompleted} />
      )}

      {/* Main Grid: Timeline + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline (2/3) */}
        <div className="lg:col-span-2">
          <GlassPanel className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="size-3 text-muted-foreground/50" />
                <span className="text-[11px] font-medium text-muted-foreground/50">Timeline do dia</span>
              </div>
              <span className="text-[9px] tabular-nums text-muted-foreground/50">
                {dayAudiencias.length} audiência{dayAudiencias.length !== 1 ? 's' : ''}
              </span>
            </div>

            {dayAudiencias.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays className="size-8 text-muted-foreground/10 mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground/55">Nenhuma audiência neste dia</p>
              </div>
            ) : (
              <div className="space-y-0">
                {morning.length > 0 && (
                  <>
                    <SectionHeader label="Manhã" icon={Sun} />
                    {morning.map((a, i) => (
                      <div key={a.id}>
                        <TimelineCard audiencia={a} onClick={() => onViewDetail(a)} />
                        {i < morning.length - 1 && renderBuffer(a.dataFim, morning[i + 1].dataInicio)}
                      </div>
                    ))}
                  </>
                )}

                {morning.length > 0 && afternoon.length > 0 && (
                  <div className="flex items-center gap-2 py-3 px-2">
                    <div className="flex-1 h-px bg-border/8" />
                    <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">Intervalo</span>
                    <div className="flex-1 h-px bg-border/8" />
                  </div>
                )}

                {afternoon.length > 0 && (
                  <>
                    <SectionHeader label="Tarde" icon={Sunset} />
                    {afternoon.map((a, i) => (
                      <div key={a.id}>
                        <TimelineCard audiencia={a} onClick={() => onViewDetail(a)} />
                        {i < afternoon.length - 1 && renderBuffer(a.dataFim, afternoon[i + 1].dataInicio)}
                      </div>
                    ))}
                  </>
                )}

                {evening.length > 0 && (
                  <>
                    <SectionHeader label="Noite" icon={Moon} />
                    {evening.map((a) => (
                      <TimelineCard key={a.id} audiencia={a} onClick={() => onViewDetail(a)} />
                    ))}
                  </>
                )}

                {finalizadas.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 py-2 mt-2">
                      <div className="flex-1 h-px bg-border/8" />
                      <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Concluídas</span>
                      <div className="flex-1 h-px bg-border/8" />
                    </div>
                    {finalizadas.map((a) => (
                      <PostHearingFlow key={a.id} audiencia={a} className="mb-2" />
                    ))}
                  </>
                )}
              </div>
            )}
          </GlassPanel>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          <RhythmStrip audiencias={audiencias} />
          <LoadHeatmap audiencias={audiencias} responsavelNomes={responsavelNomes} />
        </div>
      </div>
    </div>
  );
}

// ─── Internal Components ──────────────────────────────────────────────────

function SectionHeader({ label, icon: Icon }: { label: string; icon: typeof Sun }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Icon className="size-3 text-muted-foreground/40" />
      <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-border/6" />
    </div>
  );
}

function renderBuffer(prevEnd: string, nextStart: string) {
  const buffer = getBufferMinutes(prevEnd, nextStart);
  if (buffer <= 0 || buffer >= 180) return null;
  return (
    <div className="flex items-center gap-2 py-1 pl-16">
      <div className="w-px h-4 bg-border/10 ml-0.5" />
      <span className="text-[8px] text-muted-foreground/35">{getBufferLabel(buffer)} buffer</span>
    </div>
  );
}

function TimelineCard({ audiencia, onClick }: { audiencia: Audiencia; onClick: () => void }) {
  const now = new Date();
  let isPast = false;
  let isOngoing = false;
  try {
    isPast = parseISO(audiencia.dataFim) < now;
    isOngoing = parseISO(audiencia.dataInicio) <= now && parseISO(audiencia.dataFim) >= now;
  } catch { /* skip */ }

  const ModalIcon = audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida' ? Video : Building2;
  const prepScore = calcPrepScore(calcPrepItems(audiencia));
  const prepStatus = prepScore >= 80 ? 'good' : prepScore >= 50 ? 'warning' : 'danger';

  return (
    <div className="flex items-stretch gap-3 py-1 group">
      <div className="w-12 shrink-0 flex flex-col items-end pt-2.5">
        <span className={cn('text-[11px] tabular-nums font-medium', isPast ? 'text-muted-foreground/55' : 'text-foreground/60')}>
          {fmtTime(audiencia.dataInicio)}
        </span>
        <span className="text-[9px] tabular-nums text-muted-foreground/50">{fmtTime(audiencia.dataFim)}</span>
      </div>

      <div className="flex flex-col items-center pt-3 shrink-0">
        <div className={cn('size-2 rounded-full', isOngoing ? 'bg-success animate-pulse' : isPast ? 'bg-muted-foreground/20' : 'bg-primary/50')} />
        <div className="flex-1 w-px bg-border/8 mt-1" />
      </div>

      <button
        onClick={onClick}
        className={cn(
          'flex-1 rounded-xl p-3 transition-all duration-200 min-w-0 text-left cursor-pointer',
          'border border-border/12 hover:border-border/20 hover:shadow-sm hover:scale-[1.005]',
          isPast && 'opacity-50',
          isOngoing && 'ring-1 ring-success/20 border-success/15',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Gavel className="size-3 text-primary/40 shrink-0" />
              <h3 className="text-[13px] font-medium text-foreground truncate">{audiencia.tipoDescricao || 'Audiência'}</h3>
              {isOngoing && <span className="text-[8px] font-semibold text-success px-1.5 py-px rounded-full bg-success/10">Agora</span>}
              <span className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[8px] font-semibold tabular-nums shrink-0',
                prepStatus === 'good' ? 'bg-success/10 text-success' : prepStatus === 'warning' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive',
              )}>
                {prepStatus === 'good' ? <CheckCircle2 className="size-2" /> : <AlertTriangle className="size-2" />}
                {prepScore}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/55 tabular-nums mt-0.5 block">{audiencia.numeroProcesso}</span>
          </div>
          {!isPast && !isOngoing && <HearingCountdown targetDate={parseISO(audiencia.dataInicio)} compact />}
        </div>

        {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
          <p className="text-[10px] text-muted-foreground/60 mt-1 truncate ml-5">
            {audiencia.poloAtivoNome || '–'} <span className="text-muted-foreground/45">vs</span> {audiencia.poloPassivoNome || '–'}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 ml-5 flex-wrap">
          <div className="flex items-center gap-1">
            <ModalIcon className="size-2 text-muted-foreground/50" />
            <span className="text-[9px] text-muted-foreground/55">
              {audiencia.modalidade === 'presencial' ? 'Presencial' : audiencia.modalidade === 'hibrida' ? 'Híbrida' : 'Virtual'}
            </span>
          </div>
          {audiencia.trt && <span className="text-[8px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40">{audiencia.trt}</span>}
          {audiencia.urlAudienciaVirtual && (audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida') && (
            <a href={audiencia.urlAudienciaVirtual} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="text-[8px] font-semibold px-1.5 py-px rounded bg-info/8 text-info/50 hover:bg-info/15 transition-colors">
              Entrar na sala
            </a>
          )}
        </div>
      </button>
    </div>
  );
}
