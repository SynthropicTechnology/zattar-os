/**
 * PEÇAS JURÍDICAS FEATURE - Camada de Persistência
 *
 * Este arquivo contém funções de acesso ao banco de dados para:
 * - pecas_modelos: Modelos de peças jurídicas
 * - contrato_documentos: Vinculação de documentos a contratos
 *
 * CONVENÇÕES:
 * - Funções assíncronas que retornam Result<T>
 * - Nomes descritivos: findById, findAll, create, update, delete
 * - NUNCA fazer validação de negócio aqui (apenas persistência)
 */

import { createDbClient } from "@/lib/supabase";
import { Result, ok, err, appError, PaginatedResponse } from "@/types";
import type {
  PecaModelo,
  PecaModeloListItem,
  PecaModeloRow,
  ContratoDocumento,
  ContratoDocumentoRow,
  CreatePecaModeloInput,
  UpdatePecaModeloInput,
  CreateContratoDocumentoInput,
  ListarPecasModelosParams,
  ListarContratoDocumentosParams,
} from "./domain";
import {
  mapPecaModeloRowToModel,
  mapPecaModeloRowToListItem,
  mapContratoDocumentoRowToModel,
} from "./domain";

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_PECAS_MODELOS = "pecas_modelos";
const TABLE_CONTRATO_DOCUMENTOS = "contrato_documentos";

// =============================================================================
// PECAS_MODELOS - CRUD
// =============================================================================

/**
 * Busca um modelo de peça por ID
 */
export async function findPecaModeloById(
  id: number
): Promise<Result<PecaModelo | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_PECAS_MODELOS)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    if (!data) {
      return ok(null);
    }

    return ok(mapPecaModeloRowToModel(data as PecaModeloRow));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar modelo de peça",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Lista modelos de peças com filtros e paginação
 */
