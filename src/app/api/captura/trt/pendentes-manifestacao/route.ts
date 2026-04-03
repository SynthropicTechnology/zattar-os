// Rota de API para captura de processos pendentes de manifestação do TRT

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { getCredentialComplete } from '@/app/(authenticated)/captura/credentials/credential.service';
import { pendentesManifestacaoCapture } from '@/app/(authenticated)/captura/services/trt/pendentes-manifestacao.service';
import { getTribunalConfig } from '@/app/(authenticated)/captura/services/trt/config';
import { iniciarCapturaLog, finalizarCapturaLogSucesso, finalizarCapturaLogErro } from '@/app/(authenticated)/captura/services/captura-log.service';
import { ordenarCredenciaisPorTRT } from '@/app/(authenticated)/captura';
import { registrarCapturaRawLog } from '@/app/(authenticated)/captura/services/persistence/captura-raw-log.service';
import type { FiltroPrazoPendentes } from '@/app/(authenticated)/captura';

interface PendentesManifestacaoParams {
  advogado_id: number;
  credencial_ids: number[];
  filtroPrazo?: FiltroPrazoPendentes;
  filtrosPrazo?: FiltroPrazoPendentes[];
}

const FILTROS_VALIDOS: FiltroPrazoPendentes[] = ['sem_prazo', 'no_prazo'];

function normalizarFiltrosPrazo(
  filtros?: FiltroPrazoPendentes[],
  filtroUnico?: FiltroPrazoPendentes
): FiltroPrazoPendentes[] {
  const candidatos = filtros && Array.isArray(filtros) ? filtros : (filtroUnico ? [filtroUnico] : []);
  const valores: FiltroPrazoPendentes[] = candidatos.length > 0 ? candidatos : ['sem_prazo'];
  const invalidos = valores.filter((valor) => !FILTROS_VALIDOS.includes(valor));

  if (invalidos.length > 0) {
    throw new Error(`filtroPrazo/filtrosPrazo inválido(s): ${invalidos.join(', ')}`);
  }

  const unicos = Array.from(new Set(valores));
  return unicos.sort((a, b) => FILTROS_VALIDOS.indexOf(a) - FILTROS_VALIDOS.indexOf(b));
}

