/**
 * Serviço de captura de audiências do TRT
 *
 * FLUXO OTIMIZADO (aproveita sessão autenticada):
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔐 FASE 1: AUTENTICAÇÃO                                        │
 * │  └── Login SSO PDPJ → OTP → JWT + Cookies                       │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📡 FASE 2: BUSCAR AUDIÊNCIAS                                   │
 * │  └── GET /pauta-usuarios-externos                               │
 * │  └── Retorno: audiências (cada uma com idProcesso)              │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📋 FASE 3: EXTRAIR PROCESSOS ÚNICOS                            │
 * │  └── Set(idProcesso) → processos únicos                         │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔄 FASE 4: DADOS COMPLEMENTARES (para cada processo)           │
 * │  ├── 📜 Timeline: GET /processos/id/{id}/timeline               │
 * │  └── 👥 Partes: GET /processos/id/{id}/partes                   │
 * │      └── (com delay de 300ms entre cada requisição)             │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  💾 FASE 5: PERSISTÊNCIA (ordem garante integridade referencial)│
 * │  ├── 📦 Processos: busca completa no painel PJe → salvarAcervo  │
 * │  ├── 📜 Timeline: upsert (timeline_jsonb no Supabase)           │
 * │  ├── 👥 Partes: upsert entidades + vínculos (com ID do acervo!) │
 * │  └── 🎤 Audiências: upsert (Supabase)                           │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🚪 FASE 6: FECHAR BROWSER                                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { todayDateString, addDays } from "@/lib/date-utils";
import { autenticarPJE, type AuthResult } from "./trt-auth.service";
import type { CapturaAudienciasParams } from "./trt-capture.service";
import { obterTodasAudiencias } from "@/features/captura/pje-trt";
import type { Audiencia, PagedResponse } from "../../types/types";
import {
  salvarAudiencias,
  type SalvarAudienciasResult,
} from "../persistence/audiencias-persistence.service";
import { obterTimeline } from "@/features/captura/pje-trt/timeline/obter-timeline";
import { obterDocumento } from "@/features/captura/pje-trt/timeline/obter-documento";
import { baixarDocumento } from "@/features/captura/pje-trt/timeline/baixar-documento";
import { uploadToBackblaze } from "@/lib/storage/backblaze-b2.service";
import {
  gerarNomeDocumentoAudiencia,
  gerarCaminhoDocumento,
} from "@/lib/storage/file-naming.utils";
import { buscarOuCriarAdvogadoPorCpf } from "../advogado-helper.service";
import {
  captureLogService,
  type LogEntry,
} from "../persistence/capture-log.service";
import {
  buscarDadosComplementaresProcessos,
  extrairProcessosUnicos,
} from "./dados-complementares.service";
import { buscarProcessosPorIdsNoPainel } from "./buscar-processos-painel.service";
import { salvarAcervoBatch } from "../persistence/acervo-persistence.service";
import { salvarTimeline } from "../timeline/timeline-persistence.service";
import { persistirPartesProcesso } from "../partes/partes-capture.service";
import type { TimelineItemEnriquecido } from "@/types/contracts/pje-trt";
import type { Processo } from "../../types/types";

/**
 * Resultado da captura de audiências
 */
export interface AudienciasResult {
  audiencias: Audiencia[];
  total: number;
  dataInicio: string;
  dataFim: string;
  persistencia?: SalvarAudienciasResult;
  paginasBrutas?: PagedResponse<Audiencia>[];
  logs?: LogEntry[];
  /** Novos campos para dados complementares */
  dadosComplementares?: {
    processosUnicos: number;
    processosPulados: number;
    timelinesCapturadas: number;
    partesCapturadas: number;
    erros: number;
  };
  /** Payloads brutos de partes por processo (para salvar como raw logs no Supabase) */
  payloadsBrutosPartes?: Array<{
    processoId: number;
    numeroProcesso?: string;
    payloadBruto: Record<string, unknown> | null;
  }>;
}

/**
 * Calcula data de hoje no formato YYYY-MM-DD
 */
function getDataHoje(): string {
  return todayDateString();
}

/**
 * Calcula data de hoje + 365 dias no formato YYYY-MM-DD
 */
