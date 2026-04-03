'use server';

/**
 * PROCESSOS SERVICE - Camada de Regras de Negocio (Casos de Uso)
 *
 * Este arquivo contem a logica de negocio para Processos.
 *
 * CONVENCOES:
 * - Funcoes nomeadas como acoes: criar, atualizar, listar, buscar
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositorio)
 * - NUNCA importar React/Next.js aqui
 */

import { Result, err, appError, PaginatedResponse } from "@/types";
import { type DbClient } from "@/lib/supabase/db-client";
import {
  type Processo,
  type ProcessoUnificado,
  type Movimentacao,
  type CreateProcessoInput,
  type UpdateProcessoInput,
  type ListarProcessosParams,
  createProcessoSchema,
  updateProcessoSchema,
  validarNumeroCNJ,
} from "./domain";
import {
  findProcessoById,
  findProcessoUnificadoById,
  findAllProcessos,
  findAllTribunais,
  findTimelineByProcessoId,
  saveProcesso,
  updateProcesso as updateProcessoRepo,
  advogadoExists,
  usuarioExists,
} from "./repository";
// FSD: server-only service — intentional deep import to avoid bundling Redis/Node.js deps in client barrel
import { usuarioRepository } from "@/app/(authenticated)/usuarios/repository";

// =============================================================================
// SERVICOS - PROCESSO
// =============================================================================

/**
 * Cria um novo processo
 *
 * Regras de negocio:
 * - Campos obrigatorios: idPje, advogadoId, origem, trt, grau, numeroProcesso, etc.
 * - Advogado deve existir no sistema
 * - Numero do processo deve seguir padrao CNJ
 * - Verifica unicidade (constraint do banco)
 */
export async function criarProcesso(
  input: CreateProcessoInput,
  client?: DbClient
): Promise<Result<Processo>> {
  // 1. Validar input com Zod
  const validation = createProcessoSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError.message, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      })
    );
  }

  const dadosValidados = validation.data;

  // 2. Validar numero CNJ (validacao adicional)
  if (!validarNumeroCNJ(dadosValidados.numeroProcesso)) {
    return err(
      appError(
        "VALIDATION_ERROR",
        "Numero do processo nao segue o padrao CNJ",
        {
          field: "numeroProcesso",
          valor: dadosValidados.numeroProcesso,
        }
      )
    );
  }

  // 3. Verificar se advogado existe
  const advogadoExistsResult = await advogadoExists(dadosValidados.advogadoId, client);
  if (!advogadoExistsResult.success) {
    return err(advogadoExistsResult.error);
  }
  if (!advogadoExistsResult.data) {
    return err(
      appError("NOT_FOUND", "Advogado nao encontrado", {
        field: "advogadoId",
        advogadoId: dadosValidados.advogadoId,
      })
    );
  }

  // 4. Verificar se responsavel existe (se fornecido)
  if (dadosValidados.responsavelId) {
    const usuarioExistsResult = await usuarioExists(
      dadosValidados.responsavelId,
      client
    );
    if (!usuarioExistsResult.success) {
      return err(usuarioExistsResult.error);
    }
    if (!usuarioExistsResult.data) {
      return err(
        appError("NOT_FOUND", "Responsavel nao encontrado", {
          field: "responsavelId",
          responsavelId: dadosValidados.responsavelId,
        })
      );
    }
  }

  // 5. Persistir via repositorio
  return saveProcesso(dadosValidados, client);
}

/**
 * Busca um processo pelo ID
 *
 * Retorna null se nao encontrar (nao e erro)
 */
export async function buscarProcesso(
  id: number,
  client?: DbClient
): Promise<Result<Processo | null>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID invalido"));
  }

  return findProcessoById(id, client);
}

/**
 * Busca um processo unificado pelo ID
 *
 * Usa a view acervo_unificado para retornar dados unificados com fonte da verdade.
 * Retorna null se nao encontrar (nao e erro)
 */
export async function buscarProcessoUnificado(
  id: number,
  client?: DbClient
): Promise<Result<ProcessoUnificado | null>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID invalido"));
  }

  return findProcessoUnificadoById(id, client);
}

/**
 * Lista processos com filtros e paginacao
 *
 * Suporta 19 filtros:
 * - Paginacao: pagina, limite
 * - Busca geral: busca
 * - Ordenacao: ordenarPor, ordem
 * - Identificacao: origem, trt, grau, numeroProcesso, classeJudicial, codigoStatusProcesso
 * - Partes: nomeParteAutora, nomeParteRe, descricaoOrgaoJulgador
 * - Booleanos: segredoJustica, juizoDigital, temAssociacao, temProximaAudiencia, semResponsavel
 * - Datas: dataAutuacaoInicio/Fim, dataArquivamentoInicio/Fim, dataProximaAudienciaInicio/Fim
 * - Relacionamentos: advogadoId, responsavelId, clienteId
 */
