/**
 * Testes: briefing-helpers
 *
 * Verifica funcoes puras de calculo de stats, week pulse, briefing text
 * e filtragem de eventos por dia.
 */

import type { UnifiedCalendarEvent } from "../../domain";
import {
  isSameDay,
  addDays,
  startOfWeek,
  fmtTime,
  weekdayShort,
  monthName,
  getEventsForDay,
  getTimedEvents,
  getAllDayEvents,
  generateWeekPulse,
  getDaySummary,
  buildBriefingText,
} from "../../briefing-helpers";

// ─── Fixtures ──────────────────────────────────────────────────────────

function criarEvento(overrides: Partial<UnifiedCalendarEvent> = {}): UnifiedCalendarEvent {
  const now = new Date();
  now.setHours(9, 0, 0, 0);
  const end = new Date(now);
  end.setHours(10, 0, 0, 0);

  return {
    id: "agenda:1",
    title: "Evento Teste",
    startAt: now.toISOString(),
    endAt: end.toISOString(),
    allDay: false,
    source: "agenda",
    sourceEntityId: 1,
    url: "",
    responsavelId: null,
    color: "violet",
    metadata: null,
    ...overrides,
  };
}

function criarAudiencia(horaInicio: number, horaFim: number, metadata: Record<string, unknown> = {}): UnifiedCalendarEvent {
  const start = new Date();
  start.setHours(horaInicio, 0, 0, 0);
  const end = new Date();
  end.setHours(horaFim, 0, 0, 0);

  return criarEvento({
    id: `audiencias:${Math.random()}`,
    title: `Audiência ${horaInicio}h`,
    source: "audiencias",
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    color: "sky",
    metadata: { trt: "TRT-2", status: "M", ...metadata },
  });
}

function criarEventoAllDay(date: Date): UnifiedCalendarEvent {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return criarEvento({
    id: `exp:${Math.random()}`,
    title: "Expediente All-day",
    source: "expedientes",
    startAt: d.toISOString(),
    endAt: d.toISOString(),
    allDay: true,
    color: "amber",
  });
}

// ─── Date Helpers ──────────────────────────────────────────────────────

describe("date helpers", () => {
  it("isSameDay deve retornar true para mesma data", () => {
    const a = new Date(2026, 2, 31, 9, 0);
    const b = new Date(2026, 2, 31, 17, 0);
    expect(isSameDay(a, b)).toBe(true);
  });

  it("isSameDay deve retornar false para datas diferentes", () => {
    const a = new Date(2026, 2, 31);
    const b = new Date(2026, 3, 1);
    expect(isSameDay(a, b)).toBe(false);
  });

  it("addDays deve adicionar dias corretamente", () => {
    const d = new Date(2026, 2, 28);
    const result = addDays(d, 5);
    expect(result.getDate()).toBe(2);
    expect(result.getMonth()).toBe(3); // Abril
  });

  it("startOfWeek deve retornar domingo", () => {
    // 31 de marco 2026 e terca-feira
    const d = new Date(2026, 2, 31);
    const result = startOfWeek(d);
    expect(result.getDay()).toBe(0); // Domingo
    expect(result.getDate()).toBe(29);
  });

  it("fmtTime deve formatar corretamente", () => {
    const d = new Date(2026, 0, 1, 9, 30);
    expect(fmtTime(d)).toBe("09:30");
  });

  it("fmtTime deve formatar meia-noite", () => {
    const d = new Date(2026, 0, 1, 0, 0);
    expect(fmtTime(d)).toBe("00:00");
  });

  it("weekdayShort deve retornar abreviacao correta", () => {
    const terça = new Date(2026, 2, 31); // Terca-feira
    expect(weekdayShort(terça)).toBe("Ter");
  });

  it("monthName deve retornar nome do mes", () => {
    const marco = new Date(2026, 2, 1);
    expect(monthName(marco)).toBe("Março");
  });
});

// ─── getEventsForDay ───────────────────────────────────────────────────

describe("getEventsForDay", () => {
  it("deve retornar eventos do dia correto", () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);

    const events = [
      criarEvento({ startAt: today.toISOString() }),
      criarEvento({ id: "agenda:2", startAt: tomorrow.toISOString(), endAt: tomorrow.toISOString() }),
    ];

    const result = getEventsForDay(events, today);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("agenda:1");
  });

  it("deve incluir eventos all-day do dia", () => {
    const today = new Date();
    const events = [criarEventoAllDay(today)];
    const result = getEventsForDay(events, today);
    expect(result).toHaveLength(1);
  });

  it("deve retornar vazio para dia sem eventos", () => {
    const events = [criarEvento()];
    const nextWeek = addDays(new Date(), 7);
    const result = getEventsForDay(events, nextWeek);
    expect(result).toHaveLength(0);
  });
});

