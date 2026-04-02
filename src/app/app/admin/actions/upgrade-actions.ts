'use server';

import { requireAuth } from "@/lib/auth/server";
import { avaliarNecessidadeUpgrade } from "../services/upgrade-advisor";
import { obterMetricasDiskIO, obterComputeAtual } from "@/lib/supabase/management-api";
import { buscarCacheHitRate } from "../repositories/metricas-db-repository";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UpgradeRecommendation {
  should_upgrade: boolean;
  recommended_tier: 'small' | 'medium' | 'large' | null;
  reasons: string[];
  estimated_cost_increase: number;
  estimated_downtime_minutes: number;
}

/**
 * Avaliar necessidade de upgrade de compute
 */
export async function actionAvaliarUpgrade(): Promise<ActionResult<UpgradeRecommendation>> {
  try {
    const { user } = await requireAuth([]);

    // requireAuth() já resolve roles baseado em is_super_admin.
    if (!user.roles?.includes("admin")) {
      return { success: false, error: "Acesso negado. Apenas administradores." };
    }

    // Buscar métricas atuais
    const [cacheHitRateData, diskIOResult, computeData] = await Promise.all([
      buscarCacheHitRate(),
      obterMetricasDiskIO(),
      obterComputeAtual(),
    ]);

    // Calcular cache hit rate médio
    const cacheHitRate = cacheHitRateData.length > 0
      ? cacheHitRateData.reduce((acc, curr) => acc + curr.ratio, 0) / cacheHitRateData.length
      : 0;

    const diskIOBudgetPercent = diskIOResult.metrics?.disk_io_budget_percent ?? 0;
    const computeAtual = computeData?.name ?? diskIOResult.metrics?.compute_tier ?? "unknown";

    // Avaliar necessidade de upgrade
    const recommendation = avaliarNecessidadeUpgrade(
      cacheHitRate,
      diskIOBudgetPercent,
      computeAtual
    );

    return { success: true, data: recommendation };
  } catch (error) {
    console.error("[Upgrade] Erro ao avaliar upgrade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

interface MetricasDecisao {
  cache_hit_rate_antes: number;
  cache_hit_rate_depois: number;
  disk_io_antes: number;
  disk_io_depois: number;
  queries_lentas_antes: number;
  queries_lentas_depois: number;
}

/**
 * Documentar decisão de upgrade em docs/DISK_IO_OPTIMIZATION.md
 *
 * O arquivo de documentação está localizado em docs/DISK_IO_OPTIMIZATION.md
 * (não na raiz do projeto). Este path é usado para manter consistência com
 * outros documentos de otimização (ex: docs/CACHE_REDIS_SUMARIO.md).
 */
export async function actionDocumentarDecisao(
  decisao: 'manter' | 'upgrade_small' | 'upgrade_medium' | 'upgrade_large',
  metricas: MetricasDecisao,
  justificativa: string
): Promise<ActionResult<void>> {
  try {
    const { user } = await requireAuth([]);

    // requireAuth() já resolve roles baseado em is_super_admin.
    if (!user.roles?.includes("admin")) {
      return { success: false, error: "Acesso negado. Apenas administradores." };
    }

    // Ler arquivo atual (path correto: docs/DISK_IO_OPTIMIZATION.md)
    const filePath = join(process.cwd(), "docs/DISK_IO_OPTIMIZATION.md");

    if (!existsSync(filePath)) {
      return {
        success: false,
        error: "Arquivo docs/DISK_IO_OPTIMIZATION.md não encontrado"
      };
    }

    let content = await readFile(filePath, "utf-8");

    // Atualizar seção "Métricas Pós-Otimização"
    const melhoriaCache = metricas.cache_hit_rate_depois - metricas.cache_hit_rate_antes;
    const melhoriaDisk = metricas.disk_io_antes - metricas.disk_io_depois;
    const melhoriaQueries =
      metricas.queries_lentas_antes > 0
        ? `${((1 - metricas.queries_lentas_depois / metricas.queries_lentas_antes) * 100).toFixed(0)}%`
        : "N/D";

    const metricasPosSection = `## 📈 Métricas Pós-Otimização

> **Instruções**: Preencher valores via dashboard \`/app/admin/metricas-db\` ou página de avaliação \`/app/admin/metricas-db/avaliar-upgrade\`

### Cache Hit Rate
- **Antes**: ${metricas.cache_hit_rate_antes.toFixed(2)}%
- **Depois**: ${metricas.cache_hit_rate_depois.toFixed(2)}%
- **Melhoria**: ${melhoriaCache.toFixed(2)}%

### Disk IO Budget
- **Antes**: ${metricas.disk_io_antes.toFixed(0)}% consumido
- **Depois**: ${metricas.disk_io_depois.toFixed(0)}% consumido
- **Melhoria**: ${melhoriaDisk.toFixed(0)}%

### Queries Lentas (>1s)
- **Antes**: ${metricas.queries_lentas_antes} queries
- **Depois**: ${metricas.queries_lentas_depois} queries
- **Melhoria**: ${melhoriaQueries}
`;

    // Atualizar seção "Decisão de Upgrade de Compute"
    const decisaoMap = {
      manter: "Manter compute atual",
      upgrade_small: "Upgrade para Small",
      upgrade_medium: "Upgrade para Medium",
      upgrade_large: "Upgrade para Large",
    };

    const decisaoSection = `## 🔄 Decisão de Upgrade de Compute

### Recomendação Final
- **Decisão**: ${decisaoMap[decisao]}
- **Data da avaliação**: ${new Date().toLocaleDateString("pt-BR")}

### Justificativa
${justificativa}

### Métricas Registradas
- Cache hit rate (depois): ${metricas.cache_hit_rate_depois.toFixed(2)}%
- Disk IO Budget (depois): ${metricas.disk_io_depois.toFixed(0)}%
- Queries lentas (depois): ${metricas.queries_lentas_depois}
`;

    // Histórico entry
    const hoje = new Date().toLocaleDateString("pt-BR");
    const historicoEntry = `| ${hoje} | Decisão | ${decisaoMap[decisao]} | ${metricas.disk_io_depois.toFixed(0)}% Disk IO |`;

    // Tentar atualizar seções existentes via regex
    const metricasRegex = /## 📈 Métricas Pós-Otimização[\s\S]*?(?=\n---\n)/;
    const decisaoRegex = /## 🔄 Decisão de Upgrade de Compute[\s\S]*?(?=\n---\n)/;
    const historicoRegex = /(## 📝 Histórico de Mudanças[\s\S]*?\n\|------\|------\|-----------\|---------\|\n)/;

    let sectionsAdded = false;

    // Substituir ou adicionar seção de métricas
    if (metricasRegex.test(content)) {
      content = content.replace(metricasRegex, metricasPosSection);
    } else {
      sectionsAdded = true;
    }

    // Substituir ou adicionar seção de decisão
    if (decisaoRegex.test(content)) {
      content = content.replace(decisaoRegex, decisaoSection);
    } else {
      sectionsAdded = true;
    }

    // Adicionar ao histórico se existir
    if (historicoRegex.test(content)) {
      content = content.replace(historicoRegex, `$1${historicoEntry}\n`);
    }

    // Se seções não existiram, adicionar ao final do arquivo
    if (sectionsAdded) {
      const newSections = `
---

${metricasPosSection}
---

${decisaoSection}
---

## 📝 Histórico de Mudanças

| Data | Tipo | Descrição | Impacto |
|------|------|-----------|---------|
${historicoEntry}

---
`;
      content = content.trimEnd() + "\n" + newSections;
    }

    // Escrever arquivo atualizado
    await writeFile(filePath, content, "utf-8");

    return { success: true };
  } catch (error) {
    console.error("[Upgrade] Erro ao documentar decisão:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
