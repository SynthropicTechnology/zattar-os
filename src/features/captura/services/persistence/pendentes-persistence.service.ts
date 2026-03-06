// Serviço de persistência de processos pendentes de manifestação
// Salva processos pendentes capturados no banco de dados com comparação antes de atualizar

import { createServiceClient } from "@/lib/supabase/service-client";
import type { Processo } from "../../types/types";
import type { CodigoTRT, GrauTRT } from "../../types/trt-types";
import { compararObjetos, removerCamposControle } from "./comparison.util";
import { captureLogService, extrairMensagemErro, type TipoEntidade } from "./capture-log.service";

/**
 * Processo pendente com campos adicionais específicos
 */
export interface ProcessoPendente extends Processo {
  idDocumento?: number;
  dataCienciaParte?: string;
  dataPrazoLegalParte?: string;
  dataCriacaoExpediente?: string;
  prazoVencido?: boolean;
  siglaOrgaoJulgador?: string;
}

/**
 * Parâmetros para salvar processos pendentes
 */
export interface SalvarPendentesParams {
  processos: ProcessoPendente[];
  advogadoId: number;
  trt: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Resultado da persistência
 */
export interface SalvarPendentesResult {
  inseridos: number;
  atualizados: number;
  naoAtualizados: number;
  erros: number;
  total: number;
}

/**
 * Converte data ISO string para timestamptz ou null
 *
 * IMPORTANTE: A API do PJE retorna datas sem timezone (ex: "2025-12-04T10:00:00")
 * que representam horário de Brasília (America/Sao_Paulo, UTC-3).
 *
 * Se a string não tiver timezone explícito, assumimos Brasília para evitar
 * que o servidor (que pode estar em UTC) interprete incorretamente.
 */
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    // Se já tem timezone (Z, +HH:MM, -HH:MM), usa direto
    const hasTimezone = /Z|[+-]\d{2}:\d{2}$/.test(dateString);

    if (hasTimezone) {
      return new Date(dateString).toISOString();
    }

    // Sem timezone: assumir Brasília (UTC-3)
    return new Date(dateString + '-03:00').toISOString();
  } catch {
    return null;
  }
}

/**
 * Busca um processo pendente existente com todos os campos
 */
async function buscarPendenteExistente(
  idPje: number,
  trt: CodigoTRT,
  grau: GrauTRT,
  numeroProcesso: string
): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("expedientes")
    .select("*")
    .eq("id_pje", idPje)
    .eq("trt", trt)
    .eq("grau", grau)
    .eq("numero_processo", numeroProcesso.trim())
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar pendente: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

/**
 * Salva múltiplos processos pendentes de manifestação
 * Compara cada registro antes de atualizar para evitar atualizações desnecessárias
 */
