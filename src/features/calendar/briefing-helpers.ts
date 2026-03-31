/**
 * Briefing Helpers — Funcoes puras para a view "Briefing" da Agenda
 * ============================================================================
 * Todas as funcoes sao client-safe (sem dependencia de server).
 * Operam sobre UnifiedCalendarEvent do dominio existente.
 * ============================================================================
 */

import type { UnifiedCalendarEvent } from "./domain";
import type { BriefingEventMeta, DaySummary, WeekPulseDay, PrepStatus } from "./briefing-domain";

// ─── Date Helpers ──────────────────────────────────────────────────────

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function weekdayShort(date: Date): string { return WEEKDAY_SHORT[date.getDay()]; }
export function weekdayFull(date: Date): string { return WEEKDAY_FULL[date.getDay()]; }
export function monthName(date: Date): string { return MONTH_NAMES[date.getMonth()]; }

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fmtTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function fmtDate(date: Date): string {
  return `${date.getDate()} de ${monthName(date).toLowerCase()}`;
}

export function fmtDateFull(date: Date): string {
  return `${weekdayFull(date)}, ${date.getDate()} de ${monthName(date)}`;
}

// ─── Event Helpers ─────────────────────────────────────────────────────

/** Extrai metadata tipado de um UnifiedCalendarEvent */
export function extractMeta(event: UnifiedCalendarEvent): BriefingEventMeta {
  const m = (event.metadata ?? {}) as Record<string, unknown>;
  return {
    processo: (m.numeroProcesso as string) ?? undefined,
    trt: (m.trt as string) ?? undefined,
    grau: (m.grau as string) ?? undefined,
    modalidade: (m.modalidade as BriefingEventMeta["modalidade"]) ?? null,
    enderecoPresencial: (m.enderecoPresencial as BriefingEventMeta["enderecoPresencial"]) ?? null,
    urlAudienciaVirtual: (m.urlAudienciaVirtual as string) ?? null,
    status: (m.status as string) ?? undefined,
    prepStatus: (m.prepStatus as PrepStatus) ?? undefined,
    prazoVencido: (m.prazoVencido as boolean) ?? false,
    parcelaNum: (m.parcelaNum as number) ?? undefined,
    valor: (m.valor as number) ?? undefined,
    descricao: (m.descricao as string) ?? undefined,
    local: (m.local as string) ?? undefined,
  };
}

/** Retorna eventos de um dia especifico */
export function getEventsForDay(events: UnifiedCalendarEvent[], date: Date): UnifiedCalendarEvent[] {
  return events.filter((e) => {
    const start = new Date(e.startAt);
    if (e.allDay) {
      const end = new Date(e.endAt);
      const d = new Date(date);
      d.setHours(12, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
    return isSameDay(start, date);
  });
}

/** Filtra eventos com horario (nao all-day), ordenados por inicio */
export function getTimedEvents(events: UnifiedCalendarEvent[]): UnifiedCalendarEvent[] {
  return events
    .filter((e) => !e.allDay)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

/** Filtra eventos all-day */
export function getAllDayEvents(events: UnifiedCalendarEvent[]): UnifiedCalendarEvent[] {
  return events.filter((e) => e.allDay);
}

// ─── Week Pulse ────────────────────────────────────────────────────────

/** Gera dados do "Pulso da Semana" para a semana contendo a data base */
export function generateWeekPulse(events: UnifiedCalendarEvent[], baseDate: Date): WeekPulseDay[] {
  const weekStart = startOfWeek(baseDate);

  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const dayEvents = getEventsForDay(events, day);

    const hours = dayEvents.reduce((acc, e) => {
      if (e.allDay) return acc + 1;
      const start = new Date(e.startAt);
      const end = new Date(e.endAt);
      return acc + (end.getTime() - start.getTime()) / 3600000;
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

/** Gera resumo estatistico do dia */
export function getDaySummary(events: UnifiedCalendarEvent[], date: Date): DaySummary {
  const dayEvents = getEventsForDay(events, date);
  const audiencias = dayEvents.filter((e) => e.source === "audiencias").length;

  const timedEvents = dayEvents.filter((e) => !e.allDay);
  const horasOcupado = timedEvents.reduce((acc, e) => {
    const start = new Date(e.startAt);
    const end = new Date(e.endAt);
    return acc + (end.getTime() - start.getTime()) / 3600000;
  }, 0);

  const hFull = Math.floor(horasOcupado);
  const hMin = Math.round((horasOcupado % 1) * 60);
  const horasOcupadoStr = hMin > 0 ? `${hFull}h${String(hMin).padStart(2, "0")}` : `${hFull}h`;

  const focoDisponivel = Math.max(0, 9 - horasOcupado);
  const focoStr = `${Math.round(focoDisponivel * 10) / 10}h`;

  const alertas = dayEvents.filter((e) => {
    const meta = extractMeta(e);
    return meta.prepStatus === "pendente" || meta.prepStatus === "parcial" || meta.prazoVencido;
  }).length;

  return {
    total: dayEvents.length,
    audiencias,
    horasOcupado: horasOcupadoStr,
    horasFoco: focoStr,
    alertas,
  };
}

// ─── Briefing Text ─────────────────────────────────────────────────────

/** Gera texto narrativo do briefing do dia */
export function buildBriefingText(events: UnifiedCalendarEvent[], date: Date): string {
  const dayEvents = getEventsForDay(events, date);
  const audiencias = dayEvents.filter((e) => e.source === "audiencias");
  const primeira = audiencias.length > 0 ? audiencias[0] : null;

  const needsPrep = dayEvents.filter((e) => {
    const meta = extractMeta(e);
    return meta.prepStatus === "pendente" || meta.prepStatus === "parcial";
  });

  const h = new Date().getHours();
  const saudacao = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const total = dayEvents.length;
  const intensidade = total <= 2 ? "leve" : total <= 5 ? "moderado" : "intenso";

  let text = `${saudacao}. Dia ${intensidade} com ${audiencias.length} audiência${audiencias.length !== 1 ? "s" : ""}`;

  if (primeira) {
    const primeiraStart = new Date(primeira.startAt);
    const meta = extractMeta(primeira);
    text += `. Primeira às ${fmtTime(primeiraStart)}`;
    if (meta.trt) text += ` no ${meta.trt}`;
    if (meta.modalidade === "presencial") text += " (presencial)";
    if (meta.modalidade === "virtual") text += " (virtual)";
  }

  text += ".";

  if (needsPrep.length > 0) {
    text += ` ${needsPrep.length} evento${needsPrep.length > 1 ? "s" : ""} precisa${needsPrep.length > 1 ? "m" : ""} de preparo.`;
  } else {
    text += " Tudo preparado.";
  }

  return text;
}
