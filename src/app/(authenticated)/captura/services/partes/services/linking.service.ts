/**
 * Serviço de vinculação processo-partes
 *
 * Este serviço é responsável por:
 * - Criar vínculos entre processos e partes na tabela processo_partes
 * - Mapear polos e tipos de parte do PJE para o sistema interno
 * - Validar dados de vinculação
 */

import type { PartePJE } from "@/app/(authenticated)/captura/pje-trt/partes/types";
import type { TipoParteClassificacao } from "../types";
import type { ProcessoParaCaptura } from "../partes-capture.service";
import { vincularParteProcesso } from "@/app/(authenticated)/partes/server";
import { withRetry } from "@/lib/utils/retry";
import { CAPTURA_CONFIG } from "../config";
import { ValidationError, PersistenceError } from "../errors";
import { mapearPoloParaSistema, validarTipoParteProcesso } from "../utils";

/**
 * Cria vínculo entre processo e parte na tabela processo_partes
 *
 * @param processo - Dados do processo
 * @param tipoParte - Tipo da parte (cliente, parte_contraria, terceiro)
 * @param entidadeId - ID da entidade no sistema
 * @param parte - Dados da parte do PJE
 * @param ordem - Ordem da parte no processo (para ordenação)
 * @returns true se criado com sucesso, false caso contrário
 *
 * NOTA: Se processo.id (ID no acervo) não estiver disponível,
 * retorna false sem criar vínculo (partes são salvas, mas sem vínculo)
 */
export async function criarVinculoProcessoParte(
  processo: ProcessoParaCaptura,
  tipoParte: TipoParteClassificacao,
  entidadeId: number,
  parte: PartePJE,
  ordem: number
): Promise<boolean> {
  // Se não temos ID do processo no acervo, não podemos criar vínculo
  // Isso permite capturar partes mesmo sem o processo estar no acervo ainda
  if (!processo.id) {
    return false; // Pula criação de vínculo silenciosamente
  }

  // Validação prévia
  validarDadosVinculacao(entidadeId, parte);

  try {
    const result = await withRetry(
      () =>
        vincularParteProcesso({
          processo_id: processo.id!,
          tipo_entidade: tipoParte,
          entidade_id: entidadeId,
          id_pje: parte.idParte,
          id_pessoa_pje: parte.idPessoa,
          tipo_parte: validarTipoParteProcesso(parte.tipoParte),
          polo: mapearPoloParaSistema(parte.polo),
          trt: processo.trt,
          grau: processo.grau,
          numero_processo: processo.numero_processo ?? "", // Fallback para string vazia
          principal: parte.principal ?? false, // Default false se PJE não retornar
          ordem,
          dados_pje_completo: parte.dadosCompletos,
        }),
      {
        maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
        baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
      }
    );

    if (!result.sucesso) {
      throw new PersistenceError(
        "Falha ao criar vínculo",
        "insert",
        "vinculo",
        {
          processo_id: processo.id,
          tipo_entidade: tipoParte,
          entidade_id: entidadeId,
          erro: result.erro,
        }
      );
    }

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Valida dados necessários para criação de vínculo
 */
function validarDadosVinculacao(entidadeId: number, parte: PartePJE): void {
  if (entidadeId <= 0) {
    throw new ValidationError("entidadeId inválido", {
      entidadeId,
      parte: parte.nome,
    });
  }
  if (!parte.idParte) {
    throw new ValidationError("idParte ausente", { parte: parte.nome });
  }
}

/**
 * Verifica se um vínculo processo-parte já existe
 *
 * @param processoId - ID do processo no sistema
 * @param entidadeId - ID da entidade
 * @param tipoParte - Tipo da parte
 * @returns true se vínculo já existe
 */
export async function vinculoExiste(
  processoId: number,
  entidadeId: number,
  tipoParte: TipoParteClassificacao
): Promise<boolean> {
  try {
    const { createServiceClient } = await import(
      "@/lib/supabase/service-client"
    );
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("processo_partes")
      .select("id")
      .eq("processo_id", processoId)
      .eq("entidade_id", entidadeId)
      .eq("tipo_entidade", tipoParte)
      .maybeSingle();

    if (error) {
      console.error("Erro ao verificar vínculo existente:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Erro ao verificar vínculo:", error);
    return false;
  }
}

/**
 * Remove vínculo processo-parte
 *
 * @param processoId - ID do processo
 * @param entidadeId - ID da entidade
 * @param tipoParte - Tipo da parte
 * @returns true se removido com sucesso
 */
export async function removerVinculoProcessoParte(
  processoId: number,
  entidadeId: number,
  tipoParte: TipoParteClassificacao
): Promise<boolean> {
  try {
    const { createServiceClient } = await import(
      "@/lib/supabase/service-client"
    );
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("processo_partes")
      .delete()
      .eq("processo_id", processoId)
      .eq("entidade_id", entidadeId)
      .eq("tipo_entidade", tipoParte);

    if (error) {
      throw new PersistenceError(
        "Erro ao remover vínculo",
        "delete",
        "vinculo",
        { processoId, entidadeId, tipoParte, error: error.message }
      );
    }

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza ordem de uma parte no processo
 *
 * @param processoId - ID do processo
 * @param entidadeId - ID da entidade
 * @param tipoParte - Tipo da parte
 * @param novaOrdem - Nova posição de ordem
 */
export async function atualizarOrdemParte(
  processoId: number,
  entidadeId: number,
  tipoParte: TipoParteClassificacao,
  novaOrdem: number
): Promise<void> {
  try {
    const { createServiceClient } = await import(
      "@/lib/supabase/service-client"
    );
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("processo_partes")
      .update({ ordem: novaOrdem })
      .eq("processo_id", processoId)
      .eq("entidade_id", entidadeId)
      .eq("tipo_entidade", tipoParte);

    if (error) {
      throw new PersistenceError(
        "Erro ao atualizar ordem",
        "update",
        "vinculo",
        { processoId, entidadeId, tipoParte, novaOrdem, error: error.message }
      );
    }
  } catch (error) {
    throw error;
  }
}
