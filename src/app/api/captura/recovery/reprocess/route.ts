/**
 * API de Recuperação de Capturas - Re-Processamento
 * POST: Re-persistir elementos que falharam na captura original
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  reprocessarElementos,
  reprocessarEnderecosPorCapturaLogId,
} from '@/app/(authenticated)/captura/services/recovery/endereco-recovery.service';
import type { TipoEntidadeRecuperavel } from '@/app/(authenticated)/captura/services/recovery/types';

/**
 * @swagger
 * /api/captura/recovery/reprocess:
 *   post:
 *     summary: Re-processa elementos que falharam na captura original
 *     description: |
 *       Re-persiste elementos (endereços, partes, representantes) usando os dados
 *       brutos salvos nos logs brutos (Postgres). Útil para recuperar dados que falharam na
 *       persistência original por erros de lógica ou timeout.
 *
 *       **Modos de operação:**
 *       - Por `rawLogIds`: Re-processa logs brutos específicos
 *       - Por `capturaLogId`: Re-processa todos os documentos de uma captura
 *
 *       **Filtros disponíveis:**
 *       - `apenasGaps`: Processa apenas elementos faltantes (default: true)
 *       - `forcarAtualizacao`: Atualiza mesmo se já existir (default: false)
 *     tags:
 *       - Recovery
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rawLogIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs dos logs brutos a processar
 *               capturaLogId:
 *                 type: integer
 *                 description: ID do log no PostgreSQL (alternativo a mongoIds)
 *               tiposElementos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [endereco, parte, representante, cadastro_pje]
 *                 default: [endereco]
 *                 description: Tipos de elementos a re-processar
 *               filtros:
 *                 type: object
 *                 properties:
 *                   apenasGaps:
 *                     type: boolean
 *                     default: true
 *                     description: Processar apenas elementos faltantes
 *                   forcarAtualizacao:
 *                     type: boolean
 *                     default: false
 *                     description: Atualizar mesmo se registro já existir
 *           examples:
 *             porRawLogIds:
 *               summary: Re-processar por rawLogIds
 *               value:
 *                 rawLogIds: ["<rawLogId1>", "<rawLogId2>"]
 *                 tiposElementos: ["endereco"]
 *                 filtros:
 *                   apenasGaps: true
 *             porCapturaLogId:
 *               summary: Re-processar por ID da captura
 *               value:
 *                 capturaLogId: 123
 *                 tiposElementos: ["endereco"]
 *                 filtros:
 *                   apenasGaps: true
 *                   forcarAtualizacao: false
 *     responses:
 *       200:
 *         description: Re-processamento concluído
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sucesso:
 *                       type: boolean
 *                       description: Se todos os elementos foram processados com sucesso
 *                     totalDocumentos:
 *                       type: integer
 *                     totalElementos:
 *                       type: integer
 *                     totalSucessos:
 *                       type: integer
 *                     totalErros:
 *                       type: integer
 *                     documentos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mongoId:
 *                             type: string
 *                           numeroProcesso:
 *                             type: string
 *                           sucesso:
 *                             type: boolean
 *                           totalProcessados:
 *                             type: integer
 *                           totalSucessos:
 *                             type: integer
 *                           totalErros:
 *                             type: integer
 *                           elementos:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 tipo:
 *                                   type: string
 *                                 identificador:
 *                                   type: string
 *                                 nome:
 *                                   type: string
 *                                 sucesso:
 *                                   type: boolean
 *                                 acao:
 *                                   type: string
 *                                   enum: [criado, atualizado, ignorado, erro]
 *                                 erro:
 *                                   type: string
 *                                 registroId:
 *                                   type: integer
 *                           duracaoMs:
 *                             type: integer
 *                     duracaoMs:
 *                       type: integer
 *       400:
 *         description: Requisição inválida
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // 2. Validar body
    let body: {
      rawLogIds?: string[];
      capturaLogId?: number;
      tiposElementos?: TipoEntidadeRecuperavel[];
      filtros?: {
        apenasGaps?: boolean;
        forcarAtualizacao?: boolean;
      };
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Body JSON inválido' } },
        { status: 400 }
      );
    }

    // 3. Validar parâmetros
    const { rawLogIds, capturaLogId, tiposElementos, filtros } = body;

    if (!rawLogIds && !capturaLogId) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Informe rawLogIds ou capturaLogId',
          },
        },
        { status: 400 }
      );
    }

    if (rawLogIds && capturaLogId) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Informe apenas rawLogIds ou capturaLogId, não ambos',
          },
        },
        { status: 400 }
      );
    }

    // Validar rawLogIds
    if (rawLogIds) {
      if (!Array.isArray(rawLogIds) || rawLogIds.length === 0) {
        return NextResponse.json(
          {
            error: {
              code: 'BAD_REQUEST',
              message: 'rawLogIds deve ser um array não vazio',
            },
          },
          { status: 400 }
        );
      }

      // Limitar quantidade por requisição
      if (rawLogIds.length > 50) {
        return NextResponse.json(
          {
            error: {
              code: 'BAD_REQUEST',
              message: 'Máximo de 50 documentos por requisição',
            },
          },
          { status: 400 }
        );
      }

      for (const id of rawLogIds) {
        if (typeof id !== 'string' || id.length < 8) {
          return NextResponse.json(
            {
              error: {
                code: 'BAD_REQUEST',
                message: `rawLogId inválido: ${id}`,
              },
            },
            { status: 400 }
          );
        }
      }
    }

    // Validar tipos de elementos
    const tiposValidos: TipoEntidadeRecuperavel[] = [
      'endereco',
      'parte',
      'representante',
      'cadastro_pje',
    ];

    if (tiposElementos) {
      for (const tipo of tiposElementos) {
        if (!tiposValidos.includes(tipo)) {
          return NextResponse.json(
            {
              error: {
                code: 'BAD_REQUEST',
                message: `Tipo de elemento inválido: ${tipo}. Válidos: ${tiposValidos.join(', ')}`,
              },
            },
            { status: 400 }
          );
        }
      }
    }

    // 4. Executar re-processamento
    let resultado;

    if (capturaLogId) {
      // Re-processar por ID da captura
      resultado = await reprocessarEnderecosPorCapturaLogId(capturaLogId, {
        apenasGaps: filtros?.apenasGaps ?? true,
        forcarAtualizacao: filtros?.forcarAtualizacao ?? false,
      });
    } else {
      // Re-processar por rawLogIds
      resultado = await reprocessarElementos({
        rawLogIds: rawLogIds!,
        tiposElementos: tiposElementos ?? ['endereco'],
        filtros: {
          apenasGaps: filtros?.apenasGaps ?? true,
          forcarAtualizacao: filtros?.forcarAtualizacao ?? false,
        },
      });
    }

    // 5. Retornar resultado
    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao re-processar elementos:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: erroMsg } },
      { status: 500 }
    );
  }
}

