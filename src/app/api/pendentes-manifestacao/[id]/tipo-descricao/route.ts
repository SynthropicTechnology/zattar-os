// Rota de API para atualizar tipo e descrição de expediente pendente
// PATCH: Atualizar tipo_expediente_id e descricao_arquivos

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { atualizarTipoDescricao } from '@/app/app/expedientes/service';

/**
 * @swagger
 * /api/pendentes-manifestacao/{id}/tipo-descricao:
 *   patch:
 *     summary: Atualiza tipo e descrição de um expediente pendente
 *     description: |
 *       Atualiza o tipo de expediente e/ou descrição de arquivos de um processo pendente de manifestação.
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
 *         description: ID do processo pendente de manifestação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AtualizarTipoDescricaoRequest'
 *     responses:
 *       200:
 *         description: Tipo e descrição atualizados com sucesso
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
 *                   description: Dados atualizados do processo pendente
 *       400:
 *         description: Dados inválidos
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obter ID do expediente
    const { id } = await params;
    const expedienteId = parseInt(id, 10);

    if (isNaN(expedienteId) || expedienteId <= 0) {
      return NextResponse.json(
        { error: 'ID do expediente inválido' },
        { status: 400 }
      );
    }

    // 3. Obter body da requisição
    const body = await request.json();
    const { tipoExpedienteId, descricaoArquivos } = body;

    // Validar tipoExpedienteId (deve ser número positivo ou null/undefined)
    if (tipoExpedienteId !== null && tipoExpedienteId !== undefined) {
      if (typeof tipoExpedienteId !== 'number' || tipoExpedienteId <= 0 || !Number.isInteger(tipoExpedienteId)) {
        return NextResponse.json(
          { error: 'tipoExpedienteId deve ser um número inteiro positivo ou null' },
          { status: 400 }
        );
      }
    }

    // Validar descricaoArquivos (deve ser string ou null/undefined)
    if (descricaoArquivos !== null && descricaoArquivos !== undefined) {
      if (typeof descricaoArquivos !== 'string') {
        return NextResponse.json(
          { error: 'descricaoArquivos deve ser uma string ou null' },
          { status: 400 }
        );
      }
    }

    // 4. Obter ID do usuário que está executando a ação
    if (authResult.userId === 'system') {
      // Sistema usa ID padrão do Super Administrador
      const usuarioExecutouId = 10;

      // 5. Executar atualização
      const result = await atualizarTipoDescricao(
        expedienteId,
        tipoExpedienteId ?? null,
        descricaoArquivos ?? null,
        usuarioExecutouId,
      );

      if (!result.success) {
        const statusCode = result.error.message?.includes('não encontrado') ? 404 : 400;
        return NextResponse.json(
          { error: result.error.message || 'Erro ao atualizar tipo e descrição' },
          { status: statusCode }
        );
      }

      // 6. Retornar resultado
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    }

    // Verificar se usuarioId existe para usuários autenticados
    if (!authResult.usuarioId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na base de dados' },
        { status: 401 }
      );
    }

    const usuarioExecutouId = authResult.usuarioId;

    // 5. Executar atualização
    const result = await atualizarTipoDescricao(
      expedienteId,
      tipoExpedienteId ?? null,
      descricaoArquivos ?? null,
      usuarioExecutouId,
    );

    if (!result.success) {
      const statusCode = result.error.message?.includes('não encontrado') ? 404 : 400;
      return NextResponse.json(
        { error: result.error.message || 'Erro ao atualizar tipo e descrição' },
        { status: statusCode }
      );
    }

    // 6. Retornar resultado
    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error('Error in atualizar tipo e descrição:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