function getDataUmAnoDepois(): string {
  return addDays(todayDateString(), 365);
}

/**
 * Valida formato de data (YYYY-MM-DD)
 */
function validarFormatoData(data: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(data)) {
    return false;
  }

  const date = new Date(data);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Serviço de captura de audiências (fluxo otimizado)
 *
 * Agora aproveita a sessão autenticada para:
 * 1. Buscar audiências
 * 2. Buscar timeline de cada processo
 * 3. Buscar partes de cada processo
 * 4. Persistir tudo
 */
export async function audienciasCapture(
  params: CapturaAudienciasParams,
): Promise<AudienciasResult> {
  let authResult: AuthResult | null = null;

  try {
    // ═══════════════════════════════════════════════════════════════
    // FASE 1: AUTENTICAÇÃO
    // ═══════════════════════════════════════════════════════════════
    console.log("🔐 [Audiências] Fase 1: Autenticando no PJE...");
    authResult = await autenticarPJE({
      credential: params.credential,
      config: params.config,
      headless: true,
    });

    const { page, advogadoInfo } = authResult;
    console.log(`✅ [Audiências] Autenticado como: ${advogadoInfo.nome}`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 2: BUSCAR AUDIÊNCIAS
    // ═══════════════════════════════════════════════════════════════
    console.log("📡 [Audiências] Fase 2: Buscando audiências...");

    // Calcular período de busca
    let dataInicio: string;
    let dataFim: string;

    if (params.dataInicio) {
      if (!validarFormatoData(params.dataInicio)) {
        throw new Error(
          `Formato de dataInicio inválido: ${params.dataInicio}. Use formato YYYY-MM-DD.`,
        );
      }
      dataInicio = params.dataInicio;
    } else {
      dataInicio = getDataHoje();
    }

    if (params.dataFim) {
      if (!validarFormatoData(params.dataFim)) {
        throw new Error(
          `Formato de dataFim inválido: ${params.dataFim}. Use formato YYYY-MM-DD.`,
        );
      }
      dataFim = params.dataFim;
    } else {
      dataFim = getDataUmAnoDepois();
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      throw new Error(
        `dataInicio (${dataInicio}) não pode ser posterior a dataFim (${dataFim}).`,
      );
    }

    const codigoSituacao = params.codigoSituacao || "M";
    console.log(
      `📅 [Audiências] Período: ${dataInicio} a ${dataFim} | Situação: ${codigoSituacao}`,
    );

    const { audiencias, paginas } = await obterTodasAudiencias(
      page,
      dataInicio,
      dataFim,
      codigoSituacao,
    );

    console.log(`✅ [Audiências] ${audiencias.length} audiências encontradas`);

    // Se não há audiências, retornar imediatamente
    if (audiencias.length === 0) {
      return {
        audiencias: [],
        total: 0,
        dataInicio,
        dataFim,
        paginasBrutas: paginas,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 3: EXTRAIR PROCESSOS ÚNICOS
    // ═══════════════════════════════════════════════════════════════
    console.log("📋 [Audiências] Fase 3: Extraindo processos únicos...");
    const processosIds = extrairProcessosUnicos(audiencias);
    console.log(
      `✅ [Audiências] ${processosIds.length} processos únicos identificados`,
    );

    // ═══════════════════════════════════════════════════════════════
    // FASE 4: BUSCAR DADOS COMPLEMENTARES
    // ═══════════════════════════════════════════════════════════════
    console.log(
      "🔄 [Audiências] Fase 4: Buscando dados complementares dos processos...",
    );

    const dadosComplementares = await buscarDadosComplementaresProcessos(
      page,
      processosIds,
      {
        buscarTimeline: true,
        buscarPartes: true,
        trt: params.config.codigo,
        grau: params.config.grau,
        delayEntreRequisicoes: 300,
        verificarRecaptura: true, // Pula processos atualizados recentemente
        horasParaRecaptura: 24, // Recaptura se > 24h desde última atualização
        onProgress: (atual, total, processoId) => {
          if (atual % 5 === 0 || atual === total) {
            console.log(
              `   📊 Progresso: ${atual}/${total} (processo ${processoId})`,
            );
          }
        },
      },
    );

    console.log(
      `✅ [Audiências] Dados complementares obtidos:`,
      dadosComplementares.resumo,
    );

    // ═══════════════════════════════════════════════════════════════
    // FASE 5: PERSISTÊNCIA
    // ═══════════════════════════════════════════════════════════════
    console.log("💾 [Audiências] Fase 5: Persistindo dados...");

    // 5.1 Buscar/criar advogado
    const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
      advogadoInfo.cpf,
      advogadoInfo.nome,
    );

    // 5.2 Buscar processos completos no painel + persistir no acervo
    // Segue o mesmo padrão da captura combinada: busca dados completos do PJe
    console.log("   📦 [5.2] Buscando processos no acervo e no painel PJe...");
    const mapeamentoIds = new Map<number, number>();
    const idAdvogado = parseInt(advogadoInfo.idAdvogado, 10);

    try {
      const supabase = (
        await import("@/lib/supabase/service-client")
      ).createServiceClient();

      // Buscar processos já existentes no acervo
      const { data: processosExistentes, error: errorBusca } = await supabase
        .from("acervo")
        .select("id, id_pje")
        .in("id_pje", processosIds)
        .eq("trt", params.config.codigo)
        .eq("grau", params.config.grau);

      if (errorBusca) {
        console.error(
          `   ❌ [5.2] Erro ao buscar processos no acervo:`,
          errorBusca,
        );
      }

      // Mapear processos existentes
      for (const proc of processosExistentes ?? []) {
        mapeamentoIds.set(proc.id_pje, proc.id);
      }

      // Identificar processos faltantes
      const processosFaltantes = processosIds.filter(
        (id) => !mapeamentoIds.has(id),
      );

      console.log(
        `   ✅ [5.2] ${mapeamentoIds.size}/${processosIds.length} processos encontrados no acervo`,
      );
      console.log(
        `   📋 [5.2] Processos faltantes: ${processosFaltantes.length}`,
      );

      // Buscar dados completos dos processos faltantes no painel PJe
      if (processosFaltantes.length > 0) {
        console.log(
          `   🔎 [5.2] Buscando ${processosFaltantes.length} processos completos no painel PJe...`,
        );

        const {
          processosPorOrigem,
          processosFaltantes: naoEncontradosNoPainel,
        } = await buscarProcessosPorIdsNoPainel(page, {
          idAdvogado,
          processosIds: processosFaltantes,
        });

        // Persistir processos arquivados com dados completos
        if (processosPorOrigem.arquivado.length > 0) {
          try {
            console.log(
              `   📦 [5.2] Persistindo ${processosPorOrigem.arquivado.length} processos arquivados...`,
            );
            const resultArquivados = await salvarAcervoBatch({
              processos: processosPorOrigem.arquivado,
              advogadoId: advogadoDb.id,
              origem: "arquivado",
              trt: params.config.codigo,
              grau: params.config.grau,
            });
            for (const [idPje, idAcervo] of resultArquivados.mapeamentoIds) {
              mapeamentoIds.set(idPje, idAcervo);
            }
          } catch (e) {
            console.error(
              "   ❌ [5.2] Erro ao salvar processos arquivados:",
              e,
            );
          }
        }

        // Persistir processos do acervo geral com dados completos
        if (processosPorOrigem.acervo_geral.length > 0) {
          try {
            console.log(
              `   📦 [5.2] Persistindo ${processosPorOrigem.acervo_geral.length} processos do acervo geral...`,
            );
            const resultAcervo = await salvarAcervoBatch({
              processos: processosPorOrigem.acervo_geral,
              advogadoId: advogadoDb.id,
              origem: "acervo_geral",
              trt: params.config.codigo,
              grau: params.config.grau,
            });
            for (const [idPje, idAcervo] of resultAcervo.mapeamentoIds) {
              mapeamentoIds.set(idPje, idAcervo);
            }
          } catch (e) {
            console.error(
              "   ❌ [5.2] Erro ao salvar processos do acervo geral:",
              e,
            );
          }
        }

        // Fallback: processos não encontrados em nenhum painel
        // Pode ser processo removido do PJe, ou falha de paginação.
        // Tenta buscar no acervo local (pode já existir de captura anterior)
        if (naoEncontradosNoPainel.length > 0) {
          console.warn(
            `   ⚠️ [5.2] ${naoEncontradosNoPainel.length} processos não encontrados no painel PJe. Verificando acervo local...`,
          );

          const { data: existentesLocal } = await supabase
            .from("acervo")
            .select("id, id_pje")
            .in("id_pje", naoEncontradosNoPainel)
            .eq("trt", params.config.codigo)
            .eq("grau", params.config.grau);

          for (const proc of existentesLocal ?? []) {
            mapeamentoIds.set(proc.id_pje, proc.id);
          }

          // Processos que realmente não existem em lugar nenhum: criar mínimos como último recurso
          const semNenhumRegistro = naoEncontradosNoPainel.filter(
            (id) => !mapeamentoIds.has(id),
          );

          if (semNenhumRegistro.length > 0) {
            console.warn(
              `   ⚠️ [5.2] Criando ${semNenhumRegistro.length} processos mínimos (último recurso)...`,
            );

            // Criar mapa de número do processo por ID
            const numeroProcessoPorId = new Map<number, string>();
            for (const audiencia of audiencias) {
              const id = audiencia.idProcesso ?? audiencia.processo?.id;
              const numero = audiencia.nrProcesso ?? audiencia.processo?.numero;
              if (id && numero && !numeroProcessoPorId.has(id)) {
                numeroProcessoPorId.set(id, numero);
              }
            }

            const processosMinimos: Processo[] = semNenhumRegistro.map(
              (idPje) => {
                const numeroProcesso = (
                  numeroProcessoPorId.get(idPje) || ""
                ).trim();
                const numero =
                  parseInt(numeroProcesso.split("-")[0] ?? "", 10) || 0;

                return {
                  id: idPje,
                  descricaoOrgaoJulgador: "",
                  classeJudicial: "Não informada",
                  numero,
                  numeroProcesso,
                  segredoDeJustica: false,
                  codigoStatusProcesso: "",
                  prioridadeProcessual: 0,
                  nomeParteAutora: "",
                  qtdeParteAutora: 1,
                  nomeParteRe: "",
                  qtdeParteRe: 1,
                  dataAutuacao: new Date().toISOString(),
                  juizoDigital: false,
                  dataProximaAudiencia: null,
                  temAssociacao: false,
                };
              },
            );

            try {
              const resultMinimos = await salvarAcervoBatch({
                processos: processosMinimos,
                advogadoId: advogadoDb.id,
                origem: "acervo_geral",
                trt: params.config.codigo,
                grau: params.config.grau,
              });
              for (const [idPje, idAcervo] of resultMinimos.mapeamentoIds) {
                mapeamentoIds.set(idPje, idAcervo);
              }
            } catch (e) {
              console.error(
                "   ❌ [5.2] Erro ao inserir processos mínimos:",
                e,
              );
            }
          }
        }
      }

      // Verificação final
      const processosSemMapeamento = processosIds.filter(
        (id) => !mapeamentoIds.has(id),
      );
      if (processosSemMapeamento.length > 0) {
        console.warn(
          `   ⚠️ [5.2] ${processosSemMapeamento.length} processos ainda sem mapeamento após todas as tentativas:`,
          processosSemMapeamento,
        );
      } else {
        console.log(
          `   ✅ [5.2] Todos os ${processosIds.length} processos mapeados com sucesso`,
        );
      }
    } catch (e) {
      console.error(`   ❌ [5.2] Exceção ao processar processos:`, e);
      console.error(`   ❌ [5.2] Stack:`, e instanceof Error ? e.stack : "N/A");
    }

    // 5.3 Persistir timelines no PostgreSQL
    console.log("   📜 Persistindo timelines no PostgreSQL...");
    let timelinesPersistidas = 0;
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (
        dados.timeline &&
        Array.isArray(dados.timeline) &&
        dados.timeline.length > 0
      ) {
        try {
          await salvarTimeline({
            processoId: String(processoId),
            trtCodigo: params.config.codigo,
            grau: params.config.grau,
            timeline: dados.timeline as TimelineItemEnriquecido[],
            advogadoId: advogadoDb.id,
          });
          timelinesPersistidas++;
        } catch (e) {
          console.warn(
            `   ⚠️ Erro ao persistir timeline do processo ${processoId}:`,
            e,
          );
          captureLogService.logErro(
            "timeline",
            e instanceof Error ? e.message : String(e),
            {
              processoId,
              trt: params.config.codigo,
              grau: params.config.grau,
            },
          );
        }
      }
    }
    console.log(
      `   ✅ ${timelinesPersistidas} timelines persistidas no PostgreSQL`,
    );

    // 5.4 Persistir partes (usa dados já buscados, sem refetch da API)
    console.log("   👥 Persistindo partes...");
    let partesPersistidas = 0;
    let partesComVinculo = 0;
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.partes && dados.partes.length > 0) {
        try {
          // Buscar ID do processo no acervo (persistido no passo 5.2)
          const idAcervo = mapeamentoIds.get(processoId);

          // Buscar número do processo da audiência
          const audienciaDoProcesso = audiencias.find(
            (a) => a.idProcesso === processoId,
          );
          const numeroProcesso =
            audienciaDoProcesso?.nrProcesso ||
            audienciaDoProcesso?.processo?.numero;

          // Usa persistirPartesProcesso em vez de capturarPartesProcesso
          // para evitar refetch da API (partes já foram buscadas em dados-complementares)
          await persistirPartesProcesso(
            dados.partes,
            {
              id_pje: processoId,
              trt: params.config.codigo,
              grau:
                params.config.grau === "primeiro_grau"
                  ? "primeiro_grau"
                  : "segundo_grau",
              id: idAcervo, // ID do acervo para criar vínculo!
              numero_processo: numeroProcesso,
            },
            {
              id: parseInt(advogadoInfo.idAdvogado, 10),
              documento: advogadoInfo.cpf,
              nome: advogadoInfo.nome,
            },
          );
          partesPersistidas++;
          if (idAcervo) partesComVinculo++;
        } catch (e) {
          console.warn(
            `   ⚠️ Erro ao persistir partes do processo ${processoId}:`,
            e,
          );
          captureLogService.logErro(
            "partes",
            e instanceof Error ? e.message : String(e),
            {
              processoId,
              trt: params.config.codigo,
              grau: params.config.grau,
            },
          );
        }
      }
    }
    console.log(
      `   ✅ ${partesPersistidas} processos com partes persistidas (${partesComVinculo} com vínculo)`,
    );

    // 5.5 Processar atas para audiências realizadas
    const atasMap: Record<number, { documentoId: number; url: string }> = {};
    if (codigoSituacao === "F") {
      console.log("   📄 Buscando atas de audiências realizadas...");
      for (const a of audiencias) {
        try {
          // Usar timeline já capturada se disponível
          const dadosProcesso = dadosComplementares.porProcesso.get(
            a.idProcesso,
          );
          const timeline =
            dadosProcesso?.timeline ||
            (await obterTimeline(page, String(a.idProcesso), {
              somenteDocumentosAssinados: true,
              buscarDocumentos: true,
              buscarMovimentos: false,
            }));

          const candidato = timeline.find(
            (d) =>
              d.documento &&
              ((d.tipo || "").toLowerCase().includes("ata") ||
                (d.titulo || "").toLowerCase().includes("ata")),
          );

          if (candidato && candidato.id) {
            const documentoId = candidato.id;
            const docDetalhes = await obterDocumento(
              page,
              String(a.idProcesso),
              String(documentoId),
              {
                incluirAssinatura: true,
                grau: 1,
              },
            );
            const pdf = await baixarDocumento(
              page,
              String(a.idProcesso),
              String(documentoId),
              {
                incluirCapa: false,
                incluirAssinatura: true,
                grau: 1,
              },
            );
            const nomeArquivo = gerarNomeDocumentoAudiencia(a.id);
            const key = gerarCaminhoDocumento(
              a.nrProcesso || a.processo?.numero || "",
              "audiencias",
              nomeArquivo,
            );
            const upload = await uploadToBackblaze({
              buffer: pdf,
              key,
              contentType: "application/pdf",
            });
            atasMap[a.id] = { documentoId: docDetalhes.id, url: upload.url };
          }
        } catch (e) {
          captureLogService.logErro(
            "audiencias",
            e instanceof Error ? e.message : String(e),
            {
              id_pje: a.id,
              numero_processo: a.nrProcesso || a.processo?.numero,
              trt: params.config.codigo,
              grau: params.config.grau,
              tipo: "ata",
            },
          );
        }
      }
    }

    // 5.6 Persistir audiências
    console.log("   🎤 Persistindo audiências...");
    console.log(
      `   📊 Mapeamento disponível: ${mapeamentoIds.size} processos mapeados para ${audiencias.length} audiências`,
    );
    let persistencia: SalvarAudienciasResult | undefined;
    let logsPersistencia: LogEntry[] | undefined;

    try {
      persistencia = await salvarAudiencias({
        audiencias,
        advogadoId: advogadoDb.id,
        trt: params.config.codigo,
        grau: params.config.grau,
        atas: atasMap,
        mapeamentoIds, // Usa mapeamento pré-calculado para evitar lookups redundantes
      });

      console.log(`   ✅ Audiências persistidas:`, {
        inseridos: persistencia.inseridos,
        atualizados: persistencia.atualizados,
        naoAtualizados: persistencia.naoAtualizados,
        pulados: persistencia.pulados,
        erros: persistencia.erros,
      });
    } catch (error) {
      console.error("❌ [Audiências] Erro ao salvar audiências:", error);
    } finally {
      captureLogService.imprimirResumo();
      logsPersistencia = captureLogService.consumirLogs();
    }

    // ═══════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log("🏁 [Audiências] Captura concluída!");
    console.log(`   📊 Resumo:`);
    console.log(`      - Audiências: ${audiencias.length}`);
    console.log(`      - Processos únicos: ${processosIds.length}`);
    console.log(
      `      - Processos pulados: ${dadosComplementares.resumo.processosPulados}`,
    );
    console.log(
      `      - Timelines: ${dadosComplementares.resumo.timelinesObtidas}`,
    );
    console.log(`      - Partes: ${dadosComplementares.resumo.partesObtidas}`);
    console.log(`      - Erros: ${dadosComplementares.resumo.erros}`);

    // Coletar payloads brutos de partes para salvar como raw logs no Supabase
    const payloadsBrutosPartes: Array<{
      processoId: number;
      numeroProcesso?: string;
      payloadBruto: Record<string, unknown> | null;
    }> = [];
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.payloadBrutoPartes !== undefined) {
        // Buscar número do processo da audiência correspondente
        const audienciaDoProcesso = audiencias.find(
          (a) => a.idProcesso === processoId,
        );
        const numeroProcesso =
          audienciaDoProcesso?.nrProcesso ||
          audienciaDoProcesso?.processo?.numero;
        payloadsBrutosPartes.push({
          processoId,
          numeroProcesso,
          payloadBruto: dados.payloadBrutoPartes,
        });
      }
    }
    console.log(
      `   📦 Payloads de partes coletados: ${payloadsBrutosPartes.length}`,
    );

    return {
      audiencias,
      total: audiencias.length,
      dataInicio,
      dataFim,
      persistencia,
      paginasBrutas: paginas,
      logs: logsPersistencia,
      dadosComplementares: {
        processosUnicos: processosIds.length,
        processosPulados: dadosComplementares.resumo.processosPulados,
        timelinesCapturadas: dadosComplementares.resumo.timelinesObtidas,
        partesCapturadas: dadosComplementares.resumo.partesObtidas,
        erros: dadosComplementares.resumo.erros,
      },
      payloadsBrutosPartes,
    };
  } finally {
    // ═══════════════════════════════════════════════════════════════
    // FASE 6: FECHAR BROWSER
    // ═══════════════════════════════════════════════════════════════
    if (authResult?.browser) {
      console.log("🚪 [Audiências] Fechando browser...");
      await authResult.browser.close();
    }
  }
}
