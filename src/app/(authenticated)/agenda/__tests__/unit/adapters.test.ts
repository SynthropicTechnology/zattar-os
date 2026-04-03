/**
 * Testes: agenda adapters
 *
 * Verifica conversao de UnifiedCalendarEvent -> AgendaEvent e filtragem.
 */

import type { UnifiedCalendarEvent } from "@/app/(authenticated)/calendar/domain";
import { adaptToAgendaEvent, adaptEvents, filterBySource, filterBySearch } from "../../lib/adapters";

// ─── Fixtures ──────────────────────────────────────────────────────────

function criarEvento(overrides: Partial<UnifiedCalendarEvent> = {}): UnifiedCalendarEvent {
  return {
    id: "agenda:1",
    title: "Evento Teste",
    startAt: "2026-03-31T09:00:00.000Z",
    endAt: "2026-03-31T10:00:00.000Z",
    allDay: false,
    source: "agenda",
    sourceEntityId: 1,
    url: "",
    responsavelId: null,
    color: "violet",
    metadata: { descricao: "Desc", local: "Sala 1" },
    ...overrides,
  };
}

function criarAudiencia(): UnifiedCalendarEvent {
  return criarEvento({
    id: "audiencias:10",
    title: "Audiência Instrução",
    source: "audiencias",
    color: "sky",
    url: "/app/audiencias/semana?audienciaId=10",
    metadata: {
      numeroProcesso: "0001234-56.2024.5.02.0001",
      trt: "TRT-2",
      grau: "primeiro_grau",
      status: "M",
      modalidade: "presencial",
      prepStatus: "parcial",
    },
  });
}

// ─── adaptToAgendaEvent ────────────────────────────────────────────────

describe("adaptToAgendaEvent", () => {
  it("deve converter campos basicos corretamente", () => {
    const result = adaptToAgendaEvent(criarEvento());
    expect(result.id).toBe("agenda:1");
    expect(result.title).toBe("Evento Teste");
    expect(result.source).toBe("agenda");
    expect(result.color).toBe("violet");
    expect(result.start).toBeInstanceOf(Date);
    expect(result.end).toBeInstanceOf(Date);
  });

  it("deve extrair metadata de audiencia", () => {
    const result = adaptToAgendaEvent(criarAudiencia());
    expect(result.meta.processo).toBe("0001234-56.2024.5.02.0001");
    expect(result.meta.trt).toBe("TRT-2");
    expect(result.meta.modalidade).toBe("presencial");
    expect(result.meta.prepStatus).toBe("parcial");
  });

  it("deve extrair descricao e local de evento agenda", () => {
    const result = adaptToAgendaEvent(criarEvento());
    expect(result.meta.descricao).toBe("Desc");
    expect(result.meta.local).toBe("Sala 1");
  });

  it("deve usar violet como cor padrao quando cor e null", () => {
    const result = adaptToAgendaEvent(criarEvento({ color: null }));
    expect(result.color).toBe("violet");
  });

  it("deve manter referencia ao evento original", () => {
    const original = criarEvento();
    const result = adaptToAgendaEvent(original);
    expect(result.raw).toBe(original);
  });
});

// ─── adaptEvents ───────────────────────────────────────────────────────

describe("adaptEvents", () => {
  it("deve converter lista de eventos", () => {
    const events = [criarEvento(), criarAudiencia()];
    const result = adaptEvents(events);
    expect(result).toHaveLength(2);
    expect(result[0].source).toBe("agenda");
    expect(result[1].source).toBe("audiencias");
  });
});

// ─── filterBySource ────────────────────────────────────────────────────

describe("filterBySource", () => {
  it("deve retornar todos quando filtro esta vazio", () => {
    const events = adaptEvents([criarEvento(), criarAudiencia()]);
    const result = filterBySource(events, new Set());
    expect(result).toHaveLength(2);
  });

  it("deve filtrar por fonte especifica", () => {
    const events = adaptEvents([criarEvento(), criarAudiencia()]);
    const result = filterBySource(events, new Set(["audiencias"]));
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("audiencias");
  });

  it("deve suportar multiplas fontes", () => {
    const events = adaptEvents([
      criarEvento(),
      criarAudiencia(),
      criarEvento({ id: "expedientes:1", source: "expedientes", color: "amber" }),
    ]);
    const result = filterBySource(events, new Set(["agenda", "expedientes"]));
    expect(result).toHaveLength(2);
  });
});

// ─── filterBySearch ────────────────────────────────────────────────────

describe("filterBySearch", () => {
  it("deve retornar todos com query vazia", () => {
    const events = adaptEvents([criarEvento(), criarAudiencia()]);
    expect(filterBySearch(events, "")).toHaveLength(2);
    expect(filterBySearch(events, "  ")).toHaveLength(2);
  });

  it("deve filtrar por titulo case-insensitive", () => {
    const events = adaptEvents([criarEvento(), criarAudiencia()]);
    const result = filterBySearch(events, "audiência");
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("audiencias");
  });

  it("deve retornar vazio quando nada corresponde", () => {
    const events = adaptEvents([criarEvento()]);
    expect(filterBySearch(events, "xyz123")).toHaveLength(0);
  });
});
