import {
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes,
  getHours,
  getMinutes,
  isSameDay,
  startOfDay
} from "date-fns";

import type { CalendarEvent, EventColor } from "./components";

/**
 * Get CSS classes for event colors
 */
export function getEventColorClasses(color?: EventColor | string): string {
  const eventColor = color || "sky";

  switch (eventColor) {
    case "sky":
      return "bg-sky-200/50 hover:bg-sky-200/40 text-sky-950/80 dark:bg-sky-400/25 dark:hover:bg-sky-400/20 dark:text-sky-200 shadow-sky-700/8";
    case "amber":
      return "bg-amber-200/50 hover:bg-amber-200/40 text-amber-950/80 dark:bg-amber-400/25 dark:hover:bg-amber-400/20 dark:text-amber-200 shadow-amber-700/8";
    case "violet":
      return "bg-violet-200/50 hover:bg-violet-200/40 text-violet-950/80 dark:bg-violet-400/25 dark:hover:bg-violet-400/20 dark:text-violet-200 shadow-violet-700/8";
    case "rose":
      return "bg-rose-200/50 hover:bg-rose-200/40 text-rose-950/80 dark:bg-rose-400/25 dark:hover:bg-rose-400/20 dark:text-rose-200 shadow-rose-700/8";
    case "emerald":
      return "bg-green-200/50 hover:bg-green-200/40 text-green-950/80 dark:bg-green-400/25 dark:hover:bg-green-400/20 dark:text-green-200 shadow-green-700/8";
    case "orange":
      return "bg-orange-200/50 hover:bg-orange-200/40 text-orange-950/80 dark:bg-orange-400/25 dark:hover:bg-orange-400/20 dark:text-orange-200 shadow-orange-700/8";
    default:
      return "bg-sky-200/50 hover:bg-sky-200/40 text-sky-950/80 dark:bg-sky-400/25 dark:hover:bg-sky-400/20 dark:text-sky-200 shadow-sky-700/8";
  }
}

/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(isFirstDay: boolean, isLastDay: boolean): string {
  if (isFirstDay && isLastDay) {
    return "rounded"; // Both ends rounded
  } else if (isFirstDay) {
    return "rounded-l rounded-r-none"; // Only left end rounded
  } else if (isLastDay) {
    return "rounded-r rounded-l-none"; // Only right end rounded
  } else {
    return "rounded-none"; // No rounded corners
  }
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return event.allDay || !isSameDay(eventStart, eventEnd);
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) || isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * Get all events for a day (for agenda view)
 */
export function getAgendaEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Positioned event with calculated layout coordinates
 */
export interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

/**
 * Calculate positioned events for a day using equal-width column distribution.
 *
 * Algorithm (similar to Google Calendar):
 * 1. Sort events by start time, then by duration (longer first)
 * 2. Place each event in the first available column (no overlap)
 * 3. Group overlapping columns into clusters
 * 4. Within each cluster, all events share width equally based on max columns used
 */
export function calculatePositionedEvents(
  day: Date,
  events: CalendarEvent[],
  startHour: number,
  cellHeight: number
): PositionedEvent[] {
  const dayStart = startOfDay(day);

  // Filter to single-day, non-allday events on this day
  const dayEvents = events.filter((event) => {
    if (event.allDay || isMultiDayEvent(event)) return false;
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) ||
      isSameDay(day, eventEnd) ||
      (eventStart < day && eventEnd > day)
    );
  });

  // Sort by start time, then longer events first
  const sorted = [...dayEvents].sort((a, b) => {
    const aStart = new Date(a.start);
    const bStart = new Date(b.start);
    if (aStart < bStart) return -1;
    if (aStart > bStart) return 1;
    return differenceInMinutes(new Date(b.end), bStart) - differenceInMinutes(new Date(a.end), aStart);
  });

  // Column assignment: each column tracks its latest end time
  const columns: { event: CalendarEvent; adjustedStart: Date; adjustedEnd: Date; columnIndex: number }[] = [];
  const columnEnds: Date[] = [];

  sorted.forEach((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const adjustedStart = isSameDay(day, eventStart) ? eventStart : dayStart;
    const adjustedEnd = isSameDay(day, eventEnd) ? eventEnd : addHours(dayStart, 24);

    // Find first column where this event doesn't overlap
    let placed = -1;
    for (let col = 0; col < columnEnds.length; col++) {
      if (!areIntervalsOverlapping(
        { start: adjustedStart, end: adjustedEnd },
        { start: dayStart, end: columnEnds[col]! }
      )) {
        placed = col;
        break;
      }
    }

    if (placed === -1) {
      placed = columnEnds.length;
      columnEnds.push(adjustedEnd);
    } else {
      columnEnds[placed] = adjustedEnd;
    }

    columns.push({ event, adjustedStart, adjustedEnd, columnIndex: placed });
  });

  // Build clusters: groups of events that overlap transitively
  // Each cluster has a maxColumns count
  const result: PositionedEvent[] = [];

  // For each event, find how many columns its cluster uses
  columns.forEach((item) => {
    // Find all events that overlap with this one (directly or transitively)
    const overlapping = columns.filter((other) =>
      areIntervalsOverlapping(
        { start: item.adjustedStart, end: item.adjustedEnd },
        { start: other.adjustedStart, end: other.adjustedEnd }
      )
    );

    // The max column index in the overlapping set determines total columns
    const maxCol = Math.max(...overlapping.map((o) => o.columnIndex)) + 1;

    const startH = getHours(item.adjustedStart) + getMinutes(item.adjustedStart) / 60;
    const endH = getHours(item.adjustedEnd) + getMinutes(item.adjustedEnd) / 60;
    const top = (startH - startHour) * cellHeight;
    const height = (endH - startH) * cellHeight;

    result.push({
      event: item.event,
      top,
      height,
      left: item.columnIndex / maxCol,
      width: 1 / maxCol,
      zIndex: 10 + item.columnIndex,
    });
  });

  return result;
}
