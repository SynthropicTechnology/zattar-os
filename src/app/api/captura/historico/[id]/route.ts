// Rota de API para operações em registro específico de histórico
// GET: Buscar registro por ID
// DELETE: Deletar registro por ID

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  buscarCapturaLog,
  deletarCapturaLog,
} from '@/app/(authenticated)/captura/services/persistence/captura-log-persistence.service';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * @swagger
 * /api/captura/historico/{id}:
 *   get:
 *     summary: Busca registro de captura por ID
 *     description: Retorna os detalhes completos de um registro de captura específico
 *     tags:
 *       - Captura TRT
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
 *         description: ID do registro de captura
 *     responses:
 *       200:
 *         description: Registro de captura encontrado
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
 *       404:
 *         description: Registro não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // 2. Obter ID do registro
    const { id } = await params;
    const capturaId = parseInt(id, 10);

    if (isNaN(capturaId)) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'ID inválido' } }, { status: 400 });
    }

    // 3. Buscar registro
    const captura = await buscarCapturaLog(capturaId);

    if (!captura) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Registro de captura não encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: captura,
    });
  } catch (error) {
    console.error('Erro ao buscar registro de captura:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: { code: 'INTERNAL', message: erroMsg } }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/captura/historico/{id}:
 *   delete:
 *     summary: Deleta registro de captura por ID
 *     description: Remove permanentemente um registro de captura do histórico
 *     tags:
 *       - Captura TRT
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
 *         description: ID do registro de captura
 *     responses:
 *       200:
 *         description: Registro deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Registro de captura deletado com sucesso
 *       404:
 *         description: Registro não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // 2. Obter ID do registro
    const { id } = await params;
    const capturaId = parseInt(id, 10);

    if (isNaN(capturaId)) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'ID inválido' } }, { status: 400 });
    }

    // 3. Deletar registro
    await deletarCapturaLog(capturaId);

    return NextResponse.json({
      success: true,
      message: 'Registro de captura deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar registro de captura:', error);

    if (error instanceof Error && error.message.includes('não encontrado')) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Registro de captura não encontrado' } },
        { status: 404 }
      );
    }

    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: { code: 'INTERNAL', message: erroMsg } }, { status: 500 });
  }
}
