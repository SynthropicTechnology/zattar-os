/**
 * Calendar Views Wrapper — Reutiliza views existentes com novo styling
 * ============================================================================
 * Wraps the existing EventCalendar component from /app/calendar with the
 * new agenda's adapter layer. Preserves drag-drop, overlap calculation,
 * and all existing view functionality (month/week/day/agenda).
 * ============================================================================
 */

"use client";

import { useCallback, useMemo } from "react";
import { EventCalendar } from "@/app/app/calendar/components/event-calendar";
import type { CalendarEvent, CalendarView as LegacyCalendarView } from "@/app/app/calendar/types";
import type { AgendaEvent } from "../../lib/adapters";
import type { CalendarView } from "@/features/calendar/briefing-domain";

// ─── Props ─────────────────────────────────────────────────────────────

export interface CalendarViewWrapperProps {
  view: CalendarView;
  events: AgendaEvent[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: AgendaEvent) => void;
  onCreateEvent?: (date: Date) => void;
}

// ─── Adapter ───────────────────────────────────────────────────────────

function toCalendarEvent(event: AgendaEvent): CalendarEvent {
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

const LEGACY_VIEW_MAP: Record<string, LegacyCalendarView> = {
  month: "month",
  week: "week",
  day: "day",
  agenda: "agenda",
};

// ─── Component ─────────────────────────────────────────────────────────

export function CalendarViewWrapper({
  view,
  events,
  currentDate,
  onDateChange,
  onEventClick,
  onCreateEvent,
}: CalendarViewWrapperProps) {
  const legacyView = LEGACY_VIEW_MAP[view] ?? "month";

  const calendarEvents = useMemo(
    () => events.map(toCalendarEvent),
    [events],
  );

  // Map from CalendarEvent click back to AgendaEvent
  const handleEventClick = useCallback(
    (calEvent: CalendarEvent) => {
      const agendaEvent = events.find((e) => e.id === calEvent.id);
      if (agendaEvent) onEventClick(agendaEvent);
    },
    [events, onEventClick],
  );

  return (
    <EventCalendar
      events={calendarEvents}
      currentDate={currentDate}
      onDateChange={onDateChange}
      view={legacyView}
      onViewChange={() => {}}
      onEventClick={handleEventClick}
      onCreateEvent={onCreateEvent}
      hideToolbar
    />
  );
}
