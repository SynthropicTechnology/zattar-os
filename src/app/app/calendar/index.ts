/**
 * Feature: Calendar
 *
 * Barrel export para a Agenda global (agregação de eventos).
 * Nota: componentes do template em `src/app/app/calendar/*` permanecem como UI.
 */

export type {
	UnifiedCalendarEvent,
	CalendarSource,
	ListarEventosCalendarInput,
} from "./domain";

export {
	CALENDAR_SOURCES,
	calendarSourceSchema,
	unifiedCalendarEventSchema,
	listarEventosCalendarSchema,
	buildUnifiedEventId,
} from "./domain";

export { actionListarEventosCalendar } from "./actions/calendar-actions";
export { actionListarBriefingData } from "./actions/briefing-actions";

// Briefing domain
export type {
	PrepStatus,
	CalendarView,
	BriefingEventMeta,
	DaySummary,
	WeekPulseDay,
	EventColor,
	ColorConfig,
	SourceConfig,
} from "./briefing-domain";

export {
	COLOR_MAP,
	SOURCE_CONFIG,
} from "./briefing-domain";

// Briefing helpers
export {
	extractMeta,
	getEventsForDay,
	getTimedEvents,
	getAllDayEvents,
	generateWeekPulse,
	getDaySummary,
	buildBriefingText,
	isSameDay,
	isToday,
	addDays,
	startOfWeek,
	fmtTime,
	fmtDate,
	fmtDateFull,
	weekdayShort,
	weekdayFull,
	monthName,
} from "./briefing-helpers";

// Travel helpers
export type { TravelEstimate } from "./travel-helpers";
export { estimateTravelTime } from "./travel-helpers";

// Repository (data fetching — use in server contexts only)
export {
  findAudiencias,
  findExpedientes,
  findAcordosComParcelas,
  findPericias,
  findAgendaEventos,
} from "./repository";
