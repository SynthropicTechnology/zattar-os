"use server";

/**
 * PEÇAS JURÍDICAS FEATURE - Server Actions para Geração de Peças
 *
 * Actions para gerar peças jurídicas a partir de contratos.
 */

import { revalidatePath } from "next/cache";
import { authenticateRequest as getCurrentUser } from "@/lib/auth";
import { createDbClient } from "@/lib/supabase";
import type {
  ContratoDocumento,
  GerarPecaInput,
  ListarContratoDocumentosParams,
} from "../domain";
import {
  gerarPecaDeContrato,
  previewGeracaoPeca,
  listarDocumentosDoContrato,
  desvincularDocumentoDoContrato,
  vincularDocumentoAoContrato,
  desvincularItemDoContrato,
  type GerarPecaResult,
} from "../service";
import type {
  PlaceholderContext,
  PlaceholderResolution,
  ParteProcessual,
} from "../placeholders";
import type { PaginatedResponse } from "@/types";
import { TipoPecaJuridica } from "../domain";

// =============================================================================
// TIPOS
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | {
      success: false;
      error: string;
      errors?: Record<string, string[]>;
      message: string;
    };

// =============================================================================
// BUSCAR CONTEXTO DO CONTRATO
// =============================================================================

/**
 * Busca dados do contrato para montar o contexto de placeholders
 */
