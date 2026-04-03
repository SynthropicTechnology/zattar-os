/**
 * Serviço de captura de pendentes de manifestação do TRT
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
 * │  📡 FASE 2: BUSCAR PENDENTES                                    │
 * │  └── GET /paineladvogado/{id}/processos                         │
 * │  └── Retorno: pendentes (cada um com id do processo)            │
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
 * │  ├── 🔍 Verificação de recaptura (pula se atualizado < 6h)      │
 * │  ├── 📜 Timeline: GET /processos/id/{id}/timeline               │
 * │  └── 👥 Partes: GET /processos/id/{id}/partes                   │
 * │      └── (com delay de 300ms entre cada requisição)             │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  💾 FASE 5: PERSISTÊNCIA (ordem garante integridade referencial)│
 * │  ├── 📜 Timeline: upsert (timeline_jsonb no Supabase)           │
 * │  ├── 👥 Partes: upsert entidades + vínculos - apenas não pulados│
 * │  ├── 📋 Pendentes: upsert (Supabase)                            │
 * │  └── 📄 Documentos: download + upload (opcional)                │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🚪 FASE 6: FECHAR BROWSER                                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { autenticarPJE, type AuthResult } from "./trt-auth.service";
import type { CapturaPendentesManifestacaoParams } from "./trt-capture.service";
import {
  obterTodosProcessosPendentesManifestacao,
  obterTotalizadoresPendentesManifestacao,
} from "@/app/(authenticated)/captura/pje-trt";
import type { Processo } from "../../types";
import {
  salvarPendentes,
  type SalvarPendentesResult,
  type ProcessoPendente,
} from "../persistence/pendentes-persistence.service";
import { buscarOuCriarAdvogadoPorCpf } from "../advogado-helper.service";
import {
  captureLogService,
  type LogEntry,
} from "../persistence/capture-log.service";
import { downloadAndUploadDocumento } from "../pje/pje-expediente-documento.service";
import type { FetchDocumentoParams } from "../../types/documento-types";
import { buscarDadosComplementaresProcessos } from "./dados-complementares.service";
import { salvarTimeline } from "../timeline/timeline-persistence.service";
import { persistirPartesProcesso } from "../partes/partes-capture.service";
import type { TimelineItemEnriquecido } from "@/types/contracts/pje-trt";
import { createServiceClient } from "@/lib/supabase/service-client";

/**
 * Resultado da captura de processos pendentes de manifestação
 */
