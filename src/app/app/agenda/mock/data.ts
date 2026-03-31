/**
 * AGENDA MOCK — Dados e Helpers
 * ============================================================================
 * Mock data com 5 fontes de evento (agenda, audiências, expedientes,
 * obrigações, perícias) + helpers de cor/ícone/formatação.
 * ============================================================================
 */

import {
  Gavel,
  FileWarning,
  Receipt,
  Microscope,
  Calendar,
  type LucideIcon,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────

export type EventSource = "agenda" | "audiencias" | "expedientes" | "obrigacoes" | "pericias";
export type EventColor = "sky" | "amber" | "violet" | "rose" | "emerald" | "orange";
export type CalendarView = "month" | "week" | "day" | "agenda" | "briefing";

export interface MockCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  source: EventSource;
  color: EventColor;
  location?: string;
  description?: string;
  processo?: string;
  trt?: string;
  modalidade?: "presencial" | "virtual" | "hibrida";
  responsavel?: string;
  /** Audiência-specific */
  status?: string;
  /** Expediente-specific */
  prazoVencido?: boolean;
  /** Obrigação-specific */
  parcelaNum?: number;
  valor?: number;
  /** Prep info (audiências, prazos) */
  prepStatus?: "preparado" | "parcial" | "pendente";
  prepDocs?: number;
  prepDocsOk?: number;
  prepTestemunhas?: number;
  prepTestemunhasOk?: number;
}

// ─── Source Config ──────────────────────────────────────────────────────

export const SOURCE_CONFIG: Record<EventSource, {
  label: string;
  icon: LucideIcon;
  defaultColor: EventColor;
}> = {
  agenda:       { label: "Agenda",       icon: Calendar,     defaultColor: "violet" },
  audiencias:   { label: "Audiências",   icon: Gavel,        defaultColor: "sky" },
  expedientes:  { label: "Expedientes",  icon: FileWarning,  defaultColor: "amber" },
  obrigacoes:   { label: "Obrigações",   icon: Receipt,      defaultColor: "amber" },
  pericias:     { label: "Perícias",     icon: Microscope,   defaultColor: "violet" },
};

export const COLOR_MAP: Record<EventColor, {
  bg: string;
  bgSolid: string;
  text: string;
  border: string;
  dot: string;
}> = {
  sky:     { bg: "bg-sky-200/50 dark:bg-sky-400/25",       bgSolid: "bg-sky-500",     text: "text-sky-900 dark:text-sky-200",       border: "border-sky-300/40",     dot: "bg-sky-500" },
  amber:   { bg: "bg-amber-200/50 dark:bg-amber-400/25",   bgSolid: "bg-amber-500",   text: "text-amber-900 dark:text-amber-200",   border: "border-amber-300/40",   dot: "bg-amber-500" },
  violet:  { bg: "bg-violet-200/50 dark:bg-violet-400/25", bgSolid: "bg-violet-500",  text: "text-violet-900 dark:text-violet-200", border: "border-violet-300/40",  dot: "bg-violet-500" },
  rose:    { bg: "bg-rose-200/50 dark:bg-rose-400/25",     bgSolid: "bg-rose-500",    text: "text-rose-900 dark:text-rose-200",     border: "border-rose-300/40",    dot: "bg-rose-500" },
  emerald: { bg: "bg-green-200/50 dark:bg-green-400/25",   bgSolid: "bg-green-500",   text: "text-green-900 dark:text-green-200",   border: "border-green-300/40",   dot: "bg-green-500" },
  orange:  { bg: "bg-orange-200/50 dark:bg-orange-400/25", bgSolid: "bg-orange-500",  text: "text-orange-900 dark:text-orange-200", border: "border-orange-300/40",  dot: "bg-orange-500" },
};

// ─── Date Helpers ──────────────────────────────────────────────────────

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function setTime(date: Date, hours: number, minutes = 0) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}

export function isPast(date: Date) {
  return date.getTime() < Date.now();
}

