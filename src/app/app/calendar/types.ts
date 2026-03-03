export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  location?: string;
  source?: string;
  sourceEntityId?: number;
  responsavelId?: number | null;
}

export type EventColor = "sky" | "amber" | "violet" | "rose" | "emerald" | "orange";