// ─── getTimedEvents / getAllDayEvents ───────────────────────────────────

describe("getTimedEvents e getAllDayEvents", () => {
  it("deve separar eventos timed de all-day", () => {
    const events = [
      criarEvento({ allDay: false }),
      criarEventoAllDay(new Date()),
    ];

    expect(getTimedEvents(events)).toHaveLength(1);
    expect(getAllDayEvents(events)).toHaveLength(1);
  });

  it("getTimedEvents deve ordenar por horario de inicio", () => {
    const e1 = criarAudiencia(14, 15);
    const e2 = criarAudiencia(9, 10);
    const result = getTimedEvents([e1, e2]);
    expect(new Date(result[0].startAt).getHours()).toBe(9);
    expect(new Date(result[1].startAt).getHours()).toBe(14);
  });
});

// ─── generateWeekPulse ─────────────────────────────────────────────────

describe("generateWeekPulse", () => {
  it("deve gerar 7 dias", () => {
    const result = generateWeekPulse([], new Date());
    expect(result).toHaveLength(7);
  });

  it("deve marcar hoje corretamente", () => {
    const result = generateWeekPulse([], new Date());
    const todayEntry = result.find((d) => d.hoje);
    expect(todayEntry).toBeDefined();
  });

  it("deve calcular horas por dia", () => {
    const events = [criarAudiencia(9, 11)]; // 2 horas
    const result = generateWeekPulse(events, new Date());
    const todayEntry = result.find((d) => d.hoje);
    expect(todayEntry?.horas).toBe(2);
    expect(todayEntry?.eventos).toBe(1);
  });

  it("deve contar all-day como 1 hora", () => {
    const events = [criarEventoAllDay(new Date())];
    const result = generateWeekPulse(events, new Date());
    const todayEntry = result.find((d) => d.hoje);
    expect(todayEntry?.horas).toBe(1);
  });
});

// ─── getDaySummary ─────────────────────────────────────────────────────

describe("getDaySummary", () => {
  it("deve calcular resumo correto do dia", () => {
    const events = [
      criarAudiencia(9, 10),
      criarAudiencia(11, 12),
      criarEvento({ title: "Reuniao" }),
    ];

    const summary = getDaySummary(events, new Date());
    expect(summary.total).toBe(3);
    expect(summary.audiencias).toBe(2);
    expect(summary.alertas).toBe(0);
  });

  it("deve contar alertas de prepStatus pendente", () => {
    const events = [
      criarAudiencia(9, 10, { prepStatus: "pendente" }),
      criarAudiencia(11, 12, { prepStatus: "preparado" }),
    ];

    const summary = getDaySummary(events, new Date());
    expect(summary.alertas).toBe(1);
  });

  it("deve contar alertas de prazo vencido", () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    const events = [criarEvento({
      source: "expedientes",
      allDay: true,
      startAt: d.toISOString(),
      endAt: d.toISOString(),
      metadata: { prazoVencido: true },
    })];

    const summary = getDaySummary(events, new Date());
    expect(summary.alertas).toBe(1);
  });

  it("deve retornar zeros para dia sem eventos", () => {
    const summary = getDaySummary([], new Date());
    expect(summary.total).toBe(0);
    expect(summary.audiencias).toBe(0);
    expect(summary.horasOcupado).toBe("0h");
  });
});

// ─── buildBriefingText ─────────────────────────────────────────────────

describe("buildBriefingText", () => {
  it("deve gerar texto com saudacao", () => {
    const events = [criarAudiencia(9, 10)];
    const text = buildBriefingText(events, new Date());
    expect(text).toMatch(/^(Bom dia|Boa tarde|Boa noite)/);
  });

  it("deve incluir contagem de audiencias", () => {
    const events = [criarAudiencia(9, 10), criarAudiencia(11, 12)];
    const text = buildBriefingText(events, new Date());
    expect(text).toContain("2 audiências");
  });

  it("deve indicar quando tudo esta preparado", () => {
    const events = [criarEvento()];
    const text = buildBriefingText(events, new Date());
    expect(text).toContain("Tudo preparado");
  });

  it("deve alertar sobre preparo pendente", () => {
    const events = [criarAudiencia(9, 10, { prepStatus: "pendente" })];
    const text = buildBriefingText(events, new Date());
    expect(text).toContain("precisa de preparo");
  });

  it("deve incluir TRT da primeira audiencia", () => {
    const events = [criarAudiencia(9, 10, { trt: "TRT-15" })];
    const text = buildBriefingText(events, new Date());
    expect(text).toContain("TRT-15");
  });

  it("deve lidar com dia sem eventos", () => {
    const text = buildBriefingText([], new Date());
    expect(text).toContain("0 audiências");
    expect(text).toContain("Tudo preparado");
  });
});
