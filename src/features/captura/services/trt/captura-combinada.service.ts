/**
 * Serviço de Captura Combinada do TRT
 *
 * PROPÓSITO:
 * Executa múltiplas capturas em uma única sessão autenticada, otimizando
 * o uso da conexão e reduzindo o tempo total de execução.
 *
 * FLUXO OTIMIZADO:
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔐 FASE 1: AUTENTICAÇÃO                                        │
 * │  └── Login SSO PDPJ → OTP → JWT + Cookies (sessão mantida!)    │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📡 FASE 2: CAPTURAS MÚLTIPLAS (mesma sessão!)                  │
 * │  ├── 🎤 Audiências Designadas (hoje → +1 ano)                   │
 * │  ├── 🎤 Audiências Realizadas (ontem)                           │
 * │  ├── 🎤 Audiências Canceladas (hoje → +1 ano)                   │
 * │  ├── 📋 Expedientes No Prazo                                    │
 * │  ├── 📋 Expedientes Sem Prazo                                   │
 * │  └── 🔬 Perícias (todas as situações, apenas 1º grau)           │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📊 FASE 3: CONSOLIDAR PROCESSOS ÚNICOS                         │
 * │  └── Extrai IDs únicos de todas as listas capturadas            │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔄 FASE 4: DADOS COMPLEMENTARES (todos os processos)           │
 * │  ├── 🔍 Verificação de recaptura (pula se atualizado < 24h)     │
 * │  ├── 📜 Timeline: GET /processos/id/{id}/timeline               │
 * │  └── 👥 Partes: GET /processos/id/{id}/partes                   │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  💾 FASE 5: PERSISTÊNCIA CONSOLIDADA                            │
 * │  ├── 📜 Timeline (timeline_jsonb no Supabase)                   │
 * │  ├── 👥 Partes (PostgreSQL)                                     │
 * │  ├── 🎤 Audiências (PostgreSQL)                                 │
 * │  └── 📋 Expedientes (PostgreSQL)                                │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🚪 FASE 6: FECHAR BROWSER                                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { autenticarComRetry, type AuthResult } from "./trt-auth.service";
import type { CapturaCombinAdaParams } from "./trt-capture.service";
import { obterTodasAudiencias } from "@/features/captura/pje-trt";
import { obterTodosProcessosPendentesManifestacao } from "@/features/captura/pje-trt";
import { obterPericias } from "@/features/captura/pje-trt";
import { buscarProcessosPorIdsNoPainel } from "./buscar-processos-painel.service";
import type { Pericia } from "@/features/captura/types/pericias-types";
import {
  salvarAudiencias,
  type SalvarAudienciasResult,
} from "../persistence/audiencias-persistence.service";
import {
  salvarPendentes,
  type SalvarPendentesResult,
  type ProcessoPendente,
} from "../persistence/pendentes-persistence.service";
import {
  salvarPericias,
  type SalvarPericiasResult,
} from "../persistence/pericias-persistence.service";
import { salvarAcervoBatch } from "../persistence/acervo-persistence.service";
import { buscarOuCriarAdvogadoPorCpf } from "../advogado-helper.service";
import {
  captureLogService,
  type LogEntry,
} from "../persistence/capture-log.service";
import { buscarDadosComplementaresProcessos } from "./dados-complementares.service";
import { salvarTimeline } from "../timeline/timeline-persistence.service";
import { persistirPartesProcesso } from "../partes/partes-capture.service";
import type { TimelineItemEnriquecido } from "@/types/contracts/pje-trt";
import { createServiceClient } from "@/lib/supabase/service-client";
import type { Processo } from "../../types/types";

/**
 * Resultado de uma captura individual (audiências ou pendentes)
 */
interface ResultadoCapturaIndividual {
  tipo:
    | "audiencias_designadas"
    | "audiencias_realizadas"
    | "audiencias_canceladas"
    | "expedientes_no_prazo"
    | "expedientes_sem_prazo"
    | "pericias";
  total: number;
  processos: Array<{
    idProcesso?: number;
    id?: number;
    numeroProcesso?: string;
  }>;
  dados?: unknown;
}

function mapNumeroProcessoPorId(
  capturas: ResultadoCapturaIndividual[],
): Map<number, string> {
  const map = new Map<number, string>();
  for (const captura of capturas) {
    for (const p of captura.processos) {
      const id = p.idProcesso ?? p.id;
      if (!id) continue;
      const numero = p.numeroProcesso;
      if (!numero) continue;
      if (!map.has(id)) {
        map.set(id, numero);
      }
    }
  }
  return map;
}

