/**
 * AgendaApp — Orchestrador principal do modulo Agenda
 * ============================================================================
 * Gerencia state, fetching, filtragem e renderiza a view ativa.
 * Reutiliza o EventDialog existente para CRUD e o EventCalendar para
 * views tradicionais (month/week/day/agenda).
 * ============================================================================
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDays, addMonths, addWeeks, endOfMonth, format, startOfMonth, subMonths, subWeeks } from "date-fns";
import { toast } from "sonner";

import type { CalendarSource, UnifiedCalendarEvent } from "@/app/(authenticated)/calendar";
import type { CalendarView } from "@/app/(authenticated)/calendar/briefing-domain";
import { actionListarEventosCalendar } from "@/app/(authenticated)/calendar";
import { generateWeekPulse, getDaySummary } from "@/app/(authenticated)/calendar/briefing-helpers";
import {
  actionCriarAgendaEvento,
  actionAtualizarAgendaEvento,
  actionDeletarAgendaEvento,
} from "@/app/(authenticated)/agenda";

import type { CalendarEvent } from "@/app/(authenticated)/calendar/types";
import { EventDialog } from "@/app/(authenticated)/calendar/components/event-dialog";
import { AgendaDaysToShow } from "@/app/(authenticated)/calendar/constants";

import { adaptEvents, filterBySearch, filterBySource, type AgendaEvent } from "../lib/adapters";
import { AgendaToolbar } from "./toolbar";
import { CommandHeader } from "./command-header";
import { CalendarViewWrapper } from "./views/calendar-views";
import { BriefingView } from "./views/briefing-view";

// ─── Props ─────────────────────────────────────────────────────────────

interface AgendaAppProps {
  initialEvents: UnifiedCalendarEvent[];
}

// ─── Helpers ───────────────────────────────────────────────────────────

function adaptAgendaToCalendarEvent(event: AgendaEvent): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    color: event.color as CalendarEvent["color"],
    description: event.meta.descricao,
    location: event.meta.local,
    source: event.source,
    sourceEntityId: event.raw.sourceEntityId as number | undefined,
    responsavelId: event.responsavelId ?? undefined,
  };
}

// ─── Component ─────────────────────────────────────────────────────────

export default function AgendaApp({ initialEvents }: AgendaAppProps) {
  // ── Server state ──────────────────────────────────────────────────
  const [serverEvents, setServerEvents] = useState<UnifiedCalendarEvent[]>(initialEvents);
  const [_isLoading, setIsLoading] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("briefing");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<Set<CalendarSource>>(new Set());

  // ── Dialog state ──────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCalEvent, setSelectedCalEvent] = useState<CalendarEvent | null>(null);
  const [dialogReadOnly, setDialogReadOnly] = useState(false);

  // ── Event URL map (for source navigation) ─────────────────────────
  const eventUrlMap = useMemo(
    () => new Map(serverEvents.map((e) => [e.id, e.url])),
    [serverEvents],
  );

  // ── Adapted & filtered events ─────────────────────────────────────
  const allEvents = useMemo(() => adaptEvents(serverEvents), [serverEvents]);

  const filteredEvents = useMemo(() => {
    let evts = filterBySource(allEvents, sourceFilter);
    evts = filterBySearch(evts, search);
    return evts;
  }, [allEvents, sourceFilter, search]);

  // ── Briefing data ─────────────────────────────────────────────────
  const summary = useMemo(() => getDaySummary(serverEvents, currentDate), [serverEvents, currentDate]);
  const weekPulse = useMemo(() => generateWeekPulse(serverEvents, currentDate), [serverEvents, currentDate]);

  // ── Dynamic fetch on month change ─────────────────────────────────
  const fetchRangeKey = useMemo(() => format(startOfMonth(currentDate), "yyyy-MM"), [currentDate]);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const [year, month] = fetchRangeKey.split("-").map(Number);
    const center = new Date(year, month - 1, 1);
    const rangeStart = subMonths(center, 1);
    const rangeEnd = endOfMonth(addMonths(center, 1));

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await actionListarEventosCalendar({
          startAt: rangeStart.toISOString(),
          endAt: rangeEnd.toISOString(),
        });
        if (cancelled) return;
        if (result.success) setServerEvents(result.data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [fetchRangeKey]);

  // ── Refetch helper ────────────────────────────────────────────────
  const refetchEvents = useCallback(async () => {
    const center = startOfMonth(currentDate);
    const rangeStart = subMonths(center, 1);
    const rangeEnd = endOfMonth(addMonths(center, 1));

    const result = await actionListarEventosCalendar({
      startAt: rangeStart.toISOString(),
      endAt: rangeEnd.toISOString(),
    });
    if (result.success) setServerEvents(result.data);
  }, [currentDate]);

  // ── Navigation ────────────────────────────────────────────────────
  const handlePrev = useCallback(() => {
    setCurrentDate((d) => {
      if (view === "month") return subMonths(d, 1);
      if (view === "week") return subWeeks(d, 1);
      if (view === "day" || view === "briefing") return addDays(d, -1);
      if (view === "agenda") return addDays(d, -AgendaDaysToShow);
      return d;
    });
  }, [view]);

  const handleNext = useCallback(() => {
    setCurrentDate((d) => {
      if (view === "month") return addMonths(d, 1);
      if (view === "week") return addWeeks(d, 1);
      if (view === "day" || view === "briefing") return addDays(d, 1);
      if (view === "agenda") return addDays(d, AgendaDaysToShow);
      return d;
    });
  }, [view]);

  const handleToday = useCallback(() => setCurrentDate(new Date()), []);

  // ── Source filter toggle ──────────────────────────────────────────
  const toggleSource = useCallback((src: CalendarSource) => {
    setSourceFilter((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  }, []);

  // ── Event click (open dialog) ─────────────────────────────────────
  const handleEventClick = useCallback((event: AgendaEvent) => {
    const calEvent = adaptAgendaToCalendarEvent(event);
    setSelectedCalEvent(calEvent);
    setDialogReadOnly(event.source !== "agenda");
    setDialogOpen(true);
  }, []);

  // ── New event ─────────────────────────────────────────────────────
  const handleNewEvent = useCallback(() => {
    setSelectedCalEvent(null);
    setDialogReadOnly(false);
    setDialogOpen(true);
  }, []);

  // ── CRUD handlers (reuse existing action patterns) ────────────────
  const handleSaveEvent = useCallback(async (event: CalendarEvent) => {
    const isNew = !event.id || !event.id.startsWith("agenda:");
    const payload = {
      titulo: event.title || "(sem título)",
      descricao: event.description || null,
      dataInicio: event.start.toISOString(),
      dataFim: event.end.toISOString(),
      diaInteiro: event.allDay ?? false,
      local: event.location || null,
      cor: event.color || "sky",
      responsavelId: event.responsavelId || null,
    };

    if (isNew) {
      const result = await actionCriarAgendaEvento(payload);
      if (result.success) {
        toast.success(`Evento "${payload.titulo}" adicionado`);
        await refetchEvents();
      }
    } else {
      const entityId = Number(event.id.split(":")[1]);
      const result = await actionAtualizarAgendaEvento({ id: entityId, ...payload });
      if (result.success) {
        toast.success(`Evento "${payload.titulo}" atualizado`);
        await refetchEvents();
      }
    }
    setDialogOpen(false);
  }, [refetchEvents]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (!eventId.startsWith("agenda:")) return;
    const entityId = Number(eventId.split(":")[1]);
    const result = await actionDeletarAgendaEvento({ id: entityId });
    if (result.success) {
      toast.success("Evento excluído");
      await refetchEvents();
    }
    setDialogOpen(false);
  }, [refetchEvents]);

  const handleNavigateToSource = useCallback(() => {
    if (!selectedCalEvent) return;
    const url = eventUrlMap.get(selectedCalEvent.id);
    if (url) window.location.href = url;
  }, [eventUrlMap, selectedCalEvent]);

  // ── Render ────────────────────────────────────────────────────────
  const showCommandHeader = view === "briefing" || view === "day";
  const isTraditionalView = view === "month" || view === "week" || view === "day" || view === "agenda";

  return (
    <div className="max-w-350 mx-auto space-y-4 pb-12">
      {/* Toolbar */}
      <AgendaToolbar
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        search={search}
        onSearchChange={setSearch}
        sourceFilter={sourceFilter}
        onToggleSource={toggleSource}
        onNewEvent={handleNewEvent}
      />

      {/* Command Header (briefing + day views) */}
      {showCommandHeader && <CommandHeader summary={summary} weekPulse={weekPulse} />}

      {/* Views */}
      {isTraditionalView && (
        <CalendarViewWrapper
          view={view}
          events={filteredEvents}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onEventClick={handleEventClick}
          onCreateEvent={(date) => {
            setSelectedCalEvent(null);
            setCurrentDate(date);
            setDialogReadOnly(false);
            setDialogOpen(true);
          }}
        />
      )}

      {view === "briefing" && (
        <BriefingView
          events={filteredEvents}
          currentDate={currentDate}
          onEventClick={handleEventClick}
        />
      )}

      {/* Event Dialog (reutiliza o existente de /app/calendar) */}
      <EventDialog
        event={selectedCalEvent}
        isOpen={dialogOpen}
        readOnly={dialogReadOnly}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onNavigateToSource={handleNavigateToSource}
      />
    </div>
  );
}
