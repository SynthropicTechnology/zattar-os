/**
 * Assistente de decisão de upgrade de compute
 * 
 * Analisa métricas de performance e recomenda se upgrade é necessário
 */

interface UpgradeRecommendation {
  should_upgrade: boolean;
  recommended_tier: 'small' | 'medium' | 'large' | null;
  reasons: string[];
  estimated_cost_increase: number;
  estimated_downtime_minutes: number;
}

/**
 * Avaliar necessidade de upgrade baseado em métricas
 * 
 * @param cacheHitRate - Cache hit rate médio (0-100)
 * @param diskIOBudgetPercent - Porcentagem do Disk IO Budget consumido (0-100)
 * @param computeAtual - Tier atual (micro, small, medium, large, etc.)
 * @returns Recomendação de upgrade
 */
export function avaliarNecessidadeUpgrade(
  cacheHitRate: number,
  diskIOBudgetPercent: number,
  computeAtual: string
): UpgradeRecommendation {
  const reasons: string[] = [];
  let shouldUpgrade = false;
  let recommendedTier: 'small' | 'medium' | 'large' | null = null;
  let estimatedCostIncrease = 0;
  const estimatedDowntimeMinutes = 2; // Downtime típico do Supabase

  // Normalizar nome do compute
  const currentTier = computeAtual.toLowerCase();

  // Regra 1: Cache hit rate crítico (<95%)
  if (cacheHitRate < 95) {
    shouldUpgrade = true;
    reasons.push(`Cache hit rate está em ${cacheHitRate.toFixed(1)}% (esperado >99%)`);
  }

  // Regra 2: Disk IO Budget crítico (>90%)
  if (diskIOBudgetPercent > 90) {
    shouldUpgrade = true;
    reasons.push(`Disk IO Budget está em ${diskIOBudgetPercent.toFixed(0)}% (crítico >90%)`);
  }

  // Regra 3: Compute Micro não recomendado para produção
  if (currentTier === 'micro') {
    shouldUpgrade = true;
    reasons.push("Compute Micro não é recomendado para ambientes de produção");
  }

  // Regra 4: Aviso de atenção (80-90%)
  if (diskIOBudgetPercent >= 80 && diskIOBudgetPercent <= 90 && cacheHitRate >= 95 && cacheHitRate < 99) {
    shouldUpgrade = true;
    reasons.push(`Disk IO Budget está em ${diskIOBudgetPercent.toFixed(0)}% (atenção 80-90%)`);
    reasons.push(`Cache hit rate está em ${cacheHitRate.toFixed(1)}% (esperado >99%)`);
  }

  // Determinar tier recomendado
  if (shouldUpgrade) {
    if (currentTier === 'micro') {
      recommendedTier = 'small';
      estimatedCostIncrease = 10; // $0 → $10
      reasons.push("Recomendação: upgrade para Small ($10/mês)");
    } else if (currentTier === 'small' && diskIOBudgetPercent > 90) {
      recommendedTier = 'large';
      estimatedCostIncrease = 90; // $10 → $100
      reasons.push("Recomendação: upgrade para Large ($100/mês) devido a Disk IO crítico");
    } else if (currentTier === 'small' && cacheHitRate < 95) {
      // Cache <95% após otimizações: recomendar Small (já está) ou Medium se muito baixo
      if (cacheHitRate < 85) {
        recommendedTier = 'medium';
        estimatedCostIncrease = 40; // $10 → $50
        reasons.push("Recomendação: upgrade para Medium ($50/mês) devido a cache hit rate muito baixo");
      } else {
        recommendedTier = 'small';
        estimatedCostIncrease = 0; // Já está em Small
        reasons.push("Manter Small ($10/mês) e aplicar otimizações adicionais de cache");
      }
    } else if (currentTier === 'small') {
      recommendedTier = 'medium';
      estimatedCostIncrease = 40; // $10 → $50
      reasons.push("Recomendação: upgrade para Medium ($50/mês)");
    } else if (currentTier === 'medium' && diskIOBudgetPercent > 90) {
      recommendedTier = 'large';
      estimatedCostIncrease = 50; // $50 → $100
      reasons.push("Recomendação: upgrade para Large ($100/mês)");
    } else if (currentTier === 'medium' && cacheHitRate < 95) {
      // Medium com cache baixo: recomendar Large
      recommendedTier = 'large';
      estimatedCostIncrease = 50; // $50 → $100
      reasons.push("Recomendação: upgrade para Large ($100/mês) devido a cache hit rate baixo");
    } else if (currentTier === 'medium') {
      recommendedTier = 'large';
      estimatedCostIncrease = 50; // $50 → $100
      reasons.push("Recomendação: upgrade para Large ($100/mês)");
    } else if (currentTier === 'large') {
      // Já está em Large, considerar XL se crítico
      recommendedTier = 'large';
      estimatedCostIncrease = 0;
      reasons.push("Já em Large - considerar otimizações adicionais antes de upgrade para XL");
    } else {
      // Tier desconhecido ou XL+
      recommendedTier = 'large';
      estimatedCostIncrease = 0;
      reasons.push("Considerar otimizações adicionais antes de upgrade");
    }
  } else {
    // Situação saudável
    reasons.push("✅ Métricas dentro dos parâmetros esperados");
    reasons.push(`Cache hit rate: ${cacheHitRate.toFixed(1)}% (excelente)`);
    reasons.push(`Disk IO Budget: ${diskIOBudgetPercent.toFixed(0)}% (saudável)`);
  }

  return {
    should_upgrade: shouldUpgrade,
    recommended_tier: recommendedTier,
    reasons,
    estimated_cost_increase: estimatedCostIncrease,
    estimated_downtime_minutes: estimatedDowntimeMinutes,
  };
}
