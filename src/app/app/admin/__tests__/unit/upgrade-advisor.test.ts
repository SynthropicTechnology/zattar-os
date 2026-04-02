import { describe, it, expect } from "@jest/globals";
import { avaliarNecessidadeUpgrade } from "../../services/upgrade-advisor";

describe("upgrade-advisor", () => {
  describe("avaliarNecessidadeUpgrade", () => {
    it("deve recomendar manter atual quando métricas estão saudáveis", () => {
      const result = avaliarNecessidadeUpgrade(99.5, 70, "small");

      expect(result.should_upgrade).toBe(false);
      expect(result.recommended_tier).toBeNull();
      expect(result.reasons).toContain("✅ Métricas dentro dos parâmetros esperados");
    });

    it("deve recomendar upgrade quando cache hit rate < 95%", () => {
      const result = avaliarNecessidadeUpgrade(94.2, 70, "small");

      expect(result.should_upgrade).toBe(true);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Cache hit rate está em 94.2%"),
        ])
      );
    });

    it("deve recomendar upgrade quando Disk IO Budget > 90%", () => {
      const result = avaliarNecessidadeUpgrade(99, 92, "small");

      expect(result.should_upgrade).toBe(true);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Disk IO Budget está em 92% (crítico >90%)"),
        ])
      );
    });

    it("deve recomendar upgrade Small quando compute é Micro", () => {
      const result = avaliarNecessidadeUpgrade(99, 70, "micro");

      expect(result.should_upgrade).toBe(true);
      expect(result.recommended_tier).toBe("small");
      expect(result.estimated_cost_increase).toBe(10);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          "Compute Micro não é recomendado para ambientes de produção",
        ])
      );
    });

    it("deve recomendar upgrade Large quando Small está com Disk IO crítico", () => {
      const result = avaliarNecessidadeUpgrade(99, 92, "small");

      expect(result.should_upgrade).toBe(true);
      expect(result.recommended_tier).toBe("large");
      expect(result.estimated_cost_increase).toBe(90);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining("upgrade para Large ($100/mês)"),
        ])
      );
    });

    it("deve recomendar upgrade Medium quando Small está com cache hit rate baixo", () => {
      const result = avaliarNecessidadeUpgrade(96, 85, "small");

      expect(result.should_upgrade).toBe(true);
      expect(result.recommended_tier).toBe("medium");
      expect(result.estimated_cost_increase).toBe(40);
    });

    it("deve incluir estimativa de downtime", () => {
      const result = avaliarNecessidadeUpgrade(94, 92, "small");

      expect(result.estimated_downtime_minutes).toBe(2);
    });
  });
});