export async function findAllPecasModelos(
  params: ListarPecasModelosParams
): Promise<Result<PaginatedResponse<PecaModeloListItem>>> {
  try {
    const db = createDbClient();
    const {
      tipoPeca,
      visibilidade,
      segmentoId,
      criadoPor,
      apenasAtivos = true,
      search,
      page = 1,
      pageSize = 20,
      orderBy = "created_at",
      orderDirection = "desc",
    } = params;

    // Query base - sem conteúdo para listagem
    let query = db
      .from(TABLE_PECAS_MODELOS)
      .select(
        "id, titulo, descricao, tipo_peca, visibilidade, segmento_id, criado_por, uso_count, created_at, updated_at",
        { count: "exact" }
      );

    // Filtros
    if (apenasAtivos) {
      query = query.eq("ativo", true);
    }

    if (tipoPeca) {
      query = query.eq("tipo_peca", tipoPeca);
    }

    if (visibilidade) {
      query = query.eq("visibilidade", visibilidade);
    }

    if (segmentoId) {
      query = query.eq("segmento_id", segmentoId);
    }

    if (criadoPor) {
      query = query.eq("criado_por", criadoPor);
    }

    if (search) {
      query = query.or(`titulo.ilike.%${search}%,descricao.ilike.%${search}%`);
    }

    // Ordenação
    const orderColumn =
      orderBy === "titulo"
        ? "titulo"
        : orderBy === "uso_count"
          ? "uso_count"
          : "created_at";
    query = query.order(orderColumn, { ascending: orderDirection === "asc" });

    // Paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    const items = (data || []).map((row) =>
      mapPecaModeloRowToListItem(row as unknown as PecaModeloRow)
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return ok({
      data: items,
      pagination: {
        page,
        limit: pageSize,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar modelos de peças",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Cria um novo modelo de peça
 */
export async function createPecaModelo(
  input: CreatePecaModeloInput,
  userId?: number
): Promise<Result<PecaModelo>> {
  try {
    const db = createDbClient();

    const insertData = {
      titulo: input.titulo,
      descricao: input.descricao ?? null,
      tipo_peca: input.tipoPeca ?? "outro",
      conteudo: input.conteudo ?? [],
      placeholders_definidos: input.placeholdersDefinidos ?? [],
      visibilidade: input.visibilidade ?? "privado",
      segmento_id: input.segmentoId ?? null,
      criado_por: userId ?? null,
    };

    const { data, error } = await db
      .from(TABLE_PECAS_MODELOS)
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(mapPecaModeloRowToModel(data as PecaModeloRow));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar modelo de peça",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza um modelo de peça existente
 */
export async function updatePecaModelo(
  id: number,
  input: UpdatePecaModeloInput
): Promise<Result<PecaModelo>> {
  try {
    const db = createDbClient();

    const updateData: Record<string, unknown> = {};

    if (input.titulo !== undefined) updateData.titulo = input.titulo;
    if (input.descricao !== undefined) updateData.descricao = input.descricao;
    if (input.tipoPeca !== undefined) updateData.tipo_peca = input.tipoPeca;
    if (input.conteudo !== undefined) updateData.conteudo = input.conteudo;
    if (input.placeholdersDefinidos !== undefined)
      updateData.placeholders_definidos = input.placeholdersDefinidos;
    if (input.visibilidade !== undefined)
      updateData.visibilidade = input.visibilidade;
    if (input.segmentoId !== undefined)
      updateData.segmento_id = input.segmentoId;

    const { data, error } = await db
      .from(TABLE_PECAS_MODELOS)
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(mapPecaModeloRowToModel(data as PecaModeloRow));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao atualizar modelo de peça",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Soft delete de um modelo de peça
 */
export async function deletePecaModelo(id: number): Promise<Result<void>> {
  try {
    const db = createDbClient();

    const { error } = await db
      .from(TABLE_PECAS_MODELOS)
      .update({ ativo: false })
      .eq("id", id);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao deletar modelo de peça",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// CONTRATO_DOCUMENTOS - CRUD
// =============================================================================

/**
 * Busca vinculação contrato-documento por ID
 */
export async function findContratoDocumentoById(
  id: number
): Promise<Result<ContratoDocumento | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_CONTRATO_DOCUMENTOS)
      .select(
        `
        *,
        documentos:documento_id (id, titulo, created_at),
        arquivos:arquivo_id (id, nome, b2_url, tipo_mime),
        pecas_modelos:gerado_de_modelo_id (id, titulo)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    if (!data) {
      return ok(null);
    }

    return ok(
      mapContratoDocumentoRowToModel(
        data as ContratoDocumentoRow & {
          documentos?: {
            id: number;
            titulo: string;
            created_at: string;
          } | null;
          pecas_modelos?: { id: number; titulo: string } | null;
        }
      )
    );
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar vinculação contrato-documento",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Lista documentos vinculados a um contrato
 */
export async function findContratoDocumentosByContrato(
  params: ListarContratoDocumentosParams
): Promise<Result<PaginatedResponse<ContratoDocumento>>> {
  try {
    const db = createDbClient();
    const { contratoId, tipoPeca, page = 1, pageSize = 20 } = params;

    let query = db
      .from(TABLE_CONTRATO_DOCUMENTOS)
      .select(
        `
        *,
        documentos:documento_id (id, titulo, created_at),
        arquivos:arquivo_id (id, nome, b2_url, tipo_mime),
        pecas_modelos:gerado_de_modelo_id (id, titulo)
      `,
        { count: "exact" }
      )
      .eq("contrato_id", contratoId)
      .order("created_at", { ascending: false });

    if (tipoPeca) {
      query = query.eq("tipo_peca", tipoPeca);
    }

    // Paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    const items = (data || []).map((row) =>
      mapContratoDocumentoRowToModel(
        row as ContratoDocumentoRow & {
          documentos?: {
            id: number;
            titulo: string;
            created_at: string;
          } | null;
          pecas_modelos?: { id: number; titulo: string } | null;
        }
      )
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return ok({
      data: items,
      pagination: {
        page,
        limit: pageSize,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar documentos do contrato",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Cria uma vinculação contrato-documento
 */
export async function createContratoDocumento(
  input: CreateContratoDocumentoInput,
  userId?: number
): Promise<Result<ContratoDocumento>> {
  try {
    const db = createDbClient();

    const insertData = {
      contrato_id: input.contratoId,
      documento_id: input.documentoId ?? null,
      arquivo_id: input.arquivoId ?? null,
      gerado_de_modelo_id: input.geradoDeModeloId ?? null,
      tipo_peca: input.tipoPeca ?? null,
      observacoes: input.observacoes ?? null,
      created_by: userId ?? null,
    };

    const { data, error } = await db
      .from(TABLE_CONTRATO_DOCUMENTOS)
      .insert(insertData)
      .select(
        `
        *,
        documentos:documento_id (id, titulo, created_at),
        arquivos:arquivo_id (id, nome, b2_url, tipo_mime),
        pecas_modelos:gerado_de_modelo_id (id, titulo)
      `
      )
      .single();

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(
      mapContratoDocumentoRowToModel(
        data as ContratoDocumentoRow & {
          documentos?: {
            id: number;
            titulo: string;
            created_at: string;
          } | null;
          arquivos?: {
            id: number;
            nome: string;
            b2_url: string;
            tipo_mime: string;
          } | null;
          pecas_modelos?: { id: number; titulo: string } | null;
        }
      )
    );
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao criar vinculação contrato-documento",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Remove vinculação contrato-documento
 */
export async function deleteContratoDocumento(
  id: number
): Promise<Result<void>> {
  try {
    const db = createDbClient();

    const { error } = await db
      .from(TABLE_CONTRATO_DOCUMENTOS)
      .delete()
      .eq("id", id);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao remover vinculação contrato-documento",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Remove vinculação por contratoId e documentoId
 */
export async function deleteContratoDocumentoByIds(
  contratoId: number,
  documentoId: number
): Promise<Result<void>> {
  try {
    const db = createDbClient();

    const { error } = await db
      .from(TABLE_CONTRATO_DOCUMENTOS)
      .delete()
      .eq("contrato_id", contratoId)
      .eq("documento_id", documentoId);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao remover vinculação contrato-documento",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
