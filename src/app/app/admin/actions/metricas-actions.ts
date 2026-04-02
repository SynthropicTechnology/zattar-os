'use server';

import { requireAuth } from "@/lib/auth/server";
import {
  withCache,
  generateCacheKey,
  CACHE_PREFIXES,
} from "@/lib/redis/cache-utils";
import {
  buscarBloatTabelas,
  buscarCacheHitRate,
  buscarQueriesLentas,
  buscarTabelasSequentialScan,
  buscarIndicesNaoUtilizados,
  buscarMetricasDiskIO,
  type BloatTabela,
  type CacheHitRate,
  type QueryLenta,
  type TabelaSequentialScan,
  type IndiceNaoUtilizado,
  type MetricasDiskIO,
  type DiskIOStatus,
} from "../repositories/metricas-db-repository";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MetricasDB {
  cacheHitRate: CacheHitRate[];
  queriesLentas: QueryLenta[];
  tabelasSeqScan: TabelaSequentialScan[];
  bloat: BloatTabela[];
  indicesNaoUtilizados: IndiceNaoUtilizado[];
  diskIO: MetricasDiskIO | null;
  diskIOStatus: DiskIOStatus;
  diskIOMessage?: string;
  timestamp: string;
}

export async function actionObterMetricasDB(): Promise<ActionResult<MetricasDB>> {
  try {
    const { user } = await requireAuth([]);

    // requireAuth() já resolve roles baseado em is_super_admin.
    if (!user.roles?.includes("admin")) {
      return { success: false, error: "Acesso negado. Apenas administradores." };
    }

    const cacheKey = generateCacheKey(CACHE_PREFIXES.admin, { action: "metricas_db" });

    const data = await withCache(
      cacheKey,
      async () => {
        const [cacheHitRate, queriesLentas, tabelasSeqScan, bloat, indicesNaoUtilizados, diskIOResult] =
          await Promise.all([
            buscarCacheHitRate(),
            buscarQueriesLentas(20),
            buscarTabelasSequentialScan(20),
            buscarBloatTabelas(),
            buscarIndicesNaoUtilizados(),
            buscarMetricasDiskIO(),
          ]);

        return {
          cacheHitRate,
          queriesLentas,
          tabelasSeqScan,
          bloat,
          indicesNaoUtilizados,
          diskIO: diskIOResult.metrics,
          diskIOStatus: diskIOResult.status,
          diskIOMessage: diskIOResult.message,
          timestamp: new Date().toISOString(),
        } satisfies MetricasDB;
      },
      60
    );

    return { success: true, data };
  } catch (error) {
    console.error("[Metrica DB] erro ao obter metricas", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
