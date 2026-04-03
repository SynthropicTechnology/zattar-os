/**
 * Serviço de processamento de endereços
 *
 * Este serviço é responsável por:
 * - Processar endereços de partes
 * - Processar endereços de representantes
 * - Upsert de endereços por ID PJE
 * - Vincular endereços às entidades
 */

import type { PartePJE, RepresentantePJE } from "@/app/(authenticated)/captura/pje-trt/partes/types";
import type { TipoParteClassificacao } from "../types";
import type { ProcessoParaCaptura } from "../partes-capture.service";
import type {
  ClassificacaoEndereco,
  EntidadeTipoEndereco,
  SituacaoEndereco,
} from "@/app/(authenticated)/enderecos/types";
import { upsertEnderecoPorIdPje } from "@/app/(authenticated)/enderecos";
import { withRetry } from "@/lib/utils/retry";
import { CAPTURA_CONFIG } from "../config";
import { PersistenceError } from "../errors";
import { validarEnderecoPJE, type EnderecoPJE } from "../utils";

/**
 * Processa e salva endereço de uma parte
 *
 * @param parte - Parte com dados de endereço
 * @param tipoParte - Tipo da parte (cliente, parte_contraria, terceiro)
 * @param entidadeId - ID da entidade no sistema
 * @returns ID do endereço criado/atualizado ou null se falhou
 */
