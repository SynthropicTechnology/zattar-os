import { z } from "zod";
import { Result, err, appError, PaginatedResponse } from "@/types";
import {
  Audiencia,
  EnderecoPresencial,
  createAudienciaSchema,
  updateAudienciaSchema,
  ListarAudienciasParams,
  StatusAudiencia,
} from "./domain";
import * as repo from "./repository";

export async function criarAudiencia(
  input: z.infer<typeof createAudienciaSchema>
): Promise<Result<Audiencia>> {
  const validation = createAudienciaSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError.message, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      })
    );
  }

  try {
    const { processoId, tipoAudienciaId } = validation.data;

    const processoExistsResult = await repo.processoExists(processoId);
    if (!processoExistsResult.success || !processoExistsResult.data) {
      return err(appError("VALIDATION_ERROR", "Processo não encontrado."));
    }

    if (tipoAudienciaId) {
      const tipoExistsResult = await repo.tipoAudienciaExists(tipoAudienciaId);
      if (!tipoExistsResult.success || !tipoExistsResult.data) {
        return err(
          appError("VALIDATION_ERROR", "Tipo de audiência não encontrado.")
        );
      }
    }

    const result = await repo.saveAudiencia(validation.data);
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(e);
    return err(
      appError("INTERNAL_ERROR", "Erro ao criar audiência.", {
        originalError: message,
      })
    );
  }
}

export async function buscarAudiencia(
  id: number
): Promise<Result<Audiencia | null>> {
  if (id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID inválido."));
  }
  return repo.findAudienciaById(id);
}

export async function listarAudiencias(
  params: ListarAudienciasParams
): Promise<Result<PaginatedResponse<Audiencia>>> {
  const sanitizedParams: ListarAudienciasParams = {
    ...params,
    pagina: params.pagina && params.pagina > 0 ? params.pagina : 1,
    limite:
      params.limite && params.limite > 0 && params.limite <= 100
        ? params.limite
        : 10,
    ordenarPor: params.ordenarPor || "dataInicio",
    ordem: params.ordem || "asc",
  };
  return repo.findAllAudiencias(sanitizedParams);
}

export async function atualizarAudiencia(
  id: number,
  input: z.infer<typeof updateAudienciaSchema>
): Promise<Result<Audiencia>> {
  const validation = updateAudienciaSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      appError("VALIDATION_ERROR", firstError.message, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      })
    );
  }

  try {
    const audienciaExistenteResult = await repo.findAudienciaById(id);
    if (!audienciaExistenteResult.success || !audienciaExistenteResult.data) {
      return err(appError("NOT_FOUND", "Audiência não encontrada."));
    }

    const { processoId, tipoAudienciaId } = validation.data;

    if (processoId) {
      const processoExistsResult = await repo.processoExists(processoId);
      if (!processoExistsResult.success || !processoExistsResult.data) {
        return err(appError("VALIDATION_ERROR", "Processo não encontrado."));
      }
    }

    if (tipoAudienciaId) {
      const tipoExistsResult = await repo.tipoAudienciaExists(tipoAudienciaId);
      if (!tipoExistsResult.success || !tipoExistsResult.data) {
        return err(
          appError("VALIDATION_ERROR", "Tipo de audiência não encontrado.")
        );
      }
    }

    const result = await repo.updateAudiencia(
      id,
      validation.data,
      audienciaExistenteResult.data
    );
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(e);
    return err(
      appError("INTERNAL_ERROR", "Erro ao atualizar audiência.", {
        originalError: message,
      })
    );
  }
}

export async function atualizarObservacoesAudiencia(
  id: number,
  observacoes: string | null
): Promise<Result<Audiencia>> {
  if (id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID inválido."));
  }

  const audienciaExistenteResult = await repo.findAudienciaById(id);
  if (!audienciaExistenteResult.success || !audienciaExistenteResult.data) {
    return err(appError("NOT_FOUND", "Audiência não encontrada."));
  }

  return repo.atualizarObservacoes(id, observacoes);
}

export async function atualizarUrlVirtualAudiencia(
  id: number,
  urlAudienciaVirtual: string | null
): Promise<Result<Audiencia>> {
  if (id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID inválido."));
  }

  if (urlAudienciaVirtual) {
    try {
      new URL(urlAudienciaVirtual);
    } catch {
      return err(appError("VALIDATION_ERROR", "URL inválida."));
    }
  }

  return repo.atualizarUrlVirtual(id, urlAudienciaVirtual);
}

export async function atualizarEnderecoPresencialAudiencia(
  id: number,
  enderecoPresencial: EnderecoPresencial | null
): Promise<Result<Audiencia>> {
  if (id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID inválido."));
  }

  return repo.atualizarEnderecoPresencial(id, enderecoPresencial);
}