/**
 * @swagger
 * /api/captura/trt/pendentes-manifestacao:
 *   post:
 *     summary: Captura processos pendentes de manifestação do TRT
 *     description: |
 *       Realiza a captura de processos pendentes de manifestação do PJE/TRT usando credenciais armazenadas no banco de dados.
 *       
 *       Este endpoint:
 *       - Autentica no PJE usando as credenciais fornecidas
 *       - Obtém totalizadores para validação
 *       - Filtra processos por prazo (no prazo ou sem prazo)
 *       - Retorna todos os processos com paginação automática
 *       - Valida a quantidade obtida contra os totalizadores
 *       - Salva os dados no banco de dados automaticamente
 *       
 *       **Filtro de prazo:**
 *       - `no_prazo`: Processos que estão dentro do prazo para manifestação
 *       - `sem_prazo`: Processos que não possuem prazo definido (padrão)
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
 *               filtroPrazo:
 *                 type: string
 *                 enum: [no_prazo, sem_prazo]
 *                 default: sem_prazo
 *                 description: Filtro de prazo para processos pendentes
 *               filtrosPrazo:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [no_prazo, sem_prazo]
 *                 description: Lista de filtros de prazo para executar sequencialmente (ordem fixa sem_prazo -> no_prazo)
 *           example:
 *             advogado_id: 1
 *             credencial_ids: [1, 2, 3]
 *             filtrosPrazo: ["sem_prazo", "no_prazo"]
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
 *                             description: Resultado da captura para esta credencial (inclui processos, total, filtroPrazo, persistencia)
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
 *               error: "Credential not found or access denied"
 *       500:
 *         description: Erro interno do servidor ou erro de validação de quantidade
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               serverError:
 *                 value:
 *                   error: "Internal server error"
 *               validationError:
 *                 value:
 *                   error: "Quantidade de processos obtida (150) excede o totalizador (100). A raspagem pode estar incorreta."
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
    const { advogado_id, credencial_ids, filtroPrazo, filtrosPrazo } = body as PendentesManifestacaoParams;

    // Validações básicas
    if (!advogado_id || !credencial_ids || !Array.isArray(credencial_ids) || credencial_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: advogado_id, credencial_ids (array não vazio)' },
        { status: 400 }
      );
    }

    // Normalizar filtros de prazo (permite filtro único ou lista)
    let filtrosParaExecutar: FiltroPrazoPendentes[];
    try {
      filtrosParaExecutar = normalizarFiltrosPrazo(filtrosPrazo, filtroPrazo);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Filtro de prazo inválido' },
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
        tipo_captura: 'pendentes',
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
        filtros?: Array<{ filtroPrazo: FiltroPrazoPendentes; resultado?: unknown; erro?: string }>;
      }> = [];

      for (const credCompleta of credenciaisOrdenadas) {
        console.log(`[Pendentes] Iniciando captura: ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId})`);

        let tribunalConfig;
        try {
          tribunalConfig = await getTribunalConfig(credCompleta.tribunal, credCompleta.grau);
        } catch (error) {
          console.error(`Tribunal configuration not found for ${credCompleta.tribunal} ${credCompleta.grau}:`, error);
          resultados.push({
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            filtros: [],
            erro: `Configuração do tribunal não encontrada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          });

          await registrarCapturaRawLog({
            captura_log_id: (logId ?? -1) as number,
            tipo_captura: 'pendentes',
            advogado_id,
            credencial_id: credCompleta.credentialId,
            credencial_ids: credencial_ids,
            trt: credCompleta.tribunal,
            grau: credCompleta.grau,
            status: 'error',
            requisicao: {
              filtrosSolicitados: filtrosParaExecutar,
            },
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          });
          continue;
        }

        const resultadosPorFiltro: Array<{
          filtroPrazo: FiltroPrazoPendentes;
          resultado?: unknown;
          erro?: string;
        }> = [];

        for (const filtro of filtrosParaExecutar) {
          try {
            const resultado = await pendentesManifestacaoCapture({
              credential: credCompleta.credenciais,
              config: tribunalConfig,
              filtroPrazo: filtro,
              capturarDocumentos: true,
            });

            console.log(`[Pendentes] Captura concluída (${filtro}): ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId})`);

            resultadosPorFiltro.push({
              filtroPrazo: filtro,
              resultado,
            });

            await registrarCapturaRawLog({
              captura_log_id: (logId ?? -1) as number,
              tipo_captura: 'pendentes',
              advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'success',
              requisicao: {
                filtroPrazo: filtro,
                filtrosSolicitados: filtrosParaExecutar,
              },
              payload_bruto: resultado.payloadBruto ?? resultado.processos,
              resultado_processado: {
                persistencia: resultado.persistencia,
                documentosCapturados: resultado.documentosCapturados,
                documentosFalhados: resultado.documentosFalhados,
                errosDocumentos: resultado.errosDocumentos,
              },
              logs: resultado.logs,
            });
          } catch (error) {
            console.error(`[Pendentes] Erro ao capturar ${credCompleta.tribunal} ${credCompleta.grau} (Credencial ID: ${credCompleta.credentialId}) para filtro ${filtro}:`, error);
            
            const erroMsg = error instanceof Error && error.message.includes('Quantidade de processos')
              ? error.message
              : (error instanceof Error ? error.message : 'Erro desconhecido');
            
            resultadosPorFiltro.push({
              filtroPrazo: filtro,
              erro: erroMsg,
            });

            await registrarCapturaRawLog({
              captura_log_id: (logId ?? -1) as number,
              tipo_captura: 'pendentes',
              advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: 'error',
              requisicao: {
                filtroPrazo: filtro,
                filtrosSolicitados: filtrosParaExecutar,
              },
              erro: erroMsg,
            });
          }
        }

        resultados.push({
          credencial_id: credCompleta.credentialId,
          tribunal: credCompleta.tribunal,
          grau: credCompleta.grau,
          filtros: resultadosPorFiltro,
        });
      }

      // Atualizar histórico após conclusão
      if (logId) {
        try {
          const errosColetados = resultados.flatMap((r) => {
            const errosFiltro = r.filtros
              ?.filter((f) => f.erro)
              .map((f) => `${r.tribunal} ${r.grau} (ID ${r.credencial_id}) - ${f.filtroPrazo}: ${f.erro}`) || [];

            if (r.erro) {
              return [`${r.tribunal} ${r.grau} (ID ${r.credencial_id}): ${r.erro}`, ...errosFiltro];
            }

            return errosFiltro;
          });

          if (errosColetados.length > 0) {
            await finalizarCapturaLogErro(logId, errosColetados.join('; '));
          } else {
            await finalizarCapturaLogSucesso(logId, {
              credenciais_processadas: resultados.length,
              filtros_prazo: filtrosParaExecutar,
              resultados,
            });
          }
          console.log(`[Pendentes] Processamento concluído. Total: ${resultados.length} credenciais processadas.`);
        } catch (error) {
          console.error('Erro ao atualizar histórico de captura:', error);
        }
      }
    })().catch((error) => {
      console.error('[Pendentes] Erro ao processar capturas:', error);
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
        filtros_prazo: filtrosParaExecutar,
        message: 'A captura está sendo processada em background. Consulte o histórico para acompanhar o progresso.',
      },
    });

  } catch (error) {
    console.error('Error in pendentes-manifestacao capture:', error);
    
    // Retornar erro específico se for erro de validação
    if (error instanceof Error && error.message.includes('Quantidade de processos')) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
