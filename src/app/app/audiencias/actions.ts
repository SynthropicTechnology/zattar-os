'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import * as service from './service';
import {
  createAudienciaSchema,
  EnderecoPresencial,
  ListarAudienciasParams,
  StatusAudiencia,
  updateAudienciaSchema,
  Audiencia,
} from './domain';
import { PaginatedResponse } from '@/types';
import { createDbClient } from '@/lib/supabase';

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

function formatZodErrors(zodError: z.ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};
  zodError.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(err.message);
  });
  return formattedErrors;
}

function revalidateAudienciasPaths() {
  // Rotas do dashboard
  revalidatePath('/app/audiencias');
  revalidatePath('/app/audiencias/semana');
  revalidatePath('/app/audiencias/mes');
  revalidatePath('/app/audiencias/ano');
  revalidatePath('/app/audiencias/lista');
  // Portal do cliente
  revalidatePath('/portal/audiencias');
  // Dashboard principal (widget de audiências)
  revalidatePath('/app/dashboard');
}

// Helper to parse FormData into a cleaner object
function parseAudienciaFormData(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());

  // Parse complex fields
  let enderecoPresencial: FormDataEntryValue | null | unknown = rawData.enderecoPresencial;
  if (typeof enderecoPresencial === 'string' && enderecoPresencial) {
    try {
      enderecoPresencial = JSON.parse(enderecoPresencial);
    } catch (e) {
      console.error('Falha ao fazer parse de enderecoPresencial:', e);
      enderecoPresencial = null;
    }
  }

  // Helper to parse numbers safely
  const parseNumber = (value: unknown) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  };

  // Helper to parse empty strings as null/undefined
  const parseString = (value: unknown) => {
    if (typeof value === 'string') {
      return value.trim() === '' ? null : value.trim();
    }
    return value;
  };

  return {
    ...rawData,
    processoId: parseNumber(rawData.processoId),
    tipoAudienciaId: parseNumber(rawData.tipoAudienciaId),
    responsavelId: parseNumber(rawData.responsavelId),
    modalidade: parseString(rawData.modalidade),
    urlAudienciaVirtual: parseString(rawData.urlAudienciaVirtual),
    observacoes: parseString(rawData.observacoes),
    salaAudienciaNome: parseString(rawData.salaAudienciaNome),
    enderecoPresencial: enderecoPresencial || undefined,
  };
}

export async function actionCriarAudiencia(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const data = parseAudienciaFormData(formData);

  const validation = createAudienciaSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: 'Erro de validação.',
      errors: formatZodErrors(validation.error),
      message: 'Por favor, corrija os erros no formulário.',
    };
  }

  const result = await service.criarAudiencia(validation.data);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao criar audiência.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'Audiência criada com sucesso.',
  };
}

export async function actionAtualizarAudiencia(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const data = parseAudienciaFormData(formData);

  const validation = updateAudienciaSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: 'Erro de validação.',
      errors: formatZodErrors(validation.error),
      message: 'Por favor, corrija os erros no formulário.',
    };
  }

  const result = await service.atualizarAudiencia(id, validation.data);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar audiência.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'Audiência atualizada com sucesso.',
  };
}

export async function actionAtualizarStatusAudiencia(
  id: number,
  status: StatusAudiencia,
  statusDescricao?: string
): Promise<ActionResult> {
  const result = await service.atualizarStatusAudiencia(
    id,
    status,
    statusDescricao
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar status da audiência.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'Status da audiência atualizado com sucesso.',
  };
}

export async function actionAtualizarObservacoes(
  id: number,
  observacoes: string | null
): Promise<ActionResult> {
  const result = await service.atualizarObservacoesAudiencia(id, observacoes);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar observações da audiência.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'Observações atualizadas com sucesso.',
  };
}

export async function actionAtualizarUrlVirtual(
  id: number,
  urlAudienciaVirtual: string | null
): Promise<ActionResult> {
  const result = await service.atualizarUrlVirtualAudiencia(id, urlAudienciaVirtual);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar URL da audiência virtual.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'URL da audiência virtual atualizada com sucesso.',
  };
}

export async function actionAtualizarEnderecoPresencial(
  id: number,
  enderecoPresencial: EnderecoPresencial | null
): Promise<ActionResult> {
  const result = await service.atualizarEnderecoPresencialAudiencia(id, enderecoPresencial);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar endereço presencial da audiência.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'Endereço presencial atualizado com sucesso.',
  };
}

export async function actionListarAudiencias(
  params: ListarAudienciasParams
): Promise<ActionResult<PaginatedResponse<Audiencia>>> {
  const result = await service.listarAudiencias(params);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao listar audiências.',
    };
  }

  return {
    success: true,
    data: result.data,
    message: 'Audiências listadas com sucesso.',
  };
}

