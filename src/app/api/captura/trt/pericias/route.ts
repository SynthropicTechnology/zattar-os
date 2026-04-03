// Rota de API para captura de perícias do TRT

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { getCredentialComplete } from '@/app/(authenticated)/captura/credentials/credential.service';
import { periciasCapture } from '@/app/(authenticated)/captura/services/trt/pericias.service';
import { getTribunalConfig } from '@/app/(authenticated)/captura/services/trt/config';
import { iniciarCapturaLog, finalizarCapturaLogSucesso, finalizarCapturaLogErro } from '@/app/(authenticated)/captura/services/captura-log.service';
import { ordenarCredenciaisPorTRT } from '@/app/(authenticated)/captura';
import { registrarCapturaRawLog } from '@/app/(authenticated)/captura/services/persistence/captura-raw-log.service';
import { formatarErroCaptura, formatarErroTecnico } from '@/app/(authenticated)/captura';

interface PericiasParams {
  advogado_id: number;
  credencial_ids: number[];
  situacoes?: ('S' | 'L' | 'C' | 'F' | 'P' | 'R')[];
}

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
    const { advogado_id, credencial_ids, situacoes } = body as PericiasParams;

    // Validações básicas
    if (!advogado_id || !credencial_ids || !Array.isArray(credencial_ids) || credencial_ids.length === 0) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing required parameters: advogado_id, credencial_ids (array não vazio)' } },
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
        tipo_captura: 'pericias',
        advogado_id: advogado_id,
        credencial_ids: credencial_ids,
        status: 'in_progress',
      });
    } catch (error) {
      console.error('Erro ao criar registro de histórico:', error);
    }

    // 6. Processar cada credencial SEQUENCIALMENTE (SSO invalida sessão anterior ao fazer novo login)
    (async () => {
      const resultados: Array<{
        credencial_id: number;
        tribunal: string;
        grau: string;
        resultado?: unknown;
        erro?: string;
      }> = [];

      for (const credCompleta of credenciaisOrdenadas) {
        console.log(`[Perícias] Iniciando captura: ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId})`);

        let tribunalConfig;
        try {
          tribunalConfig = await getTribunalConfig(credCompleta.tribunal, credCompleta.grau);
        } catch (error) {
          console.error(`Tribunal configuration not found for ${credCompleta.tribunal} ${credCompleta.grau}:`, error);
          resultados.push({
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            erro: formatarErroCaptura(error, credCompleta.tribunal, credCompleta.grau),
          });

          await registrarCapturaRawLog({
            captura_log_id: (logId ?? -1) as number,
            tipo_captura: 'pericias',
            advogado_id,
            credencial_id: credCompleta.credentialId,
            credencial_ids: credencial_ids,
            trt: credCompleta.tribunal,
            grau: credCompleta.grau,
            status: 'error',
            requisicao: {
              situacoes: situacoes || ['S', 'L', 'C', 'F', 'P', 'R'],
            },
            erro: formatarErroTecnico(error),
          });
          continue;
        }

        try {
          const resultado = await periciasCapture({
            credential: credCompleta.credenciais,
            config: tribunalConfig,
            situacoes: situacoes || ['S', 'L', 'C', 'F', 'P', 'R'],
          });

          console.log(`[Perícias] Captura concluída: ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId})`);

          resultados.push({
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            resultado,
          });

          await registrarCapturaRawLog({
            captura_log_id: (logId ?? -1) as number,
            tipo_captura: 'pericias',
            advogado_id,
            credencial_id: credCompleta.credentialId,
            credencial_ids: credencial_ids,
            trt: credCompleta.tribunal,
            grau: credCompleta.grau,
            status: 'success',
            requisicao: {
              situacoes: situacoes || ['S', 'L', 'C', 'F', 'P', 'R'],
            },
            payload_bruto: resultado.pericias,
            resultado_processado: {
              persistencia: resultado.persistencia,
              dadosComplementares: resultado.dadosComplementares,
            },
            logs: resultado.logs,
          });

          // Salvar payloads brutos de partes como logs separados (captura_logs_brutos)
          // Isso permite reprocessamento futuro das partes (padrão usado no scheduler).
          if (resultado.payloadsBrutosPartes && resultado.payloadsBrutosPartes.length > 0) {
            for (const { processoId, numeroProcesso, payloadBruto } of resultado.payloadsBrutosPartes) {
              if (!payloadBruto) continue;
              try {
                await registrarCapturaRawLog({
                  captura_log_id: (logId ?? -1) as number,
                  tipo_captura: 'partes',
                  advogado_id,
                  credencial_id: credCompleta.credentialId,
                  credencial_ids: credencial_ids,
                  trt: credCompleta.tribunal,
                  grau: credCompleta.grau,
                  status: 'success',
                  requisicao: {
                    processo_id: processoId,
                    numero_processo: numeroProcesso,
                    captura_pai: 'pericias',
                  },
                  payload_bruto: payloadBruto,
                });
              } catch (e) {
                console.warn(`⚠️ [Perícias] Falha ao salvar payload de partes do processo ${processoId}:`, e);
              }
            }
          }
        } catch (error) {
          const erroFormatado = formatarErroCaptura(error, credCompleta.tribunal, credCompleta.grau);
          const erroTecnico = formatarErroTecnico(error);
          
          console.error(`[Perícias] Erro ao capturar ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId}):`, erroTecnico);
          
          resultados.push({
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            erro: erroFormatado,
          });

          await registrarCapturaRawLog({
            captura_log_id: (logId ?? -1) as number,
            tipo_captura: 'pericias',
            advogado_id,
            credencial_id: credCompleta.credentialId,
            credencial_ids: credencial_ids,
            trt: credCompleta.tribunal,
            grau: credCompleta.grau,
            status: 'error',
            requisicao: {
              situacoes: situacoes || ['S', 'L', 'C', 'F', 'P', 'R'],
            },
            erro: erroTecnico,
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
          console.log(`[Perícias] Processamento concluído. Total: ${resultados.length} credenciais processadas.`);
        } catch (error) {
          console.error('Erro ao atualizar histórico de captura:', error);
        }
      }
    })().catch((error) => {
      console.error('[Perícias] Erro ao processar capturas:', error);
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
    console.error('Error in pericias capture:', error);

    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

