/**
 * Agenda Adapters — Conversao de UnifiedCalendarEvent para tipos de UI
 * ============================================================================
 */

import type { UnifiedCalendarEvent } from "@/app/app/calendar";
import type { BriefingEventMeta, EventColor } from "@/app/app/calendar/briefing-domain";
import { extractMeta } from "@/app/app/calendar/briefing-helpers";

/** Evento adaptado para uso em views da agenda */
export interface AgendaEvent {
  /** ID unico (format: "source:entityId") */
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  source: UnifiedCalendarEvent["source"];
  color: EventColor;
  url: string;
  responsavelId: number | null;
  meta: BriefingEventMeta;
  /** Evento original para referencia */
  raw: UnifiedCalendarEvent;
}

/** Adapta um UnifiedCalendarEvent para uso nas views da agenda */
export function adaptToAgendaEvent(event: UnifiedCalendarEvent): AgendaEvent {
  const meta = extractMeta(event);

  return {
    id: event.id,
    title: event.title,
    start: new Date(event.startAt),
    end: new Date(event.endAt),
    allDay: event.allDay,
    source: event.source,
    color: (event.color as EventColor) ?? "violet",
    url: event.url,
    responsavelId: event.responsavelId ?? null,
    meta,
    raw: event,
  };
}

/** Adapta uma lista de eventos */
export function adaptEvents(events: UnifiedCalendarEvent[]): AgendaEvent[] {
  return events.map(adaptToAgendaEvent);
}

/** Filtra eventos por fontes selecionadas */
export function filterBySource(
  events: AgendaEvent[],
  sources: Set<UnifiedCalendarEvent["source"]>,
): AgendaEvent[] {
  if (sources.size === 0) return events;
  return events.filter((e) => sources.has(e.source));
}

/** Filtra eventos por busca de texto no titulo */
export function filterBySearch(events: AgendaEvent[], query: string): AgendaEvent[] {
  if (!query.trim()) return events;
  const q = query.toLowerCase();
  return events.filter((e) => e.title.toLowerCase().includes(q));
}