export async function salvarPendentes(
  params: SalvarPendentesParams
): Promise<SalvarPendentesResult> {
  const supabase = createServiceClient();
  const { processos, advogadoId, trt, grau } = params;

  if (processos.length === 0) {
    return {
      inseridos: 0,
      atualizados: 0,
      naoAtualizados: 0,
      erros: 0,
      total: 0,
    };
  }

  let inseridos = 0;
  let atualizados = 0;
  let naoAtualizados = 0;
  let erros = 0;

  const entidade: TipoEntidade = "expedientes";

  // Batch: buscar todos os registros existentes de uma vez (evita N+1 queries)
  const idsPje = processos.map((p) => p.id);
  const existentesMap = new Map<string, Record<string, unknown>>();

  try {
    const { data: existentes, error: erroBatch } = await supabase
      .from("expedientes")
      .select("*")
      .in("id_pje", idsPje)
      .eq("trt", trt)
      .eq("grau", grau);

    if (erroBatch) {
      console.warn(
        `⚠️ [Pendentes] Erro ao buscar existentes em batch: ${erroBatch.message}. Continuando sem cache.`,
      );
    } else if (existentes) {
      for (const reg of existentes) {
        const key = `${reg.id_pje}:${(reg.numero_processo as string).trim()}`;
        existentesMap.set(key, reg as Record<string, unknown>);
      }
    }
  } catch (e) {
    console.warn(
      `⚠️ [Pendentes] Exceção ao buscar existentes em batch. Continuando sem cache.`,
    );
  }

  // Processar cada processo
  for (const processo of processos) {
    try {
      const numeroProcesso = processo.numeroProcesso.trim();

      const dadosNovos = {
        id_pje: processo.id,
        advogado_id: advogadoId,
        trt,
        grau,
        numero_processo: numeroProcesso,
        descricao_orgao_julgador: processo.descricaoOrgaoJulgador.trim(),
        classe_judicial: processo.classeJudicial.trim(),
        numero: processo.numero,
        segredo_justica: processo.segredoDeJustica,
        codigo_status_processo: processo.codigoStatusProcesso.trim(),
        prioridade_processual: processo.prioridadeProcessual,
        nome_parte_autora: processo.nomeParteAutora.trim(),
        qtde_parte_autora: processo.qtdeParteAutora,
        nome_parte_re: processo.nomeParteRe.trim(),
        qtde_parte_re: processo.qtdeParteRe,
        data_autuacao: parseDate(processo.dataAutuacao),
        juizo_digital: processo.juizoDigital,
        data_arquivamento: parseDate(processo.dataArquivamento),
        id_documento: processo.idDocumento ?? null,
        data_ciencia_parte: parseDate(processo.dataCienciaParte),
        data_prazo_legal_parte: parseDate(processo.dataPrazoLegalParte),
        data_criacao_expediente: parseDate(processo.dataCriacaoExpediente),
        prazo_vencido: processo.prazoVencido ?? false,
        sigla_orgao_julgador: processo.siglaOrgaoJulgador?.trim() ?? null,
      };

      // Lookup no cache batch (ou fallback para query individual se cache vazio)
      const cacheKey = `${processo.id}:${numeroProcesso}`;
      const registroExistente = existentesMap.has(cacheKey)
        ? existentesMap.get(cacheKey)!
        : existentesMap.size === 0
          ? await buscarPendenteExistente(processo.id, trt, grau, numeroProcesso)
          : null;

      if (!registroExistente) {
        // Inserir
        const { error } = await supabase.from("expedientes").insert(dadosNovos);

        if (error) {
          throw error;
        }

        inseridos++;
        captureLogService.logInserido(
          entidade,
          processo.id,
          trt,
          grau,
          numeroProcesso
        );
      } else {
        // Comparar antes de atualizar
        const comparacao = compararObjetos(
          dadosNovos,
          registroExistente as Record<string, unknown>
        );

        if (comparacao.saoIdenticos) {
          naoAtualizados++;
          captureLogService.logNaoAtualizado(
            entidade,
            processo.id,
            trt,
            grau,
            numeroProcesso
          );
        } else {
          const dadosAnteriores = removerCamposControle(
            registroExistente as Record<string, unknown>
          );

          const { error } = await supabase
            .from("expedientes")
            .update({
              ...dadosNovos,
              dados_anteriores: dadosAnteriores,
            })
            .eq("id_pje", processo.id)
            .eq("trt", trt)
            .eq("grau", grau)
            .eq("numero_processo", numeroProcesso);

          if (error) {
            throw error;
          }

          atualizados++;
          captureLogService.logAtualizado(
            entidade,
            processo.id,
            trt,
            grau,
            numeroProcesso,
            comparacao.camposAlterados
          );
        }
      }
    } catch (error) {
      erros++;
      const erroMsg = extrairMensagemErro(error);
      captureLogService.logErro(entidade, erroMsg, {
        id_pje: processo.id,
        numero_processo: processo.numeroProcesso,
        trt,
        grau,
      });
      console.error(
        `Erro ao salvar pendente ${processo.numeroProcesso}:`,
        error
      );
    }
  }

  return {
    inseridos,
    atualizados,
    naoAtualizados,
    erros,
    total: processos.length,
  };
}

/**
 * Atualiza informações de arquivo/documento de um expediente
 * Usado após upload bem-sucedido de documento para Google Drive
 *
 * @param pendenteId - ID do expediente na tabela expedientes
 * @param arquivoInfo - Informações do arquivo (nome, URLs de visualização e download, file_id)
 * @returns Promise<void>
 * @throws Error se a atualização falhar
 */
export async function atualizarDocumentoPendente(
  pendenteId: number,
  arquivoInfo: {
    arquivo_nome: string;
    arquivo_url: string;
    arquivo_key: string;
    arquivo_bucket: string;
  }
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("expedientes")
    .update({
      arquivo_nome: arquivoInfo.arquivo_nome,
      arquivo_url: arquivoInfo.arquivo_url,
      arquivo_key: arquivoInfo.arquivo_key,
      arquivo_bucket: arquivoInfo.arquivo_bucket,
    })
    .eq("id", pendenteId);

  if (error) {
    throw new Error(
      `Erro ao atualizar documento do expediente ${pendenteId}: ${error.message}`
    );
  }

  console.log(`✅ Documento atualizado no banco para expediente ${pendenteId}`);
}