export async function listarProcessos(
  params: ListarProcessosParams = {},
  client?: DbClient
): Promise<Result<PaginatedResponse<Processo | ProcessoUnificado>>> {
  // Sanitizar parametros de paginacao
  const sanitizedParams: ListarProcessosParams = {
    ...params,
    pagina: Math.max(1, params.pagina ?? 1),
    limite: Math.min(100, Math.max(1, params.limite ?? 50)),
  };

  const result = await findAllProcessos(sanitizedParams, client);
  if (!result.success) return err(result.error);

  const pagina = sanitizedParams.pagina ?? 1;
  const limite = sanitizedParams.limite ?? 50;
  const total = result.total ?? 0;
  const totalPages = Math.ceil(total / limite);

  return {
    success: true,
    data: {
      data: result.data,
      pagination: {
        page: pagina,
        limit: limite,
        total,
        totalPages,
        hasMore: pagina < totalPages,
      },
    },
  };
}

/**
 * Busca processo por numero processual (formato CNJ ou simplificado)
 *
 * Usado internamente por services que precisam localizar um processo
 * pelo numero, sem passar pela camada de Server Actions.
 */
export async function buscarProcessoPorNumero(
  numeroProcesso: string,
  client?: DbClient
): Promise<Result<Processo | ProcessoUnificado | null>> {
  if (!numeroProcesso || !numeroProcesso.trim()) {
    return err(appError("VALIDATION_ERROR", "Numero do processo e obrigatorio"));
  }

  // Importar utils dinamicamente para evitar dependencia circular
  const { normalizarNumeroProcesso } = await import("./utils");
  const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso.trim());

  const result = await listarProcessos(
    { numeroProcesso: numeroNormalizado, limite: 1 },
    client
  );

  if (!result.success) {
    return err(result.error);
  }

  if (!result.data.data || result.data.data.length === 0) {
    return { success: true, data: null };
  }

  return { success: true, data: result.data.data[0] };
}

/**
 * Atualiza um processo existente
 *
 * Regras de negocio:
 * - Processo precisa existir
 * - Se alterar advogadoId, novo advogado deve existir
 * - Se alterar responsavelId, novo responsavel deve existir
 * - Se alterar numeroProcesso, validar formato CNJ
 * - Preserva estado anterior para auditoria
 */
export async function atualizarProcesso(
  id: number,
  input: UpdateProcessoInput,
  client?: DbClient
): Promise<Result<Processo>> {
  // 1. Validar ID
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID invalido"));
  }

  // 2. Validar input com Zod
  const validation = updateProcessoSchema.safeParse(input);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError.message, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      })
    );
  }

  // 3. Verificar se ha algo para atualizar
  const dadosValidados = validation.data;
  if (Object.keys(dadosValidados).length === 0) {
    return err(appError("VALIDATION_ERROR", "Nenhum campo para atualizar"));
  }

  // 4. Verificar se processo existe
  const existingResult = await findProcessoById(id, client);
  if (!existingResult.success) {
    return existingResult;
  }
  if (!existingResult.data) {
    return err(appError("NOT_FOUND", `Processo com ID ${id} nao encontrado`));
  }

  const processoExistente = existingResult.data;

  // 5. Se alterando numeroProcesso, validar formato CNJ
  if (
    dadosValidados.numeroProcesso &&
    dadosValidados.numeroProcesso !== processoExistente.numeroProcesso
  ) {
    if (!validarNumeroCNJ(dadosValidados.numeroProcesso)) {
      return err(
        appError(
          "VALIDATION_ERROR",
          "Numero do processo nao segue o padrao CNJ",
          {
            field: "numeroProcesso",
            valor: dadosValidados.numeroProcesso,
          }
        )
      );
    }
  }

  // 6. Se alterando advogadoId, verificar se novo advogado existe
  if (
    dadosValidados.advogadoId &&
    dadosValidados.advogadoId !== processoExistente.advogadoId
  ) {
    const advogadoExistsResult = await advogadoExists(
      dadosValidados.advogadoId,
      client
    );
    if (!advogadoExistsResult.success) {
      return err(advogadoExistsResult.error);
    }
    if (!advogadoExistsResult.data) {
      return err(
        appError("NOT_FOUND", "Novo advogado nao encontrado", {
          field: "advogadoId",
          advogadoId: dadosValidados.advogadoId,
        })
      );
    }
  }

  // 7. Se alterando responsavelId, verificar se novo responsavel existe
  if (
    dadosValidados.responsavelId !== undefined &&
    dadosValidados.responsavelId !== null &&
    dadosValidados.responsavelId !== processoExistente.responsavelId
  ) {
    const usuarioExistsResult = await usuarioExists(
      dadosValidados.responsavelId,
      client
    );
    if (!usuarioExistsResult.success) {
      return err(usuarioExistsResult.error);
    }
    if (!usuarioExistsResult.data) {
      return err(
        appError("NOT_FOUND", "Novo responsavel nao encontrado", {
          field: "responsavelId",
          responsavelId: dadosValidados.responsavelId,
        })
      );
    }
  }

  // 8. Atualizar via repositorio
  return updateProcessoRepo(id, dadosValidados, processoExistente, client);
}

