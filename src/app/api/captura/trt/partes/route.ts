// Rota de API para captura de partes de processos do PJE-TRT
// Captura partes, representantes e cria vínculos processo-partes

import type { Browser, Page } from "playwright";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { getCredentialComplete } from "@/app/(authenticated)/captura/credentials/credential.service";
import { getTribunalConfig } from "@/app/(authenticated)/captura/services/trt/config";
import {
  capturarPartesProcesso,
  type ProcessoParaCaptura,
} from "@/app/(authenticated)/captura/services/partes/partes-capture.service";
import { autenticarPJE } from "@/app/(authenticated)/captura/services/trt/trt-auth.service";
import { buscarAdvogado } from "@/app/(authenticated)/advogados";
import { createServiceClient } from "@/lib/supabase/service-client";
import { registrarCapturaRawLog } from "@/app/(authenticated)/captura/services/persistence/captura-raw-log.service";
import {
  criarCapturaLog,
  atualizarCapturaLog,
} from "@/app/(authenticated)/captura/services/persistence/captura-log-persistence.service";
import type { CodigoTRT, GrauTRT } from "@/app/(authenticated)/captura";
import type { GrauAcervo } from "@/app/(authenticated)/acervo";
import type { CapturaLog, ResultadoCapturaPartes, TipoCaptura } from "@/app/(authenticated)/captura";
import getLogger, { withCorrelationId } from "@/lib/logger";
import { withDistributedLock } from "@/lib/utils/locks/distributed-lock";
import { CAPTURA_CONFIG } from "@/app/(authenticated)/captura/services/partes/config";
import {
  extractErrorInfo,
  LockError,
} from "@/app/(authenticated)/captura/services/partes/errors";

const GRAUS_VALIDOS: GrauTRT[] = [
  "primeiro_grau",
  "segundo_grau",
  "tribunal_superior",
];

function isCodigoTRT(value: unknown): value is CodigoTRT {
  return typeof value === "string" && /^TRT([1-9]|1[0-9]|2[0-4])$/.test(value);
}

function isGrauTRT(value: unknown): value is GrauTRT {
  return typeof value === "string" && GRAUS_VALIDOS.includes(value as GrauTRT);
}

function sanitizeNumeroProcesso(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const sanitized = value.trim().replace(/\s+/g, "");
  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeListaNumerosProcesso(value: unknown): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  const numeros = list
    .map((n) => (typeof n === "string" ? n.trim() : ""))
    .map((n) => n.replace(/\s+/g, ""))
    .filter((n) => n.length > 0);
  return Array.from(new Set(numeros));
}

/**
 * @swagger
 * /api/captura/trt/partes:
 *   post:
 *     summary: Captura partes (pessoas envolvidas) de processos do PJE-TRT
 *     description: |
 *       Captura todas as partes de processos específicos ou de todos os processos de um advogado.
 *       Para cada parte:
 *       - Identifica se é cliente, parte contrária ou terceiro (baseado em CPF de representantes)
 *       - Faz upsert na tabela apropriada (clientes, partes_contrarias ou terceiros)
 *       - Salva representantes legais (advogados, defensores, etc.)
 *       - Cria vínculo processo-parte na tabela processo_partes
 *       - Permite filtrar processos por IDs, TRTs, graus ou números de processo (único ou múltiplos)
 *     tags:
 *       - Captura TRT
 *       - Partes
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
 *                 description: ID do advogado (usado para identificar clientes por CPF)
 *               credencial_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs das credenciais para autenticação no PJE
 *               processo_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs dos processos (opcional - se vazio, captura todos os processos do advogado)
 *               trts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "Lista de códigos TRT (ex: TRT3) para filtrar processos"
 *               graus:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [primeiro_grau, segundo_grau]
 *                 description: Lista de graus para filtrar processos
 *               numero_processo:
 *                 type: string
 *                 description: Número específico de processo para captura
 *               numeros_processo:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de números de processos (um por item)
 *           example:
 *             advogado_id: 1
 *             credencial_ids: [5, 6]
 *             processo_ids: [100, 101, 102]
 *             trts: ['TRT3', 'TRT5']
 *             graus: ['primeiro_grau']
 *     responses:
 *       200:
 *         description: Captura concluída com sucesso
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
 *                   example: "Captura de partes concluída"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_processos:
 *                       type: integer
 *                       description: Quantidade de processos processados
 *                     total_partes:
 *                       type: integer
 *                       description: Total de partes encontradas
 *                     clientes:
 *                       type: integer
 *                       description: Quantidade de clientes identificados
 *                     partes_contrarias:
 *                       type: integer
 *                       description: Quantidade de partes contrárias
 *                     terceiros:
 *                       type: integer
 *                       description: Quantidade de terceiros (peritos, MP, etc.)
 *                     representantes:
 *                       type: integer
 *                       description: Total de representantes salvos
 *                     vinculos:
 *                       type: integer
 *                       description: Total de vínculos processo-parte criados
 *                     erros:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           processo_id:
 *                             type: integer
 *                           numero_processo:
 *                             type: string
 *                           erro:
 *                             type: string
 *                       description: Lista de erros ocorridos
 *                     duracao_ms:
 *                       type: integer
 *                       description: Tempo total de execução em milissegundos
 *       400:
 *         description: Parâmetros obrigatórios ausentes ou inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Missing required parameters: advogado_id, credencial_ids"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Advogado, credencial ou processo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Advogado não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Internal server error"
 */
