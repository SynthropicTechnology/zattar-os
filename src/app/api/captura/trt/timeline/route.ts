/**
 * POST /api/captura/trt/timeline
 * 
 * Captura a timeline de um processo do PJE-TRT com download opcional de documentos
 */

import { NextRequest, NextResponse } from 'next/server';
import { capturarTimeline, type CapturaTimelineParams } from '@/app/(authenticated)/captura/services/timeline/timeline-capture.service';
import { authenticateRequest } from '@/lib/auth/api-auth';

/**
 * @swagger
 * /api/captura/trt/timeline:
 *   post:
 *     tags:
 *       - Captura TRT
 *     summary: Captura timeline de processo do PJE-TRT
 *     description: |
 *       Obtém a timeline completa de um processo do PJE-TRT, incluindo movimentos e documentos.
 *       Opcionalmente, baixa os PDFs dos documentos assinados.
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trtCodigo
 *               - grau
 *               - processoId
 *               - numeroProcesso
 *               - advogadoId
 *             properties:
 *               trtCodigo:
 *                 type: string
 *                 enum: [TRT1, TRT2, TRT3, TRT4, TRT5, TRT6, TRT7, TRT8, TRT9, TRT10, TRT11, TRT12, TRT13, TRT14, TRT15, TRT16, TRT17, TRT18, TRT19, TRT20, TRT21, TRT22, TRT23, TRT24]
 *                 description: Código do TRT
 *                 example: TRT3
 *               grau:
 *                 type: string
 *                 enum: [primeiro_grau, segundo_grau]
 *                 description: Grau da instância
 *                 example: primeiro_grau
 *               processoId:
 *                 type: string
 *                 description: ID do processo no sistema PJE
 *                 example: "2887163"
 *               numeroProcesso:
 *                 type: string
 *                 description: "Número do processo (ex: 0010702-80.2025.5.03.0111)"
 *                 example: "0010702-80.2025.5.03.0111"
 *               advogadoId:
 *                 type: number
 *                 description: ID do advogado (para obter credenciais)
 *                 example: 1
 *               baixarDocumentos:
 *                 type: boolean
 *                 description: Se deve baixar os PDFs dos documentos
 *                 default: true
 *               filtroDocumentos:
 *                 type: object
 *                 description: Filtros para documentos
 *                 properties:
 *                   apenasAssinados:
 *                     type: boolean
 *                     description: Apenas documentos assinados
 *                     default: true
 *                   apenasNaoSigilosos:
 *                     type: boolean
 *                     description: Apenas documentos não sigilosos
 *                     default: true
 *                   tipos:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Tipos de documento específicos
 *                     example: ["Certidão", "Petição"]
 *                   dataInicial:
 *                     type: string
 *                     format: date-time
 *                     description: Data inicial (ISO 8601)
 *                   dataFinal:
 *                     type: string
 *                     format: date-time
 *                     description: Data final (ISO 8601)
 *     responses:
 *       200:
 *         description: Timeline capturada com sucesso
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
 *                     timeline:
 *                       type: array
 *                       description: Array de itens da timeline
 *                     totalItens:
 *                       type: number
 *                       example: 190
 *                     totalDocumentos:
 *                       type: number
 *                       example: 61
 *                     totalMovimentos:
 *                       type: number
 *                       example: 129
 *                     documentosBaixados:
 *                       type: array
 *                       description: Documentos baixados
 *                     totalBaixadosSucesso:
 *                       type: number
 *                       example: 61
 *                     totalErros:
 *                       type: number
 *                       example: 0
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar requisição
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validar e extrair parâmetros
    const body = await request.json();
    const {
      trtCodigo,
      grau,
      processoId,
      numeroProcesso,
      advogadoId,
      baixarDocumentos,
      filtroDocumentos,
    } = body;

    // Validação básica
    if (!trtCodigo || !grau || !processoId || !numeroProcesso || !advogadoId) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: trtCodigo, grau, processoId, numeroProcesso, advogadoId' },
        { status: 400 }
      );
    }

    // 3. Executar captura
    const params: CapturaTimelineParams = {
      trtCodigo,
      grau,
      processoId: String(processoId),
      numeroProcesso: String(numeroProcesso),
      advogadoId: Number(advogadoId),
      baixarDocumentos: baixarDocumentos !== undefined ? baixarDocumentos : true,
      filtroDocumentos: filtroDocumentos || {},
    };

    console.log('📋 [POST /api/captura/trt/timeline] Iniciando captura', params);

    const resultado = await capturarTimeline(params);

    console.log('✅ [POST /api/captura/trt/timeline] Captura concluída', {
      totalItens: resultado.totalItens,
      totalBaixadosSucesso: resultado.totalBaixadosSucesso,
    });

    // 4. Retornar resultado (sem os buffers PDF na resposta - muito grande)
    const resultadoSemPDFs = {
      ...resultado,
      documentosBaixados: resultado.documentosBaixados.map((doc) => ({
        detalhes: doc.detalhes,
        pdfTamanho: doc.pdf?.length,
        erro: doc.erro,
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: resultadoSemPDFs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [POST /api/captura/trt/timeline] Erro:', error);

    const mensagem = error instanceof Error ? error.message : 'Erro ao capturar timeline';

    return NextResponse.json(
      { error: mensagem },
      { status: 500 }
    );
  }
}
