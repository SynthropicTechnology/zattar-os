/**
 * Testes: travel-helpers
 *
 * Verifica estimativa de tempo de deslocamento entre eventos presenciais.
 */

import { estimateTravelTime } from "../../travel-helpers";
import type { BriefingEventMeta } from "../../briefing-domain";

// ─── Fixtures ──────────────────────────────────────────────────────────

function criarMeta(overrides: Partial<BriefingEventMeta> = {}): BriefingEventMeta {
  return {
    modalidade: "presencial",
    enderecoPresencial: { cidade: "São Paulo", uf: "SP" },
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe("estimateTravelTime", () => {
  it("deve retornar null se evento de origem nao e presencial", () => {
    const from = criarMeta({ modalidade: "virtual" });
    const to = criarMeta();
    expect(estimateTravelTime(from, to)).toBeNull();
  });

  it("deve retornar null se evento destino nao e presencial", () => {
    const from = criarMeta();
    const to = criarMeta({ modalidade: "virtual" });
    expect(estimateTravelTime(from, to)).toBeNull();
  });

  it("deve retornar null se ambos sao virtuais", () => {
    const from = criarMeta({ modalidade: "virtual" });
    const to = criarMeta({ modalidade: "virtual" });
    expect(estimateTravelTime(from, to)).toBeNull();
  });

  it("deve estimar 25min para mesma cidade", () => {
    const from = criarMeta({ enderecoPresencial: { cidade: "São Paulo", uf: "SP" } });
    const to = criarMeta({ enderecoPresencial: { cidade: "São Paulo", uf: "SP" } });
    const result = estimateTravelTime(from, to);
    expect(result).not.toBeNull();
    expect(result!.minutes).toBe(25);
  });

  it("deve estimar 60min para cidades diferentes", () => {
    const from = criarMeta({ enderecoPresencial: { cidade: "São Paulo", uf: "SP" } });
    const to = criarMeta({ enderecoPresencial: { cidade: "Campinas", uf: "SP" } });
    const result = estimateTravelTime(from, to);
    expect(result).not.toBeNull();
    expect(result!.minutes).toBe(60);
  });

  it("deve estimar 30min quando sem dados de cidade", () => {
    const from = criarMeta({ enderecoPresencial: null });
    const to = criarMeta({ enderecoPresencial: null });
    const result = estimateTravelTime(from, to);
    expect(result).not.toBeNull();
    expect(result!.minutes).toBe(30);
  });

  it("deve ser case-insensitive para comparacao de cidade", () => {
    const from = criarMeta({ enderecoPresencial: { cidade: "são paulo" } });
    const to = criarMeta({ enderecoPresencial: { cidade: "São Paulo" } });
    const result = estimateTravelTime(from, to);
    expect(result!.minutes).toBe(25);
  });
});
