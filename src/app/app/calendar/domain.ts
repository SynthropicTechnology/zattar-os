import { z } from "zod";

export const CALENDAR_SOURCES = ["audiencias", "expedientes", "obrigacoes", "pericias", "agenda"] as const;
export type CalendarSource = (typeof CALENDAR_SOURCES)[number];

export const calendarSourceSchema = z.enum(CALENDAR_SOURCES);

export const unifiedCalendarEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  startAt: z.string().min(1), // ISO string
  endAt: z.string().min(1), // ISO string
  allDay: z.boolean().default(false),
  source: calendarSourceSchema,
  sourceEntityId: z.union([z.string(), z.number()]),
  url: z.string().min(1),
  responsavelId: z.number().int().positive().nullable().optional(),
  color: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export type UnifiedCalendarEvent = z.infer<typeof unifiedCalendarEventSchema>;

export const listarEventosCalendarSchema = z
  .object({
    startAt: z.string().min(1),
    endAt: z.string().min(1),
    sources: z.array(calendarSourceSchema).optional(),
  })
  .refine(
    (v) => {
      const start = new Date(v.startAt);
      const end = new Date(v.endAt);
      return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end;
    },
    { message: "Intervalo de datas inválido" }
  );

export type ListarEventosCalendarInput = z.infer<typeof listarEventosCalendarSchema>;

export function buildUnifiedEventId(source: CalendarSource, sourceEntityId: string | number): string {
  return `${source}:${String(sourceEntityId)}`;
}

export function safeDateToIso(date: Date): string {
  return date.toISOString();
}
