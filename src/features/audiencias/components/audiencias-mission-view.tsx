/**
 * AudienciasMissionView — "Mission Control" para audiencias
 * ============================================================================
 * View inovadora que trata audiencias como missoes com 3 fases:
 * ANTES (preparar) -> DURANTE (participar) -> DEPOIS (registrar)
 *
 * Layout:
 * - Hero: MissionCard da proxima audiencia (ou PostHearingFlow da ultima)
 * - Timeline: Audiencias do dia com buffers e prep status
 * - Sidebar: ConflictAlert + LoadHeatmap
 * ============================================================================
 */

"use client";

import { useMemo, useCallback } from "react";
import { parseISO, isSameDay, format, differenceInMinutes, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Gavel,
  Clock,
  Sun,
  Sunset,
  Moon,
  Video,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/app/app/dashboard/mock/widgets/primitives";
import { SectionDivider, TimeSlotIndicator, CurrentTimeLine } from "@/components/calendar";

import type { Audiencia } from "../domain";
import { StatusAudiencia } from "../domain";
import { MissionCard } from "./mission-card";
import { PostHearingFlow } from "./post-hearing-flow";
import { ConflictAlert } from "./conflict-alert";
import { LoadHeatmap } from "./load-heatmap";
import { PrepScoreBadge, calcPrepItems, calcPrepScore } from "./prep-score";
import { HearingCountdown } from "./hearing-countdown";
import { AudienciaModalidadeBadge } from "./audiencia-modalidade-badge";

// ─── Props ─────────────────────────────────────────────────────────────

export interface AudienciasMissionViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (audiencia: Audiencia) => void;
  onEdit?: (audiencia: Audiencia) => void;
  /** Map de responsavelId -> nome */
  responsavelNomes?: Map<number, string>;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return format(parseISO(iso), "HH:mm");
}

function getBufferMinutes(prevEnd: string, nextStart: string): number {
  return differenceInMinutes(parseISO(nextStart), parseISO(prevEnd));
}

function getBufferLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Component ─────────────────────────────────────────────────────────

