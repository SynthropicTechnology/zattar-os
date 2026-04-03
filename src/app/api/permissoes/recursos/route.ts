/**
 * @swagger
 * /api/permissoes/recursos:
 *   get:
 *     summary: Lista a matriz de permissões disponíveis
 *     description: Retorna todos os recursos e operações disponíveis no sistema de permissões
 *     tags:
 *       - Permissões
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Matriz de permissões retornada com sucesso
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
 *                     matriz:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           recurso:
 *                             type: string
 *                           operacoes:
 *                             type: array
 *                             items:
 *                               type: string
 *                     totalRecursos:
 *                       type: integer
 *                     totalPermissoes:
 *                       type: integer
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  MATRIZ_PERMISSOES,
  obterMatrizPermissoes,
  obterTotalPermissoes,
} from '@/app/(authenticated)/usuarios';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matriz = obterMatrizPermissoes();
    const totalPermissoes = obterTotalPermissoes();

    return NextResponse.json(
      {
        success: true,
        data: {
          matriz,
          matrizSimples: MATRIZ_PERMISSOES,
          totalRecursos: matriz.length,
          totalPermissoes,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
