/**
 * Conversation Endpoints - Chatwoot Conversations
 * PUT /api/chatwoot/conversas/:id - Sync conversation
 * PATCH /api/chatwoot/conversas/:id - Update conversation status
 */

import { NextRequest, NextResponse } from 'next/server';
import { sincronizarConversaManual, atualizarStatusConversaAPI } from '@/lib/chatwoot/actions';

/**
 * Sincroniza uma conversa manualmente
 * PUT /api/chatwoot/conversas/:id?accountId=1
 */
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = parseInt(id, 10);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: 'ID da conversa inválido' },
        { status: 400 }
      );
    }

    // Busca accountId dos query params
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`[API Chatwoot] Sincronizando conversa ${conversationId} (account: ${accountId})`);

    const result = await sincronizarConversaManual(
      conversationId,
      parseInt(accountId, 10)
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API Chatwoot] Erro ao sincronizar conversa:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

/**
 * Atualiza status de uma conversa
 * PATCH /api/chatwoot/conversas/:id
 * Body: { status: 'open' | 'resolved' | 'pending' | 'snoozed', accountId: number }
 */
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = parseInt(id, 10);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: 'ID da conversa inválido' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status, accountId } = body;

    // Valida status
    if (!status || !['open', 'resolved', 'pending', 'snoozed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: open, resolved, pending ou snoozed' },
        { status: 400 }
      );
    }

    // Valida accountId
    if (!accountId || isNaN(parseInt(accountId, 10))) {
      return NextResponse.json(
        { error: 'accountId inválido' },
        { status: 400 }
      );
    }

    console.log(
      `[API Chatwoot] Atualizando status da conversa ${conversationId} para ${status}`
    );

    const result = await atualizarStatusConversaAPI(
      conversationId,
      parseInt(accountId, 10),
      status
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      conversationId,
      status,
    });
  } catch (error) {
    console.error('[API Chatwoot] Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