export interface PendentesManifestacaoResult {
  processos: Processo[];
  total: number;
  filtroPrazo?: "no_prazo" | "sem_prazo";
  persistencia?: SalvarPendentesResult;
  documentosCapturados?: number;
  documentosFalhados?: number;
  errosDocumentos?: string[];
  logs?: LogEntry[];
  payloadBruto?: Processo[];
  /** Dados complementares capturados */
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
 * Mapeamento de filtro de prazo para parâmetro da API
 */
const FILTRO_PRAZO_MAP: Record<"no_prazo" | "sem_prazo", string> = {
  sem_prazo: "I", // Expedientes sem prazo
  no_prazo: "N", // Expedientes no prazo
};

/**
 * Extrai IDs únicos de processos de uma lista de pendentes
 */
function extrairProcessosUnicosDePendentes(
  pendentes: ProcessoPendente[]
): number[] {
  const idsUnicos = [...new Set(pendentes.map((p) => p.id))];
  console.log(
    `📋 [Pendentes] ${idsUnicos.length} processos únicos extraídos de ${pendentes.length} pendentes`
  );
  return idsUnicos;
}

/**
 * Serviço de captura de processos pendentes de manifestação
 *
 * Fluxo otimizado em 6 fases:
 * 1. Autenticação
 * 2. Buscar pendentes (API)
 * 3. Extrair IDs únicos de processos
 * 4. Buscar dados complementares (timeline, partes) com verificação de recaptura
 * 5. Persistência (timeline -> partes -> pendentes -> documentos)
 * 6. Fechar browser
 */
export async function pendentesManifestacaoCapture(
  params: CapturaPendentesManifestacaoParams
): Promise<PendentesManifestacaoResult> {
  let authResult: AuthResult | null = null;

  try {
    // ═══════════════════════════════════════════════════════════════
    // FASE 1: AUTENTICAÇÃO
    // ═══════════════════════════════════════════════════════════════
    console.log("🔐 [Pendentes] Fase 1: Autenticando...");
    authResult = await autenticarPJE({
      credential: params.credential,
      config: params.config,
      headless: true,
    });

    const { page, advogadoInfo } = authResult;
    console.log(`✅ [Pendentes] Autenticado como: ${advogadoInfo.nome}`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 2: BUSCAR PENDENTES
    // ═══════════════════════════════════════════════════════════════
    console.log("📡 [Pendentes] Fase 2: Buscando pendentes de manifestação...");

    const idAdvogado = parseInt(advogadoInfo.idAdvogado, 10);
    if (isNaN(idAdvogado)) {
      throw new Error(`ID do advogado inválido: ${advogadoInfo.idAdvogado}`);
    }

    // Obter totalizador para validação
    const totalizadorPendentes = await obterTotalizadoresPendentesManifestacao(
      page,
      idAdvogado
    );

    // Preparar parâmetros
    const filtroPrazo = params.filtroPrazo || "sem_prazo";
    const agrupadorExpediente = FILTRO_PRAZO_MAP[filtroPrazo];
    const paramsAdicionais = {
      agrupadorExpediente,
      tipoPainelAdvogado: 2,
      idPainelAdvogadoEnum: 2,
      ordenacaoCrescente: false,
    };

    // Buscar pendentes
    const processos = await obterTodosProcessosPendentesManifestacao(
      page,
      idAdvogado,
      500,
      paramsAdicionais
    );

    console.log(`✅ [Pendentes] ${processos.length} pendentes encontrados`);

    // Validar contra totalizador
    if (totalizadorPendentes) {
      const quantidadeEsperada = totalizadorPendentes.quantidadeProcessos;
      if (processos.length > quantidadeEsperada) {
        throw new Error(
          `Quantidade de processos (${processos.length}) excede totalizador (${quantidadeEsperada})`
        );
      }
    }

    if (processos.length === 0) {
      console.log("ℹ️ [Pendentes] Nenhum pendente encontrado");
      return {
        processos: [],
        total: 0,
        filtroPrazo,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 3: EXTRAIR PROCESSOS ÚNICOS
    // ═══════════════════════════════════════════════════════════════
    console.log("📋 [Pendentes] Fase 3: Extraindo processos únicos...");
    const processosIds = extrairProcessosUnicosDePendentes(
      processos as ProcessoPendente[]
    );

    // ═══════════════════════════════════════════════════════════════
    // FASE 4: BUSCAR DADOS COMPLEMENTARES (com verificação de recaptura)
    // ═══════════════════════════════════════════════════════════════
    console.log("🔄 [Pendentes] Fase 4: Buscando dados complementares...");

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
        onProgress: (atual, total, processoId) => {
          if (atual % 10 === 0 || atual === 1 || atual === total) {
            console.log(
              `   📊 Progresso: ${atual}/${total} (processo ${processoId})`
            );
          }
        },
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // FASE 5: PERSISTÊNCIA
    // ═══════════════════════════════════════════════════════════════
    console.log("💾 [Pendentes] Fase 5: Persistindo dados...");

    // 5.1 Buscar/criar advogado
    const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
      advogadoInfo.cpf,
      advogadoInfo.nome
    );

    // 5.2 Persistir timelines no PostgreSQL (apenas para processos não pulados)
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
            e
          );
          captureLogService.logErro(
            "timeline",
            e instanceof Error ? e.message : String(e),
            {
              processoId,
              trt: params.config.codigo,
              grau: params.config.grau,
            }
          );
        }
      }
    }
    console.log(`   ✅ ${timelinesPersistidas} timelines persistidas no PostgreSQL`);

    // 5.3 Buscar IDs dos processos no acervo (para vínculos de partes)
    console.log("   📦 Buscando processos no acervo...");
    const mapeamentoIds = new Map<number, number>();
    const supabase = createServiceClient();

    for (const idPje of processosIds) {
      const { data } = await supabase
        .from("acervo")
        .select("id")
        .eq("id_pje", idPje)
        .eq("trt", params.config.codigo)
        .eq("grau", params.config.grau)
        .single();

      if (data?.id) {
        mapeamentoIds.set(idPje, data.id);
      }
    }
    console.log(
      `   ✅ ${mapeamentoIds.size}/${processosIds.length} processos encontrados no acervo`
    );

