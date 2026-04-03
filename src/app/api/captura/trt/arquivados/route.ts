// Rota de API para captura de processos arquivados do TRT

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { getCredentialComplete } from '@/app/(authenticated)/captura/credentials/credential.service';
import { arquivadosCapture } from '@/app/(authenticated)/captura/services/trt/arquivados.service';
import { getTribunalConfig } from '@/app/(authenticated)/captura/services/trt/config';
import { iniciarCapturaLog, finalizarCapturaLogSucesso, finalizarCapturaLogErro } from '@/app/(authenticated)/captura/services/captura-log.service';
import { ordenarCredenciaisPorTRT } from '@/app/(authenticated)/captura';
import { registrarCapturaRawLog } from '@/app/(authenticated)/captura/services/persistence/captura-raw-log.service';

/**
 * @swagger
 * /api/captura/trt/arquivados:
 *   post:
 *     summary: Captura processos arquivados do TRT
 *     description: |
 *       Realiza a captura de processos arquivados do PJE/TRT usando credenciais armazenadas no banco de dados.
 *       
 *       Este endpoint:
 *       - Autentica no PJE usando as credenciais fornecidas
 *       - Obtém todos os processos arquivados do advogado
 *       - Retorna os processos com paginação automática
 *       - Salva os dados no banco de dados automaticamente
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
 *           example:
 *             advogado_id: 1
 *             credencial_ids: [1, 2, 3]
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
 *                             description: Resultado da captura para esta credencial
 *                           erro:
 *                             type: string
 *                             description: Mensagem de erro se a captura falhou
 *       400:
 *         description: Parâmetros obrigatórios ausentes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing required parameters: advogado_id, credencial_ids"
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
 *               error: "One or more credentials not found"
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validar e parsear body da requisição
    const body = await request.json();
    const { advogado_id, credencial_ids } = body as {
      advogado_id: number;
      credencial_ids: number[];
    };

    // Validações básicas
    if (!advogado_id || !credencial_ids || !Array.isArray(credencial_ids) || credencial_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: advogado_id, credencial_ids (array não vazio)' },
        { status: 400 }
      );
    }

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
          error: 'One or more credentials not found',
          details: {
            credencial_ids_nao_encontradas: credenciaisNaoEncontradas,
            message: 'Verifique se todas as credenciais existem e estão ativas',
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
          error: 'One or more credentials do not belong to the specified advogado',
          details: {
            credencial_ids_invalidas: credenciaisInvalidas,
            advogado_id,
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
        tipo_captura: 'arquivados',
        advogado_id: advogado_id,
        credencial_ids: credencial_ids,
        status: 'in_progress',
      });
    } catch (error) {
      console.error('Erro ao criar registro de histórico:', error);
    }

    // 6. Processar cada credencial SEQUENCIALMENTE
    (async () => {
      const resultados: Array<{
        credencial_id: number;
        tribunal: string;
        grau: string;
        resultado?: unknown;
        erro?: string;
      }> = [];

      for (const credCompleta of credenciaisOrdenadas) {
        console.log(`[Arquivados] Iniciando captura: ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId})`);

        let tribunalConfig;
        try {
          tribunalConfig = await getTribunalConfig(credCompleta.tribunal, credCompleta.grau);
        } catch (error) {
          console.error(`Tribunal configuration not found for ${credCompleta.tribunal} ${credCompleta.grau}:`, error);
          resultados.push({
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            erro: `Configuração do tribunal não encontrada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          });

          await registrarCapturaRawLog({
            captura_log_id: (logId ?? -1) as number,
            tipo_captura: 'arquivados',
            advogado_id,
            credencial_id: credCompleta.credentialId,
            credencial_ids: credencial_ids,
            trt: credCompleta.tribunal,
            grau: credCompleta.grau,
            status: 'error',
            requisicao: {
              advogado_id,
              credencial_id: credCompleta.credentialId,
            },
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          });
          continue;
        }

        try {
          const resultado = await arquivadosCapture({
            credential: credCompleta.credenciais,
            config: tribunalConfig,
          });

          console.log(`[Arquivados] Captura concluída: ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId})`);

          resultados.push({
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            resultado,
          });

          await registrarCapturaRawLog({
            captura_log_id: (logId ?? -1) as number,
            tipo_captura: 'arquivados',
            advogado_id,
            credencial_id: credCompleta.credentialId,
            credencial_ids: credencial_ids,
            trt: credCompleta.tribunal,
            grau: credCompleta.grau,
            status: 'success',
            requisicao: {
              advogado_id,
              credencial_id: credCompleta.credentialId,
            },
            payload_bruto: resultado.payloadBruto ?? resultado.processos,
            resultado_processado: resultado.persistencia,
            logs: resultado.logs,
          });
        } catch (error) {
          console.error(`[Arquivados] Erro ao capturar ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId}):`, error);
          resultados.push({
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          });

          await registrarCapturaRawLog({
            captura_log_id: (logId ?? -1) as number,
            tipo_captura: 'arquivados',
            advogado_id,
            credencial_id: credCompleta.credentialId,
            credencial_ids: credencial_ids,
            trt: credCompleta.tribunal,
            grau: credCompleta.grau,
            status: 'error',
            requisicao: {
              advogado_id,
              credencial_id: credCompleta.credentialId,
            },
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      }

      // Atualizar histórico após conclusão
      if (logId) {
        try {
          const temErros = resultados.some((r) => 'erro' in r);
          if (temErros) {
            const erros = resultados
              .filter((r) => 'erro' in r)
              .map((r) => `${r.tribunal} ${r.grau} (ID ${r.credencial_id}): ${r.erro}`)
              .join('; ');
            await finalizarCapturaLogErro(logId, erros);
          } else {
            await finalizarCapturaLogSucesso(logId, {
              credenciais_processadas: resultados.length,
              resultados,
            });
          }
          console.log(`[Arquivados] Processamento concluído. Total: ${resultados.length} credenciais processadas.`);
        } catch (error) {
          console.error('Erro ao atualizar histórico de captura:', error);
        }
      }
    })().catch((error) => {
      console.error('[Arquivados] Erro ao processar capturas:', error);
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
        message: 'A captura está sendo processada em background. Consulte o histórico para acompanhar o progresso.',
      },
    });

  } catch (error) {
    console.error('Error in arquivados capture:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
