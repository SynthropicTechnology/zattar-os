"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Eye,
  Check,
  Gavel,
  Brain,
  AlertTriangle,
  Sun,
  Sunset,
  Coffee,
  MapPin,
  Video,
  Building2,
  FileText,
  Users,
  CheckCircle2,
  Circle,
  Shield,
  Zap,
  ArrowRight,
  ExternalLink,
  Timer,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";
import {
  type CalendarView,
  type EventSource,
  type MockCalendarEvent,
  SOURCE_CONFIG,
  COLOR_MAP,
  today,
  addDays,
  isToday,
  isPast,
  startOfWeek,
  getMonthGrid,
  getWeekDays,
  weekdayShort,
  weekdayFull,
  monthName,
  fmtTime,
  fmtDate,
  fmtDateFull,
  generateMockEvents,
  generateWeekPulse,
  getDaySummary,
  getEventsForDay,
  getTimedEvents,
  getAllDayEvents,
} from "./data";

// ============================================================================
// AGENDA MOCK — Full Feature Mock
// ============================================================================
// Acesse em: /app/agenda/mock
// 5 views: Mês, Semana, Dia, Lista (Agenda), Briefing (inovação)
// 5 fontes: Agenda, Audiências, Expedientes, Obrigações, Perícias
// Toolbar: search, filtro por fonte, view switcher, criar evento, nav
// ============================================================================