    // 5.4 Persistir partes (usa dados já buscados, sem refetch da API)
    console.log("   👥 Persistindo partes...");
    let partesPersistidas = 0;
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.partes && dados.partes.length > 0) {
        const idAcervo = mapeamentoIds.get(processoId);

        if (!idAcervo) {
          console.log(
            `   ⚠️ Processo ${processoId} não encontrado no acervo, pulando partes...`
          );
          continue;
        }

        try {
          const pendente = (processos as ProcessoPendente[]).find(
            (p) => p.id === processoId
          );
          const numeroProcesso = pendente?.numeroProcesso;

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
              id: idAcervo,
              numero_processo: numeroProcesso,
            },
            {
              id: parseInt(advogadoInfo.idAdvogado, 10),
              documento: advogadoInfo.cpf,
              nome: advogadoInfo.nome,
            }
          );
          partesPersistidas++;
        } catch (e) {
          console.warn(
            `   ⚠️ Erro ao persistir partes do processo ${processoId}:`,
            e
          );
          captureLogService.logErro(
            "partes",
            e instanceof Error ? e.message : String(e),
            {
              processoId,
              trt: params.config.codigo,
              grau: params.config.grau,
            }
          );
        }
      }
    }
    console.log(`   ✅ ${partesPersistidas} processos com partes persistidas`);

    // 5.5 Persistir pendentes
    console.log("   📋 Persistindo pendentes...");
    let persistencia: SalvarPendentesResult | undefined;
    let logsPersistencia: LogEntry[] | undefined;

    try {
      persistencia = await salvarPendentes({
        processos: processos as ProcessoPendente[],
        advogadoId: advogadoDb.id,
        trt: params.config.codigo,
        grau: params.config.grau,
      });

      console.log(
        `   ✅ ${persistencia.total} pendentes processados (${persistencia.inseridos} inseridos, ${persistencia.atualizados} atualizados, ${persistencia.naoAtualizados} sem alteração, ${persistencia.erros} erros)`
      );
    } catch (error) {
      console.error("   ❌ Erro ao salvar pendentes:", error);
    } finally {
      captureLogService.imprimirResumo();
      logsPersistencia = captureLogService.consumirLogs();
    }

    // 5.6 Capturar documentos PDF (opcional)
    let documentosCapturados = 0;
    let documentosFalhados = 0;
    const errosDocumentos: string[] = [];

    if (params.capturarDocumentos && persistencia) {
      console.log("   📄 Capturando documentos...");

      for (const processo of processos as ProcessoPendente[]) {
        if (!processo.idDocumento) {
          continue;
        }

        try {
          const { data: pendenteDb } = await supabase
            .from("expedientes")
            .select("id")
            .eq("id_pje", processo.id)
            .eq("trt", params.config.codigo)
            .eq("grau", params.config.grau)
            .eq("numero_processo", processo.numeroProcesso.trim())
            .single();

          if (!pendenteDb) {
            continue;
          }

          const documentoParams: FetchDocumentoParams = {
            processoId: String(processo.id),
            documentoId: String(processo.idDocumento),
            expedienteId: pendenteDb.id,
            numeroProcesso: processo.numeroProcesso,
            trt: params.config.codigo,
            grau: params.config.grau,
          };

          const resultado = await downloadAndUploadDocumento(
            authResult.page,
            documentoParams
          );

          if (resultado.success) {
            documentosCapturados++;
          } else {
            documentosFalhados++;
            errosDocumentos.push(
              `${processo.numeroProcesso}: ${resultado.error}`
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          documentosFalhados++;
          const erroMsg =
            error instanceof Error ? error.message : String(error);
          errosDocumentos.push(`${processo.numeroProcesso}: ${erroMsg}`);
        }
      }

      console.log(
        `   ✅ Documentos: ${documentosCapturados} capturados, ${documentosFalhados} falhados`
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 6: RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log("✅ [Pendentes] Captura concluída!");

    // Coletar payloads brutos de partes para salvar como raw logs no Supabase
    const payloadsBrutosPartes: Array<{
      processoId: number;
      numeroProcesso?: string;
      payloadBruto: Record<string, unknown> | null;
    }> = [];
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.payloadBrutoPartes !== undefined) {
        // Buscar número do processo
        const processoCorrespondente = processos.find(
          (p) => p.id === processoId
        );
        const numeroProcesso =
          processoCorrespondente?.numeroProcesso ||
          (processoCorrespondente?.numero
            ? String(processoCorrespondente.numero)
            : undefined);
        payloadsBrutosPartes.push({
          processoId,
          numeroProcesso,
          payloadBruto: dados.payloadBrutoPartes,
        });
      }
    }
    console.log(
      `   📦 Payloads de partes coletados: ${payloadsBrutosPartes.length}`
    );

    return {
      processos,
      total: processos.length,
      filtroPrazo,
      persistencia,
      documentosCapturados,
      documentosFalhados,
      errosDocumentos: errosDocumentos.length > 0 ? errosDocumentos : undefined,
      logs: logsPersistencia,
      payloadBruto: processos,
      dadosComplementares: {
        processosUnicos: processosIds.length,
        processosPulados: dadosComplementares.resumo.processosPulados,
        timelinesCapturadas: timelinesPersistidas,
        partesCapturadas: partesPersistidas,
        erros: dadosComplementares.resumo.erros,
      },
      payloadsBrutosPartes,
    };
  } finally {
    // FASE 6: Fechar browser
    if (authResult?.browser) {
      await authResult.browser.close();
    }
  }
}
