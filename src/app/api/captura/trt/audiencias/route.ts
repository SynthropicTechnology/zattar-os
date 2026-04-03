// Rota de API para captura de audiências do TRT

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { getCredentialComplete } from '@/app/(authenticated)/captura/credentials/credential.service';
import { audienciasCapture } from '@/app/(authenticated)/captura/services/trt/audiencias.service';
import { getTribunalConfig } from '@/app/(authenticated)/captura/services/trt/config';
import { iniciarCapturaLog, finalizarCapturaLogSucesso, finalizarCapturaLogErro } from '@/app/(authenticated)/captura/services/captura-log.service';
import { ordenarCredenciaisPorTRT } from '@/app/(authenticated)/captura';
import { registrarCapturaRawLog } from '@/app/(authenticated)/captura/services/persistence/captura-raw-log.service';
import { formatarErroCaptura, formatarErroTecnico } from '@/app/(authenticated)/captura';

type StatusAudiencia = 'M' | 'C' | 'F';

interface AudienciasParams {
  advogado_id: number;
  credencial_ids: number[];
  dataInicio?: string;
  dataFim?: string;
  statusAudiencias: StatusAudiencia[];
}

const STATUS_VALIDOS: StatusAudiencia[] = ['C', 'M', 'F'];

/**
 * @swagger
 * /api/captura/trt/audiencias:
 *   post:
 *     summary: Captura audiências do TRT
 *     description: |
 *       Realiza a captura de audiências marcadas/designadas do PJE/TRT usando credenciais armazenadas no banco de dados.
 *
 *       Este endpoint:
 *       - Autentica no PJE usando as credenciais fornecidas
 *       - Busca audiências no período especificado (ou usa padrão: hoje até +365 dias)
 *       - Retorna todas as audiências com paginação automática
 *       - Salva os dados no banco de dados automaticamente
 *
 *       **Comportamento das datas:**
 *       - Se `dataInicio` não fornecida: usa a data de hoje
 *       - Se `dataFim` não fornecida: usa hoje + 365 dias
 *       - Se ambas fornecidas: usa as datas fornecidas
 *       - Formato das datas: YYYY-MM-DD
 *
 *       **Status de audiência:**
 *       - `statusAudiencias` (array) permite capturar múltiplos status sequencialmente na mesma sessão
 *       - Valores: C (Cancelada), M (Designada), F (Realizada)
 *     tags:
 *       - Captura TRT
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
 *             required:
 *               - advogado_id
 *               - credencial_ids
 *             properties:
 *               advogado_id:
 *                 type: integer
 *                 description: ID do advogado
 *               credencial_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs das credenciais a serem utilizadas na captura
 *               dataInicio:
 *                 type: string
 *                 format: date
 *                 description: Data inicial do período de busca (YYYY-MM-DD). Se não fornecida, usa a data de hoje.
 *               dataFim:
 *                 type: string
 *                 format: date
 *                 description: Data final do período de busca (YYYY-MM-DD). Se não fornecida, usa hoje + 365 dias.
 *               statusAudiencias:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [M, C, F]
 *                 description: Lista de status para capturar sequencialmente (ordem fixa C -> M -> F)
 *           example:
 *             advogado_id: 1
 *             credencial_ids: [1, 2, 3]
 *             dataInicio: "2024-01-01"
 *             dataFim: "2024-12-31"
 *             statusAudiencias: ["M", "C", "F"]
 *     responses:
 *       200:
 *         description: Captura iniciada com sucesso (resposta assíncrona)
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
 *                   example: "Captura iniciada com sucesso"
 *                 status:
 *                   type: string
 *                   enum: [in_progress]
 *                   example: "in_progress"
 *                 capture_id:
 *                   type: integer
 *                   nullable: true
 *                   description: ID do registro de histórico da captura (para consulta posterior)
 *                   example: 123
 *                 data:
 *                   type: object
 *                   properties:
 *                     credenciais_processadas:
 *                       type: integer
 *                       description: Número de credenciais processadas
 *                     status_audiencias:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Status de audiência que serão capturados
 *                     resultados:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           credencial_id:
 *                             type: integer
 *                           tribunal:
 *                             type: string
 *                           grau:
 *                             type: string
 *                           resultado:
 *                             type: object
 *                             description: Resultado da captura para esta credencial (inclui audiencias, total, persistencia)
 *                           erro:
 *                             type: string
 *                             description: Mensagem de erro se a captura falhou
 *       400:
 *         description: Parâmetros inválidos ou formato de data incorreto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingParams:
 *                 value:
 *                   error: "Missing required parameters: advogado_id, credencial_ids"
 *               invalidDate:
 *                 value:
 *                   error: "Formato de dataInicio inválido: 2024/01/01. Use formato YYYY-MM-DD."
 *               dateRange:
 *                 value:
 *                   error: "dataInicio (2024-12-31) não pode ser posterior a dataFim (2024-01-01)."
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Credencial ou configuração não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Credential not found or access denied"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal server error"
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação (Supabase Auth ou Bearer Token)
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // 2. Validar e parsear body da requisição
    const body = await request.json();
    const { advogado_id, credencial_ids, dataInicio, dataFim, statusAudiencias } = body as AudienciasParams;

    // Validações básicas
    if (!advogado_id || !credencial_ids || !Array.isArray(credencial_ids) || credencial_ids.length === 0) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing required parameters: advogado_id, credencial_ids (array não vazio)' } },
        { status: 400 }
      );
    }

    if (!statusAudiencias || !Array.isArray(statusAudiencias) || statusAudiencias.length === 0) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing required parameter: statusAudiencias (array não vazio)' } },
        { status: 400 }
      );
    }

    const invalidos = statusAudiencias.filter((v) => !STATUS_VALIDOS.includes(v));
    if (invalidos.length > 0) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: `statusAudiencias inválido(s): ${invalidos.join(', ')}` } },
        { status: 400 }
      );
    }

    const statusParaExecutar = [...new Set(statusAudiencias)].sort(
      (a, b) => STATUS_VALIDOS.indexOf(a) - STATUS_VALIDOS.indexOf(b)
    );

    // 3. Buscar credenciais completas por IDs
    const credenciaisCompletas = await Promise.all(
      credencial_ids.map((id) => getCredentialComplete(id))
    );

    // Verificar se todas as credenciais foram encontradas
    const credenciaisNaoEncontradas = credenciaisCompletas
      .map((cred, index) => (!cred ? credencial_ids[index] : null))
      .filter((id): id is number => id !== null);

    if (credenciaisNaoEncontradas.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'One or more credentials not found',
            details: {
              credencial_ids_nao_encontradas: credenciaisNaoEncontradas,
              message: 'Verifique se todas as credenciais existem e estão ativas',
            },
          },
        },
        { status: 404 }
      );
    }

    // Verificar se todas as credenciais pertencem ao advogado
    const credenciaisInvalidas = credenciaisCompletas
      .map((cred, index) => (cred && cred.advogadoId !== advogado_id ? credencial_ids[index] : null))
      .filter((id): id is number => id !== null);

    if (credenciaisInvalidas.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'One or more credentials do not belong to the specified advogado',
            details: {
              credencial_ids_invalidas: credenciaisInvalidas,
              advogado_id,
            },
          },
        },
        { status: 400 }
      );
    }

    // 4. Ordenar credenciais por número do TRT (TRT1, TRT2, ..., TRT10, ...)
    const credenciaisOrdenadas = ordenarCredenciaisPorTRT(
      credenciaisCompletas.filter((c): c is NonNullable<typeof c> => c !== null)
    );

    // 5. Criar registro de histórico de captura
    let logId: number | null = null;
    try {
      logId = await iniciarCapturaLog({
        tipo_captura: 'audiencias',
        advogado_id: advogado_id,
        credencial_ids: credencial_ids,
        status: 'in_progress',
      });
    } catch (error) {
      console.error('Erro ao criar registro de histórico:', error);
    }

    // 6. Processar cada credencial SEQUENCIALMENTE (SSO invalida sessão anterior ao fazer novo login)
    // Para cada credencial, iterar sobre os status selecionados
    (async () => {
      const resultados: Array<{
        credencial_id: number;
        tribunal: string;
        grau: string;
        resultado?: unknown;
        erro?: string;
        status_results?: Array<{ codigoSituacao: StatusAudiencia; resultado?: unknown; erro?: string }>;
      }> = [];

      for (const credCompleta of credenciaisOrdenadas) {
        console.log(`[Audiências] Iniciando captura: ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId})`);

        let tribunalConfig;
        try {
          tribunalConfig = await getTribunalConfig(credCompleta.tribunal, credCompleta.grau);
        } catch (error) {
          const erroFormatado = formatarErroCaptura(error, credCompleta.tribunal, credCompleta.grau);
          const erroTecnico = formatarErroTecnico(error);

          console.error(`Tribunal configuration not found for ${credCompleta.tribunal} ${credCompleta.grau}:`, erroTecnico);
          resultados.push({
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            status_results: [],
            erro: erroFormatado,
          });

          await registrarCapturaRawLog({
            captura_log_id: (logId ?? -1) as number,
            tipo_captura: 'audiencias',
            advogado_id,
            credencial_id: credCompleta.credentialId,
            credencial_ids: credencial_ids,
            trt: credCompleta.tribunal,
            grau: credCompleta.grau,
            status: 'error',
            requisicao: {
              dataInicioSolicitado: dataInicio,
              dataFimSolicitado: dataFim,
              statusSolicitados: statusParaExecutar,
            },
            erro: erroTecnico,
          });
          continue;
        }

        const resultadosPorStatus: Array<{
          codigoSituacao: StatusAudiencia;
          resultado?: unknown;
          erro?: string;
        }> = [];

        for (const codigoSituacao of statusParaExecutar) {
          try {
            const resultado = await audienciasCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
              dataInicio,
              dataFim,
              codigoSituacao,
            });

            console.log(`[Audiências] Captura concluída (${codigoSituacao}): ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId})`);

            resultadosPorStatus.push({
              codigoSituacao,
              resultado,
            });

            await registrarCapturaRawLog({
              captura_log_id: (logId ?? -1) as number,
              tipo_captura: 'audiencias',
              advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'success',
              requisicao: {
                dataInicioSolicitado: dataInicio,
                dataFimSolicitado: dataFim,
                codigoSituacao,
                statusSolicitados: statusParaExecutar,
                dataInicioExecutado: resultado.dataInicio,
                dataFimExecutado: resultado.dataFim,
              },
              payload_bruto: resultado.paginasBrutas ?? resultado.audiencias,
              resultado_processado: resultado.persistencia,
              logs: resultado.logs,
            });
          } catch (error) {
            const erroFormatado = formatarErroCaptura(error, credCompleta.tribunal, credCompleta.grau);
            const erroTecnico = formatarErroTecnico(error);

            console.error(`[Audiências] Erro ao capturar ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId}) para status ${codigoSituacao}:`, erroTecnico);

            resultadosPorStatus.push({
              codigoSituacao,
              erro: erroFormatado,
            });

            await registrarCapturaRawLog({
              captura_log_id: (logId ?? -1) as number,
              tipo_captura: 'audiencias',
              advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'error',
              requisicao: {
                dataInicioSolicitado: dataInicio,
                dataFimSolicitado: dataFim,
                codigoSituacao,
                statusSolicitados: statusParaExecutar,
              },
              erro: erroTecnico,
            });
          }
        }

        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
          status_results: resultadosPorStatus,
        });
      }

      // Atualizar histórico após conclusão
      if (logId) {
        try {
          const errosColetados = resultados.flatMap((r) => {
            const errosStatus = r.status_results
              ?.filter((s) => s.erro)
              .map((s) => `${r.tribunal} ${r.grau} (ID ${r.credencial_id}) - ${s.codigoSituacao}: ${s.erro}`) || [];

            if (r.erro) {
              return [`${r.tribunal} ${r.grau} (ID ${r.credencial_id}): ${r.erro}`, ...errosStatus];
            }

            return errosStatus;
          });

          if (errosColetados.length > 0) {
            await finalizarCapturaLogErro(logId, errosColetados.join('; '));
          } else {
            await finalizarCapturaLogSucesso(logId, {
              credenciais_processadas: resultados.length,
              status_audiencias: statusParaExecutar,
              resultados,
            });
          }
          console.log(`[Audiências] Processamento concluído. Total: ${resultados.length} credenciais processadas, ${statusParaExecutar.length} status por credencial.`);
        } catch (error) {
          console.error('Erro ao atualizar histórico de captura:', error);
        }
      }
    })().catch((error) => {
      console.error('[Audiências] Erro ao processar capturas:', error);
      if (logId) {
        finalizarCapturaLogErro(logId, error instanceof Error ? error.message : 'Erro desconhecido').catch(
          (err) => console.error('Erro ao registrar erro no histórico:', err)
        );
      }
    });

    // 7. Retornar resultado imediato
    return NextResponse.json({
      success: true,
      message: 'Captura iniciada com sucesso',
      status: 'in_progress',
      capture_id: logId,
      data: {
        credenciais_processadas: credenciaisCompletas.length,
        status_audiencias: statusParaExecutar,
        message: 'A captura está sendo processada em background. Consulte o histórico para acompanhar o progresso.',
      },
    });

  } catch (error) {
    console.error('Error in audiencias capture:', error);

    // Retornar erro específico se for erro de validação
    if (error instanceof Error && (error.message.includes('Formato de data') || error.message.includes('não pode ser posterior'))) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