/**
 * Resultado da captura combinada
 */
export interface CapturaCombinAdaResult {
  /** Resultados individuais de cada captura */
  capturas: ResultadoCapturaIndividual[];

  /** Resumo geral */
  resumo: {
    totalAudienciasDesignadas: number;
    totalAudienciasRealizadas: number;
    totalAudienaciasCanceladas: number;
    totalExpedientesNoPrazo: number;
    totalExpedientesSemPrazo: number;
    totalPericias: number;
    totalProcessosUnicos: number;
    totalProcessosPulados: number;
  };

  /** Dados complementares capturados */
  dadosComplementares: {
    processosUnicos: number;
    processosPulados: number;
    timelinesCapturadas: number;
    partesCapturadas: number;
    erros: number;
  };

  /** Persistência */
  persistenciaAudiencias?: SalvarAudienciasResult;
  persistenciaExpedientes?: SalvarPendentesResult;
  persistenciaPericias?: SalvarPericiasResult;

  /** Payloads brutos de partes (raw logs no Supabase) */
  payloadsBrutosPartes?: Array<{
    processoId: number;
    numeroProcesso?: string;
    payloadBruto: Record<string, unknown> | null;
  }>;

  /** Logs */
  logs?: LogEntry[];

  /** Duração total */
  duracaoMs: number;
}

/**
 * Calcula data de hoje no formato YYYY-MM-DD
 */
