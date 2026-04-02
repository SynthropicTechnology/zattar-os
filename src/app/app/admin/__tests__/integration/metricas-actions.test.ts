import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { actionObterMetricasDB } from "../../actions/metricas-actions";
import { actionAvaliarUpgrade, actionDocumentarDecisao } from "../../actions/upgrade-actions";
import * as authServer from "@/lib/auth/server";
import * as cacheUtils from "@/lib/redis/cache-utils";
import * as repo from "../../repositories/metricas-db-repository";
import * as managementApi from "@/lib/supabase/management-api";
import * as fsPromises from "fs/promises";
import * as fs from "fs";

// Mock modules
jest.mock("@/lib/auth/server");
jest.mock("@/lib/redis/cache-utils");
jest.mock("../../repositories/metricas-db-repository");
jest.mock("@/lib/supabase/management-api");
jest.mock("fs/promises");
jest.mock("fs");

describe("metricas-actions", () => {
  const mockUser = { id: 123, roles: ["admin"] };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock requireAuth
    (authServer.requireAuth as unknown as jest.Mock).mockResolvedValue({ user: mockUser });
  });

  describe("actionObterMetricasDB", () => {
    it("deve retornar todas as métricas incluindo diskIO", async () => {
      const mockCacheHitRate = [{ name: "index", ratio: 99.5 }];
      const mockQueriesLentas = [{ rolname: "postgres", query: "SELECT *", calls: 100, total_time: 1000, max_time: 50 }];
      const mockDiskIO = {
        disk_io_budget_percent: 75,
        disk_io_consumption_mbps: 50,
        disk_io_limit_mbps: 87,
        disk_iops_consumption: 1500,
        disk_iops_limit: 2085,
        compute_tier: "small",
        timestamp: "2026-01-09T12:00:00Z",
      };

      // Mock repository functions
      (repo.buscarCacheHitRate as unknown as jest.Mock).mockResolvedValue(mockCacheHitRate);
      (repo.buscarQueriesLentas as unknown as jest.Mock).mockResolvedValue(mockQueriesLentas);
      (repo.buscarTabelasSequentialScan as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarBloatTabelas as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarIndicesNaoUtilizados as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarMetricasDiskIO as unknown as jest.Mock).mockResolvedValue({
        metrics: mockDiskIO,
        status: "ok",
      });

      // Mock cache
      (cacheUtils.withCache as unknown as jest.Mock).mockImplementation(
        async (_key: string, fn: () => Promise<unknown>) => await fn()
      );

      const result = await actionObterMetricasDB();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.diskIO).toEqual(mockDiskIO);
      expect(result.data?.diskIOStatus).toBe("ok");
      expect(result.data?.cacheHitRate).toEqual(mockCacheHitRate);
    });

    it("deve retornar diskIO null e status 'unavailable' se Management API falhar", async () => {
      (repo.buscarCacheHitRate as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarQueriesLentas as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarTabelasSequentialScan as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarBloatTabelas as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarIndicesNaoUtilizados as unknown as jest.Mock).mockResolvedValue([]);
      (repo.buscarMetricasDiskIO as unknown as jest.Mock).mockResolvedValue({
        metrics: null,
        status: "api_error",
      });

      (cacheUtils.withCache as unknown as jest.Mock).mockImplementation(
        async (_key: string, fn: () => Promise<unknown>) => await fn()
      );

      const result = await actionObterMetricasDB();

      expect(result.success).toBe(true);
      expect(result.data?.diskIO).toBeNull();
      expect(result.data?.diskIOStatus).toBe("api_error");
    });

    it("deve negar acesso se não for super_admin", async () => {
      (authServer.requireAuth as unknown as jest.Mock).mockResolvedValue({
        user: { id: 123, roles: [] },
      });

      const result = await actionObterMetricasDB();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Acesso negado");
    });
  });

  describe("actionAvaliarUpgrade", () => {
    it("deve retornar recomendação correta", async () => {
      (repo.buscarCacheHitRate as unknown as jest.Mock).mockResolvedValue([
        { name: "index", ratio: 94.2 },
        { name: "table", ratio: 93.8 },
      ]);

      (managementApi.obterMetricasDiskIO as unknown as jest.Mock).mockResolvedValue({
        status: "ok",
        metrics: {
          disk_io_budget_percent: 92,
          disk_io_consumption_mbps: 50,
          disk_io_limit_mbps: 87,
          disk_iops_consumption: 1500,
          disk_iops_limit: 2085,
          compute_tier: "small",
        },
      });

      (managementApi.obterComputeAtual as unknown as jest.Mock).mockResolvedValue({
        name: "small",
      });

      const result = await actionAvaliarUpgrade();

      expect(result.success).toBe(true);
      expect(result.data?.should_upgrade).toBe(true);
      expect(result.data?.recommended_tier).toBeDefined();
    });
  });

  describe("actionDocumentarDecisao", () => {
    it("deve atualizar arquivo DISK_IO_OPTIMIZATION.md", async () => {
      const mockContent = `
## 📈 Métricas Pós-Otimização

### Cache Hit Rate
- **Antes**: [PREENCHER]
- **Depois**: [PREENCHER]
- **Melhoria**: [PREENCHER]

### Disk IO Budget
- **Antes**: [PREENCHER]% consumido
- **Depois**: [PREENCHER]% consumido
- **Melhoria**: [PREENCHER]%

### Queries Lentas (>1s)
- **Antes**: [PREENCHER] queries
- **Depois**: [PREENCHER] queries
- **Melhoria**: [PREENCHER]%

---

## 🔄 Decisão de Upgrade de Compute
[PREENCHER]

---

## 📝 Histórico de Mudanças

| Data | Fase | Descrição | Impacto |
|------|------|-----------|---------|
`;

      (fs.existsSync as unknown as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as unknown as jest.Mock).mockResolvedValue(mockContent);
      (fsPromises.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);

      const result = await actionDocumentarDecisao(
        "manter",
        {
          cache_hit_rate_antes: 94.0,
          cache_hit_rate_depois: 99.5,
          disk_io_antes: 92,
          disk_io_depois: 75,
          queries_lentas_antes: 50,
          queries_lentas_depois: 5,
        },
        "Otimizações aplicadas com sucesso"
      );

      expect(result.success).toBe(true);
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fsPromises.writeFile).toHaveBeenCalled();
    });

    it("deve negar acesso se não for super_admin", async () => {
      (authServer.requireAuth as unknown as jest.Mock).mockResolvedValue({
        user: { id: 123, roles: [] },
      });

      const result = await actionDocumentarDecisao(
        "manter",
        {
          cache_hit_rate_antes: 0,
          cache_hit_rate_depois: 0,
          disk_io_antes: 0,
          disk_io_depois: 0,
          queries_lentas_antes: 0,
          queries_lentas_depois: 0,
        },
        "teste"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Acesso negado");
    });
  });
});
