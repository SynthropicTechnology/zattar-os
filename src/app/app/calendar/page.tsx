import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
import { startOfMonth, endOfMonth } from "date-fns";

import EventCalendarApp from "./components/event-calendar-app";
import { actionListarEventosCalendar, type UnifiedCalendarEvent } from "@/features/calendar";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Agenda",
    description:
      "Visualize e gerencie seus eventos e compromissos de forma organizada.",
  };
}

export default async function Page() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const result = await actionListarEventosCalendar({
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  });

  const events: UnifiedCalendarEvent[] = result.success ? result.data : [];

  return <EventCalendarApp initialEvents={events} />;
}