function getDataHoje(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calcula data de ontem no formato YYYY-MM-DD
 */
function getDataOntem(): string {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  return ontem.toISOString().split("T")[0];
}

/**
 * Calcula data de hoje + 365 dias no formato YYYY-MM-DD
 */
function getDataUmAnoDepois(): string {
  const hoje = new Date();
  const umAnoDepois = new Date(hoje);
  umAnoDepois.setFullYear(hoje.getFullYear() + 1);
  return umAnoDepois.toISOString().split("T")[0];
}

/**
 * Extrai IDs únicos de processos de múltiplas listas
 */
function extrairProcessosUnicosDeTodas(
  listas: ResultadoCapturaIndividual[],
): number[] {
  const idsSet = new Set<number>();

  for (const lista of listas) {
    for (const processo of lista.processos) {
      const id = processo.idProcesso ?? processo.id;
      if (id) {
        idsSet.add(id);
      }
    }
  }

  const idsUnicos = Array.from(idsSet);
  console.log(
    `📋 [CapturaCombinada] ${idsUnicos.length} processos únicos extraídos de ${listas.reduce((acc, l) => acc + l.total, 0)} registros totais`,
  );
  return idsUnicos;
}

/**
 * Serviço de captura combinada
 *
 * Executa múltiplas capturas em uma única sessão:
 * 1. Audiências Designadas (hoje → +1 ano)
 * 2. Audiências Realizadas (ontem)
 * 3. Audiências Canceladas (hoje → +1 ano)
 * 4. Expedientes No Prazo
 * 5. Expedientes Sem Prazo
 * 6. Timeline + Partes de todos os processos únicos
 */
export async function capturaCombinada(
  params: CapturaCombinAdaParams,
): Promise<CapturaCombinAdaResult> {
  const inicio = performance.now();
  let authResult: AuthResult | null = null;

  const resultado: CapturaCombinAdaResult = {
    capturas: [],
    resumo: {
      totalAudienciasDesignadas: 0,
      totalAudienciasRealizadas: 0,
      totalAudienaciasCanceladas: 0,
      totalExpedientesNoPrazo: 0,
      totalExpedientesSemPrazo: 0,
      totalPericias: 0,
      totalProcessosUnicos: 0,
      totalProcessosPulados: 0,
    },
    dadosComplementares: {
      processosUnicos: 0,
      processosPulados: 0,
      timelinesCapturadas: 0,
      partesCapturadas: 0,
      erros: 0,
    },
    duracaoMs: 0,
  };

  try {
    // ═══════════════════════════════════════════════════════════════
    // FASE 1: AUTENTICAÇÃO
    // ═══════════════════════════════════════════════════════════════
    console.log("🔐 [CapturaCombinada] Fase 1: Autenticando no PJE...");
    authResult = await autenticarComRetry({
      credential: params.credential,
      config: params.config,
      headless: true,
    });

    const { page, advogadoInfo } = authResult;
    console.log(`✅ [CapturaCombinada] Autenticado como: ${advogadoInfo.nome}`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 2: CAPTURAS MÚLTIPLAS (mesma sessão!)
    // ═══════════════════════════════════════════════════════════════
    console.log(
      "📡 [CapturaCombinada] Fase 2: Executando capturas múltiplas...",
    );

    const hoje = getDataHoje();
    const ontem = getDataOntem();
    const umAnoDepois = getDataUmAnoDepois();

    // 2.1 Audiências Designadas (M) - hoje → +1 ano
    console.log(
      `   🎤 Capturando Audiências Designadas (${hoje} → ${umAnoDepois})...`,
    );
    const { audiencias: audienciasDesignadas, paginas: paginasDesignadas } =
      await obterTodasAudiencias(
        page,
        hoje,
        umAnoDepois,
        "M", // Designada/Marcada
      );
    console.log(
      `   ✅ ${audienciasDesignadas.length} audiências designadas encontradas`,
    );

    resultado.capturas.push({
      tipo: "audiencias_designadas",
      total: audienciasDesignadas.length,
      processos: audienciasDesignadas.map((a) => ({
        idProcesso: a.idProcesso,
        numeroProcesso: a.nrProcesso || a.processo?.numero,
      })),
      dados: { audiencias: audienciasDesignadas, paginas: paginasDesignadas },
    });
    resultado.resumo.totalAudienciasDesignadas = audienciasDesignadas.length;

    // 2.2 Audiências Realizadas (F) - ontem
    console.log(`   🎤 Capturando Audiências Realizadas (${ontem})...`);
    const { audiencias: audienciasRealizadas, paginas: paginasRealizadas } =
      await obterTodasAudiencias(
        page,
        ontem,
        ontem,
        "F", // Finalizada/Realizada
      );
    console.log(
      `   ✅ ${audienciasRealizadas.length} audiências realizadas encontradas`,
    );

    resultado.capturas.push({
      tipo: "audiencias_realizadas",
      total: audienciasRealizadas.length,
      processos: audienciasRealizadas.map((a) => ({
        idProcesso: a.idProcesso,
        numeroProcesso: a.nrProcesso || a.processo?.numero,
      })),
      dados: { audiencias: audienciasRealizadas, paginas: paginasRealizadas },
    });
    resultado.resumo.totalAudienciasRealizadas = audienciasRealizadas.length;

    // 2.3 Audiências Canceladas (C) - hoje → +1 ano
    console.log(
      `   🎤 Capturando Audiências Canceladas (${hoje} → ${umAnoDepois})...`,
    );
    const { audiencias: audienciasCanceladas, paginas: paginasCanceladas } =
      await obterTodasAudiencias(
        page,
        hoje,
        umAnoDepois,
        "C", // Cancelada
      );
    console.log(
      `   ✅ ${audienciasCanceladas.length} audiências canceladas encontradas`,
    );

    resultado.capturas.push({
      tipo: "audiencias_canceladas",
      total: audienciasCanceladas.length,
      processos: audienciasCanceladas.map((a) => ({
        idProcesso: a.idProcesso,
        numeroProcesso: a.nrProcesso || a.processo?.numero,
      })),
      dados: { audiencias: audienciasCanceladas, paginas: paginasCanceladas },
    });
    resultado.resumo.totalAudienaciasCanceladas = audienciasCanceladas.length;

    // 2.4 Expedientes No Prazo (N)
    console.log(`   📋 Capturando Expedientes No Prazo...`);
    const idAdvogado = parseInt(advogadoInfo.idAdvogado, 10);
    const expedientesNoPrazo = await obterTodosProcessosPendentesManifestacao(
      page,
      idAdvogado,
      500,
      {
        agrupadorExpediente: "N", // No prazo
        tipoPainelAdvogado: 2,
        idPainelAdvogadoEnum: 2,
        ordenacaoCrescente: false,
      },
    );
    console.log(
      `   ✅ ${expedientesNoPrazo.length} expedientes no prazo encontrados`,
    );

    resultado.capturas.push({
      tipo: "expedientes_no_prazo",
      total: expedientesNoPrazo.length,
      processos: expedientesNoPrazo.map((e) => ({
        id: e.id,
        numeroProcesso: e.numeroProcesso,
      })),
      dados: { processos: expedientesNoPrazo },
    });
    resultado.resumo.totalExpedientesNoPrazo = expedientesNoPrazo.length;

    // 2.5 Expedientes Sem Prazo (I)
    console.log(`   📋 Capturando Expedientes Sem Prazo...`);
    const expedientesSemPrazo = await obterTodosProcessosPendentesManifestacao(
      page,
      idAdvogado,
      500,
      {
        agrupadorExpediente: "I", // Sem prazo (Indefinido)
        tipoPainelAdvogado: 2,
        idPainelAdvogadoEnum: 2,
        ordenacaoCrescente: false,
      },
    );
    console.log(
      `   ✅ ${expedientesSemPrazo.length} expedientes sem prazo encontrados`,
    );

    resultado.capturas.push({
      tipo: "expedientes_sem_prazo",
      total: expedientesSemPrazo.length,
      processos: expedientesSemPrazo.map((e) => ({
        id: e.id,
        numeroProcesso: e.numeroProcesso,
      })),
      dados: { processos: expedientesSemPrazo },
    });
    resultado.resumo.totalExpedientesSemPrazo = expedientesSemPrazo.length;

    // 2.6 Perícias (todas as situações) - APENAS PRIMEIRO GRAU
    if (params.config.grau !== "primeiro_grau") {
      throw new Error("Perícias disponíveis apenas para primeiro grau");
    }

    console.log(`   🔬 Capturando Perícias (todas as situações)...`);
    const pericias = await obterPericias(page, 500);
    console.log(`   ✅ ${pericias.length} perícias encontradas`);

    resultado.capturas.push({
      tipo: "pericias",
      total: pericias.length,
      processos: pericias.map((p) => ({
        idProcesso: p.idProcesso,
        numeroProcesso: p.numeroProcesso,
      })),
      dados: { pericias },
    });
    resultado.resumo.totalPericias = pericias.length;

    // ═══════════════════════════════════════════════════════════════
    // FASE 3: CONSOLIDAR PROCESSOS ÚNICOS
    // ═══════════════════════════════════════════════════════════════
    console.log(
      "📊 [CapturaCombinada] Fase 3: Consolidando processos únicos...",
    );
    const processosIds = extrairProcessosUnicosDeTodas(resultado.capturas);
    resultado.resumo.totalProcessosUnicos = processosIds.length;

    if (processosIds.length === 0) {
      console.log("ℹ️ [CapturaCombinada] Nenhum processo para atualizar");
      resultado.duracaoMs = performance.now() - inicio;
      return resultado;
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 4: DADOS COMPLEMENTARES (timeline + partes)
    // ═══════════════════════════════════════════════════════════════
    console.log(
      "🔄 [CapturaCombinada] Fase 4: Buscando dados complementares...",
    );

    const dadosComplementares = await buscarDadosComplementaresProcessos(
      page,
      processosIds,
      {
        buscarTimeline: true,
        buscarPartes: true,
        trt: params.config.codigo,
        grau: params.config.grau,
        verificarRecaptura: true, // Pula processos atualizados recentemente
        horasParaRecaptura: 24, // Recaptura se > 24h desde última atualização
        delayEntreRequisicoes: 300,
        onProgress: (atual, total, processoId) => {
          if (atual % 10 === 0 || atual === 1 || atual === total) {
            console.log(
              `   📊 Progresso: ${atual}/${total} (processo ${processoId})`,
            );
          }
        },
      },
    );

    console.log(
      `✅ [CapturaCombinada] Dados complementares obtidos:`,
      dadosComplementares.resumo,
    );
    resultado.dadosComplementares = {
      processosUnicos: processosIds.length,
      processosPulados: dadosComplementares.resumo.processosPulados,
      timelinesCapturadas: 0, // Será preenchido na persistência
      partesCapturadas: 0, // Será preenchido na persistência
      erros: dadosComplementares.resumo.erros,
    };
    resultado.resumo.totalProcessosPulados =
      dadosComplementares.resumo.processosPulados;

    // ═══════════════════════════════════════════════════════════════
    // FASE 5: PERSISTÊNCIA CONSOLIDADA
    // ═══════════════════════════════════════════════════════════════
    console.log("💾 [CapturaCombinada] Fase 5: Persistindo dados...");

    // 5.1 Buscar/criar advogado
    const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
      advogadoInfo.cpf,
      advogadoInfo.nome,
    );

    // 5.2 Persistir processos no acervo (PRIMEIRO; respeita origem)
    console.log(
      "   📦 Persistindo processos no acervo (respeitando origem)...",
    );
    const numeroProcessoPorId = mapNumeroProcessoPorId(resultado.capturas);

    const { processosPorOrigem, processosFaltantes } =
      await buscarProcessosPorIdsNoPainel(page, {
        idAdvogado: parseInt(advogadoInfo.idAdvogado, 10),
        processosIds,
        delayEntrePaginas: 300,
      });

    const mapeamentoIds = new Map<number, number>();

    if (processosPorOrigem.arquivado.length > 0) {
      try {
        const persistenciaArquivados = await salvarAcervoBatch({
          processos: processosPorOrigem.arquivado,
          advogadoId: advogadoDb.id,
          origem: "arquivado",
          trt: params.config.codigo,
          grau: params.config.grau,
        });
        for (const [idPje, idAcervo] of persistenciaArquivados.mapeamentoIds) {
          mapeamentoIds.set(idPje, idAcervo);
        }
      } catch (e) {
        console.error(
          "   ❌ [CapturaCombinada] Erro ao salvar processos arquivados no acervo:",
          e,
        );
      }
    }

    if (processosPorOrigem.acervo_geral.length > 0) {
      try {
        const persistenciaAcervo = await salvarAcervoBatch({
          processos: processosPorOrigem.acervo_geral,
          advogadoId: advogadoDb.id,
          origem: "acervo_geral",
          trt: params.config.codigo,
          grau: params.config.grau,
        });
        for (const [idPje, idAcervo] of persistenciaAcervo.mapeamentoIds) {
          mapeamentoIds.set(idPje, idAcervo);
        }
      } catch (e) {
        console.error(
          "   ❌ [CapturaCombinada] Erro ao salvar processos do acervo geral:",
          e,
        );
      }
    }

    // Fallback: inserir processos mínimos para IDs não encontrados no painel, sem sobrescrever existentes
    if (processosFaltantes.length > 0) {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("acervo")
        .select("id,id_pje")
        .in("id_pje", processosFaltantes)
        .eq("trt", params.config.codigo)
        .eq("grau", params.config.grau);

      if (error) {
        console.warn(
          `⚠️ [CapturaCombinada] Erro ao verificar processos faltantes no acervo: ${error.message}`,
        );
      }

      const existentes = new Map<number, number>();
      for (const row of (data ?? []) as Array<{ id: number; id_pje: number }>) {
        existentes.set(row.id_pje, row.id);
      }

      for (const [idPje, idAcervo] of existentes) {
        mapeamentoIds.set(idPje, idAcervo);
      }

      const paraInserir = processosFaltantes.filter(
        (id) => !existentes.has(id),
      );
      if (paraInserir.length > 0) {
        console.warn(
          `⚠️ [CapturaCombinada] Inserindo ${paraInserir.length} processos mínimos no acervo (não encontrados no painel).`,
        );

        const processosMinimos: Processo[] = paraInserir.map((idPje) => {
          const numeroProcesso = (numeroProcessoPorId.get(idPje) || "").trim();
          const numeroParsed = parseInt(numeroProcesso.split("-")[0] ?? "", 10);
          const numero = Number.isNaN(numeroParsed) ? 0 : numeroParsed;
          if (Number.isNaN(numeroParsed)) {
            console.warn(
              `   ⚠️ [CapturaCombinada] Processo PJE ID ${idPje}: não foi possível extrair número de "${numeroProcesso}", usando 0`,
            );
          }

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
        });

        try {
          const persistenciaMinimos = await salvarAcervoBatch({
            processos: processosMinimos,
            advogadoId: advogadoDb.id,
            origem: "acervo_geral",
            trt: params.config.codigo,
            grau: params.config.grau,
          });
          for (const [idPje, idAcervo] of persistenciaMinimos.mapeamentoIds) {
            mapeamentoIds.set(idPje, idAcervo);
          }
        } catch (e) {
          console.error(
            "   ❌ [CapturaCombinada] Erro ao inserir processos mínimos no acervo:",
            e,
          );
        }
      }
    }

    console.log(
      `   ✅ Mapeamento acervo: ${mapeamentoIds.size}/${processosIds.length} processos com id disponível`,
    );

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
    resultado.dadosComplementares.timelinesCapturadas = timelinesPersistidas;

    // 5.4 Persistir partes
    console.log("   👥 Persistindo partes...");
    let partesPersistidas = 0;
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.partes && dados.partes.length > 0) {
        try {
          const idAcervo = mapeamentoIds.get(processoId);
          if (!idAcervo) {
            console.warn(
              `   ⚠️ Processo ${processoId} sem acervo_id no mapeamento, pulando persistência de partes`,
            );
            continue;
          }

          // Buscar número do processo de qualquer uma das listas
          let numeroProcesso: string | undefined;
          for (const captura of resultado.capturas) {
            const proc = captura.processos.find(
              (p) => (p.idProcesso ?? p.id) === processoId,
            );
            if (proc?.numeroProcesso) {
              numeroProcesso = proc.numeroProcesso;
              break;
            }
          }

          // Validar que o código do tribunal está presente
          if (!params.config.codigo) {
            console.warn(
              `   ⚠️ Tribunal não informado na configuração para processo ${processoId}, pulando persistência de partes`,
            );
            continue;
          }

          await persistirPartesProcesso(
            dados.partes,
            {
              id_pje: processoId,
              trt: params.config.codigo,
              grau:
                params.config.grau === "primeiro_grau"
                  ? "primeiro_grau"
                  : "segundo_grau",
              id: idAcervo,
              numero_processo: numeroProcesso,
            },
            {
              id: parseInt(advogadoInfo.idAdvogado, 10),
              documento: advogadoInfo.cpf,
              nome: advogadoInfo.nome,
            },
          );
          partesPersistidas++;
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
    console.log(`   ✅ ${partesPersistidas} processos com partes persistidas`);
    resultado.dadosComplementares.partesCapturadas = partesPersistidas;

    // 5.5 Persistir audiências (consolidar todas)
    console.log("   🎤 Persistindo audiências...");
    const todasAudiencias = [
      ...audienciasDesignadas,
      ...audienciasRealizadas,
      ...audienciasCanceladas,
    ];

    if (todasAudiencias.length > 0) {
      try {
        const persistenciaAud = await salvarAudiencias({
          audiencias: todasAudiencias,
          advogadoId: advogadoDb.id,
          trt: params.config.codigo,
          grau: params.config.grau,
          atas: {}, // Atas seriam processadas em captura específica
          mapeamentoIds, // Usa mapeamento pré-calculado para evitar lookups redundantes
        });

        console.log(`   ✅ Audiências persistidas:`, {
          inseridos: persistenciaAud.inseridos,
          atualizados: persistenciaAud.atualizados,
          naoAtualizados: persistenciaAud.naoAtualizados,
          pulados: persistenciaAud.pulados,
          erros: persistenciaAud.erros,
        });
        resultado.persistenciaAudiencias = persistenciaAud;
      } catch (error) {
        console.error(
          "❌ [CapturaCombinada] Erro ao salvar audiências:",
          error,
        );
      }
    }

    // 5.6 Persistir expedientes (consolidar todos)
    console.log("   📋 Persistindo expedientes...");
    const todosExpedientes = [...expedientesNoPrazo, ...expedientesSemPrazo];

    if (todosExpedientes.length > 0) {
      try {
        const persistenciaExp = await salvarPendentes({
          processos: todosExpedientes as ProcessoPendente[],
          advogadoId: advogadoDb.id,
          trt: params.config.codigo,
          grau: params.config.grau,
        });

        console.log(`   ✅ Expedientes persistidos:`, {
          inseridos: persistenciaExp.inseridos,
          atualizados: persistenciaExp.atualizados,
          naoAtualizados: persistenciaExp.naoAtualizados,
          erros: persistenciaExp.erros,
        });
        resultado.persistenciaExpedientes = persistenciaExp;
      } catch (error) {
        console.error(
          "❌ [CapturaCombinada] Erro ao salvar expedientes:",
          error,
        );
      }
    }

    // 5.7 Persistir perícias
    console.log("   🔬 Persistindo perícias...");
    const todasPericiasRaw = resultado.capturas
      .filter((c) => c.tipo === "pericias")
      .flatMap((c) => {
        const dados = c.dados as Record<string, unknown> | undefined;
        if (!dados || !Array.isArray(dados.pericias)) {
          if (dados) {
            console.warn(
              "   ⚠️ [CapturaCombinada] Captura de perícias com estrutura inesperada:",
              Object.keys(dados),
            );
          }
          return [];
        }
        return dados.pericias;
      });

    // Filtrar apenas perícias com campos obrigatórios mínimos
    const todasPericias = todasPericiasRaw.filter((p): p is Pericia => {
      const obj = p as Record<string, unknown>;
      return (
        typeof obj === "object" &&
        obj !== null &&
        typeof obj.id === "number" &&
        typeof obj.idProcesso === "number" &&
        typeof obj.numeroProcesso === "string"
      );
    });
    if (todasPericias.length !== todasPericiasRaw.length) {
      console.warn(
        `   ⚠️ [CapturaCombinada] ${todasPericiasRaw.length - todasPericias.length} perícia(s) descartadas por estrutura inválida`,
      );
    }

    if (todasPericias.length > 0) {
      try {
        const persistenciaPer = await salvarPericias({
          pericias: todasPericias,
          advogadoId: advogadoDb.id,
          trt: params.config.codigo,
          grau: params.config.grau,
        });

        console.log(`   ✅ Perícias persistidas:`, {
          inseridos: persistenciaPer.inseridos,
          atualizados: persistenciaPer.atualizados,
          naoAtualizados: persistenciaPer.naoAtualizados,
          erros: persistenciaPer.erros,
          especialidadesCriadas: persistenciaPer.especialidadesCriadas,
          peritosCriados: persistenciaPer.peritosCriados,
        });
        resultado.persistenciaPericias = persistenciaPer;
      } catch (error) {
        console.error("❌ [CapturaCombinada] Erro ao salvar perícias:", error);
      }
    }

    // 5.8 Coletar payloads brutos de partes
    const payloadsBrutosPartes: Array<{
      processoId: number;
      numeroProcesso?: string;
      payloadBruto: Record<string, unknown> | null;
    }> = [];

    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.payloadBrutoPartes !== undefined) {
        // Buscar número do processo de qualquer uma das listas
        let numeroProcesso: string | undefined;
        for (const captura of resultado.capturas) {
          const proc = captura.processos.find(
            (p) => (p.idProcesso ?? p.id) === processoId,
          );
          if (proc?.numeroProcesso) {
            numeroProcesso = proc.numeroProcesso;
            break;
          }
        }

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
    resultado.payloadsBrutosPartes = payloadsBrutosPartes;

    // Logs finais
    captureLogService.imprimirResumo();
    resultado.logs = captureLogService.consumirLogs();

    // ═══════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════
    resultado.duracaoMs = performance.now() - inicio;

    console.log("🏁 [CapturaCombinada] Captura concluída!");
    console.log(`   📊 Resumo Geral:`);
    console.log(`      Audiências:`);
    console.log(
      `        - Designadas: ${resultado.resumo.totalAudienciasDesignadas}`,
    );
    console.log(
      `        - Realizadas: ${resultado.resumo.totalAudienciasRealizadas}`,
    );
    console.log(
      `        - Canceladas: ${resultado.resumo.totalAudienaciasCanceladas}`,
    );
    console.log(`      Expedientes:`);
    console.log(
      `        - No Prazo: ${resultado.resumo.totalExpedientesNoPrazo}`,
    );
    console.log(
      `        - Sem Prazo: ${resultado.resumo.totalExpedientesSemPrazo}`,
    );
    console.log(`      Perícias: ${resultado.resumo.totalPericias}`);
    console.log(`      Processos:`);
    console.log(`        - Únicos: ${resultado.resumo.totalProcessosUnicos}`);
    console.log(`        - Pulados: ${resultado.resumo.totalProcessosPulados}`);
    console.log(`      Dados Complementares:`);
    console.log(
      `        - Timelines: ${resultado.dadosComplementares.timelinesCapturadas}`,
    );
    console.log(
      `        - Partes: ${resultado.dadosComplementares.partesCapturadas}`,
    );
    console.log(`        - Erros: ${resultado.dadosComplementares.erros}`);
    console.log(`      Duração: ${(resultado.duracaoMs / 1000).toFixed(2)}s`);

    return resultado;
  } finally {
    // ═══════════════════════════════════════════════════════════════
    // FASE 6: FECHAR BROWSER
    // ═══════════════════════════════════════════════════════════════
    if (authResult?.browser) {
      console.log("🚪 [CapturaCombinada] Fechando browser...");
      await authResult.browser.close();
    }
  }
}
