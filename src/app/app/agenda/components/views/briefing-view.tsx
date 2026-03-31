/**
 * BriefingView — Timeline inteligente + sidebar de preparacao
 * ============================================================================
 * A view inovadora da Agenda: narrativa do dia, timeline com eventos ricos,
 * janelas de foco, indicadores de deslocamento, prep radar e alertas.
 * ============================================================================
 */

"use client";

import React, { useMemo } from "react";
import {
  Clock,
  Sun,
  Sunset,
  Video,
  Building2,
  FileText,
  Users,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Shield,
  Zap,
  ArrowRight,
  ExternalLink,
  Calendar,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/app/app/dashboard/mock/widgets/primitives";

import {
  EventChip,
  SectionDivider,
  TimeSlotIndicator,
  CurrentTimeLine,
  ProgressItem,
  AlertCard,
} from "@/components/calendar";

import {
  SOURCE_CONFIG,
  COLOR_MAP,
  type EventColor,
} from "@/features/calendar/briefing-domain";
import {
  buildBriefingText,
  fmtTime,
  extractMeta,
  getEventsForDay,
  getTimedEvents,
  getAllDayEvents,
} from "@/features/calendar/briefing-helpers";
import { estimateTravelTime } from "@/features/calendar/travel-helpers";

import type { AgendaEvent } from "../../lib/adapters";

// ─── Props ─────────────────────────────────────────────────────────────

export interface BriefingViewProps {
  events: AgendaEvent[];
  currentDate: Date;
  onEventClick: (e: AgendaEvent) => void;
}

// ─── Source Icon Map ───────────────────────────────────────────────────

const SOURCE_ICONS: Record<string, LucideIcon> = {
  agenda: Calendar,
  audiencias: Timer,
  expedientes: FileText,
  obrigacoes: FileText,
  pericias: Shield,
};

// ─── Component ─────────────────────────────────────────────────────────

export function BriefingView({ events, currentDate, onEventClick }: BriefingViewProps) {
  const rawEvents = events.map((e) => e.raw);

  const dayEvents = useMemo(() => events.filter((e) => {
    if (e.allDay) {
      const d = new Date(currentDate);
      d.setHours(12, 0, 0, 0);
      const s = new Date(e.start);
      s.setHours(0, 0, 0, 0);
      const end = new Date(e.end);
      end.setHours(23, 59, 59, 999);
      return d >= s && d <= end;
    }
    return e.start.getFullYear() === currentDate.getFullYear() &&
           e.start.getMonth() === currentDate.getMonth() &&
           e.start.getDate() === currentDate.getDate();
  }), [events, currentDate]);

  const timed = useMemo(() => dayEvents.filter((e) => !e.allDay).sort((a, b) => a.start.getTime() - b.start.getTime()), [dayEvents]);
  const allDay = useMemo(() => dayEvents.filter((e) => e.allDay), [dayEvents]);
  const morningEvents = timed.filter((e) => e.start.getHours() < 12);
  const afternoonEvents = timed.filter((e) => e.start.getHours() >= 12);

  const needsPrep = dayEvents.filter((e) => e.meta.prepStatus && e.meta.prepStatus !== "preparado");
  const alerts = dayEvents.filter((e) => e.meta.prepStatus === "pendente" || e.meta.prazoVencido);

  const briefingText = buildBriefingText(rawEvents, currentDate);

  return (
    <div className="space-y-4">
      {/* Briefing text */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/8 bg-primary/2 px-4 py-3.5 sm:px-5">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/3 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <div className="size-1.5 rounded-full bg-primary animate-pulse mt-2 shrink-0" />
          <p className="text-[13px] text-foreground/70 leading-relaxed">{briefingText}</p>
        </div>
      </div>

      {/* Grid: Timeline + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Timeline (5/7) */}
        <div className="lg:col-span-5">
          <GlassPanel className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-3 text-muted-foreground/50" />
                <span className="text-[11px] font-medium text-muted-foreground/50">Linha do Tempo</span>
              </div>
              <div className="flex items-center gap-2">
                {(["audiencias", "agenda", "expedientes"] as const).map((s) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={cn("size-1.5 rounded-full", COLOR_MAP[SOURCE_CONFIG[s].defaultColor].dot)} />
                    <span className="text-[8px] text-muted-foreground/50">{SOURCE_CONFIG[s].label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-0">
              {/* All-day events */}
              {allDay.length > 0 && (
                <div className="mb-3 pb-2 border-b border-border/8">
                  <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground/45 font-semibold">Dia inteiro</span>
                  <div className="mt-1 space-y-1">
                    {allDay.map((ev) => (
                      <EventChip key={ev.id} title={ev.title} color={ev.color} past={ev.end < new Date()} onClick={() => onEventClick(ev)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Morning */}
              <SectionDivider label="Manhã" icon={Sun} />

              {timed.length > 0 && (
                <TimeSlotIndicator
                  variant="focus"
                  startTime="08:00"
                  endTime={fmtTime(timed[0].start)}
                  label="Preparação"
                />
              )}

              {morningEvents.map((ev, i) => (
                <div key={ev.id}>
                  <BriefingEventCard event={ev} onClick={() => onEventClick(ev)} />
                  {/* Travel between consecutive presencial */}
                  {i < morningEvents.length - 1 && (() => {
                    const travel = estimateTravelTime(ev.meta, morningEvents[i + 1].meta);
                    return travel ? <TimeSlotIndicator variant="travel" startTime="" minutes={travel.minutes} /> : null;
                  })()}
                </div>
              ))}

              <CurrentTimeLine />
              <TimeSlotIndicator variant="break" startTime="12:00" endTime="13:30" label="Intervalo" />

              {/* Afternoon */}
              <SectionDivider label="Tarde" icon={Sunset} />

              {afternoonEvents.map((ev) => (
                <BriefingEventCard key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
              ))}

              <TimeSlotIndicator variant="focus" startTime="17:00" endTime="18:30" label="Encerramento" />
            </div>
          </GlassPanel>
        </div>

        {/* Sidebar (2/7) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Prep Radar */}
          <GlassPanel className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="size-3 text-warning/40" />
              <span className="text-[11px] font-medium text-muted-foreground/50">Preparação</span>
              {needsPrep.length > 0 && (
                <span className="text-[9px] tabular-nums px-1.5 py-0.5 rounded-full bg-warning/8 text-warning/50 font-semibold ml-auto">{needsPrep.length}</span>
              )}
            </div>
            <div className="space-y-2">
              {needsPrep.length > 0 ? needsPrep.map((ev) => {
                const SrcIcon = SOURCE_ICONS[ev.source] ?? Calendar;
                const docs = ev.meta.prepStatus ? 1 : 0;
                return (
                  <ProgressItem
                    key={ev.id}
                    title={ev.title}
                    subtitle={fmtTime(ev.start)}
                    icon={SrcIcon}
                    color={ev.color}
                    progress={ev.meta.prepStatus === "parcial" ? 50 : 0}
                    leftLabel={ev.meta.prepStatus === "parcial" ? "Parcial" : "Pendente"}
                    onClick={() => onEventClick(ev)}
                  />
                );
              }) : (
                <div className="py-4 text-center">
                  <CheckCircle2 className="size-5 text-success/25 mx-auto mb-1.5" />
                  <p className="text-[10px] text-success/40 font-medium">Tudo pronto</p>
                </div>
              )}
            </div>
          </GlassPanel>

          {/* Alerts */}
          {(alerts.length > 0 || needsPrep.length > 0) && (
            <GlassPanel className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="size-3 text-destructive/40" />
                <span className="text-[11px] font-medium text-muted-foreground/50">Alertas</span>
              </div>
              <div className="space-y-2">
                {dayEvents.filter((e) => e.meta.prepStatus === "pendente").map((ev) => (
                  <AlertCard key={ev.id} icon={Timer} title={ev.title} description={ev.meta.descricao ?? "Preparação pendente"} variant="destructive" />
                ))}
                {dayEvents.filter((e) => e.meta.prazoVencido).map((ev) => (
                  <AlertCard key={ev.id} icon={FileText} title="Prazo vencido" description={ev.title} variant="destructive" />
                ))}
                {dayEvents.filter((e) => e.meta.prepStatus === "parcial").map((ev) => (
                  <AlertCard key={ev.id} icon={FileText} title="Preparação parcial" description={ev.title} variant="warning" />
                ))}
              </div>
            </GlassPanel>
          )}

          {/* Quick Actions */}
          <GlassPanel className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="size-3 text-primary/40" />
              <span className="text-[11px] font-medium text-muted-foreground/50">Ações</span>
            </div>
            <div className="space-y-0.5">
              {[
                { label: "Abrir PJe", icon: ExternalLink },
                { label: "Preparar peça", icon: FileText },
                { label: "Confirmar testemunhas", icon: Users },
                { label: "Pauta da semana", icon: Calendar },
              ].map((a) => (
                <button key={a.label} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] text-muted-foreground/50 hover:text-foreground/70 hover:bg-white/4 transition-all cursor-pointer group">
                  <a.icon className="size-2.5 text-muted-foreground/45 group-hover:text-primary/40 transition-colors" />
                  {a.label}
                  <ArrowRight className="size-2 ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
                </button>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

// ─── Briefing Event Card (internal) ────────────────────────────────────

function BriefingEventCard({ event, onClick }: { event: AgendaEvent; onClick: () => void }) {
  const c = COLOR_MAP[event.color] ?? COLOR_MAP.violet;
  const SrcIcon = SOURCE_ICONS[event.source] ?? Calendar;
  const ModalIcon = event.meta.modalidade === "virtual" || event.meta.modalidade === "hibrida" ? Video : Building2;
  const prep = event.meta.prepStatus;
  const isAudiencia = event.source === "audiencias";
  const isPast = event.end < new Date();
  const isOngoing = event.start <= new Date() && event.end >= new Date();

  // Countdown for audiencias < 2h away
  const isNearby = isAudiencia && !isPast && !isOngoing &&
    (event.start.getTime() - Date.now()) < 2 * 60 * 60 * 1000;

  return (
    <div className="flex items-stretch gap-3 py-1 group">
      <div className="w-11 shrink-0 flex flex-col items-end pt-2.5">
        <span className={cn(
          "text-[11px] tabular-nums font-medium",
          isPast ? "text-muted-foreground/55" : "text-foreground/60",
        )}>{fmtTime(event.start)}</span>
        <span className="text-[9px] tabular-nums text-muted-foreground/50">{fmtTime(event.end)}</span>
      </div>
      <div className="flex flex-col items-center pt-3 shrink-0">
        <div className={cn(
          "size-2 rounded-full",
          isOngoing ? "bg-success animate-pulse" : isPast ? "bg-muted-foreground/20" : c.dot,
        )} />
        <div className="flex-1 w-px bg-border/8 mt-1" />
      </div>
      <button onClick={onClick} className={cn(
        "flex-1 rounded-xl border-l-[3px] p-3 transition-all duration-200 min-w-0 text-left",
        "border border-border/12 hover:border-border/20 hover:shadow-sm cursor-pointer",
        isAudiencia && isOngoing && "ring-1 ring-success/20 border-success/15",
        isPast && "opacity-50",
        c.bg,
      )} style={{ borderLeftColor: `var(--color-${event.color === "emerald" ? "green" : event.color}-500, currentColor)` }}>
        <div className="flex items-start gap-2">
          <div className={cn("size-6 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
            <SrcIcon className={cn("size-3", c.text)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-medium text-foreground truncate">{event.title}</h3>
              {isOngoing && isAudiencia && (
                <span className="text-[8px] font-semibold text-success px-1.5 py-px rounded-full bg-success/10 shrink-0">Agora</span>
              )}
              {prep && (
                <span className={cn(
                  "flex items-center gap-0.5 px-1.5 py-px rounded-full text-[8px] font-semibold shrink-0",
                  prep === "preparado" ? "bg-success/10 text-success" : prep === "parcial" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive",
                )}>
                  {prep === "preparado" ? <CheckCircle2 className="size-2" /> : prep === "parcial" ? <Circle className="size-2" /> : <AlertTriangle className="size-2" />}
                  {prep === "preparado" ? "Preparado" : prep === "parcial" ? "Parcial" : "Pendente"}
                </span>
              )}
              {/* Countdown for nearby audiencias */}
              {isNearby && (
                <NearbyCountdown target={event.start} />
              )}
            </div>
            {event.meta.processo && <span className="text-[9px] font-mono text-muted-foreground/55 tabular-nums">{event.meta.processo}</span>}
          </div>
        </div>
        {event.meta.descricao && <p className="text-[10px] text-muted-foreground/60 mt-1 truncate ml-8">{event.meta.descricao}</p>}
        <div className="flex items-center gap-2 mt-2 ml-8 flex-wrap">
          {event.meta.local && (
            <div className="flex items-center gap-1">
              <ModalIcon className="size-2 text-muted-foreground/50" />
              <span className="text-[9px] text-muted-foreground/55 truncate max-w-40">{event.meta.local}</span>
            </div>
          )}
          {event.meta.trt && <span className="text-[8px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40">{event.meta.trt}</span>}
          {event.meta.modalidade && (
            <span className={cn("text-[8px] font-semibold px-1.5 py-px rounded", event.meta.modalidade === "presencial" ? "bg-warning/8 text-warning/50" : "bg-info/8 text-info/50")}>
              {event.meta.modalidade === "presencial" ? "Presencial" : "Virtual"}
            </span>
          )}
          {/* Deep link to audiencias page */}
          {isAudiencia && event.url && (
            <a
              href={event.url}
              onClick={(e) => e.stopPropagation()}
              className="text-[8px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40 hover:bg-primary/10 transition-colors"
            >
              Ver detalhes →
            </a>
          )}
          {/* Virtual room link */}
          {isAudiencia && event.meta.urlAudienciaVirtual && (event.meta.modalidade === "virtual" || event.meta.modalidade === "hibrida") && (
            <a
              href={event.meta.urlAudienciaVirtual}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[8px] font-semibold px-1.5 py-px rounded bg-info/8 text-info/50 hover:bg-info/15 transition-colors"
            >
              Entrar na sala
            </a>
          )}
        </div>
        {/* Post-hearing nudge */}
        {isAudiencia && isPast && !prep && (
          <div className="mt-2 ml-8 flex items-center gap-1.5 px-2 py-1 rounded-md bg-warning/5 border border-warning/10">
            <Clock className="size-2.5 text-warning/40" />
            <span className="text-[9px] text-warning/50">Registrar resultado da audiência</span>
          </div>
        )}
      </button>
    </div>
  );
}

// ─── Nearby Countdown (inline, updates every minute) ──────────────────

function NearbyCountdown({ target }: { target: Date }) {
  const [label, setLabel] = React.useState("");

  React.useEffect(() => {
    function update() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setLabel(""); return; }
      const mins = Math.floor(diff / 60000);
      if (mins < 60) setLabel(`em ${mins}min`);
      else {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        setLabel(`em ${h}h${m > 0 ? ` ${m}min` : ""}`);
      }
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [target]);

  if (!label) return null;

  const diff = target.getTime() - Date.now();
  const isUrgent = diff < 30 * 60 * 1000; // < 30min

  return (
    <span className={cn(
      "text-[8px] font-semibold px-1.5 py-px rounded-full tabular-nums shrink-0",
      isUrgent ? "bg-destructive/10 text-destructive" : "bg-warning/8 text-warning/60",
    )}>
      {label}
    </span>
  );
}