export async function actionBuscarAudienciaPorId(
  id: number
): Promise<ActionResult<Audiencia | null>> {
  const result = await service.buscarAudiencia(id);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao buscar audiência.',
    };
  }

  return {
    success: true,
    data: result.data,
    message: result.data ? 'Audiência encontrada.' : 'Audiência não encontrada.',
  };
}

export async function actionListarTiposAudiencia(params?: {
  limite?: number;
}): Promise<ActionResult<Array<{ id: number; descricao: string; is_virtual: boolean }>>> {
  try {
    const db = createDbClient();
    const limit = Math.min(Math.max(params?.limite ?? 200, 1), 1000);

    const { data, error } = await db
      .from('tipo_audiencia')
      .select('id, descricao, is_virtual')
      .order('descricao', { ascending: true })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message, message: 'Falha ao listar tipos de audiência.' };
    }

    return { success: true, data: (data as Array<{ id: number; descricao: string; is_virtual: boolean }>) ?? [], message: 'Tipos listados com sucesso.' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Falha ao listar tipos de audiência.',
    };
  }
}

export async function actionListarSalasAudiencia(params?: {
  trt?: string;
  grau?: string;
  orgao_julgador_id?: number;
  limite?: number;
}): Promise<ActionResult<Array<{ id: number; nome: string }>>> {
  try {
    const db = createDbClient();
    const limit = Math.min(Math.max(params?.limite ?? 500, 1), 2000);

    let query = db
      .from('sala_audiencia')
      .select('id, nome')
      .order('nome', { ascending: true })
      .limit(limit);

    if (params?.trt) query = query.eq('trt', params.trt);
    if (params?.grau) query = query.eq('grau', params.grau);
    if (params?.orgao_julgador_id) query = query.eq('orgao_julgador_id', params.orgao_julgador_id);

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message, message: 'Falha ao listar salas de audiência.' };
    }

    return { success: true, data: (data as Array<{ id: number; nome: string }>) ?? [], message: 'Salas listadas com sucesso.' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Falha ao listar salas de audiência.',
    };
  }
}

export async function actionCriarAudienciaPayload(
  payload: z.infer<typeof createAudienciaSchema>
): Promise<ActionResult<Audiencia>> {
  const validation = createAudienciaSchema.safeParse(payload);
  if (!validation.success) {
    return {
      success: false,
      error: 'Erro de validação.',
      errors: formatZodErrors(validation.error),
      message: 'Por favor, corrija os erros no formulário.',
    };
  }

  const result = await service.criarAudiencia(validation.data);
  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao criar audiência.',
    };
  }

  revalidateAudienciasPaths();
  return {
    success: true,
    data: result.data,
    message: 'Audiência criada com sucesso.',
  };
}

// =============================================================================
// BUSCAS POR CPF/CNPJ (para MCP Tools - FASE 1)
// =============================================================================

/**
 * Busca audiências vinculadas a um cliente por CPF
 */
export async function actionBuscarAudienciasPorCPF(
  cpf: string,
  status?: StatusAudiencia
): Promise<ActionResult<Audiencia[]>> {
  try {
    if (!cpf || !cpf.trim()) {
      return {
        success: false,
        error: 'CPF invalido',
        message: 'CPF e obrigatorio',
      };
    }

    const result = await service.buscarAudienciasPorClienteCPF(cpf, status);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: `${result.data.length} audiência(s) encontrada(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Erro ao buscar audiências.',
    };
  }
}

/**
 * Busca audiências vinculadas a um cliente por CNPJ
 */
export async function actionBuscarAudienciasPorCNPJ(
  cnpj: string,
  status?: StatusAudiencia
): Promise<ActionResult<Audiencia[]>> {
  try {
    if (!cnpj || !cnpj.trim()) {
      return {
        success: false,
        error: 'CNPJ invalido',
        message: 'CNPJ e obrigatorio',
      };
    }

    const result = await service.buscarAudienciasPorClienteCNPJ(cnpj, status);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: `${result.data.length} audiência(s) encontrada(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Erro ao buscar audiências.',
    };
  }
}

// =============================================================================
// BUSCAS POR NUMERO DE PROCESSO (para MCP Tools - FASE 2)
// =============================================================================

/**
 * Busca audiências de um processo específico pelo número processual
 */
export async function actionBuscarAudienciasPorNumeroProcesso(
  numeroProcesso: string,
  status?: StatusAudiencia
): Promise<ActionResult<Audiencia[]>> {
  try {
    if (!numeroProcesso || !numeroProcesso.trim()) {
      return {
        success: false,
        error: 'Numero invalido',
        message: 'Numero do processo e obrigatorio',
      };
    }

    const result = await service.buscarAudienciasPorNumeroProcesso(
      numeroProcesso.trim(),
      status
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: `${result.data.length} audiência(s) encontrada(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Erro ao buscar audiências.',
    };
  }
}
