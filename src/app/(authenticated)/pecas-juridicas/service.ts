/**
 * PEÇAS JURÍDICAS FEATURE - Camada de Serviço
 *
 * Este arquivo contém a lógica de negócio para:
 * - Gestão de modelos de peças jurídicas
 * - Geração de peças a partir de contratos
 * - Vinculação de documentos a contratos
 */

import { Result, ok, err, appError, PaginatedResponse } from "@/types";
import * as repository from "./repository";
import {
  createPecaModeloSchema,
  updatePecaModeloSchema,
  createContratoDocumentoSchema,
  gerarPecaSchema,
  type PecaModelo,
  type PecaModeloListItem,
  type ContratoDocumento,
  type CreatePecaModeloInput,
  type UpdatePecaModeloInput,
  type CreateContratoDocumentoInput,
  type GerarPecaInput,
  type ListarPecasModelosParams,
  type ListarContratoDocumentosParams,
} from "./domain";
import {
  resolvePlateContent,
  generatePreview,
  extractPlaceholders,
  type PlaceholderContext,
  type PlaceholderResolution,
} from "./placeholders";

// =============================================================================
// PECAS MODELOS - SERVICE
// =============================================================================

/**
 * Busca modelo de peça por ID
 */
export async function buscarPecaModelo(
  id: number
): Promise<Result<PecaModelo | null>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID do modelo inválido"));
  }

  return repository.findPecaModeloById(id);
}

/**
 * Lista modelos de peças com filtros
 */
export async function listarPecasModelos(
  params: ListarPecasModelosParams
): Promise<Result<PaginatedResponse<PecaModeloListItem>>> {
  return repository.findAllPecasModelos(params);
}

/**
 * Cria um novo modelo de peça
 */
export async function criarPecaModelo(
  input: CreatePecaModeloInput,
  userId?: number
): Promise<Result<PecaModelo>> {
  // Validação
  const validation = createPecaModeloSchema.safeParse(input);
  if (!validation.success) {
    return err(
      appError("VALIDATION_ERROR", "Dados inválidos", {
        errors: validation.error.flatten().fieldErrors,
      })
    );
  }

  // Extrair placeholders do conteúdo
  const conteudoStr = JSON.stringify(validation.data.conteudo);
  const placeholdersExtraidos = extractPlaceholders(conteudoStr);

  const inputComPlaceholders: CreatePecaModeloInput = {
    ...validation.data,
    placeholdersDefinidos: placeholdersExtraidos,
  };

  return repository.createPecaModelo(inputComPlaceholders, userId);
}

/**
 * Atualiza um modelo de peça existente
 */
export async function atualizarPecaModelo(
  id: number,
  input: UpdatePecaModeloInput
): Promise<Result<PecaModelo>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID do modelo inválido"));
  }

  // Validação
  const validation = updatePecaModeloSchema.safeParse(input);
  if (!validation.success) {
    return err(
      appError("VALIDATION_ERROR", "Dados inválidos", {
        errors: validation.error.flatten().fieldErrors,
      })
    );
  }

  // Se conteúdo foi atualizado, extrair placeholders
  let inputFinal = validation.data;
  if (validation.data.conteudo) {
    const conteudoStr = JSON.stringify(validation.data.conteudo);
    const placeholdersExtraidos = extractPlaceholders(conteudoStr);
    inputFinal = {
      ...validation.data,
      placeholdersDefinidos: placeholdersExtraidos,
    };
  }

  return repository.updatePecaModelo(id, inputFinal);
}

/**
 * Deleta (soft delete) um modelo de peça
 */
export async function deletarPecaModelo(id: number): Promise<Result<void>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID do modelo inválido"));
  }

  return repository.deletePecaModelo(id);
}

// =============================================================================
// GERAÇÃO DE PEÇAS
// =============================================================================

export interface GerarPecaResult {
  documentoId: number;
  titulo: string;
  placeholdersResolvidos: number;
  placeholdersNaoResolvidos: number;
  resolutions: PlaceholderResolution[];
}

/**
 * Gera uma peça jurídica a partir de um modelo e dados do contrato
 *
 * Esta função:
 * 1. Busca o modelo
 * 2. Resolve os placeholders com dados do contexto
 * 3. Cria um novo documento com o conteúdo processado
 * 4. Vincula o documento ao contrato
 */
