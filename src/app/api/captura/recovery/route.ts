/**
 * API de Recuperação de Capturas
 * GET: Listar logs brutos para recuperação
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  listarLogsRecovery,
  contarLogsPorStatus,
  estatisticasPorTrt,
} from '@/app/(authenticated)/captura/services/recovery/captura-recovery.service';
import { analisarGapsAgregado } from '@/app/(authenticated)/captura/services/recovery/recovery-analysis.service';
import type { ListarLogsRecoveryParams } from '@/app/(authenticated)/captura/services/recovery/types';
import type { TipoCaptura } from '@/app/(authenticated)/captura';
import type { CodigoTRT, GrauTRT } from '@/app/(authenticated)/captura';
import type { StatusCapturaRaw } from '@/app/(authenticated)/captura';

/**
 * @swagger
 * /api/captura/recovery:
 *   get:
 *     summary: Lista logs brutos de captura para recuperação
 *     description: |
 *       Retorna uma lista paginada de logs brutos de captura armazenados no PostgreSQL.
 *       Permite filtrar por tipo de captura, status, TRT, grau, advogado e período.
 *       Útil para identificar capturas que podem ter elementos faltantes.
 *     tags:
 *       - Recovery
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
 *         name: captura_log_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do log no PostgreSQL
 *       - in: query
 *         name: tipo_captura
 *         schema:
 *           type: string
 *           enum: [acervo_geral, arquivados, audiencias, pendentes, partes]
 *         description: Filtrar por tipo de captura
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, error]
 *         description: Filtrar por status do log bruto
 *       - in: query
 *         name: trt
 *         schema:
 *           type: string
 *         description: Filtrar por código TRT (ex TRT1, TRT3)
 *       - in: query
 *         name: grau
 *         schema:
 *           type: string
 *           enum: [primeiro_grau, segundo_grau]
 *         description: Filtrar por grau do tribunal
 *       - in: query
 *         name: advogado_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do advogado
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *       - in: query
 *         name: incluir_estatisticas
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir estatísticas agregadas na resposta
 *     responses:
 *       200:
 *         description: Lista de logs retornada com sucesso
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
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rawLogId:
 *                             type: string
 *                           capturaLogId:
 *                             type: integer
 *                           tipoCaptura:
 *                             type: string
 *                           status:
 *                             type: string
 *                           trt:
 *                             type: string
 *                           grau:
 *                             type: string
 *                           advogadoId:
 *                             type: integer
 *                           criadoEm:
 *                             type: string
 *                             format: date-time
 *                           numeroProcesso:
 *                             type: string
 *                           erro:
 *                             type: string
 *                     total:
 *                       type: integer
 *                     pagina:
 *                       type: integer
 *                     limite:
 *                       type: integer
 *                     totalPaginas:
 *                       type: integer
 *                 estatisticas:
 *                   type: object
 *                   description: Incluído se incluir_estatisticas=true
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

    const params: ListarLogsRecoveryParams = {
      pagina: searchParams.get('pagina')
        ? parseInt(searchParams.get('pagina')!, 10)
        : undefined,
      limite: searchParams.get('limite')
        ? parseInt(searchParams.get('limite')!, 10)
        : undefined,
      capturaLogId: searchParams.get('captura_log_id')
        ? parseInt(searchParams.get('captura_log_id')!, 10)
        : undefined,
      tipoCaptura: (searchParams.get('tipo_captura') as TipoCaptura) || undefined,
      status: (searchParams.get('status') as StatusCapturaRaw) || undefined,
      trt: (searchParams.get('trt') as CodigoTRT) || undefined,
      grau: (searchParams.get('grau') as GrauTRT) || undefined,
      advogadoId: searchParams.get('advogado_id')
        ? parseInt(searchParams.get('advogado_id')!, 10)
        : undefined,
      dataInicio: searchParams.get('data_inicio') || undefined,
      dataFim: searchParams.get('data_fim') || undefined,
    };

    const incluirEstatisticas = searchParams.get('incluir_estatisticas') === 'true';

    // 3. Listar logs
    const resultado = await listarLogsRecovery(params);

    // 4. Incluir estatísticas se solicitado
    let estatisticas = null;
    if (incluirEstatisticas) {
      const [contadores, porTrt, analiseGaps] = await Promise.all([
        contarLogsPorStatus({
          dataInicio: params.dataInicio,
          dataFim: params.dataFim,
          tipoCaptura: params.tipoCaptura,
          trt: params.trt,
        }),
        estatisticasPorTrt({
          dataInicio: params.dataInicio,
          dataFim: params.dataFim,
          tipoCaptura: params.tipoCaptura,
        }),
        analisarGapsAgregado({
          tipoCaptura: params.tipoCaptura,
          dataInicio: params.dataInicio,
          dataFim: params.dataFim,
          trt: params.trt,
          grau: params.grau,
        }),
      ]);

      estatisticas = {
        contadores,
        porTrt,
        gaps: analiseGaps,
      };
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      ...(estatisticas && { estatisticas }),
    });
  } catch (error) {
    console.error('Erro ao listar logs de recovery:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: erroMsg } },
      { status: 500 }
    );
  }
}

