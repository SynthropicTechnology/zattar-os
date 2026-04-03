import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { getCredentialComplete } from '@/app/(authenticated)/captura/credentials/credential.service';
import { getTribunalConfig } from '@/app/(authenticated)/captura/services/trt/config';
import { ordenarCredenciaisPorTRT } from '@/app/(authenticated)/captura';
import { iniciarCapturaLog, atualizarCapturaLog } from '@/app/(authenticated)/captura/services/captura-log.service';
import { capturaCombinada } from '@/app/(authenticated)/captura/services/trt/captura-combinada.service';
import { registrarCapturaRawLog } from '@/app/(authenticated)/captura/services/persistence/captura-raw-log.service';
import { buscarAdvogado } from '@/app/(authenticated)/advogados';

/**
 * @swagger
 * /api/captura/trt/combinada:
 *   post:
 *     summary: Captura unificada do TRT
 *     description: |
 *       Executa múltiplas capturas em uma única sessão autenticada:
 *       - Audiências Designadas (hoje → +1 ano)
 *       - Audiências Realizadas (ontem)
 *       - Audiências Canceladas (hoje → +1 ano)
 *       - Expedientes No Prazo
 *       - Expedientes Sem Prazo
 *       - Timeline + Partes de todos os processos únicos
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
 *         description: Captura iniciada com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Credencial ou configuração não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
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

    // 3. Buscar advogado
    const advogado = await buscarAdvogado(advogado_id);
    if (!advogado) {
      return NextResponse.json(
        { error: `Advogado não encontrado` },
        { status: 404 }
      );
    }

    // 4. Buscar credenciais completas por IDs
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

    // 5. Ordenar credenciais por número do TRT
    const credenciaisOrdenadas = ordenarCredenciaisPorTRT(
      credenciaisCompletas.filter((c): c is NonNullable<typeof c> => c !== null)
    );

    // 6. Criar registro de histórico de captura
    let logId: number | null = null;
    try {
      logId = await iniciarCapturaLog({
        tipo_captura: 'combinada',
        advogado_id: advogado_id,
        credencial_ids: credencial_ids,
        status: 'in_progress',
      });
    } catch (error) {
      console.error('Erro ao criar registro de histórico:', error);
      // Continuar mesmo se falhar o registro de histórico
    }

    // 7. Processar cada credencial SEQUENCIALMENTE (não bloqueia resposta)
    (async () => {
      const resultados: Array<{
        credencial_id: number;
        tribunal: string;
        grau: string;
        resultado?: unknown;
        erro?: string;
      }> = [];

      for (const credCompleta of credenciaisOrdenadas) {
        console.log(`[Captura Combinada] Iniciando captura: ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId})`);

        try {
          // Buscar configuração do tribunal usando getTribunalConfig
          // Esta função já faz o mapeamento correto e retorna ConfigTRT
          const tribunalConfig = await getTribunalConfig(
            credCompleta.tribunal,
            credCompleta.grau
          );

          // Executar captura combinada
          const resultado = await capturaCombinada({
            credential: credCompleta.credenciais,
            config: tribunalConfig,
          });

          // Registrar captura raw log
          await registrarCapturaRawLog({
            captura_log_id: logId ?? -1,
            tipo_captura: 'combinada',
            advogado_id: advogado_id,
            credencial_id: credCompleta.credentialId,
            credencial_ids: credencial_ids,
            trt: credCompleta.tribunal,
            grau: credCompleta.grau,
            status: 'success',
            requisicao: {
              resumo: resultado.resumo,
            },
            payload_bruto: {
              capturas: resultado.capturas,
            },
            resultado_processado: {
              persistenciaAudiencias: resultado.persistenciaAudiencias,
              persistenciaExpedientes: resultado.persistenciaExpedientes,
              dadosComplementares: resultado.dadosComplementares,
            },
            logs: resultado.logs,
          });

          resultados.push({
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            resultado: {
              resumo: resultado.resumo,
              dadosComplementares: resultado.dadosComplementares,
              duracaoMs: resultado.duracaoMs,
            },
          });

          console.log(`✅ [Captura Combinada] Concluída: ${credCompleta.tribunal} ${credCompleta.grau}`);
        } catch (error) {
          const erroMsg = error instanceof Error ? error.message : 'Erro desconhecido';
          console.error(`❌ [Captura Combinada] Erro em ${credCompleta.tribunal} ${credCompleta.grau}:`, erroMsg);

          await registrarCapturaRawLog({
            captura_log_id: logId ?? -1,
            tipo_captura: 'combinada',
            advogado_id: advogado_id,
            credencial_id: credCompleta.credentialId,
            credencial_ids: credencial_ids,
            trt: credCompleta.tribunal,
            grau: credCompleta.grau,
            status: 'error',
            erro: erroMsg,
          });

          resultados.push({
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            erro: erroMsg,
          });
        }
      }

      // Atualizar log de captura com resultado final
      if (logId) {
        const totalSucesso = resultados.filter((r) => !r.erro).length;
        const totalErro = resultados.filter((r) => r.erro).length;

        await atualizarCapturaLog(logId, {
          status: totalErro === 0 ? 'completed' : totalSucesso > 0 ? 'completed' : 'failed',
          resultado: {
            credenciais_processadas: resultados.length,
            total_sucesso: totalSucesso,
            total_erro: totalErro,
            resultados,
          },
          concluido_em: new Date().toISOString(),
        });
      }

      console.log(`✅ [Captura Combinada] Processamento finalizado: ${resultados.length} credenciais processadas`);
    })().catch((error) => {
      console.error('❌ [Captura Combinada] Erro no processamento assíncrono:', error);
      if (logId) {
        atualizarCapturaLog(logId, {
          status: 'failed',
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          concluido_em: new Date().toISOString(),
        }).catch((err) => {
          console.error('Erro ao atualizar log de captura:', err);
        });
      }
    });

    // 8. Retornar resposta imediata (processamento é assíncrono)
    return NextResponse.json(
      {
        success: true,
        message: 'Captura unificada iniciada com sucesso',
        status: 'in_progress',
        capture_id: logId,
        data: {
          credenciais_processadas: credenciaisOrdenadas.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [POST /api/captura/trt/combinada] Erro:', error);

    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      {
        success: false,
        error: erroMsg,
      },
      { status: 500 }
    );
  }
}