export async function POST(request: NextRequest) {
  return withCorrelationId(async () => {
    const logger = getLogger({ service: "api-captura-partes" });
    let capturaLog: CapturaLog | undefined;

    try {
      // 1. Autenticação
      const authResult = await authenticateRequest(request);
      if (!authResult.authenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // 2. Validar e parsear body da requisição
      const body = await request.json();
      const {
        advogado_id,
        credencial_ids,
        processo_ids,
        trts,
        graus,
        numero_processo,
        numeros_processo,
      } = body as {
        advogado_id: number;
        credencial_ids: number[];
        processo_ids?: number[];
        trts?: CodigoTRT[];
        graus?: GrauTRT[];
        numero_processo?: string;
        numeros_processo?: string[];
      };

      // Validações básicas
      if (
        !advogado_id ||
        !credencial_ids ||
        !Array.isArray(credencial_ids) ||
        credencial_ids.length === 0
      ) {
        return NextResponse.json(
          {
            error:
              "Missing required parameters: advogado_id, credencial_ids (array não vazio)",
          },
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
      const credenciais = [];
      for (const id of credencial_ids) {
        const credencial = await getCredentialComplete(id);
        if (!credencial) {
          return NextResponse.json(
            { error: `Credencial ${id} não encontrada` },
            { status: 404 }
          );
        }
        credenciais.push(credencial);
      }

      if (credenciais.length === 0) {
        return NextResponse.json(
          { error: "Nenhuma credencial válida encontrada" },
          { status: 404 }
        );
      }

      // Sanitizar filtros opcionais
      const trtsFiltrados = Array.isArray(trts) ? trts.filter(isCodigoTRT) : [];
      const grausFiltrados = Array.isArray(graus)
        ? graus.filter(isGrauTRT)
        : [];
      const numeroProcessoUnico = sanitizeNumeroProcesso(numero_processo);
      const numerosProcessoLista =
        sanitizeListaNumerosProcesso(numeros_processo);
      const numerosParaFiltro = new Set<string>(numerosProcessoLista);
      if (numeroProcessoUnico) {
        numerosParaFiltro.add(numeroProcessoUnico);
      }
      const numerosFiltroArray = Array.from(numerosParaFiltro);

      if (
        (!processo_ids || processo_ids.length === 0) &&
        trtsFiltrados.length === 0 &&
        grausFiltrados.length === 0 &&
        numerosFiltroArray.length === 0
      ) {
        return NextResponse.json(
          {
            error:
              "É necessário informar pelo menos um filtro: processo_ids, numero_processo, numeros_processo, trts ou graus",
          },
          { status: 400 }
        );
      }

      // 5. Buscar processos com base nos filtros fornecidos
      let processos: ProcessoParaCaptura[] = [];

      const supabase = createServiceClient();
      let processosQuery = supabase
        .from("acervo")
        .select("id, numero_processo, id_pje, trt, grau");

      if (processo_ids && processo_ids.length > 0) {
        processosQuery = processosQuery.in("id", processo_ids);
      }
      if (numerosFiltroArray.length > 0) {
        processosQuery = processosQuery.in(
          "numero_processo",
          numerosFiltroArray
        );
      }
      if (trtsFiltrados.length > 0) {
        processosQuery = processosQuery.in("trt", trtsFiltrados);
      }
      if (grausFiltrados.length > 0) {
        processosQuery = processosQuery.in("grau", grausFiltrados);
      }

      const { data: processosData, error: processosError } =
        await processosQuery;

      if (processosError || !processosData || processosData.length === 0) {
        return NextResponse.json(
          { error: "Nenhum processo encontrado com os filtros fornecidos" },
          { status: 404 }
        );
      }

      processos = processosData.map((p) => ({
        id: p.id as number,
        numero_processo: p.numero_processo as string,
        id_pje: p.id_pje as number,
        trt: p.trt as CodigoTRT,
        grau: p.grau as GrauAcervo,
      }));

      // 6. Iniciar log de captura
      capturaLog = await criarCapturaLog({
        tipo_captura: "partes" as TipoCaptura,
        advogado_id: advogado.id,
        credencial_ids: credencial_ids,
        status: "in_progress" as const,
      });

      logger.info({ capturaLogId: capturaLog?.id }, "Log de captura criado");

      // 7. Resultado agregado de todos os processos
      // Cada processo gera um log bruto para auditoria granular (um por processo capturado)
      // Erros de autenticação também são logados para rastreabilidade completa
      // Formato de resultado.raw_log_ids: array de strings (um por processo) persistidas em public.captura_logs_brutos
      const resultadoTotal: ResultadoCapturaPartes & {
        erros: Array<{
          processo_id: number;
          numero_processo: string;
          erro: string;
        }>;
      } = {
        total_processos: processos.length,
        total_partes: 0,
        clientes: 0,
        partes_contrarias: 0,
        terceiros: 0,
        representantes: 0,
        vinculos: 0,
        erros_count: 0,
        duracao_ms: 0,
        raw_log_ids: [], // Array de IDs dos logs brutos (um por processo)
        raw_log_falhas: 0, // Contador de falhas ao salvar log bruto
        erros: [],
      };

      const inicio = Date.now();

      // 8. Agrupar processos por TRT + grau para reutilizar sessão autenticada
      type GrupoChave = string; // Formato: "TRT{numero}_{grau}"
      const gruposProcessos = new Map<GrupoChave, typeof processos>();

      for (const processo of processos) {
        const chaveGrupo: GrupoChave = `${processo.trt}_${processo.grau}`;
        if (!gruposProcessos.has(chaveGrupo)) {
          gruposProcessos.set(chaveGrupo, []);
        }
        gruposProcessos.get(chaveGrupo)!.push(processo);
      }

      logger.info(
        { gruposCount: gruposProcessos.size },
        "Processos agrupados em grupos (por TRT + grau)"
      );

      // 9. Processar cada grupo (um login por grupo)
      for (const [chaveGrupo, processosDoGrupo] of gruposProcessos) {
        // Usar o primeiro processo do grupo para obter os dados de TRT e grau corretos
        // Isso evita erros de parse na string da chave (ex: split('_') em "primeiro_grau")
        const processoModelo = processosDoGrupo[0];

        logger.info(
          { chaveGrupo, processosCount: processosDoGrupo.length },
          "Processando grupo"
        );

        // Encontra credencial para este grupo usando os dados originais
        const credencial = credenciais.find(
          (c) =>
            c.tribunal === processoModelo.trt && c.grau === processoModelo.grau
        );

        if (!credencial) {
          logger.warn(
            { chaveGrupo, processosCount: processosDoGrupo.length },
            "Nenhuma credencial encontrada para grupo, pulando processos"
          );
          for (const proc of processosDoGrupo) {
            resultadoTotal.erros.push({
              processo_id: proc.id ?? 0,
              numero_processo: proc.numero_processo ?? "",
              erro: `Nenhuma credencial disponível para ${chaveGrupo}`,
            });
          }
          continue;
        }

        // Buscar configuração do tribunal
        const config = await getTribunalConfig(
          credencial.tribunal,
          credencial.grau
        );

        let browser: Browser | null = null;
        let page: Page | null = null;

        try {
          // ✅ AUTENTICAR UMA VEZ POR GRUPO
          logger.info({ chaveGrupo }, "Autenticando no grupo");
          const authResult = await autenticarPJE({
            credential: credencial.credenciais,
            config,
          });
          browser = authResult.browser;
          page = authResult.page;
          logger.info(
            { chaveGrupo, processosCount: processosDoGrupo.length },
            "Autenticado com sucesso! Processando processos com a mesma sessão"
          );

          // ✅ PROCESSAR TODOS OS PROCESSOS DO GRUPO COM A MESMA SESSÃO
          for (const processo of processosDoGrupo) {
            try {
              logger.info(
                { chaveGrupo, numeroProcesso: processo.numero_processo },
                "Processando processo"
              );

              if (CAPTURA_CONFIG.ENABLE_DISTRIBUTED_LOCK) {
                try {
                  await withDistributedLock(
                    `captura:processo:${processo.id}`,
                    async () => {
                      const resultado = await capturarPartesProcesso(
                        page!,
                        processo,
                        {
                          id: advogado.id,
                          documento: advogado.cpf,
                        }
                      );
                      // Agregar resultados
                      resultadoTotal.total_partes += resultado.totalPartes;
                      resultadoTotal.clientes += resultado.clientes;
                      resultadoTotal.partes_contrarias +=
                        resultado.partesContrarias;
                      resultadoTotal.terceiros += resultado.terceiros;
                      resultadoTotal.representantes += resultado.representantes;
                      resultadoTotal.vinculos += resultado.vinculos;

                      // Agregar erros
                      if (resultado.erros.length > 0) {
                        for (const erro of resultado.erros) {
                          resultadoTotal.erros.push({
                            processo_id: processo.id ?? 0,
                            numero_processo: processo.numero_processo ?? "",
                            erro: erro.erro,
                          });
                        }
                      }

                      // Salvar log bruto (Postgres) para auditoria/recovery
                      const result = await registrarCapturaRawLog({
                        tipo_captura: "partes",
                        advogado_id: advogado.id,
                        credencial_id: credencial.credentialId,
                        captura_log_id: capturaLog!.id,
                        trt: processo.trt as CodigoTRT,
                        grau: processo.grau as GrauTRT,
                        status:
                          resultado.erros.length === 0 ? "success" : "error",
                        requisicao: {
                          numero_processo: processo.numero_processo ?? "",
                          id_pje: processo.id_pje,
                          processo_id: processo.id ?? 0,
                        },
                        payload_bruto: resultado.payloadBruto,
                        resultado_processado: {
                          total_partes: resultado.totalPartes,
                          clientes: resultado.clientes,
                          partes_contrarias: resultado.partesContrarias,
                          terceiros: resultado.terceiros,
                          representantes: resultado.representantes,
                          vinculos: resultado.vinculos,
                        },
                        logs: resultado.erros.map((e) => ({
                          tipo: "erro" as const,
                          entidade: "acervo" as const,
                          erro: e.erro,
                          contexto: { processo_id: processo.id ?? 0 },
                        })),
                        erro:
                          resultado.erros.length > 0
                            ? resultado.erros[0].erro
                            : undefined,
                      });

                      if (result.success) {
                        resultadoTotal.raw_log_ids.push(result.rawLogId!);
                      } else {
                        logger.warn(
                          {
                            numeroProcesso: processo.numero_processo,
                            erro: result.erro,
                          },
                          "Falha ao salvar log bruto para processo"
                        );
                        resultadoTotal.raw_log_falhas++;
                      }

                      logger.info(
                        {
                          chaveGrupo,
                          numeroProcesso: processo.numero_processo,
                          totalPartes: resultado.totalPartes,
                        },
                        "Processo concluído"
                      );
                    },
                    { ttl: CAPTURA_CONFIG.LOCK_TTL_SECONDS }
                  );
                } catch (error) {
                  if (error instanceof LockError) {
                    logger.warn(
                      { processoId: processo.id },
                      "Captura já em andamento para este processo"
                    );
                    resultadoTotal.erros.push({
                      processo_id: processo.id ?? 0,
                      numero_processo: processo.numero_processo ?? "",
                      erro: "Captura já em andamento",
                    });
                    continue;
                  }
                  throw error;
                }
              } else {
                // Sem lock (para testes ou ambientes específicos)
                const resultado = await capturarPartesProcesso(page, processo, {
                  id: advogado.id,
                  documento: advogado.cpf,
                });
                // Agregar resultados
                resultadoTotal.total_partes += resultado.totalPartes;
                resultadoTotal.clientes += resultado.clientes;
                resultadoTotal.partes_contrarias += resultado.partesContrarias;
                resultadoTotal.terceiros += resultado.terceiros;
                resultadoTotal.representantes += resultado.representantes;
                resultadoTotal.vinculos += resultado.vinculos;

                // Agregar erros
                if (resultado.erros.length > 0) {
                  for (const erro of resultado.erros) {
                    resultadoTotal.erros.push({
                      processo_id: processo.id ?? 0,
                      numero_processo: processo.numero_processo ?? "",
                      erro: erro.erro,
                    });
                  }
                }

                // Salvar log bruto (Postgres) para auditoria/recovery
                const result = await registrarCapturaRawLog({
                  tipo_captura: "partes",
                  advogado_id: advogado.id,
                  credencial_id: credencial.credentialId,
                  captura_log_id: capturaLog?.id ?? 0,
                  trt: processo.trt as CodigoTRT,
                  grau: processo.grau as GrauTRT,
                  status: resultado.erros.length === 0 ? "success" : "error",
                  requisicao: {
                    numero_processo: processo.numero_processo ?? "",
                    id_pje: processo.id_pje,
                    processo_id: processo.id ?? 0,
                  },
                  payload_bruto: resultado.payloadBruto,
                  resultado_processado: {
                    total_partes: resultado.totalPartes,
                    clientes: resultado.clientes,
                    partes_contrarias: resultado.partesContrarias,
                    terceiros: resultado.terceiros,
                    representantes: resultado.representantes,
                    vinculos: resultado.vinculos,
                  },
                  logs: resultado.erros.map((e) => ({
                    tipo: "erro" as const,
                    entidade: "acervo" as const,
                    erro: e.erro,
                    contexto: { processo_id: processo.id ?? 0 },
                  })),
                  erro:
                    resultado.erros.length > 0
                      ? resultado.erros[0].erro
                      : undefined,
                });

                if (result.success) {
                  resultadoTotal.raw_log_ids.push(result.rawLogId!);
                } else {
                  logger.warn(
                    {
                      numeroProcesso: processo.numero_processo,
                      erro: result.erro,
                    },
                    "Falha ao salvar log bruto para processo"
                  );
                  resultadoTotal.raw_log_falhas++;
                }

                logger.info(
                  {
                    chaveGrupo,
                    numeroProcesso: processo.numero_processo,
                    totalPartes: resultado.totalPartes,
                  },
                  "Processo concluído"
                );
              }
            } catch (error) {
              logger.error(
                {
                  chaveGrupo,
                  numeroProcesso: processo.numero_processo,
                  error: error instanceof Error ? error.message : String(error),
                },
                "Erro ao processar processo"
              );

              const erroMensagem =
                error instanceof Error ? error.message : String(error);

              // Salvar log de erro bruto (Postgres)
              const result = await registrarCapturaRawLog({
                tipo_captura: "partes",
                advogado_id: advogado.id,
                credencial_id: credencial.credentialId,
                captura_log_id: capturaLog?.id ?? 0,
                trt: processo.trt as CodigoTRT,
                grau: processo.grau as GrauTRT,
                status: "error",
                requisicao: {
                  numero_processo: processo.numero_processo ?? "",
                  id_pje: processo.id_pje,
                  processo_id: processo.id ?? 0,
                },
                payload_bruto: null,
                resultado_processado: null,
                logs: [
                  {
                    tipo: "erro" as const,
                    entidade: "acervo" as const,
                    erro: erroMensagem,
                    contexto: { processo_id: processo.id ?? 0 },
                  },
                ],
                erro: erroMensagem,
              });

              if (result.success) {
                resultadoTotal.raw_log_ids.push(result.rawLogId!);
              } else {
                logger.warn(
                  {
                    numeroProcesso: processo.numero_processo,
                    erro: result.erro,
                  },
                  "Falha ao salvar log bruto para processo"
                );
                resultadoTotal.raw_log_falhas++;
              }

              resultadoTotal.erros.push({
                processo_id: processo.id ?? 0,
                numero_processo: processo.numero_processo ?? "",
                erro: erroMensagem,
              });
            }
          }
        } catch (error) {
          logger.error(
            {
              chaveGrupo,
              error: error instanceof Error ? error.message : String(error),
            },
            "Erro ao autenticar no grupo"
          );
          // Se falhar a autenticação, marca todos os processos do grupo com erro
          const erroMensagem =
            error instanceof Error ? error.message : String(error);
          for (const proc of processosDoGrupo) {
            // Logar erro de autenticação em log bruto (Postgres)
            const result = await registrarCapturaRawLog({
              tipo_captura: "partes",
              advogado_id: advogado.id,
              credencial_id: credencial.credentialId,
              captura_log_id: capturaLog?.id ?? 0,
              trt: proc.trt as CodigoTRT,
              grau: proc.grau as GrauTRT,
              status: "error",
              requisicao: {
                numero_processo: proc.numero_processo ?? "",
                id_pje: proc.id_pje,
                processo_id: proc.id ?? 0,
              },
              payload_bruto: null,
              resultado_processado: null,
              logs: [
                {
                  tipo: "erro" as const,
                  entidade: "auth" as const,
                  erro: erroMensagem,
                  contexto: { processo_id: proc.id },
                },
              ],
              erro: erroMensagem,
            });

            if (result.success) {
              resultadoTotal.raw_log_ids.push(result.rawLogId!);
            } else {
              logger.warn(
                { numeroProcesso: proc.numero_processo, erro: result.erro },
                "Falha ao salvar log bruto para processo"
              );
              resultadoTotal.raw_log_falhas++;
            }

            resultadoTotal.erros.push({
              processo_id: proc.id ?? 0,
              numero_processo: proc.numero_processo ?? "",
              erro: `Falha na autenticação: ${erroMensagem}`,
            });
          }
        } finally {
          // ✅ FECHAR BROWSER APENAS AO TERMINAR O GRUPO
          if (browser) {
            await browser.close();
            logger.info({ chaveGrupo }, "Browser fechado para grupo");
          }
        }
      }

      resultadoTotal.duracao_ms = Date.now() - inicio;
      resultadoTotal.erros_count = resultadoTotal.erros.length;

      // Validação de consistência
      let erroAppend = "";
      if (
        resultadoTotal.raw_log_ids.length !== resultadoTotal.total_processos
      ) {
        const warning = `Inconsistência: ${resultadoTotal.total_processos} processos processados mas ${resultadoTotal.raw_log_ids.length} logs brutos criados`;
        logger.warn({ warning }, "Inconsistência detectada");
        erroAppend = warning;
      }

      // 9. Finalizar log de captura no PostgreSQL
      const status =
        resultadoTotal.erros.length === 0
          ? "completed"
          : resultadoTotal.erros.length === resultadoTotal.total_processos
          ? "failed"
          : "completed";

      if (capturaLog) {
        await atualizarCapturaLog(capturaLog.id, {
          status,
          resultado: resultadoTotal as unknown as Record<string, unknown>,
          erro:
            resultadoTotal.erros.length > 0
              ? `${resultadoTotal.erros.length} erro(s) durante a captura${
                  erroAppend ? "; " + erroAppend : ""
                }`
              : erroAppend || undefined,
        });

        logger.info(
          { capturaLogId: capturaLog.id, status },
          "Log de captura atualizado"
        );
      }
      logger.info(
        {
          rawLogs: resultadoTotal.raw_log_ids.length,
          rawLogFalhas: resultadoTotal.raw_log_falhas,
        },
        "Logs brutos salvos"
      );

      const metricas = {
        total_processos: resultadoTotal.total_processos,
        duracao_total_ms: resultadoTotal.duracao_ms,
        duracao_media_por_processo_ms: Math.round(
          resultadoTotal.duracao_ms / resultadoTotal.total_processos
        ),
        taxa_sucesso:
          (
            ((resultadoTotal.total_processos - resultadoTotal.erros_count) /
              resultadoTotal.total_processos) *
            100
          ).toFixed(1) + "%",
      };

      logger.info(metricas, "Captura concluída");

      // Alerta se performance abaixo do esperado
      if (
        metricas.duracao_media_por_processo_ms >
        CAPTURA_CONFIG.PERFORMANCE_THRESHOLD_MS
      ) {
        logger.warn(
          { ...metricas, threshold: CAPTURA_CONFIG.PERFORMANCE_THRESHOLD_MS },
          "Performance abaixo do esperado"
        );
      }

      // 10. Retornar resultado
      return NextResponse.json({
        success: true,
        message: "Captura de partes concluída",
        data: resultadoTotal,
      });
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      logger.error(errorInfo, "Erro na captura");

      // Finalizar log com erro se foi iniciado
      try {
        if (capturaLog) {
          await atualizarCapturaLog(capturaLog.id, {
            status: "failed",
            erro: errorInfo.message,
          });
          logger.info(
            { capturaLogId: capturaLog.id },
            "Log de captura marcado como failed"
          );
        }
      } catch (logError) {
        logger.error(
          { error: extractErrorInfo(logError) },
          "Erro ao atualizar log de captura"
        );
      }

      return NextResponse.json(
        {
          error: errorInfo.message,
          code: errorInfo.code,
        },
        { status: 500 }
      );
    }
  });
}
