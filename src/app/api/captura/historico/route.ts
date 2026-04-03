// Rota de API para histórico de capturas
// GET: Listar histórico de capturas

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { listarCapturasLog } from '@/app/(authenticated)/captura/services/persistence/captura-log-persistence.service';
import type { ListarCapturasLogParams } from '@/app/(authenticated)/captura/types';

/**
 * @swagger
 * /api/captura/historico:
 *   get:
 *     summary: Lista histórico de capturas realizadas
 *     description: |
 *       Retorna uma lista paginada do histórico de capturas realizadas no sistema.
 *       Permite filtrar por tipo de captura, advogado, status e período.
 *     tags:
 *       - Captura TRT
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Quantidade de itens por página (máximo 100)
 *       - in: query
 *         name: tipo_captura
 *         schema:
 *           type: string
 *           enum: [acervo_geral, arquivados, audiencias, pendentes]
 *         description: Filtrar por tipo de captura
 *       - in: query
 *         name: advogado_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do advogado
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, failed]
 *         description: Filtrar por status da captura
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtrar por data de início (YYYY-MM-DD)
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtrar por data de início (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Histórico de capturas retornado com sucesso
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
 *                     capturas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           tipo_captura:
 *                             type: string
 *                           advogado_id:
 *                             type: integer
 *                           credencial_ids:
 *                             type: array
 *                             items:
 *                               type: integer
 *                           status:
 *                             type: string
 *                           resultado:
 *                             type: object
 *                           erro:
 *                             type: string
 *                           iniciado_em:
 *                             type: string
 *                             format: date-time
 *                           concluido_em:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                     pagina:
 *                       type: integer
 *                     limite:
 *                       type: integer
 *                     totalPaginas:
 *                       type: integer
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // 2. Obter parâmetros da query string
    const { searchParams } = new URL(request.url);
    const params: ListarCapturasLogParams = {
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
      tipo_captura: searchParams.get('tipo_captura') as ListarCapturasLogParams['tipo_captura'] || undefined,
      advogado_id: searchParams.get('advogado_id') ? parseInt(searchParams.get('advogado_id')!, 10) : undefined,
      status: searchParams.get('status') as ListarCapturasLogParams['status'] || undefined,
      data_inicio: searchParams.get('data_inicio') || undefined,
      data_fim: searchParams.get('data_fim') || undefined,
    };

    // 3. Listar histórico
    const resultado = await listarCapturasLog(params);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar histórico de capturas:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: erroMsg } },
      { status: 500 }
    );
  }
}

