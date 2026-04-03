/**
 * API Route: Executar Agendamentos de Captura
 *
 * Esta rota executa o scheduler de agendamentos de captura.
 * Busca todos os agendamentos com proxima_execucao <= NOW() e os executa.
 *
 * Chamada automaticamente a cada minuto via pg_cron do Supabase.
 *
 * Autenticação: Requer secret token via header Authorization
 *
 * Configuração pg_cron (Supabase):
 *   SELECT cron.schedule('executar-agendamentos-captura', '* * * * *', $$
 *     SELECT net.http_post(
 *       url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'app_url')
 *              || '/api/cron/executar-agendamentos',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
 *       ),
 *       body := '{}'::jsonb,
 *       timeout_milliseconds := 300000
 *     );
 *   $$);
 */

import { NextRequest, NextResponse } from "next/server";
import { executarScheduler } from "@/app/(authenticated)/captura/services/scheduler/agendamento-scheduler.service";
import { requireCronAuth } from "@/lib/cron/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Aumentar timeout para capturas longas (máximo permitido)
export const maxDuration = 300; // 5 minutos

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authError = requireCronAuth(request, { logPrefix: "[Cron Agendamentos]" });
    if (authError) return authError;

    console.log("[Cron Agendamentos] Iniciando execução do scheduler...");

    // Executar o scheduler
    await executarScheduler();

    const duration = Date.now() - startTime;

    console.log(`[Cron Agendamentos] Execução concluída em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Scheduler executado com sucesso",
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[Cron Agendamentos] Erro ao executar scheduler:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao executar scheduler",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Permitir GET para facilitar testes e health checks (mesma autenticação)
export async function GET(request: NextRequest) {
  return POST(request);
}
