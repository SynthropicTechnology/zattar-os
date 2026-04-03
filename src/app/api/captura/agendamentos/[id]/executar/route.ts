// Rota de API para executar agendamento manualmente
// POST: Executa um agendamento imediatamente

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { buscarAgendamento } from '@/app/(authenticated)/captura/services/agendamentos/buscar-agendamento.service';
import { executarAgendamento } from '@/app/(authenticated)/captura/services/scheduler/executar-agendamento.service';

/**
 * @swagger
 * /api/captura/agendamentos/{id}/executar:
 *   post:
 *     summary: Executa um agendamento manualmente
 *     description: Executa a captura de um agendamento imediatamente, sem alterar a próxima execução agendada
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
 *         description: Agendamento executado com sucesso
 *       404:
 *         description: Agendamento não encontrado
 *       400:
 *         description: Agendamento inativo ou dados inválidos
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(
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

    // 4. Executar agendamento (não atualiza proxima_execucao)
    const resultado = await executarAgendamento(agendamento, false); // false = não atualizar próxima execução

    return NextResponse.json({
      success: true,
      message: 'Agendamento executado com sucesso',
      data: {
        capture_id: resultado.captureId,
        status: 'in_progress',
        message: 'A captura está sendo processada em background. Consulte o histórico para acompanhar o progresso.',
      },
    });
  } catch (error) {
    console.error('Erro ao executar agendamento:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json(
        { error: erroMsg },
        { status: 404 }
      );
    }
    
    if (erroMsg.includes('inativo') || erroMsg.includes('inválido')) {
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