export function AudienciasMissionView({
  audiencias,
  currentDate,
  onDateChange,
  onViewDetail,
  onEdit,
  responsavelNomes,
}: AudienciasMissionViewProps) {
  const now = new Date();

  // Filter day's audiencias
  const dayAudiencias = useMemo(
    () =>
      audiencias
        .filter((a) => isSameDay(parseISO(a.dataInicio), currentDate))
        .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)),
    [audiencias, currentDate],
  );

  const marcadas = dayAudiencias.filter((a) => a.status === StatusAudiencia.Marcada);
  const finalizadas = dayAudiencias.filter((a) => a.status === StatusAudiencia.Finalizada);

  // Split by time
  const morningAudiencias = marcadas.filter((a) => parseISO(a.dataInicio).getHours() < 12);
  const afternoonAudiencias = marcadas.filter((a) => {
    const h = parseISO(a.dataInicio).getHours();
    return h >= 12 && h < 18;
  });
  const eveningAudiencias = marcadas.filter((a) => parseISO(a.dataInicio).getHours() >= 18);

  // Next upcoming audiencia
  const nextAudiencia = useMemo(
    () =>
      marcadas.find((a) => parseISO(a.dataFim) > now) ?? null,
    [marcadas, now],
  );

  // Most recently completed (for post-hearing flow)
  const lastCompleted = useMemo(() => {
    const pastToday = dayAudiencias
      .filter((a) => parseISO(a.dataFim) <= now && a.status !== StatusAudiencia.Cancelada)
      .sort((a, b) => b.dataFim.localeCompare(a.dataFim));
    return pastToday[0] ?? null;
  }, [dayAudiencias, now]);

  // Stats
  const stats = useMemo(() => {
    const total = dayAudiencias.length;
    const virtual = dayAudiencias.filter((a) => a.modalidade === "virtual" || a.modalidade === "hibrida").length;
    const presencial = dayAudiencias.filter((a) => a.modalidade === "presencial").length;
    const avgPrep = total > 0
      ? Math.round(dayAudiencias.reduce((acc, a) => acc + calcPrepScore(calcPrepItems(a)), 0) / total)
      : 0;
    return { total, virtual, presencial, avgPrep };
  }, [dayAudiencias]);

  // Date navigation
  const handlePrev = useCallback(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  }, [currentDate, onDateChange]);

  const handleNext = useCallback(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  }, [currentDate, onDateChange]);

  const handleToday = useCallback(() => onDateChange(new Date()), [onDateChange]);

  const isCurrentDay = isToday(currentDate);
  const dateLabel = format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-4">
      {/* Date Navigator + Stats Strip */}
      <GlassPanel depth={2} className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          {/* Date nav */}
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 hover:text-muted-foreground/50 cursor-pointer">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={handleToday} className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
              isCurrentDay ? "bg-primary/12 text-primary" : "bg-border/8 text-muted-foreground/50 hover:bg-border/15",
            )}>
              Hoje
            </button>
            <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 hover:text-muted-foreground/50 cursor-pointer">
              <ChevronRight className="size-4" />
            </button>
            <div className="ml-2">
              <span className="text-sm font-medium capitalize">{dateLabel}</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pt-3 border-t border-border/10">
          <div className="flex items-center gap-2 min-w-max">
            <Gavel className="size-3 text-primary/40" />
            <span className="font-display text-sm font-bold tabular-nums">{stats.total}</span>
            <span className="text-[9px] text-muted-foreground/55">audiências</span>
          </div>
          <div className="w-px h-6 bg-border/8" />
          <div className="flex items-center gap-2 min-w-max">
            <Video className="size-3 text-info/40" />
            <span className="font-display text-sm font-bold tabular-nums">{stats.virtual}</span>
            <span className="text-[9px] text-muted-foreground/55">virtuais</span>
          </div>
          <div className="w-px h-6 bg-border/8" />
          <div className="flex items-center gap-2 min-w-max">
            <Building2 className="size-3 text-warning/40" />
            <span className="font-display text-sm font-bold tabular-nums">{stats.presencial}</span>
            <span className="text-[9px] text-muted-foreground/55">presenciais</span>
          </div>
          <div className="w-px h-6 bg-border/8" />
          <div className="flex items-center gap-2 min-w-max">
            <CheckCircle2 className="size-3 text-success/40" />
            <span className="font-display text-sm font-bold tabular-nums">{stats.avgPrep}%</span>
            <span className="text-[9px] text-muted-foreground/55">prep. média</span>
          </div>
        </div>
      </GlassPanel>

      {/* Main Grid: Timeline + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Main column (5/7) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Hero: Next Mission or Post-Hearing */}
          {nextAudiencia ? (
            <MissionCard
              audiencia={nextAudiencia}
              onOpenProcess={(id) => window.location.href = `/app/processos/${id}`}
              onViewChecklist={(a) => onViewDetail(a)}
            />
          ) : lastCompleted && lastCompleted.status !== StatusAudiencia.Finalizada ? (
            <PostHearingFlow audiencia={lastCompleted} />
          ) : null}

          {/* Timeline */}
          <GlassPanel className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-3 text-muted-foreground/50" />
                <span className="text-[11px] font-medium text-muted-foreground/50">Timeline do dia</span>
              </div>
              <span className="text-[9px] tabular-nums text-muted-foreground/50">
                {dayAudiencias.length} audiência{dayAudiencias.length !== 1 ? "s" : ""}
              </span>
            </div>

            {dayAudiencias.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays className="size-8 text-muted-foreground/10 mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground/55">Nenhuma audiência neste dia</p>
              </div>
            ) : (
              <div className="space-y-0">
                {/* Morning section */}
                {morningAudiencias.length > 0 && (
                  <>
                    <SectionDivider label="Manhã" icon={Sun} />
                    {morningAudiencias.map((a, i) => (
                      <div key={a.id}>
                        <TimelineAudienciaCard audiencia={a} onClick={() => onViewDetail(a)} />
                        {/* Buffer between consecutive */}
                        {i < morningAudiencias.length - 1 && (() => {
                          const buffer = getBufferMinutes(a.dataFim, morningAudiencias[i + 1].dataInicio);
                          if (buffer > 0 && buffer < 180) {
                            return (
                              <TimeSlotIndicator
                                variant={buffer >= 30 ? "focus" : "travel"}
                                startTime={fmtTime(a.dataFim)}
                                endTime={fmtTime(morningAudiencias[i + 1].dataInicio)}
                                label={buffer >= 30 ? `${getBufferLabel(buffer)} para preparar` : `Buffer: ${getBufferLabel(buffer)}`}
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ))}
                  </>
                )}

                {/* Current time indicator */}
                {isCurrentDay && <CurrentTimeLine />}

                {/* Lunch break */}
                {morningAudiencias.length > 0 && afternoonAudiencias.length > 0 && (
                  <TimeSlotIndicator variant="break" startTime="12:00" endTime="13:30" label="Intervalo" />
                )}

                {/* Afternoon section */}
                {afternoonAudiencias.length > 0 && (
                  <>
                    <SectionDivider label="Tarde" icon={Sunset} />
                    {afternoonAudiencias.map((a, i) => (
                      <div key={a.id}>
                        <TimelineAudienciaCard audiencia={a} onClick={() => onViewDetail(a)} />
                        {i < afternoonAudiencias.length - 1 && (() => {
                          const buffer = getBufferMinutes(a.dataFim, afternoonAudiencias[i + 1].dataInicio);
                          if (buffer > 0 && buffer < 180) {
                            return (
                              <TimeSlotIndicator
                                variant={buffer >= 30 ? "focus" : "travel"}
                                startTime={fmtTime(a.dataFim)}
                                endTime={fmtTime(afternoonAudiencias[i + 1].dataInicio)}
                                label={buffer >= 30 ? `${getBufferLabel(buffer)} para preparar` : `Buffer: ${getBufferLabel(buffer)}`}
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ))}
                  </>
                )}

                {/* Evening section */}
                {eveningAudiencias.length > 0 && (
                  <>
                    <SectionDivider label="Noite" icon={Moon} />
                    {eveningAudiencias.map((a) => (
                      <TimelineAudienciaCard key={a.id} audiencia={a} onClick={() => onViewDetail(a)} />
                    ))}
                  </>
                )}

                {/* Post-hearing cards for completed audiencias */}
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

        {/* Sidebar (2/7) */}
        <div className="lg:col-span-2 space-y-4">
          <ConflictAlert audiencias={dayAudiencias} />
          <LoadHeatmap
            audiencias={audiencias}
            responsavelNomes={responsavelNomes}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Audiencia Card (internal) ────────────────────────────────

function TimelineAudienciaCard({ audiencia, onClick }: { audiencia: Audiencia; onClick: () => void }) {
  const isPast = parseISO(audiencia.dataFim) < new Date();
  const isOngoing = parseISO(audiencia.dataInicio) <= new Date() && parseISO(audiencia.dataFim) >= new Date();
  const ModalIcon = audiencia.modalidade === "virtual" || audiencia.modalidade === "hibrida" ? Video : Building2;

  return (
    <div className="flex items-stretch gap-3 py-1 group">
      {/* Time column */}
      <div className="w-11 shrink-0 flex flex-col items-end pt-2.5">
        <span className={cn(
          "text-[11px] tabular-nums font-medium",
          isPast ? "text-muted-foreground/55" : "text-foreground/60",
        )}>
          {fmtTime(audiencia.dataInicio)}
        </span>
        <span className="text-[9px] tabular-nums text-muted-foreground/50">
          {fmtTime(audiencia.dataFim)}
        </span>
      </div>

      {/* Dot + line */}
      <div className="flex flex-col items-center pt-3 shrink-0">
        <div className={cn(
          "size-2 rounded-full",
          isOngoing ? "bg-success animate-pulse" : isPast ? "bg-muted-foreground/20" : "bg-primary/50",
        )} />
        <div className="flex-1 w-px bg-border/8 mt-1" />
      </div>

      {/* Card */}
      <button
        onClick={onClick}
        className={cn(
          "flex-1 rounded-xl p-3 transition-all duration-200 min-w-0 text-left cursor-pointer",
          "border border-border/12 hover:border-border/20 hover:shadow-sm",
          isPast ? "opacity-50" : "",
          isOngoing && "ring-1 ring-success/20 border-success/15",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Gavel className="size-3 text-primary/40 shrink-0" />
              <h3 className="text-[13px] font-medium text-foreground truncate">
                {audiencia.tipoDescricao || "Audiência"}
              </h3>
              {isOngoing && <span className="text-[8px] font-semibold text-success px-1.5 py-px rounded-full bg-success/10">Agora</span>}
              <PrepScoreBadge audiencia={audiencia} />
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/55 tabular-nums mt-0.5 block">
              {audiencia.numeroProcesso}
            </span>
          </div>

          {/* Countdown for upcoming */}
          {!isPast && !isOngoing && (
            <HearingCountdown targetDate={parseISO(audiencia.dataInicio)} compact />
          )}
        </div>

        {/* Parties */}
        {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
          <p className="text-[10px] text-muted-foreground/60 mt-1 truncate ml-5">
            {audiencia.poloAtivoNome || "–"} <span className="text-muted-foreground/45">vs</span> {audiencia.poloPassivoNome || "–"}
          </p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 mt-2 ml-5 flex-wrap">
          <div className="flex items-center gap-1">
            <ModalIcon className="size-2 text-muted-foreground/50" />
            <span className="text-[9px] text-muted-foreground/55">
              {audiencia.modalidade === "presencial" ? "Presencial" : audiencia.modalidade === "hibrida" ? "Híbrida" : "Virtual"}
            </span>
          </div>
          {audiencia.trt && (
            <span className="text-[8px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40">{audiencia.trt}</span>
          )}
          {audiencia.urlAudienciaVirtual && (audiencia.modalidade === "virtual" || audiencia.modalidade === "hibrida") && (
            <a
              href={audiencia.urlAudienciaVirtual}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[8px] font-semibold px-1.5 py-px rounded bg-info/8 text-info/50 hover:bg-info/15 transition-colors"
            >
              Entrar na sala
            </a>
          )}
        </div>
      </button>
    </div>
  );
}
