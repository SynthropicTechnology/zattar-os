'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import * as service from '../service';
import {
  createAudienciaSchema,
  EnderecoPresencial,
  ListarAudienciasParams,
  StatusAudiencia,
  updateAudienciaSchema,
  Audiencia,
} from '../domain';
import { PaginatedResponse } from '@/types';

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

export async function actionAtualizarAudienciaPayload(
  id: number,
  payload: z.infer<typeof updateAudienciaSchema>
): Promise<ActionResult<Audiencia>> {
  const validation = updateAudienciaSchema.safeParse(payload);
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
