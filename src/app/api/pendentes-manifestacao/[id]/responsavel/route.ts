// Rota de API para atribuir responsável a processo pendente de manifestação
// PATCH: Atribuir/transferir/desatribuir responsável

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { atribuirResponsavel } from '@/app/(authenticated)/expedientes/service';

/**
 * @swagger
 * /api/pendentes-manifestacao/{id}/responsavel:
 *   patch:
 *     summary: Atribui responsável a um processo pendente de manifestação
 *     description: |
 *       Atribui, transfere ou desatribui um responsável de um processo pendente de manifestação.
 *       Todas as alterações são automaticamente registradas em logs_alteracao.
 *       
 *       **Tipos de operação:**
 *       - Atribuição: quando processo não tem responsável e um é atribuído
 *       - Transferência: quando processo tem responsável e é atribuído a outro
 *       - Desatribuição: quando responsavelId é null
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
 *             $ref: '#/components/schemas/AtribuirResponsavelRequest'
 *           example:
 *             responsavelId: 15
 *     responses:
 *       200:
 *         description: Responsável atribuído com sucesso
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
 *                   properties:
 *                     id:
 *                       type: integer
 *                     responsavel_id:
 *                       type: integer
 *                       nullable: true
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Processo pendente não encontrado"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

    // 2. Obter ID do processo pendente
    const { id } = await params;
    const pendenteId = parseInt(id, 10);

    if (isNaN(pendenteId)) {
      return NextResponse.json(
        { error: 'ID do processo pendente inválido' },
        { status: 400 }
      );
    }

    // 3. Obter body da requisição
    const body = await request.json();
    const { responsavelId } = body;

    // Validar responsavelId (deve ser número positivo ou null/undefined)
    if (responsavelId !== null && responsavelId !== undefined) {
      if (typeof responsavelId !== 'number' || responsavelId <= 0 || !Number.isInteger(responsavelId)) {
        return NextResponse.json(
          { error: 'responsavelId deve ser um número inteiro positivo ou null' },
          { status: 400 }
        );
      }
    }

    // 4. Obter ID do usuário que está executando a ação
    // Se for sistema (service key), usar ID padrão 10 (Super Administrador)
    // Se for usuário autenticado, usar o usuarioId retornado pela autenticação
    if (authResult.userId === 'system') {
      // Sistema usa ID padrão do Super Administrador
      const usuarioExecutouId = 10;

      // 5. Executar atribuição
      const result = await atribuirResponsavel(
        pendenteId,
        responsavelId ?? null,
        usuarioExecutouId,
      );

      if (!result.success) {
        const statusCode = result.error.message?.includes('não encontrado') ? 404 : 400; // Simplified check
        return NextResponse.json(
          { error: result.error.message || 'Erro ao atribuir responsável' },
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

    // 5. Executar atribuição
    const result = await atribuirResponsavel(
      pendenteId,
      responsavelId ?? null,
      usuarioExecutouId,
    );

    if (!result.success) {
      const statusCode = result.error.message?.includes('não encontrado') ? 404 : 400; // Simplified check
      return NextResponse.json(
        { error: result.error.message || 'Erro ao atribuir responsável' },
        { status: statusCode }
      );
    }

    // 6. Retornar resultado
    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error('Error in atribuir responsavel pendente:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

