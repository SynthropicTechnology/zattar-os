/**
 * Sistema de Quotas MCP do Synthropic
 *
 * Implementa checagem e atualização de quotas por usuário
 */

import { createServiceClient } from "@/lib/supabase/service-client";

// =============================================================================
// TIPOS
// =============================================================================

export interface QuotaCheck {
  allowed: boolean;
  remaining?: number;
  resetAt?: Date;
  reason?: string;
}

export interface QuotaLimits {
  callsPerDay: number;
  callsPerMonth: number;
}

// Limites por tier
const QUOTA_LIMITS: Record<string, QuotaLimits> = {
  anonymous: {
    callsPerDay: 10,
    callsPerMonth: 100,
  },
  authenticated: {
    callsPerDay: 100,
    callsPerMonth: 3000,
  },
  service: {
    callsPerDay: 10000,
    callsPerMonth: 300000,
  },
};

// =============================================================================
// FUNÇÕES DE CHECAGEM
// =============================================================================

/**
 * Verifica se o usuário está dentro da quota
 */
export async function checkQuota(
  usuarioId: number | null,
  tier: "anonymous" | "authenticated" | "service"
): Promise<QuotaCheck> {
  // Service tier tem quota ilimitada (mas registramos para métricas)
  if (tier === "service") {
    return { allowed: true };
  }

  // Anonymous usa rate limit do Redis, não quota do banco
  if (!usuarioId) {
    return { allowed: true };
  }

  const supabase = createServiceClient();
  const limits = QUOTA_LIMITS[tier];

  try {
    // Buscar ou criar registro de quota
    const { data: quota, error } = await supabase
      .from("mcp_quotas")
      .select("*")
      .eq("usuario_id", usuarioId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      console.error("[MCP Quotas] Erro ao buscar quota:", error);
      // Em caso de erro, permitir (fail open)
      return { allowed: true };
    }

    const now = new Date();

    // Se não existe quota, criar
    if (!quota) {
      await supabase.from("mcp_quotas").insert({
        usuario_id: usuarioId,
        tier,
        calls_today: 0,
        calls_month: 0,
        last_call_at: now,
        quota_reset_at: getNextMonthReset(),
      });

      return {
        allowed: true,
        remaining: limits.callsPerDay,
        resetAt: getNextDayReset(),
      };
    }

    // Verificar se precisa resetar contador diário
    const lastCallDate = new Date(quota.last_call_at || now);
    const needsDailyReset = !isSameDay(lastCallDate, now);

    // Verificar se precisa resetar contador mensal
    const quotaResetDate = new Date(quota.quota_reset_at || now);
    const needsMonthlyReset = now >= quotaResetDate;

    const callsToday = needsDailyReset ? 0 : quota.calls_today || 0;
    const callsMonth = needsMonthlyReset ? 0 : quota.calls_month || 0;

    // Verificar limites
    if (callsToday >= limits.callsPerDay) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: getNextDayReset(),
        reason: `Limite diário excedido (${limits.callsPerDay} calls/dia)`,
      };
    }

    if (callsMonth >= limits.callsPerMonth) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: quotaResetDate > now ? quotaResetDate : getNextMonthReset(),
        reason: `Limite mensal excedido (${limits.callsPerMonth} calls/mês)`,
      };
    }

    return {
      allowed: true,
      remaining: Math.min(
        limits.callsPerDay - callsToday,
        limits.callsPerMonth - callsMonth
      ),
      resetAt: getNextDayReset(),
    };
  } catch (error) {
    console.error("[MCP Quotas] Erro ao verificar quota:", error);
    // Em caso de erro, permitir (fail open)
    return { allowed: true };
  }
}

/**
 * Incrementa o contador de quota após chamada bem-sucedida
 */
export async function incrementQuota(
  usuarioId: number | null,
  tier: "anonymous" | "authenticated" | "service"
): Promise<void> {
  // Anonymous e service não precisam incrementar quota no banco
  if (!usuarioId || tier === "anonymous" || tier === "service") {
    return;
  }

  const supabase = createServiceClient();
  const now = new Date();

  try {
    // Buscar quota atual
    const { data: quota } = await supabase
      .from("mcp_quotas")
      .select("*")
      .eq("usuario_id", usuarioId)
      .single();

    if (!quota) {
      // Criar se não existir
      await supabase.from("mcp_quotas").insert({
        usuario_id: usuarioId,
        tier,
        calls_today: 1,
        calls_month: 1,
        last_call_at: now,
        quota_reset_at: getNextMonthReset(),
      });
      return;
    }

    // Verificar se precisa resetar contadores
    const lastCallDate = new Date(quota.last_call_at || now);
    const needsDailyReset = !isSameDay(lastCallDate, now);

    const quotaResetDate = new Date(quota.quota_reset_at || now);
    const needsMonthlyReset = now >= quotaResetDate;

    const callsToday = needsDailyReset ? 1 : (quota.calls_today || 0) + 1;
    const callsMonth = needsMonthlyReset ? 1 : (quota.calls_month || 0) + 1;

    // Atualizar quota
    await supabase
      .from("mcp_quotas")
      .update({
        calls_today: callsToday,
        calls_month: callsMonth,
        last_call_at: now,
        quota_reset_at: needsMonthlyReset
          ? getNextMonthReset()
          : quota.quota_reset_at,
      })
      .eq("usuario_id", usuarioId);
  } catch (error) {
    console.error("[MCP Quotas] Erro ao incrementar quota:", error);
    // Não bloqueia em caso de erro
  }
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Verifica se duas datas são do mesmo dia
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Retorna a data/hora do próximo reset diário (meia-noite UTC)
 */
function getNextDayReset(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Retorna a data/hora do próximo reset mensal (primeiro dia do próximo mês, meia-noite UTC)
 */
function getNextMonthReset(): Date {
  const nextMonth = new Date();
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  nextMonth.setUTCDate(1);
  nextMonth.setUTCHours(0, 0, 0, 0);
  return nextMonth;
}

/**
 * Obtém informações de quota do usuário
 */
export async function getQuotaInfo(usuarioId: number): Promise<{
  tier: string;
  callsToday: number;
  callsMonth: number;
  limitsDay: number;
  limitsMonth: number;
  resetAt: Date;
} | null> {
  const supabase = createServiceClient();

  try {
    const { data: quota } = await supabase
      .from("mcp_quotas")
      .select("*")
      .eq("usuario_id", usuarioId)
      .single();

    if (!quota) {
      return null;
    }

    const tier = quota.tier || "authenticated";
    const limits = QUOTA_LIMITS[tier];

    return {
      tier,
      callsToday: quota.calls_today || 0,
      callsMonth: quota.calls_month || 0,
      limitsDay: limits.callsPerDay,
      limitsMonth: limits.callsPerMonth,
      resetAt: new Date(quota.quota_reset_at || getNextMonthReset()),
    };
  } catch (error) {
    console.error("[MCP Quotas] Erro ao buscar informações de quota:", error);
    return null;
  }
}
