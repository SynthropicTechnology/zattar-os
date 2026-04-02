/**
 * Webhook Endpoint - Chatwoot Events
 * POST /api/webhooks/chatwoot
 *
 * Recebe eventos do Chatwoot e processa sincronização
 */

import { NextRequest, NextResponse } from 'next/server';
import { processarWebhookChatwoot } from '@/lib/chatwoot/actions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Valida estrutura básica do webhook
    if (!body.event) {
      return NextResponse.json(
        { error: 'Webhook payload inválido: falta "event"' },
        { status: 400 }
      );
    }

    console.log(`[Webhook Chatwoot] Recebido evento: ${body.event}`, {
      account_id: body.account_id,
      timestamp: new Date().toISOString(),
    });

    // Processa o webhook
    const result = await processarWebhookChatwoot(body.event, body);

    if (!result.success) {
      console.error('[Webhook Chatwoot] Erro ao processar:', result.error);
      // Mesmo com erro, retorna 200 para evitar retry infinito
      return NextResponse.json(
        {
          ok: true,
          processed: false,
          error: result.error.message,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      processed: true,
      event: body.event,
    });
  } catch (error) {
    console.error('[Webhook Chatwoot] Exceção não tratada:', error);
    // Retorna 200 mesmo em erro para evitar retry infinito do Chatwoot
    return NextResponse.json(
      {
        ok: true,
        processed: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 200 }
    );
  }
}

/**
 * Health check para webhook
 * GET /api/webhooks/chatwoot
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'chatwoot-webhook',
    timestamp: new Date().toISOString(),
  });
}
