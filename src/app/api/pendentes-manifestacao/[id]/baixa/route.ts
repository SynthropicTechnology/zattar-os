// Rota de API para baixar expediente pendente de manifestação
// PATCH: Baixar expediente (marcar como respondido)

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { realizarBaixa } from '@/app/(authenticated)/expedientes/service';

/**
 * @swagger
 * /api/pendentes-manifestacao/{id}/baixa:
 *   patch:
 *     summary: Baixa um expediente pendente de manifestação
 *     description: |
 *       Marca um expediente como baixado (respondido). É necessário informar
 *       o ID do protocolo OU a justificativa da baixa.
 *       
 *       Todas as alterações são automaticamente registradas em logs_alteracao.
 *     tags:
 *       - Pendentes de Manifestação
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
 *         description: ID do expediente pendente de manifestação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               protocolo_id:
 *                 type: string
 *                 nullable: true
 *                 description: ID do protocolo da peça protocolada (pode conter números e letras, obrigatório se justificativa não fornecida)
 *               justificativa:
 *                 type: string
 *                 nullable: true
 *                 description: Justificativa para baixa sem protocolo (obrigatório se protocolo_id não fornecido)
 *           example:
 *             protocolo_id: "ABC12345"
 *             # OU
 *             justificativa: "Expediente resolvido extrajudicialmente"
 *     responses:
 *       200:
 *         description: Expediente baixado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     baixado_em:
 *                       type: string
 *                       format: date-time
 *                     protocolo_id:
 *                       type: string
 *                       nullable: true
 *                     justificativa_baixa:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "É necessário informar o ID do protocolo ou a justificativa da baixa"
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Expediente não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID do expediente
    const { id } = await params;
    const expedienteId = parseInt(id, 10);

    if (isNaN(expedienteId)) {
      return NextResponse.json(
        { error: 'ID do expediente inválido' },
        { status: 400 }
      );
    }

    // 3. Obter body da requisição
    const body = await request.json();
    const { protocolo_id, justificativa } = body;

    // 4. Obter ID do usuário que está executando a ação
    let usuarioId: number;
    if (authResult.source === 'service') {
      usuarioId = 10; // Sistema usa ID padrão do Super Administrador
    } else if (!authResult.usuarioId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na base de dados' },
        { status: 401 }
      );
    } else {
      usuarioId = authResult.usuarioId;
    }

    // 5. Baixar expediente
    const result = await realizarBaixa(
      expedienteId,
      {
        expedienteId,
        protocoloId: protocolo_id ?? undefined,
        justificativaBaixa: justificativa ?? undefined,
      },
      usuarioId
    );

    if (!result.success) {
      const statusCode =
        result.error.code === 'NOT_FOUND' ||
          result.error.message.includes('não encontrado')
          ? 404
          : result.error.code === 'BAD_REQUEST' ||
            result.error.message.includes('É necessário')
            ? 400
            : 500;
      return NextResponse.json(
        { error: result.error.message || 'Erro ao baixar expediente' },
        { status: statusCode }
      );
    }

    // 6. Retornar resultado
    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao baixar expediente:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