export async function atualizarStatusAudiencia(
  id: number,
  status: StatusAudiencia,
  statusDescricao?: string
): Promise<Result<Audiencia>> {
  if (!Object.values(StatusAudiencia).includes(status)) {
    return err(appError("VALIDATION_ERROR", "Status inválido."));
  }

  const audienciaExistenteResult = await repo.findAudienciaById(id);
  if (!audienciaExistenteResult.success || !audienciaExistenteResult.data) {
    return err(appError("NOT_FOUND", "Audiência não encontrada."));
  }

  // TODO: Log the user who made the change if a logging system exists
  // logService.log(`User ${userId} changed status of audiencia ${id} to ${status}`);

  return repo.atualizarStatus(id, status, statusDescricao);
}

/**
 * Helper para Portal do Cliente: Lista audiências associadas ao CPF retornando array tipado.
 */
export async function listarAudienciasPorBuscaCpf(
  cpf: string
): Promise<Audiencia[]> {
  const result = await repo.findAudienciasByClienteCpf(cpf);
  if (!result.success) return [];
  return result.data;
}

// =============================================================================
// BUSCAS POR CPF/CNPJ (para MCP Tools - FASE 1)
// =============================================================================

/**
 * Busca audiências vinculadas a um cliente por CPF
 */
export async function buscarAudienciasPorClienteCPF(
  cpf: string,
  status?: string
): Promise<import('@/types').Result<import('./domain').Audiencia[]>> {
  const { normalizarDocumento } = await import('@/app/(authenticated)/partes');
  const { err, appError } = await import('@/types');

  if (!cpf || !cpf.trim()) {
    return err(appError('VALIDATION_ERROR', 'CPF e obrigatorio'));
  }

  const cpfNormalizado = normalizarDocumento(cpf);

  if (cpfNormalizado.length !== 11) {
    return err(appError('VALIDATION_ERROR', 'CPF deve conter 11 digitos'));
  }

  const result = await repo.findAudienciasByClienteCpf(cpfNormalizado);
  if (!result.success) return result;

  // Filtrar por status se fornecido
  let audiencias = result.data;
  if (status) {
    audiencias = audiencias.filter((a) => a.status === status);
  }

  return { success: true, data: audiencias };
}

/**
 * Busca audiências vinculadas a um cliente por CNPJ
 */
export async function buscarAudienciasPorClienteCNPJ(
  cnpj: string,
  status?: string
): Promise<import('@/types').Result<import('./domain').Audiencia[]>> {
  const { normalizarDocumento } = await import('@/app/(authenticated)/partes');
  const { err, appError } = await import('@/types');

  if (!cnpj || !cnpj.trim()) {
    return err(appError('VALIDATION_ERROR', 'CNPJ e obrigatorio'));
  }

  const cnpjNormalizado = normalizarDocumento(cnpj);

  if (cnpjNormalizado.length !== 14) {
    return err(appError('VALIDATION_ERROR', 'CNPJ deve conter 14 digitos'));
  }

  // Busca audiências do cliente via CNPJ usando função dedicada do repository
  const result = await repo.findAudienciasByClienteCnpj(cnpjNormalizado);

  if (!result.success) return result;

  // Filtrar por status se fornecido
  let audiencias = result.data;
  if (status) {
    audiencias = audiencias.filter((a) => a.status === status);
  }

  return { success: true, data: audiencias };
}

/**
 * Busca audiências de um processo específico pelo número processual
 */
export async function buscarAudienciasPorNumeroProcesso(
  numeroProcesso: string,
  status?: string
): Promise<import('@/types').Result<import('./domain').Audiencia[]>> {
  const { err, appError } = await import('@/types');
  // Usar service diretamente (não Server Action)
  const { buscarProcessoPorNumero } = await import('@/app/(authenticated)/processos/service');

  if (!numeroProcesso || !numeroProcesso.trim()) {
    return err(appError('VALIDATION_ERROR', 'Numero do processo e obrigatorio'));
  }

  // Busca processo pelo número (service já normaliza internamente)
  const processoResult = await buscarProcessoPorNumero(numeroProcesso.trim());

  if (!processoResult.success || !processoResult.data) {
    return err(appError('NOT_FOUND', 'Processo nao encontrado'));
  }

  const processoId = processoResult.data.id;

  // Busca audiências do processo usando função dedicada do repository
  const result = await repo.findAudienciasByProcessoId(
    processoId,
    status as import('./domain').StatusAudiencia | undefined
  );

  if (!result.success) return result;

  return { success: true, data: result.data };
}