export function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getMonthGrid(date: Date): Date[] {
  const first = startOfMonth(date);
  const startDay = first.getDay(); // 0=Sun
  const total = daysInMonth(date);
  const grid: Date[] = [];

  // Previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    grid.push(addDays(first, -i - 1));
  }
  // Current month
  for (let i = 0; i < total; i++) {
    grid.push(addDays(first, i));
  }
  // Next month to fill 6 rows
  while (grid.length < 42) {
    grid.push(addDays(first, grid.length - startDay));
  }
  return grid;
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function weekdayShort(date: Date) { return WEEKDAY_SHORT[date.getDay()]; }
export function weekdayFull(date: Date) { return WEEKDAY_FULL[date.getDay()]; }
export function monthName(date: Date) { return MONTH_NAMES[date.getMonth()]; }

export function fmtTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function fmtDate(date: Date) {
  return `${date.getDate()} de ${monthName(date).toLowerCase()}`;
}

export function fmtDateFull(date: Date) {
  return `${weekdayFull(date)}, ${date.getDate()} de ${monthName(date)}`;
}

// ─── Mock Events Generator ────────────────────────────────────────────

export function generateMockEvents(_baseDate: Date): MockCalendarEvent[] {
  const d = today();
  const events: MockCalendarEvent[] = [];

  // ── Audiências (sky/emerald/rose) ────────────────────────────────
  events.push(
    {
      id: "audiencias:1",
      title: "Audiência de Instrução e Julgamento",
      start: setTime(d, 9, 0),
      end: setTime(d, 10, 30),
      allDay: false,
      source: "audiencias",
      color: "sky",
      processo: "0001234-56.2024.5.02.0001",
      trt: "TRT-2",
      modalidade: "presencial",
      location: "TRT-2 — 1ª Vara do Trabalho de São Paulo",
      status: "Marcada",
      responsavel: "Dr. Marcos",
      prepStatus: "preparado",
      prepDocs: 4, prepDocsOk: 4,
      prepTestemunhas: 2, prepTestemunhasOk: 2,
    },
    {
      id: "audiencias:2",
      title: "Audiência de Conciliação",
      start: setTime(d, 11, 0),
      end: setTime(d, 12, 0),
      allDay: false,
      source: "audiencias",
      color: "sky",
      processo: "0005678-90.2024.5.02.0003",
      trt: "TRT-2",
      modalidade: "virtual",
      location: "Microsoft Teams",
      status: "Marcada",
      responsavel: "Dra. Patrícia",
      prepStatus: "parcial",
      prepDocs: 5, prepDocsOk: 2,
    },
    {
      id: "audiencias:3",
      title: "Audiência UNA (Instrução + Julgamento)",
      start: setTime(d, 15, 30),
      end: setTime(d, 16, 30),
      allDay: false,
      source: "audiencias",
      color: "sky",
      processo: "0002468-33.2024.5.02.0012",
      trt: "TRT-2",
      modalidade: "virtual",
      location: "Pje — Videoconferência",
      status: "Marcada",
      responsavel: "Dr. Marcos",
      prepStatus: "parcial",
      prepDocs: 6, prepDocsOk: 4,
      prepTestemunhas: 3, prepTestemunhasOk: 1,
    },
    {
      id: "audiencias:4",
      title: "Audiência de Instrução",
      start: setTime(addDays(d, 1), 14, 0),
      end: setTime(addDays(d, 1), 15, 30),
      allDay: false,
      source: "audiencias",
      color: "sky",
      processo: "0003456-78.2024.5.15.0007",
      trt: "TRT-15",
      modalidade: "presencial",
      location: "TRT-15 — 3ª Vara de Campinas",
      status: "Marcada",
      responsavel: "Dra. Patrícia",
    },
    {
      id: "audiencias:5",
      title: "Audiência Realizada — Conciliação",
      start: setTime(addDays(d, -1), 10, 0),
      end: setTime(addDays(d, -1), 11, 0),
      allDay: false,
      source: "audiencias",
      color: "emerald",
      processo: "0007890-12.2024.5.02.0005",
      trt: "TRT-2",
      modalidade: "virtual",
      status: "Realizada",
      responsavel: "Dr. Marcos",
    },
    {
      id: "audiencias:6",
      title: "Audiência de Julgamento",
      start: setTime(addDays(d, 3), 9, 30),
      end: setTime(addDays(d, 3), 11, 0),
      allDay: false,
      source: "audiencias",
      color: "sky",
      processo: "0004321-11.2024.5.02.0009",
      trt: "TRT-2",
      modalidade: "presencial",
      location: "TRT-2 — 5ª Vara do Trabalho",
      status: "Marcada",
      responsavel: "Dr. Marcos",
    },
  );

  // ── Expedientes (amber/rose) ─────────────────────────────────────
  events.push(
    {
      id: "expedientes:1",
      title: "Expediente — Despacho — 0001234-56.2024.5.02.0001",
      start: setTime(addDays(d, 1), 0, 0),
      end: setTime(addDays(d, 1), 23, 59),
      allDay: true,
      source: "expedientes",
      color: "amber",
      processo: "0001234-56.2024.5.02.0001",
      trt: "TRT-2",
      prazoVencido: false,
    },
    {
      id: "expedientes:2",
      title: "Expediente — Intimação — 0005678-90.2024.5.02.0003",
      start: setTime(d, 0, 0),
      end: setTime(d, 23, 59),
      allDay: true,
      source: "expedientes",
      color: "rose",
      processo: "0005678-90.2024.5.02.0003",
      trt: "TRT-2",
      prazoVencido: true,
    },
    {
      id: "expedientes:3",
      title: "Expediente — Sentença — 0009876-12.2024.5.15.0042",
      start: setTime(addDays(d, 4), 0, 0),
      end: setTime(addDays(d, 4), 23, 59),
      allDay: true,
      source: "expedientes",
      color: "amber",
      processo: "0009876-12.2024.5.15.0042",
      trt: "TRT-15",
      prazoVencido: false,
    },
  );

  // ── Obrigações (amber/rose/emerald) ──────────────────────────────
  events.push(
    {
      id: "obrigacoes:1",
      title: "Obrigação — Parcela 3 — 0001234-56.2024.5.02.0001",
      start: setTime(addDays(d, 2), 0, 0),
      end: setTime(addDays(d, 2), 23, 59),
      allDay: true,
      source: "obrigacoes",
      color: "amber",
      processo: "0001234-56.2024.5.02.0001",
      parcelaNum: 3,
      valor: 4500,
    },
    {
      id: "obrigacoes:2",
      title: "Obrigação — Parcela 5 — 0007890-12.2024.5.02.0005",
      start: setTime(addDays(d, -2), 0, 0),
      end: setTime(addDays(d, -2), 23, 59),
      allDay: true,
      source: "obrigacoes",
      color: "rose",
      processo: "0007890-12.2024.5.02.0005",
      parcelaNum: 5,
      valor: 8200,
      description: "Atrasada",
    },
  );

  // ── Perícias (violet/emerald/rose) ───────────────────────────────
  events.push(
    {
      id: "pericias:1",
      title: "Perícia — 0003456-78.2024.5.15.0007",
      start: setTime(addDays(d, 5), 0, 0),
      end: setTime(addDays(d, 5), 23, 59),
      allDay: true,
      source: "pericias",
      color: "violet",
      processo: "0003456-78.2024.5.15.0007",
      trt: "TRT-15",
    },
  );

  // ── Agenda (user events — varied colors) ─────────────────────────
  events.push(
    {
      id: "agenda:1",
      title: "Reunião Estratégica — Caso Metalúrgica",
      start: setTime(d, 14, 0),
      end: setTime(d, 15, 0),
      allDay: false,
      source: "agenda",
      color: "violet",
      location: "Sala de Reuniões",
      description: "Alinhar estratégia de defesa com equipe",
      responsavel: "Dr. Marcos",
    },
    {
      id: "agenda:2",
      title: "Contestação — Prazo Final",
      start: setTime(d, 16, 30),
      end: setTime(d, 17, 0),
      allDay: false,
      source: "agenda",
      color: "rose",
      processo: "0009876-12.2024.5.15.0042",
      description: "Prazo fatal — vence hoje às 23:59",
      trt: "TRT-15",
      prepStatus: "pendente",
      prepDocs: 3, prepDocsOk: 0,
    },
    {
      id: "agenda:3",
      title: "Revisão de Contratos — Lote 12",
      start: setTime(addDays(d, 1), 9, 0),
      end: setTime(addDays(d, 1), 11, 0),
      allDay: false,
      source: "agenda",
      color: "orange",
      location: "Escritório",
      responsavel: "Dra. Patrícia",
    },
    {
      id: "agenda:4",
      title: "Treinamento Equipe — Novo PJe",
      start: setTime(addDays(d, 2), 14, 0),
      end: setTime(addDays(d, 2), 16, 0),
      allDay: false,
      source: "agenda",
      color: "emerald",
      location: "Sala de Treinamento",
    },
    {
      id: "agenda:5",
      title: "Aniversário do Escritório",
      start: addDays(d, 4),
      end: addDays(d, 4),
      allDay: true,
      source: "agenda",
      color: "violet",
    },
  );

  return events;
}