export async function processarEndereco(
  parte: PartePJE,
  tipoParte: TipoParteClassificacao,
  entidadeId: number
): Promise<number | null> {
  // Verifica se a parte tem endereço
  if (!parte.dadosCompletos?.endereco) {
    return null;
  }

  const enderecoPJE = parte.dadosCompletos.endereco as unknown as EnderecoPJE;

  const { valido } = validarEnderecoPJE(enderecoPJE);
  if (!valido) {
    return null;
  }

  try {
    const result = await withRetry(
      () => upsertEnderecoPorIdPje(mapearEnderecoParaPersistencia(
        enderecoPJE,
        tipoParte as EntidadeTipoEndereco,
        entidadeId
      )),
      {
        maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
        baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
      }
    );

    if (result.success && result.data) {
      return result.data.id;
    }

    return null;
  } catch (error) {
    throw new PersistenceError(
      `Erro ao processar endereço de ${parte.nome}`,
      "upsert",
      "endereco",
      {
        parte: parte.nome,
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * Processa e salva endereço de um representante
 *
 * @param rep - Representante com dados de endereço
 * @param tipoParte - Tipo da parte associada
 * @param parteId - ID da parte no sistema
 * @param processo - Dados do processo
 * @returns ID do endereço criado/atualizado ou null se falhou
 */
export async function processarEnderecoRepresentante(
  rep: RepresentantePJE,
  tipoParte: TipoParteClassificacao,
  parteId: number,
  processo: ProcessoParaCaptura
): Promise<number | null> {
  // Verifica se o representante tem endereço
  if (!rep.dadosCompletos?.endereco) {
    return null;
  }

  const enderecoPJE = rep.dadosCompletos.endereco as unknown as EnderecoPJE;

  const { valido } = validarEnderecoPJE(enderecoPJE);
  if (!valido) {
    return null;
  }

  try {
    const result = await withRetry(
      () => upsertEnderecoPorIdPje({
        ...mapearEnderecoParaPersistencia(
          enderecoPJE,
          tipoParte as EntidadeTipoEndereco,
          parteId
        ),
        trt: processo.trt,
        grau: processo.grau,
        numero_processo: processo.numero_processo,
      }),
      {
        maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
        baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
      }
    );

    if (result.success && result.data) {
      return result.data.id;
    }

    return null;
  } catch (error) {
    throw new PersistenceError(
      `Erro ao processar endereço de representante ${rep.nome}`,
      "upsert",
      "endereco",
      {
        representante: rep.nome,
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * Vincula endereço à entidade (cliente, parte_contraria ou terceiro)
 * Atualiza o campo endereco_id na tabela apropriada
 *
 * @param tipoParte - Tipo da parte
 * @param entidadeId - ID da entidade
 * @param enderecoId - ID do endereço
 */
export async function vincularEnderecoNaEntidade(
  tipoParte: TipoParteClassificacao,
  entidadeId: number,
  enderecoId: number
): Promise<void> {
  try {
    const { createServiceClient } = await import(
      "@/lib/supabase/service-client"
    );
    const supabase = createServiceClient();

    const tableName = getTableName(tipoParte);

    const { error } = await supabase
      .from(tableName)
      .update({ endereco_id: enderecoId })
      .eq("id", entidadeId);

    if (error) {
      throw new PersistenceError(
        `Erro ao vincular endereço ${enderecoId} à ${tipoParte} ${entidadeId}`,
        "update",
        tipoParte,
        { enderecoId, entidadeId, error: error.message }
      );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Mapeia dados de endereço PJE para formato de persistência
 */
function mapearEnderecoParaPersistencia(
  enderecoPJE: EnderecoPJE,
  entidadeTipo: EntidadeTipoEndereco,
  entidadeId: number
): Parameters<typeof upsertEnderecoPorIdPje>[0] {
  return {
    id_pje: Number(enderecoPJE?.id || 0),
    entidade_tipo: entidadeTipo,
    entidade_id: entidadeId,
    logradouro: enderecoPJE?.logradouro
      ? String(enderecoPJE.logradouro)
      : undefined,
    numero: enderecoPJE?.numero ? String(enderecoPJE.numero) : undefined,
    complemento: enderecoPJE?.complemento
      ? String(enderecoPJE.complemento)
      : undefined,
    bairro: enderecoPJE?.bairro ? String(enderecoPJE.bairro) : undefined,
    id_municipio_pje: enderecoPJE?.idMunicipio
      ? Number(enderecoPJE.idMunicipio)
      : undefined,
    municipio: enderecoPJE?.municipio
      ? String(enderecoPJE.municipio)
      : undefined,
    municipio_ibge: enderecoPJE?.municipioIbge
      ? String(enderecoPJE.municipioIbge)
      : undefined,
    estado_id_pje: enderecoPJE?.estado?.id
      ? Number(enderecoPJE.estado.id)
      : undefined,
    estado_sigla: enderecoPJE?.estado?.sigla
      ? String(enderecoPJE.estado.sigla)
      : undefined,
    estado_descricao: enderecoPJE?.estado?.descricao
      ? String(enderecoPJE.estado.descricao)
      : undefined,
    estado: enderecoPJE?.estado?.sigla
      ? String(enderecoPJE.estado.sigla)
      : undefined,
    pais_id_pje: enderecoPJE?.pais?.id
      ? Number(enderecoPJE.pais.id)
      : undefined,
    pais_codigo: enderecoPJE?.pais?.codigo
      ? String(enderecoPJE.pais.codigo)
      : undefined,
    pais_descricao: enderecoPJE?.pais?.descricao
      ? String(enderecoPJE.pais.descricao)
      : undefined,
    pais: enderecoPJE?.pais?.descricao
      ? String(enderecoPJE.pais.descricao)
      : undefined,
    cep: enderecoPJE?.nroCep ? String(enderecoPJE.nroCep) : undefined,
    classificacoes_endereco:
      (enderecoPJE?.classificacoesEndereco as ClassificacaoEndereco[]) || undefined,
    correspondencia:
      enderecoPJE?.correspondencia !== undefined
        ? Boolean(enderecoPJE.correspondencia)
        : undefined,
    situacao:
      (enderecoPJE?.situacao as unknown as SituacaoEndereco) || undefined,
    id_usuario_cadastrador_pje: enderecoPJE?.idUsuarioCadastrador
      ? Number(enderecoPJE.idUsuarioCadastrador)
      : undefined,
    data_alteracao_pje: enderecoPJE?.dtAlteracao
      ? String(enderecoPJE.dtAlteracao)
      : undefined,
    dados_pje_completo: enderecoPJE as unknown as Record<string, unknown>,
  };
}

/**
 * Retorna o nome da tabela baseado no tipo de parte
 */
function getTableName(tipoParte: TipoParteClassificacao): string {
  switch (tipoParte) {
    case "cliente":
      return "clientes";
    case "parte_contraria":
      return "partes_contrarias";
    case "terceiro":
      return "terceiros";
    default:
      return "terceiros";
  }
}