export async function gerarPecaDeContrato(
  input: GerarPecaInput,
  context: PlaceholderContext,
  userId?: number
): Promise<Result<GerarPecaResult>> {
  // Validação
  const validation = gerarPecaSchema.safeParse(input);
  if (!validation.success) {
    return err(
      appError("VALIDATION_ERROR", "Dados inválidos", {
        errors: validation.error.flatten().fieldErrors,
      })
    );
  }

  const { contratoId, modeloId, titulo } = validation.data;

  // 1. Buscar modelo
  const modeloResult = await repository.findPecaModeloById(modeloId);
  if (!modeloResult.success) {
    return err(modeloResult.error);
  }

  if (!modeloResult.data) {
    return err(appError("NOT_FOUND", "Modelo de peça não encontrado"));
  }

  const modelo = modeloResult.data;

  // 2. Resolver placeholders
  const {
    result: conteudoProcessado,
    resolutions,
    unresolvedCount,
  } = resolvePlateContent(modelo.conteudo as unknown[], context);

  // 3. Criar documento (importar dinamicamente para evitar dependência circular)
  const { criarDocumento } = await import("@/app/(authenticated)/documentos/service");

  if (!userId) {
    return err(appError("VALIDATION_ERROR", "Usuário não autenticado"));
  }

  let documento;
  try {
    documento = await criarDocumento(
      {
        titulo,
        conteudo: conteudoProcessado,
      },
      userId
    );
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro ao criar documento"
      )
    );
  }

  // 4. Vincular ao contrato
  const vinculoResult = await repository.createContratoDocumento(
    {
      contratoId,
      documentoId: documento.id,
      geradoDeModeloId: modeloId,
      tipoPeca: modelo.tipoPeca,
    },
    userId
  );

  if (!vinculoResult.success) {
    // Se falhou vincular, tentar deletar o documento criado
    // (não bloquear se falhar)
    return err(vinculoResult.error);
  }

  return ok({
    documentoId: documento.id,
    titulo: documento.titulo,
    placeholdersResolvidos: resolutions.length - unresolvedCount,
    placeholdersNaoResolvidos: unresolvedCount,
    resolutions,
  });
}

/**
 * Gera preview dos dados que serão substituídos
 */
export async function previewGeracaoPeca(
  modeloId: number,
  context: PlaceholderContext
): Promise<
  Result<{
    placeholders: PlaceholderResolution[];
    resolvidosCount: number;
    naoResolvidosCount: number;
  }>
> {
  // Buscar modelo
  const modeloResult = await repository.findPecaModeloById(modeloId);
  if (!modeloResult.success) {
    return err(modeloResult.error);
  }

  if (!modeloResult.data) {
    return err(appError("NOT_FOUND", "Modelo de peça não encontrado"));
  }

  const modelo = modeloResult.data;

  // Gerar preview
  const placeholders = generatePreview(modelo.placeholdersDefinidos, context);
  const resolvidosCount = placeholders.filter((p) => p.resolved).length;
  const naoResolvidosCount = placeholders.filter((p) => !p.resolved).length;

  return ok({
    placeholders,
    resolvidosCount,
    naoResolvidosCount,
  });
}

// =============================================================================
// CONTRATO DOCUMENTOS - SERVICE
// =============================================================================

/**
 * Lista documentos vinculados a um contrato
 */
export async function listarDocumentosDoContrato(
  params: ListarContratoDocumentosParams
): Promise<Result<PaginatedResponse<ContratoDocumento>>> {
  if (!params.contratoId || params.contratoId <= 0) {
    return err(appError("VALIDATION_ERROR", "ID do contrato inválido"));
  }

  return repository.findContratoDocumentosByContrato(params);
}

/**
 * Vincula um documento existente a um contrato
 */
export async function vincularDocumentoAoContrato(
  input: CreateContratoDocumentoInput,
  userId?: number
): Promise<Result<ContratoDocumento>> {
  // Validação
  const validation = createContratoDocumentoSchema.safeParse(input);
  if (!validation.success) {
    return err(
      appError("VALIDATION_ERROR", "Dados inválidos", {
        errors: validation.error.flatten().fieldErrors,
      })
    );
  }

  return repository.createContratoDocumento(validation.data, userId);
}

/**
 * Desvincula um documento de um contrato
 */
export async function desvincularDocumentoDoContrato(
  contratoId: number,
  documentoId: number
): Promise<Result<void>> {
  if (!contratoId || contratoId <= 0) {
    return err(appError("VALIDATION_ERROR", "ID do contrato inválido"));
  }

  if (!documentoId || documentoId <= 0) {
    return err(appError("VALIDATION_ERROR", "ID do documento inválido"));
  }

  return repository.deleteContratoDocumentoByIds(contratoId, documentoId);
}

/**
 * Desvincula um item (documento ou arquivo) do contrato pelo ID do vínculo
 */
export async function desvincularItemDoContrato(
  id: number
): Promise<Result<void>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID do vínculo inválido"));
  }

  return repository.deleteContratoDocumento(id);
}