/**
 * Busca timeline/movimentacoes de um processo
 *
 * PLACEHOLDER: Sera implementado na Fase 4 (Integracao PJE)
 */
export async function buscarTimeline(
  processoId: number,
  client?: DbClient
): Promise<Result<Movimentacao[]>> {
  if (!processoId || processoId <= 0) {
    return err(appError("VALIDATION_ERROR", "ID invalido"));
  }

  return findTimelineByProcessoId(processoId, client);
}

/**
 * Busca usuarios responsaveis pelos processos listados
 *
 * Helper para resolver os nomes dos responsaveis para exibicao na UI
 */
export async function buscarUsuariosRelacionados(
  processos: (Processo | ProcessoUnificado)[]
): Promise<Record<number, { nome: string; avatarUrl?: string | null }>> {
  const ids = new Set<number>();

  processos.forEach((p) => {
    if (p.responsavelId) {
      ids.add(p.responsavelId);
    }
  });

  if (ids.size === 0) {
    return {};
  }

  try {
    const usuarios = await usuarioRepository.findByIds(Array.from(ids));
    const map: Record<number, { nome: string; avatarUrl?: string | null }> = {};

    usuarios.forEach((u) => {
      map[u.id] = { nome: u.nomeExibicao || u.nomeCompleto, avatarUrl: u.avatarUrl ?? null };
    });

    return map;
  } catch (error) {
    console.error("Erro ao buscar usuarios relacionados:", error);
    // Retorna mapa vazio em caso de erro para nao quebrar a UI
    return {};
  }
}

/**
 * Lista todos os tribunais ativos
 */
export async function listarTribunais(
  client?: DbClient
): Promise<
  Result<Array<{ codigo: string; nome: string }>>
> {
  return findAllTribunais(client);
}

// =============================================================================
// BUSCAS POR CPF/CNPJ (para MCP Tools - FASE 1)
// =============================================================================

/**
 * Busca processos vinculados a um cliente por CPF
 */
export async function buscarProcessosPorClienteCPF(
  cpf: string,
  limite: number = 50,
  client?: DbClient
): Promise<Result<Processo[]>> {
  // Import dynamically to avoid circular dependency
  const { findClienteByCPF } = await import("@/app/(authenticated)/partes/server");
  const { normalizarDocumento } = await import("@/app/(authenticated)/partes");

  if (!cpf || !cpf.trim()) {
    return err(appError("VALIDATION_ERROR", "CPF e obrigatorio"));
  }

  const cpfNormalizado = normalizarDocumento(cpf);

  if (cpfNormalizado.length !== 11) {
    return err(appError("VALIDATION_ERROR", "CPF deve conter 11 digitos"));
  }

  try {
    // Busca cliente por CPF
    const clienteResult = await findClienteByCPF(cpfNormalizado);
    if (!clienteResult.success) return err(clienteResult.error);
    if (!clienteResult.data) {
      return err(appError("NOT_FOUND", "Cliente nao encontrado"));
    }

    const clienteId = clienteResult.data.id;

    // Busca processos usando o filtro clienteId (já implementado na repository)
    const processosResult = await findAllProcessos({
      clienteId,
      limite,
      unified: false,
    }, client);

    if (!processosResult.success) return err(processosResult.error);

    return { success: true, data: processosResult.data as Processo[] };
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro ao buscar processos"
      )
    );
  }
}

/**
 * Busca processos vinculados a um cliente por CNPJ
 */
export async function buscarProcessosPorClienteCNPJ(
  cnpj: string,
  limite: number = 50,
  client?: DbClient
): Promise<Result<Processo[]>> {
  // Import dynamically to avoid circular dependency
  const { findClienteByCNPJ } = await import("@/app/(authenticated)/partes/server");
  const { normalizarDocumento } = await import("@/app/(authenticated)/partes");

  if (!cnpj || !cnpj.trim()) {
    return err(appError("VALIDATION_ERROR", "CNPJ e obrigatorio"));
  }

  const cnpjNormalizado = normalizarDocumento(cnpj);

  if (cnpjNormalizado.length !== 14) {
    return err(appError("VALIDATION_ERROR", "CNPJ deve conter 14 digitos"));
  }

  try {
    // Busca cliente por CNPJ
    const clienteResult = await findClienteByCNPJ(cnpjNormalizado);
    if (!clienteResult.success) return err(clienteResult.error);
    if (!clienteResult.data) {
      return err(appError("NOT_FOUND", "Cliente nao encontrado"));
    }

    const clienteId = clienteResult.data.id;

    // Busca processos usando o filtro clienteId (já implementado na repository)
    const processosResult = await findAllProcessos({
      clienteId,
      limite,
      unified: false,
    }, client);

    if (!processosResult.success) return err(processosResult.error);

    return { success: true, data: processosResult.data as Processo[] };
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro ao buscar processos"
      )
    );
  }
}
