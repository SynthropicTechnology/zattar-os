import type { Metadata } from "next";
import { addMonths, startOfMonth, endOfMonth, subMonths } from "date-fns";

import AgendaApp from "./components/agenda-app";
import { actionListarEventosCalendar, type UnifiedCalendarEvent } from "@/features/calendar";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Agenda",
    description: "Visualize e gerencie seus eventos e compromissos de forma organizada.",
  };
}

export default async function AgendaPage() {
  const now = new Date();
  const start = startOfMonth(subMonths(now, 1));
  const end = endOfMonth(addMonths(now, 1));

  const result = await actionListarEventosCalendar({
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  });

  const events: UnifiedCalendarEvent[] = result.success ? result.data : [];

  return <AgendaApp initialEvents={events} />;
}