export async function actionBuscarContextoContrato(
  contratoId: number
): Promise<ActionResult<PlaceholderContext>> {
  try {
    const db = createDbClient();

    // 1. Buscar contrato com partes
    const { data: contrato, error: contratoError } = await db
      .from("contratos")
      .select(
        `
        id,
        segmento_id,
        tipo_contrato,
        cadastrado_em,
        responsavel_id,
        segmentos:segmento_id (nome),
        contrato_partes (
          id,
          tipo_entidade,
          entidade_id,
          papel_contratual,
          ordem
        )
      `
      )
      .eq("id", contratoId)
      .single();

    if (contratoError || !contrato) {
      return {
        success: false,
        error: "NOT_FOUND",
        message: "Contrato não encontrado",
      };
    }

    // 2. Separar partes por tipo e papel
    const partes = (contrato.contrato_partes || []) as Array<{
      id: number;
      tipo_entidade: "cliente" | "parte_contraria";
      entidade_id: number;
      papel_contratual: "autora" | "re";
      ordem: number;
    }>;

    // IDs para buscar
    const clienteIds = partes
      .filter((p) => p.tipo_entidade === "cliente")
      .map((p) => p.entidade_id);
    const parteContrariaIds = partes
      .filter((p) => p.tipo_entidade === "parte_contraria")
      .map((p) => p.entidade_id);

    // 3. Buscar dados das partes
    const [clientesResult, partesContrariasResult] = await Promise.all([
      clienteIds.length > 0
        ? db
            .from("clientes")
            .select("*, enderecos:endereco_id (*)")
            .in("id", clienteIds)
        : Promise.resolve({ data: [], error: null }),
      parteContrariaIds.length > 0
        ? db
            .from("partes_contrarias")
            .select("*, enderecos:endereco_id (*)")
            .in("id", parteContrariaIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Mapear para lookup
    const clientesMap = new Map(
      (clientesResult.data || []).map((c) => [c.id, c])
    );
    const partesContrariasMap = new Map(
      (partesContrariasResult.data || []).map((p) => [p.id, p])
    );

    // 4. Montar autores e réus
    const autores: ParteProcessual[] = [];
    const reus: ParteProcessual[] = [];

    for (const parte of partes) {
      let dados;
      let endereco;

      if (parte.tipo_entidade === "cliente") {
        const cliente = clientesMap.get(parte.entidade_id);
        if (cliente) {
          dados = cliente;
          endereco = cliente.enderecos;
        }
      } else {
        const parteContraria = partesContrariasMap.get(parte.entidade_id);
        if (parteContraria) {
          dados = parteContraria;
          endereco = parteContraria.enderecos;
        }
      }

      if (dados) {
        const parteProcessual: ParteProcessual = {
          id: parte.id,
          tipoEntidade: parte.tipo_entidade,
          papelContratual: parte.papel_contratual,
          ordem: parte.ordem,
          dados,
          endereco,
        };

        if (parte.papel_contratual === "autora") {
          autores.push(parteProcessual);
        } else {
          reus.push(parteProcessual);
        }
      }
    }

    // Ordenar por ordem
    autores.sort((a, b) => a.ordem - b.ordem);
    reus.sort((a, b) => a.ordem - b.ordem);

    // 5. Buscar advogado responsável (se existir)
    let advogado;
    if (contrato.responsavel_id) {
      const { data: usuario } = await db
        .from("usuarios")
        .select("nome, oab")
        .eq("id", contrato.responsavel_id)
        .single();

      if (usuario) {
        advogado = {
          nome: usuario.nome || "",
          oab: usuario.oab || "",
        };
      }
    }

    // 6. Montar contexto
    const context: PlaceholderContext = {
      autores,
      reus,
      contrato: {
        id: contrato.id,
        areaDireito: (contrato.segmentos as
          | { nome: string }
          | { nome: string }[]
          | null)
          ? Array.isArray(contrato.segmentos)
            ? (contrato.segmentos as { nome: string }[])[0]?.nome
            : (contrato.segmentos as { nome: string })?.nome
          : undefined,
        tipo: contrato.tipo_contrato,
        dataCadastro: contrato.cadastrado_em,
      },
      advogado,
    };

    return {
      success: true,
      data: context,
      message: "Contexto carregado com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// =============================================================================
// GERAÇÃO DE PEÇA
// =============================================================================

/**
 * Gera preview dos placeholders que serão substituídos
 */
export async function actionPreviewGeracaoPeca(
  modeloId: number,
  contratoId: number
): Promise<
  ActionResult<{
    placeholders: PlaceholderResolution[];
    resolvidosCount: number;
    naoResolvidosCount: number;
  }>
> {
  try {
    // Buscar contexto
    const contextResult = await actionBuscarContextoContrato(contratoId);
    if (!contextResult.success) {
      return contextResult;
    }

    // Gerar preview
    const result = await previewGeracaoPeca(modeloId, contextResult.data);

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: "Preview gerado com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Gera uma peça jurídica a partir de um modelo e contrato
 */
export async function actionGerarPecaDeContrato(
  input: GerarPecaInput
): Promise<ActionResult<GerarPecaResult>> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id;

    // Buscar contexto
    const contextResult = await actionBuscarContextoContrato(input.contratoId);
    if (!contextResult.success) {
      return contextResult;
    }

    // Gerar peça
    const result = await gerarPecaDeContrato(input, contextResult.data, userId);

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        errors: result.error.details?.errors as
          | Record<string, string[]>
          | undefined,
        message: result.error.message,
      };
    }

    revalidatePath(`/app/contratos/${input.contratoId}`);
    revalidatePath("/app/documentos");

    return {
      success: true,
      data: result.data,
      message: `Peça gerada com sucesso. ${result.data.placeholdersResolvidos} placeholders resolvidos.`,
    };
  } catch (error) {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// =============================================================================
// DOCUMENTOS DO CONTRATO
// =============================================================================

/**
 * Lista documentos vinculados a um contrato
 */
export async function actionListarDocumentosDoContrato(
  params: ListarContratoDocumentosParams
): Promise<ActionResult<PaginatedResponse<ContratoDocumento>>> {
  try {
    const result = await listarDocumentosDoContrato(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: "Documentos listados com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Desvincula um documento de um contrato
 */
export async function actionDesvincularDocumentoDoContrato(
  contratoId: number,
  documentoId: number
): Promise<ActionResult<void>> {
  try {
    const result = await desvincularDocumentoDoContrato(
      contratoId,
      documentoId
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        message: result.error.message,
      };
    }

    revalidatePath(`/app/contratos/${contratoId}`);

    return {
      success: true,
      data: undefined,
      message: "Documento desvinculado com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Vincula um arquivo (upload) a um contrato
 */
export async function actionVincularArquivoAoContrato(input: {
  contratoId: number;
  arquivoId: number;
  tipoPeca?: TipoPecaJuridica | null;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id;

    if (!userId) {
      return {
        success: false,
        error: "AUTH_ERROR",
        message: "Usuário não autenticado",
      };
    }

    const result = await vincularDocumentoAoContrato(
      {
        contratoId: input.contratoId,
        arquivoId: input.arquivoId,
        tipoPeca: input.tipoPeca,
      },
      userId
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        message: result.error.message,
      };
    }

    revalidatePath(`/app/contratos/${input.contratoId}`);
    revalidatePath("/app/documentos");

    return {
      success: true,
      data: result.data,
      message: "Arquivo vinculado com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Desvincula um item do contrato (documento ou arquivo) usando ID do vínculo
 */
export async function actionDesvincularItemDoContrato(
  id: number,
  contratoId: number // Necessário para revalidatePath
): Promise<ActionResult<void>> {
  try {
    const result = await desvincularItemDoContrato(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error.code,
        message: result.error.message,
      };
    }

    revalidatePath(`/app/contratos/${contratoId}`);

    return {
      success: true,
      data: undefined,
      message: "Item desvinculado com sucesso",
    };
  } catch (error) {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