// ─── Week Pulse Data ───────────────────────────────────────────────────

export function generateWeekPulse(events: MockCalendarEvent[], baseDate: Date) {
  const week = getWeekDays(baseDate);
  return week.map((day) => {
    const dayEvents = events.filter((e) => {
      if (e.allDay) {
        return isSameDay(e.start, day);
      }
      return isSameDay(e.start, day);
    });

    const hours = dayEvents.reduce((acc, e) => {
      if (e.allDay) return acc + 1;
      return acc + (e.end.getTime() - e.start.getTime()) / 3600000;
    }, 0);

    return {
      date: day,
      dia: weekdayShort(day),
      eventos: dayEvents.length,
      horas: Math.round(hours * 10) / 10,
      hoje: isToday(day),
    };
  });
}

// ─── Day Summary ───────────────────────────────────────────────────────

export function getDaySummary(events: MockCalendarEvent[], date: Date) {
  const dayEvents = events.filter((e) => isSameDay(e.start, date));
  const audiencias = dayEvents.filter((e) => e.source === "audiencias").length;
  const timedEvents = dayEvents.filter((e) => !e.allDay);
  const horasOcupado = timedEvents.reduce((acc, e) => acc + (e.end.getTime() - e.start.getTime()) / 3600000, 0);
  const alertas = dayEvents.filter((e) => e.prepStatus === "pendente" || e.prepStatus === "parcial" || e.prazoVencido).length;

  return {
    total: dayEvents.length,
    audiencias,
    horasOcupado: `${Math.floor(horasOcupado)}h${Math.round((horasOcupado % 1) * 60) > 0 ? String(Math.round((horasOcupado % 1) * 60)).padStart(2, "0") : ""}`,
    horasFoco: `${Math.max(0, Math.round((9 - horasOcupado) * 10) / 10)}h`,
    alertas,
  };
}

// ─── Events for a specific day ─────────────────────────────────────────

export function getEventsForDay(events: MockCalendarEvent[], date: Date) {
  return events.filter((e) => {
    if (e.allDay) {
      // All-day events: check if date falls within start-end range
      const s = new Date(e.start); s.setHours(0,0,0,0);
      const eEnd = new Date(e.end); eEnd.setHours(23,59,59,999);
      const d = new Date(date); d.setHours(12,0,0,0);
      return d >= s && d <= eEnd;
    }
    return isSameDay(e.start, date);
  });
}

export function getTimedEvents(events: MockCalendarEvent[]) {
  return events.filter((e) => !e.allDay).sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function getAllDayEvents(events: MockCalendarEvent[]) {
  return events.filter((e) => e.allDay);
}
