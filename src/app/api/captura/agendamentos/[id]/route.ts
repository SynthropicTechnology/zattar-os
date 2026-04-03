// Rota de API para operações em agendamento específico
// GET: Buscar agendamento | PATCH: Atualizar agendamento | DELETE: Deletar agendamento

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { buscarAgendamento } from '@/app/(authenticated)/captura/services/agendamentos/buscar-agendamento.service';
import { atualizarAgendamento } from '@/app/(authenticated)/captura/services/agendamentos/atualizar-agendamento.service';
import { deletarAgendamento } from '@/app/(authenticated)/captura/services/agendamentos/deletar-agendamento.service';
import type { AtualizarAgendamentoParams } from '@/app/(authenticated)/captura';

/**
 * @swagger
 * /api/captura/agendamentos/{id}:
 *   get:
 *     summary: Busca um agendamento por ID
 *     description: Retorna detalhes de um agendamento específico
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do agendamento
 *     responses:
 *       200:
 *         description: Agendamento encontrado
 *       404:
 *         description: Agendamento não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   patch:
 *     summary: Atualiza um agendamento
 *     description: Atualiza campos de um agendamento existente
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do agendamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_captura:
 *                 type: string
 *                 enum: [acervo_geral, arquivados, audiencias, pendentes]
 *               advogado_id:
 *                 type: integer
 *               credencial_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               periodicidade:
 *                 type: string
 *                 enum: [diario, a_cada_N_dias]
 *               dias_intervalo:
 *                 type: integer
 *               horario:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *               ativo:
 *                 type: boolean
 *               parametros_extras:
 *                 type: object
 *     responses:
 *       200:
 *         description: Agendamento atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Agendamento não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Deleta um agendamento
 *     description: Remove um agendamento do sistema
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do agendamento
 *     responses:
 *       200:
 *         description: Agendamento deletado com sucesso
 *       404:
 *         description: Agendamento não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter ID do parâmetro
    const { id } = await params;
    const agendamentoId = parseInt(id, 10);

    if (isNaN(agendamentoId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Buscar agendamento
    const agendamento = await buscarAgendamento(agendamentoId);

    if (!agendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agendamento,
    });
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter ID do parâmetro
    const { id } = await params;
    const agendamentoId = parseInt(id, 10);

    if (isNaN(agendamentoId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Obter e validar body
    const body = await request.json();
    const paramsUpdate: AtualizarAgendamentoParams = {
      tipo_captura: body.tipo_captura,
      advogado_id: body.advogado_id,
      credencial_ids: body.credencial_ids,
      periodicidade: body.periodicidade,
      dias_intervalo: body.dias_intervalo,
      horario: body.horario,
      ativo: body.ativo,
      parametros_extras: body.parametros_extras,
    };

    // 4. Atualizar agendamento
    const agendamento = await atualizarAgendamento(agendamentoId, paramsUpdate);

    return NextResponse.json({
      success: true,
      data: agendamento,
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 404 }
      );
    }
    
    if (erroMsg.includes('obrigatório') || erroMsg.includes('inválido') || erroMsg.includes('formato')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter ID do parâmetro
    const { id } = await params;
    const agendamentoId = parseInt(id, 10);

    if (isNaN(agendamentoId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 3. Verificar se existe antes de deletar
    const agendamento = await buscarAgendamento(agendamentoId);
    if (!agendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // 4. Deletar agendamento
    await deletarAgendamento(agendamentoId);

    return NextResponse.json({
      success: true,
      message: 'Agendamento deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: erroMsg },
      { status: 500 }
    );
  }
}