const VIEW_OPTIONS: { id: CalendarView; label: string; shortcut: string }[] = [
  { id: "month", label: "Mês", shortcut: "M" },
  { id: "week", label: "Semana", shortcut: "W" },
  { id: "day", label: "Dia", shortcut: "D" },
  { id: "agenda", label: "Lista", shortcut: "A" },
  { id: "briefing", label: "Briefing", shortcut: "B" },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 - 21:00

// ============================================================================
// Toolbar
// ============================================================================

function Toolbar({
  view,
  setView,
  currentDate,
  onPrev,
  onNext,
  onToday,
  search,
  setSearch,
  sourceFilter,
  toggleSource,
  onNewEvent,
}: {
  view: CalendarView;
  setView: (v: CalendarView) => void;
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  search: string;
  setSearch: (s: string) => void;
  sourceFilter: Set<EventSource>;
  toggleSource: (s: EventSource) => void;
  onNewEvent: () => void;
}) {
  const [viewOpen, setViewOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const dateLabel = useMemo(() => {
    if (view === "month") return `${monthName(currentDate)} ${currentDate.getFullYear()}`;
    if (view === "week") {
      const start = startOfWeek(currentDate);
      const end = addDays(start, 6);
      if (start.getMonth() === end.getMonth()) return `${start.getDate()}–${end.getDate()} de ${monthName(start).toLowerCase()}`;
      return `${start.getDate()} ${monthName(start).slice(0, 3).toLowerCase()} – ${end.getDate()} ${monthName(end).slice(0, 3).toLowerCase()}`;
    }
    if (view === "day" || view === "briefing") return fmtDateFull(currentDate);
    return `${monthName(currentDate)} ${currentDate.getFullYear()}`;
  }, [view, currentDate]);

  const activeFilters = sourceFilter.size;

  return (
    <div className="space-y-3">
      {/* Row 1: Title + New Event */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{dateLabel}</p>
        </div>
        <button
          onClick={onNewEvent}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Novo evento</span>
        </button>
      </div>

      {/* Row 2: Search + Filters + Nav + View */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/55" />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/4 border border-border/15 text-xs placeholder:text-muted-foreground/55 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/55 hover:text-muted-foreground/50 cursor-pointer">
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Source Filter */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer",
              activeFilters > 0
                ? "border-primary/20 bg-primary/6 text-primary"
                : "border-border/15 text-muted-foreground/50 hover:text-muted-foreground/70",
            )}
          >
            Tipo
            {activeFilters > 0 && (
              <span className="text-[9px] px-1 py-0.5 rounded-full bg-primary/15 tabular-nums">{activeFilters}</span>
            )}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 w-48 p-1.5 rounded-xl border border-border/20 bg-background shadow-lg">
                {(Object.keys(SOURCE_CONFIG) as EventSource[]).map((src) => {
                  const cfg = SOURCE_CONFIG[src];
                  const active = sourceFilter.has(src);
                  return (
                    <button
                      key={src}
                      onClick={() => toggleSource(src)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/4 transition-colors cursor-pointer"
                    >
                      <div className={cn("size-3.5 rounded border flex items-center justify-center", active ? "bg-primary border-primary" : "border-border/30")}>
                        {active && <Check className="size-2.5 text-primary-foreground" />}
                      </div>
                      <cfg.icon className="size-3 text-muted-foreground/60" />
                      <span className={cn(active ? "text-foreground" : "text-muted-foreground/60")}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Date Nav */}
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 hover:text-muted-foreground/50 cursor-pointer">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={onToday} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/8 text-primary hover:bg-primary/12 transition-colors cursor-pointer">
            Hoje
          </button>
          <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 hover:text-muted-foreground/50 cursor-pointer">
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="relative">
          <button
            onClick={() => setViewOpen(!viewOpen)}
            className="p-1.5 rounded-lg hover:bg-white/4 border border-border/15 transition-colors text-muted-foreground/60 hover:text-muted-foreground/60 cursor-pointer"
          >
            <Eye className="size-4" />
          </button>
          {viewOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setViewOpen(false)} />
              <div className="absolute top-full right-0 mt-1 z-50 w-40 p-1.5 rounded-xl border border-border/20 bg-background shadow-lg">
                {VIEW_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setView(opt.id); setViewOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                      view === opt.id ? "bg-primary/8 text-primary" : "text-muted-foreground/60 hover:bg-white/4",
                    )}
                  >
                    <span>{opt.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-muted-foreground/50">{opt.shortcut}</span>
                      {view === opt.id && <Check className="size-3" />}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Command Header (Stats + Week Pulse)
// ============================================================================

function CommandHeader({ events, currentDate }: { events: MockCalendarEvent[]; currentDate: Date }) {
  const summary = getDaySummary(events, currentDate);
  const pulse = generateWeekPulse(events, currentDate);
  const maxH = Math.max(...pulse.map((d) => d.horas), 1);

  function intColor(h: number) {
    if (h === 0) return "bg-border/8";
    if (h <= 3) return "bg-success/30";
    if (h <= 5) return "bg-primary/35";
    if (h <= 7) return "bg-warning/35";
    return "bg-destructive/35";
  }

  return (
    <GlassPanel depth={2} className="p-4 sm:p-5">
      {/* Stats row */}
      <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto pb-3 border-b border-border/10">
        {[
          { icon: Calendar, v: String(summary.total), l: "eventos", c: "text-primary" },
          { icon: Gavel, v: String(summary.audiencias), l: "audiências", c: "text-primary" },
          { icon: Clock, v: summary.horasOcupado, l: "ocupado", c: "text-warning" },
          { icon: Brain, v: summary.horasFoco, l: "foco livre", c: "text-success" },
          { icon: AlertTriangle, v: String(summary.alertas), l: "alertas", c: "text-destructive" },
        ].map((s, i) => (
          <div key={s.l} className="flex items-center gap-2 min-w-max">
            {i > 0 && <div className="w-px h-6 bg-border/8 shrink-0 hidden sm:block" />}
            <s.icon className={cn("size-3 opacity-40 shrink-0", s.c)} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-sm font-bold tabular-nums">{s.v}</span>
              <span className="text-[9px] text-muted-foreground/55 hidden sm:inline">{s.l}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Week pulse row */}
      <div className="flex items-end justify-between gap-1.5 sm:gap-2 pt-3">
        {pulse.map((day) => {
          const h = day.horas > 0 ? Math.max(14, (day.horas / maxH) * 100) : 6;
          return (
            <div key={day.dia} className="flex flex-col items-center gap-1 flex-1">
              <span className={cn("text-[9px] tabular-nums font-medium", day.hoje ? "text-primary" : day.eventos > 0 ? "text-muted-foreground/60" : "text-muted-foreground/60")}>
                {day.eventos || "–"}
              </span>
              <div
                className={cn("w-2.5 sm:w-3 rounded-full transition-all duration-500", intColor(day.horas), day.hoje && "ring-1 ring-primary/25 ring-offset-1 ring-offset-transparent")}
                style={{ height: `${h}%`, minHeight: 4, maxHeight: 36 }}
              />
              <span className={cn("text-[9px] font-medium", day.hoje ? "text-primary font-semibold" : "text-muted-foreground/55")}>
                {day.dia}
              </span>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ============================================================================
// Shared: Event Chip (compact, for month/week/day)
// ============================================================================

function EventChip({ event, compact = false, onClick }: { event: MockCalendarEvent; compact?: boolean; onClick?: () => void }) {
  const c = COLOR_MAP[event.color];
  const past = isPast(event.end);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate transition-colors cursor-pointer border",
        c.bg, c.text, c.border,
        past && "opacity-60 line-through",
        "hover:opacity-80",
      )}
    >
      {!compact && !event.allDay && (
        <span className="tabular-nums mr-1 opacity-70">{fmtTime(event.start)}</span>
      )}
      {event.title}
    </button>
  );
}

// ============================================================================
// Month View
// ============================================================================

function MonthView({ events, currentDate, onEventClick }: { events: MockCalendarEvent[]; currentDate: Date; onEventClick: (e: MockCalendarEvent) => void }) {
  const grid = getMonthGrid(currentDate);
  const thisMonth = currentDate.getMonth();

  return (
    <GlassPanel className="p-2 sm:p-3 overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="text-center text-[10px] text-muted-foreground/60 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 border-t border-l border-border/10">
        {grid.map((date, i) => {
          const dayEvents = getEventsForDay(events, date);
          const isCurrentMonth = date.getMonth() === thisMonth;
          const isDateToday = isToday(date);
          const maxVisible = 3;
          const overflow = dayEvents.length - maxVisible;

          return (
            <div
              key={i}
              className={cn(
                "border-r border-b border-border/10 min-h-20 sm:min-h-24 p-1 transition-colors",
                !isCurrentMonth && "bg-muted/2",
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-center mb-0.5">
                <span className={cn(
                  "text-[11px] tabular-nums font-medium size-6 flex items-center justify-center rounded-full",
                  isDateToday ? "bg-primary text-primary-foreground font-bold" : isCurrentMonth ? "text-foreground/70" : "text-muted-foreground/50",
                )}>
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, maxVisible).map((ev) => (
                  <EventChip key={ev.id} event={ev} compact onClick={() => onEventClick(ev)} />
                ))}
                {overflow > 0 && (
                  <button className="w-full text-center text-[9px] text-muted-foreground/60 hover:text-muted-foreground/60 py-0.5 cursor-pointer">
                    +{overflow} mais
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ============================================================================
// Week View
// ============================================================================

function WeekView({ events, currentDate, onEventClick }: { events: MockCalendarEvent[]; currentDate: Date; onEventClick: (e: MockCalendarEvent) => void }) {
  const days = getWeekDays(currentDate);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <GlassPanel className="p-2 sm:p-3 overflow-hidden">
      {/* Header row: time + day labels */}
      <div className="grid grid-cols-8 border-b border-border/10 pb-1 mb-1">
        <div className="text-[9px] text-muted-foreground/50" />
        {days.map((d) => (
          <div key={d.toISOString()} className="text-center">
            <span className={cn("text-[10px] font-medium", isToday(d) ? "text-primary" : "text-muted-foreground/50")}>{weekdayShort(d)}</span>
            <div className={cn(
              "text-sm tabular-nums font-semibold mx-auto size-7 flex items-center justify-center rounded-full mt-0.5",
              isToday(d) ? "bg-primary text-primary-foreground" : "text-foreground/60",
            )}>
              {d.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* All-day section */}
      {(() => {
        const allDayByDay = days.map((d) => getAllDayEvents(getEventsForDay(events, d)));
        const hasAllDay = allDayByDay.some((arr) => arr.length > 0);
        if (!hasAllDay) return null;
        return (
          <div className="grid grid-cols-8 border-b border-border/10 pb-1 mb-1">
            <div className="text-[8px] text-muted-foreground/45 flex items-center justify-end pr-2">dia inteiro</div>
            {allDayByDay.map((dayEvents, i) => (
              <div key={i} className="px-0.5 space-y-0.5">
                {dayEvents.map((ev) => (
                  <EventChip key={ev.id} event={ev} compact onClick={() => onEventClick(ev)} />
                ))}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Time grid */}
      <div className="grid grid-cols-8 max-h-130 overflow-y-auto relative">
        {/* Time labels + Day columns */}
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            {/* Time label */}
            <div className="text-[9px] tabular-nums text-muted-foreground/50 text-right pr-2 h-16 flex items-start -mt-1.5">
              {String(hour).padStart(2, "0")}:00
            </div>
            {/* Day cells */}
            {days.map((day) => {
              const cellEvents = getTimedEvents(getEventsForDay(events, day)).filter(
                (e) => e.start.getHours() === hour || (e.start.getHours() < hour && e.end.getHours() > hour)
              );
              const startEvents = cellEvents.filter((e) => e.start.getHours() === hour);
              const isNowCell = isToday(day) && now.getHours() === hour;

              return (
                <div key={`${hour}-${day.toISOString()}`} className="border-t border-l border-border/6 h-16 px-0.5 py-0.5 relative">
                  {/* Current time line */}
                  {isNowCell && (
                    <div
                      className="absolute left-0 right-0 z-10 flex items-center"
                      style={{ top: `${((nowMinutes - hour * 60) / 60) * 100}%` }}
                    >
                      <div className="size-1.5 rounded-full bg-destructive" />
                      <div className="flex-1 h-px bg-destructive/50" />
                    </div>
                  )}
                  {startEvents.map((ev) => (
                    <EventChip key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// ============================================================================
// Day View
// ============================================================================

function DayView({ events, currentDate, onEventClick }: { events: MockCalendarEvent[]; currentDate: Date; onEventClick: (e: MockCalendarEvent) => void }) {
  const dayEvents = getEventsForDay(events, currentDate);
  const allDay = getAllDayEvents(dayEvents);
  const timed = getTimedEvents(dayEvents);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isViewToday = isToday(currentDate);

  return (
    <GlassPanel className="p-3 sm:p-4">
      {/* Day header */}
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border/10">
        <div className={cn(
          "size-10 rounded-xl flex items-center justify-center",
          isViewToday ? "bg-primary text-primary-foreground" : "bg-border/10 text-foreground/70",
        )}>
          <span className="text-lg font-bold tabular-nums">{currentDate.getDate()}</span>
        </div>
        <div>
          <p className={cn("text-sm font-medium", isViewToday ? "text-primary" : "text-foreground/70")}>{weekdayFull(currentDate)}</p>
          <p className="text-[10px] text-muted-foreground/60">{fmtDate(currentDate)} · {dayEvents.length} evento{dayEvents.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* All-day events */}
      {allDay.length > 0 && (
        <div className="mb-3 pb-2 border-b border-border/10">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider font-medium">Dia inteiro</span>
          <div className="mt-1 space-y-1">
            {allDay.map((ev) => (
              <EventChip key={ev.id} event={ev} compact onClick={() => onEventClick(ev)} />
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="relative max-h-130rflow-y-auto">
        {HOURS.map((hour) => {
          const hourEvents = timed.filter((e) => e.start.getHours() === hour);
          const isNowHour = isViewToday && now.getHours() === hour;

          return (
            <div key={hour} className="flex gap-3 h-16 relative">
              {/* Time label */}
              <div className="w-12 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground/50 -mt-1.5 pr-2">
                {String(hour).padStart(2, "0")}:00
              </div>
              {/* Events area */}
              <div className="flex-1 border-t border-border/6 py-0.5 space-y-0.5 relative">
                {isNowHour && (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center"
                    style={{ top: `${((nowMinutes - hour * 60) / 60) * 100}%` }}
                  >
                    <div className="size-2 rounded-full bg-destructive" />
                    <div className="flex-1 h-px bg-destructive/50" />
                  </div>
                )}
                {hourEvents.map((ev) => (
                  <EventChip key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ============================================================================
// Agenda (List) View
// ============================================================================

function AgendaListView({ events, currentDate, onEventClick }: { events: MockCalendarEvent[]; currentDate: Date; onEventClick: (e: MockCalendarEvent) => void }) {
  // Group events by day for next 30 days
  const days = useMemo(() => {
    const result: { date: Date; events: MockCalendarEvent[] }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(currentDate, i);
      const dayEvents = getEventsForDay(events, d).sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return a.start.getTime() - b.start.getTime();
      });
      if (dayEvents.length > 0) {
        result.push({ date: d, events: dayEvents });
      }
    }
    return result;
  }, [events, currentDate]);

  return (
    <GlassPanel className="p-4 sm:p-5">
      <div className="space-y-0">
        {days.length === 0 && (
          <div className="py-16 flex flex-col items-center text-center">
            <Calendar className="size-8 text-muted-foreground/45 mb-3" />
            <p className="text-sm font-medium text-muted-foreground/60">Nenhum evento encontrado</p>
            <p className="text-xs text-muted-foreground/50">nos próximos 30 dias</p>
          </div>
        )}
        {days.map(({ date, events: dayEvents }) => {
          const isDateToday = isToday(date);
          return (
            <div key={date.toISOString()} className="border-b border-border/6 last:border-b-0">
              {/* Day header */}
              <div className="flex items-center gap-3 py-2.5 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <div className={cn(
                  "size-8 rounded-lg flex items-center justify-center shrink-0",
                  isDateToday ? "bg-primary text-primary-foreground" : "bg-border/8",
                )}>
                  <span className={cn("text-sm font-bold tabular-nums", !isDateToday && "text-foreground/60")}>{date.getDate()}</span>
                </div>
                <div>
                  <span className={cn("text-xs font-medium", isDateToday ? "text-primary" : "text-foreground/60")}>{weekdayFull(date)}</span>
                  <span className="text-[10px] text-muted-foreground/55 ml-2">{fmtDate(date)}</span>
                </div>
                <span className="text-[9px] text-muted-foreground/45 ml-auto tabular-nums">{dayEvents.length}</span>
              </div>

              {/* Events */}
              <div className="pl-11 pb-2 space-y-1">
                {dayEvents.map((ev) => {
                  const c = COLOR_MAP[ev.color];
                  const srcCfg = SOURCE_CONFIG[ev.source];
                  const SrcIcon = srcCfg.icon;
                  const past = isPast(ev.end);

                  return (
                    <button
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      className={cn(
                        "w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer",
                        c.bg, "border", c.border,
                        past && "opacity-60",
                        "hover:opacity-80",
                      )}
                    >
                      <div className={cn("size-1.5 rounded-full shrink-0", c.dot.replace("bg-", "bg-"))} style={{ backgroundColor: undefined }}>
                        <div className={cn("size-1.5 rounded-full", c.dot)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-medium truncate", c.text, past && "line-through")}>{ev.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                            {ev.allDay ? "Dia inteiro" : `${fmtTime(ev.start)} – ${fmtTime(ev.end)}`}
                          </span>
                          {ev.location && (
                            <>
                              <span className="text-muted-foreground/60">·</span>
                              <span className="text-[10px] text-muted-foreground/55 truncate">{ev.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <SrcIcon className="size-3 text-muted-foreground/45 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ============================================================================
// Briefing View (Innovation) — Timeline + Sidebar
// ============================================================================

function BriefingView({ events, currentDate, onEventClick }: { events: MockCalendarEvent[]; currentDate: Date; onEventClick: (e: MockCalendarEvent) => void }) {
  const dayEvents = getEventsForDay(events, currentDate);
  const timed = getTimedEvents(dayEvents);
  const allDay = getAllDayEvents(dayEvents);
  const needsPrep = dayEvents.filter((e) => e.prepStatus && e.prepStatus !== "preparado");
  const alerts = dayEvents.filter((e) => e.prepStatus === "pendente" || e.prazoVencido);

  // Briefing text
  const audiencias = dayEvents.filter((e) => e.source === "audiencias");
  const primeira = audiencias[0];
  const saudacao = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";
  const intensidade = dayEvents.length <= 2 ? "leve" : dayEvents.length <= 5 ? "moderado" : "intenso";

  return (
    <div className="space-y-4">
      {/* Briefing */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/8 bg-primary/2 px-4 py-3.5 sm:px-5">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/3 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <div className="size-1.5 rounded-full bg-primary animate-pulse mt-2 shrink-0" />
          <p className="text-[13px] text-foreground/70 leading-relaxed">
            <span className="font-medium text-foreground">{saudacao}.</span>{" "}
            Dia <span className={cn("font-medium", intensidade === "leve" ? "text-success" : intensidade === "moderado" ? "text-warning" : "text-destructive")}>{intensidade}</span>
            {" "}com <span className="font-medium text-foreground">{audiencias.length} audiência{audiencias.length !== 1 ? "s" : ""}</span>
            {primeira && <>. Primeira às <span className="font-medium tabular-nums">{fmtTime(primeira.start)}</span>{primeira.modalidade === "presencial" ? " (presencial)" : " (virtual)"}</>}
            .{" "}
            {needsPrep.length > 0
              ? <span className="text-warning/80 font-medium">{needsPrep.length} evento{needsPrep.length > 1 ? "s" : ""} precisa{needsPrep.length > 1 ? "m" : ""} de preparo.</span>
              : <span className="text-success/70">Tudo preparado.</span>}
          </p>
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
                {(["audiencias", "agenda", "expedientes"] as EventSource[]).map((s) => (
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
                    {allDay.map((ev) => <EventChip key={ev.id} event={ev} compact onClick={() => onEventClick(ev)} />)}
                  </div>
                </div>
              )}

              {/* Morning */}
              <PhaseLabel label="Manhã" icon={Sun} />
              <FocusSlot inicio="08:00" fim={timed[0] ? fmtTime(timed[0].start) : "09:00"} label="Preparação" />

              {timed.filter((e) => e.start.getHours() < 12).map((ev, i, arr) => (
                <div key={ev.id}>
                  <BriefingEventCard event={ev} onClick={() => onEventClick(ev)} />
                  {/* Travel indicator between presencial events */}
                  {i < arr.length - 1 && ev.modalidade === "presencial" && arr[i + 1]?.modalidade === "presencial" && (
                    <TravelSlot minutes={25} />
                  )}
                </div>
              ))}

              {/* Now line */}
              <NowLine />

              {/* Lunch */}
              <BreakSlot inicio="12:00" fim="13:30" label="Intervalo" icon={Coffee} />

              {/* Afternoon */}
              <PhaseLabel label="Tarde" icon={Sunset} />
              {timed.filter((e) => e.start.getHours() >= 12).map((ev) => (
                <BriefingEventCard key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
              ))}
              <FocusSlot inicio="17:00" fim="18:30" label="Encerramento" />
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
              {needsPrep.length > 0 ? needsPrep.map((ev) => <PrepRadarItem key={ev.id} event={ev} />) : (
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
                {dayEvents.filter((e) => e.prepStatus === "pendente").map((ev) => (
                  <AlertCard key={ev.id} icon={Timer} title={ev.title} desc={ev.description ?? "Preparação pendente"} variant="destructive" />
                ))}
                {dayEvents.filter((e) => e.prazoVencido).map((ev) => (
                  <AlertCard key={ev.id} icon={FileText} title="Prazo vencido" desc={ev.title} variant="destructive" />
                ))}
                {dayEvents.filter((e) => e.prepStatus === "parcial").map((ev) => (
                  <AlertCard key={ev.id} icon={FileText} title={`${ev.prepDocsOk ?? 0}/${ev.prepDocs ?? 0} docs`} desc={ev.title} variant="warning" />
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

// ── Briefing sub-components ────────────────────────────────────────────

function BriefingEventCard({ event, onClick }: { event: MockCalendarEvent; onClick: () => void }) {
  const srcCfg = SOURCE_CONFIG[event.source];
  const SrcIcon = srcCfg.icon;
  const c = COLOR_MAP[event.color];
  const ModalIcon = event.modalidade === "virtual" || event.modalidade === "hibrida" ? Video : Building2;
  const prep = event.prepStatus ? { preparado: { c: "text-success", bg: "bg-success/10", l: "Preparado" }, parcial: { c: "text-warning", bg: "bg-warning/10", l: "Parcial" }, pendente: { c: "text-destructive", bg: "bg-destructive/10", l: "Pendente" } }[event.prepStatus] : null;

  return (
    <div className="flex items-stretch gap-3 py-1 group">
      <div className="w-11 shrink-0 flex flex-col items-end pt-2.5">
        <span className="text-[11px] tabular-nums font-medium text-foreground/60">{fmtTime(event.start)}</span>
        <span className="text-[9px] tabular-nums text-muted-foreground/50">{fmtTime(event.end)}</span>
      </div>
      <div className="flex flex-col items-center pt-3 shrink-0">
        <div className={cn("size-2 rounded-full", c.dot)} />
        <div className="flex-1 w-px bg-border/8 mt-1" />
      </div>
      <button onClick={onClick} className={cn("flex-1 rounded-xl border-l-[3px] p-3 transition-all duration-200 min-w-0 text-left", "border border-border/12 hover:border-border/20 hover:shadow-sm cursor-pointer", `border-l-${event.color === "sky" ? "sky" : event.color === "violet" ? "violet" : event.color === "rose" ? "rose" : event.color === "amber" ? "amber" : event.color === "emerald" ? "green" : "orange"}-500/50`, c.bg)}>
        <div className="flex items-start gap-2">
          <div className={cn("size-6 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
            <SrcIcon className={cn("size-3", c.text)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-medium text-foreground truncate">{event.title}</h3>
              {prep && (
                <span className={cn("flex items-center gap-0.5 px-1.5 py-px rounded-full text-[8px] font-semibold shrink-0", prep.bg, prep.c)}>
                  {event.prepStatus === "preparado" ? <CheckCircle2 className="size-2" /> : event.prepStatus === "parcial" ? <Circle className="size-2" /> : <AlertTriangle className="size-2" />}
                  {prep.l}
                </span>
              )}
            </div>
            {event.processo && <span className="text-[9px] font-mono text-muted-foreground/55 tabular-nums">{event.processo}</span>}
          </div>
        </div>
        {event.description && <p className="text-[10px] text-muted-foreground/60 mt-1 truncate ml-8">{event.description}</p>}
        <div className="flex items-center gap-2 mt-2 ml-8 flex-wrap">
          {event.location && (
            <div className="flex items-center gap-1">
              <ModalIcon className="size-2 text-muted-foreground/50" />
              <span className="text-[9px] text-muted-foreground/55 truncate max-w-40">{event.location}</span>
            </div>
          )}
          {event.trt && <span className="text-[8px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/40">{event.trt}</span>}
          {event.modalidade && (
            <span className={cn("text-[8px] font-semibold px-1.5 py-px rounded", event.modalidade === "presencial" ? "bg-warning/8 text-warning/50" : "bg-info/8 text-info/50")}>
              {event.modalidade === "presencial" ? "Presencial" : "Virtual"}
            </span>
          )}
          {event.prepDocs !== undefined && (
            <>
              <div className="w-px h-3 bg-border/8 mx-0.5" />
              <div className="flex items-center gap-0.5">
                <FileText className="size-2 text-muted-foreground/45" />
                <span className={cn("text-[9px] tabular-nums", event.prepDocsOk === event.prepDocs ? "text-success/50" : "text-warning/50")}>{event.prepDocsOk ?? 0}/{event.prepDocs}</span>
              </div>
              {event.prepTestemunhas !== undefined && event.prepTestemunhas > 0 && (
                <div className="flex items-center gap-0.5">
                  <Users className="size-2 text-muted-foreground/45" />
                  <span className={cn("text-[9px] tabular-nums", event.prepTestemunhasOk === event.prepTestemunhas ? "text-success/50" : "text-warning/50")}>{event.prepTestemunhasOk ?? 0}/{event.prepTestemunhas}</span>
                </div>
              )}
            </>
          )}
        </div>
      </button>
    </div>
  );
}

function PhaseLabel({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-1.5 first:pt-0">
      <Icon className="size-2.5 text-muted-foreground/60" />
      <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground/45 font-semibold">{label}</span>
      <div className="flex-1 h-px bg-border/6" />
    </div>
  );
}

function FocusSlot({ inicio, fim, label }: { inicio: string; fim: string; label?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-11 text-right text-[10px] tabular-nums text-muted-foreground/45 shrink-0">{inicio}</span>
      <div className="size-1.5 rounded-full border border-dashed border-success/25 shrink-0" />
      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-success/10 bg-success/1.5">
        <Brain className="size-2.5 text-success/30" />
        <span className="text-[9px] text-success/40 font-medium">{label ?? "Foco"}</span>
        <span className="text-[9px] tabular-nums text-muted-foreground/60 ml-auto">{inicio}–{fim}</span>
      </div>
    </div>
  );
}

function TravelSlot({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <span className="w-11 shrink-0" />
      <MapPin className="size-1.5 text-warning/30 shrink-0" />
      <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-warning/3 border border-warning/8">
        <MapPin className="size-2 text-warning/35" />
        <span className="text-[8px] text-warning/50 font-medium">~{minutes}min deslocamento</span>
      </div>
    </div>
  );
}

function BreakSlot({ inicio, fim, label, icon: Icon }: { inicio: string; fim: string; label: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-11 text-right text-[10px] tabular-nums text-muted-foreground/60 shrink-0">{inicio}</span>
      <div className="size-1.5 rounded-full border border-dashed border-muted-foreground/10 shrink-0" />
      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-muted-foreground/8 bg-muted/1">
        <Icon className="size-2.5 text-muted-foreground/45" />
        <span className="text-[9px] text-muted-foreground/45 font-medium">{label}</span>
        <span className="text-[9px] tabular-nums text-muted-foreground/10 ml-auto">{inicio}–{fim}</span>
      </div>
    </div>
  );
}

function NowLine() {
  const now = new Date();
  const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return (
    <div className="flex items-center gap-3 py-0.5 -my-0.5 z-10 relative">
      <span className="w-11 text-right text-[10px] tabular-nums text-primary font-semibold shrink-0">{t}</span>
      <div className="size-2 rounded-full bg-primary shadow-[0_0_6px_oklch(0.48_0.26_281/0.35)] animate-pulse shrink-0" />
      <div className="flex-1 h-px bg-primary/25" />
    </div>
  );
}

function PrepRadarItem({ event }: { event: MockCalendarEvent }) {
  if (!event.prepDocs) return null;
  const pct = ((event.prepDocsOk ?? 0) / event.prepDocs) * 100;
  const srcCfg = SOURCE_CONFIG[event.source];
  const SrcIcon = srcCfg.icon;
  const c = COLOR_MAP[event.color];

  return (
    <div className="flex items-start gap-2 p-2.5 rounded-xl border border-border/8 hover:border-border/15 transition-all cursor-pointer">
      <div className={cn("size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5", c.bg)}>
        <SrcIcon className={cn("size-2.5", c.text)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-[10px] font-medium text-foreground truncate">{event.title}</h4>
          <span className="text-[9px] tabular-nums text-muted-foreground/55 shrink-0">{fmtTime(event.start)}</span>
        </div>
        <div className="mt-1.5 h-0.5 rounded-full bg-border/8 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", pct === 100 ? "bg-success/50" : pct >= 50 ? "bg-warning/50" : "bg-destructive/50")} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[8px] text-muted-foreground/50">{event.prepDocsOk ?? 0}/{event.prepDocs} docs</span>
          {event.prepTestemunhas !== undefined && event.prepTestemunhas > 0 && (
            <span className="text-[8px] text-muted-foreground/50">{event.prepTestemunhasOk ?? 0}/{event.prepTestemunhas} test.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertCard({ icon: Icon, title, desc, variant = "warning" }: { icon: LucideIcon; title: string; desc: string; variant?: "warning" | "destructive" | "info" }) {
  const cfg = {
    warning: { bg: "bg-warning/[0.03]", border: "border-warning/10", icon: "text-warning/50", title: "text-warning/70" },
    destructive: { bg: "bg-destructive/[0.03]", border: "border-destructive/10", icon: "text-destructive/50", title: "text-destructive/70" },
    info: { bg: "bg-info/[0.03]", border: "border-info/10", icon: "text-info/50", title: "text-info/70" },
  }[variant];

  return (
    <div className={cn("p-2.5 rounded-xl border flex items-start gap-2", cfg.bg, cfg.border)}>
      <Icon className={cn("size-3 mt-0.5 shrink-0", cfg.icon)} />
      <div className="min-w-0">
        <h4 className={cn("text-[10px] font-medium leading-tight", cfg.title)}>{title}</h4>
        <p className="text-[9px] text-muted-foreground/55 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Event Detail Dialog (Mocked)
// ============================================================================

function EventDetailDialog({ event, onClose }: { event: MockCalendarEvent | null; onClose: () => void }) {
  if (!event) return null;

  const c = COLOR_MAP[event.color];
  const srcCfg = SOURCE_CONFIG[event.source];
  const SrcIcon = srcCfg.icon;
  const isAgenda = event.source === "agenda";

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-border/20 bg-background shadow-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={cn("size-8 rounded-xl flex items-center justify-center", c.bg)}>
              <SrcIcon className={cn("size-4", c.text)} />
            </div>
            <div>
              <p className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">{isAgenda ? "Editar Evento" : "Detalhes do Evento"}</p>
              <h2 className="text-sm font-heading font-semibold">{event.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/4 text-muted-foreground/55 cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        {/* Source badge */}
        <div className="flex items-center gap-2">
          <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full", c.bg, c.text)}>{srcCfg.label}</span>
          {event.processo && <span className="text-[10px] font-mono text-muted-foreground/55 tabular-nums">{event.processo}</span>}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {/* Date/Time */}
          <div className="flex items-center gap-3 text-xs">
            <Calendar className="size-3.5 text-muted-foreground/55" />
            <div>
              <p className="text-foreground/70">{fmtDateFull(event.start)}</p>
              <p className="text-muted-foreground/60 tabular-nums">
                {event.allDay ? "Dia inteiro" : `${fmtTime(event.start)} – ${fmtTime(event.end)}`}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3 text-xs">
              <MapPin className="size-3.5 text-muted-foreground/55" />
              <p className="text-foreground/70">{event.location}</p>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3 text-xs">
              <FileText className="size-3.5 text-muted-foreground/55 mt-0.5" />
              <p className="text-foreground/70">{event.description}</p>
            </div>
          )}

          {/* Responsável */}
          {event.responsavel && (
            <div className="flex items-center gap-3 text-xs">
              <Users className="size-3.5 text-muted-foreground/55" />
              <p className="text-foreground/70">{event.responsavel}</p>
            </div>
          )}

          {/* Modalidade */}
          {event.modalidade && (
            <div className="flex items-center gap-3 text-xs">
              {event.modalidade === "virtual" ? <Video className="size-3.5 text-muted-foreground/55" /> : <Building2 className="size-3.5 text-muted-foreground/55" />}
              <p className="text-foreground/70 capitalize">{event.modalidade}</p>
            </div>
          )}

          {/* TRT */}
          {event.trt && (
            <div className="flex items-center gap-3 text-xs">
              <Gavel className="size-3.5 text-muted-foreground/55" />
              <p className="text-foreground/70">{event.trt}</p>
            </div>
          )}

          {/* Color indicator */}
          <div className="flex items-center gap-3 text-xs">
            <div className={cn("size-3.5 rounded-full", c.dot)} />
            <p className="text-muted-foreground/50 capitalize">{event.color === "sky" ? "Azul" : event.color === "amber" ? "Âmbar" : event.color === "violet" ? "Violeta" : event.color === "rose" ? "Rosa" : event.color === "emerald" ? "Verde" : "Laranja"}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/10">
          {isAgenda ? (
            <button className="text-[10px] text-destructive/60 hover:text-destructive/80 cursor-pointer">Excluir</button>
          ) : (
            <button className="flex items-center gap-1 text-[10px] text-primary/60 hover:text-primary/80 cursor-pointer">
              <ExternalLink className="size-2.5" />
              Abrir
            </button>
          )}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground/50 hover:bg-white/4 cursor-pointer">
              {isAgenda ? "Cancelar" : "Fechar"}
            </button>
            {isAgenda && (
              <button className="px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function AgendaMockPage() {
  const [view, setView] = useState<CalendarView>("briefing");
  const [currentDate, setCurrentDate] = useState(today());
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<Set<EventSource>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<MockCalendarEvent | null>(null);

  // Generate events
  const allEvents = useMemo(() => generateMockEvents(currentDate), [currentDate]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let evts = allEvents;
    if (sourceFilter.size > 0) {
      evts = evts.filter((e) => sourceFilter.has(e.source));
    }
    if (search) {
      const q = search.toLowerCase();
      evts = evts.filter((e) => e.title.toLowerCase().includes(q));
    }
    return evts;
  }, [allEvents, sourceFilter, search]);

  function toggleSource(src: EventSource) {
    setSourceFilter((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  }

  function navigate(dir: -1 | 1) {
    setCurrentDate((prev) => {
      if (view === "month") return new Date(prev.getFullYear(), prev.getMonth() + dir, 1);
      if (view === "week") return addDays(prev, dir * 7);
      return addDays(prev, dir);
    });
  }

  return (
    <div className="max-w-350 mx-auto space-y-4 pb-12">
      <Toolbar
        view={view}
        setView={setView}
        currentDate={currentDate}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={() => setCurrentDate(today())}
        search={search}
        setSearch={setSearch}
        sourceFilter={sourceFilter}
        toggleSource={toggleSource}
        onNewEvent={() => {}}
      />

      {/* Command Header — visible on briefing & day views */}
      {(view === "briefing" || view === "day") && (
        <CommandHeader events={filteredEvents} currentDate={currentDate} />
      )}

      {/* Views */}
      {view === "month" && <MonthView events={filteredEvents} currentDate={currentDate} onEventClick={setSelectedEvent} />}
      {view === "week" && <WeekView events={filteredEvents} currentDate={currentDate} onEventClick={setSelectedEvent} />}
      {view === "day" && <DayView events={filteredEvents} currentDate={currentDate} onEventClick={setSelectedEvent} />}
      {view === "agenda" && <AgendaListView events={filteredEvents} currentDate={currentDate} onEventClick={setSelectedEvent} />}
      {view === "briefing" && <BriefingView events={filteredEvents} currentDate={currentDate} onEventClick={setSelectedEvent} />}

      {/* Event Detail Dialog */}
      <EventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
