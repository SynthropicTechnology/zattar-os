/**
 * Service Layer para Lembretes (Reminders)
 * Lógica de negócio e validação para lembretes do dashboard
 */

'use server';

import { Result, ok, err, appError } from '@/types';
import type {
  Lembrete,
  CriarLembreteInput,
  AtualizarLembreteInput,
  ListarLembretesParams,
  MarcarLembreteConcluidoInput,
  DeletarLembreteInput,
} from '../domain';
import {
  criarLembreteSchema,
  atualizarLembreteSchema,
  listarLembretesSchema,
  marcarLembreteConcluidoSchema,
  deletarLembreteSchema,
} from '../domain';
import {
  buscarLembretes,
  buscarLembretePorId,
  criarLembrete as criarLembreteRepo,
  atualizarLembrete as atualizarLembreteRepo,
  marcarLembreteConcluido as marcarLembreteConcluidoRepo,
  deletarLembrete as deletarLembreteRepo,
  contarLembretesPendentes,
  buscarLembretesVencidos,
} from '../repository';

/**
 * Lista lembretes de um usuário com validação
 */
export async function listarLembretes(
  params: ListarLembretesParams
): Promise<Result<Lembrete[]>> {
  try {
    // Validar parâmetros
    const validation = listarLembretesSchema.safeParse(params);
    if (!validation.success) {
      return err(
        appError(
          'VALIDATION_ERROR',
          'Parâmetros inválidos',
          validation.error.flatten().fieldErrors
        )
      );
    }

    const lembretes = await buscarLembretes(validation.data);
    return ok(lembretes);
  } catch (error) {
    console.error('Erro no service ao listar lembretes:', error);
    return err(
      appError(
        'INTERNAL_ERROR',
        'Erro ao listar lembretes',
        error instanceof Error ? { message: error.message } : undefined
      )
    );
  }
}

/**
 * Busca um lembrete específico com validação de permissão
 */
export async function obterLembrete(
  id: number,
  usuarioId: number
): Promise<Result<Lembrete>> {
  try {
    const lembrete = await buscarLembretePorId(id, usuarioId);

    if (!lembrete) {
      return err(
        appError(
          'NOT_FOUND',
          'Lembrete não encontrado ou você não tem permissão para visualizá-lo'
        )
      );
    }

    return ok(lembrete);
  } catch (error) {
    console.error('Erro no service ao obter lembrete:', error);
    return err(
      appError(
        'INTERNAL_ERROR',
        'Erro ao obter lembrete',
        error instanceof Error ? { message: error.message } : undefined
      )
    );
  }
}

/**
 * Cria um novo lembrete com validação
 */
export async function criarNovoLembrete(
  input: CriarLembreteInput,
  usuarioId: number
): Promise<Result<Lembrete>> {
  try {
    // Validar dados de entrada
    const validation = criarLembreteSchema.safeParse(input);
    if (!validation.success) {
      return err(
        appError(
          'VALIDATION_ERROR',
          'Dados inválidos para criar lembrete',
          validation.error.flatten().fieldErrors
        )
      );
    }

    // Verificar se a data do lembrete não está no passado
    const dataLembrete = new Date(validation.data.data_lembrete);
    const agora = new Date();

    if (dataLembrete < agora) {
      return err(
        appError(
          'VALIDATION_ERROR',
          'A data do lembrete não pode estar no passado',
          { data_lembrete: ['Data inválida'] }
        )
      );
    }

    const lembrete = await criarLembreteRepo(validation.data, usuarioId);
    return ok(lembrete);
  } catch (error) {
    console.error('Erro no service ao criar lembrete:', error);
    return err(
      appError(
        'INTERNAL_ERROR',
        'Erro ao criar lembrete',
        error instanceof Error ? { message: error.message } : undefined
      )
    );
  }
}

/**
 * Atualiza um lembrete existente com validação
 */
export async function atualizarLembreteExistente(
  input: AtualizarLembreteInput,
  usuarioId: number
): Promise<Result<Lembrete>> {
  try {
    // Validar dados de entrada
    const validation = atualizarLembreteSchema.safeParse(input);
    if (!validation.success) {
      return err(
        appError(
          'VALIDATION_ERROR',
          'Dados inválidos para atualizar lembrete',
          validation.error.flatten().fieldErrors
        )
      );
    }

    // Verificar se o lembrete existe e pertence ao usuário
    const lembreteExistente = await buscarLembretePorId(
      validation.data.id,
      usuarioId
    );
    if (!lembreteExistente) {
      return err(
        appError(
          'NOT_FOUND',
          'Lembrete não encontrado ou você não tem permissão para atualizá-lo'
        )
      );
    }

    // Se estiver atualizando a data, verificar se não está no passado
    if (validation.data.data_lembrete) {
      const dataLembrete = new Date(validation.data.data_lembrete);
      const agora = new Date();

      if (dataLembrete < agora && !validation.data.concluido) {
        return err(
          appError(
            'VALIDATION_ERROR',
            'A data do lembrete não pode estar no passado',
            { data_lembrete: ['Data inválida'] }
          )
        );
      }
    }

    const lembrete = await atualizarLembreteRepo(validation.data, usuarioId);
    return ok(lembrete);
  } catch (error) {
    console.error('Erro no service ao atualizar lembrete:', error);
    return err(
      appError(
        'INTERNAL_ERROR',
        'Erro ao atualizar lembrete',
        error instanceof Error ? { message: error.message } : undefined
      )
    );
  }
}

/**
 * Marca um lembrete como concluído ou não concluído
 */
export async function alterarStatusLembrete(
  input: MarcarLembreteConcluidoInput,
  usuarioId: number
): Promise<Result<Lembrete>> {
  try {
    // Validar dados de entrada
    const validation = marcarLembreteConcluidoSchema.safeParse(input);
    if (!validation.success) {
      return err(
        appError(
          'VALIDATION_ERROR',
          'Dados inválidos',
          validation.error.flatten().fieldErrors
        )
      );
    }

    // Verificar se o lembrete existe e pertence ao usuário
    const lembreteExistente = await buscarLembretePorId(
      validation.data.id,
      usuarioId
    );
    if (!lembreteExistente) {
      return err(
        appError(
          'NOT_FOUND',
          'Lembrete não encontrado ou você não tem permissão para alterá-lo'
        )
      );
    }

    const lembrete = await marcarLembreteConcluidoRepo(
      validation.data.id,
      validation.data.concluido,
      usuarioId
    );
    return ok(lembrete);
  } catch (error) {
    console.error('Erro no service ao alterar status do lembrete:', error);
    return err(
      appError(
        'INTERNAL_ERROR',
        'Erro ao alterar status do lembrete',
        error instanceof Error ? { message: error.message } : undefined
      )
    );
  }
}

/**
 * Deleta um lembrete com validação de permissão
 */
export async function removerLembrete(
  input: DeletarLembreteInput,
  usuarioId: number
): Promise<Result<void>> {
  try {
    // Validar dados de entrada
    const validation = deletarLembreteSchema.safeParse(input);
    if (!validation.success) {
      return err(
        appError(
          'VALIDATION_ERROR',
          'Dados inválidos',
          validation.error.flatten().fieldErrors
        )
      );
    }

    // Verificar se o lembrete existe e pertence ao usuário
    const lembreteExistente = await buscarLembretePorId(
      validation.data.id,
      usuarioId
    );
    if (!lembreteExistente) {
      return err(
        appError(
          'NOT_FOUND',
          'Lembrete não encontrado ou você não tem permissão para deletá-lo'
        )
      );
    }

    await deletarLembreteRepo(validation.data.id, usuarioId);
    return ok(undefined);
  } catch (error) {
    console.error('Erro no service ao deletar lembrete:', error);
    return err(
      appError(
        'INTERNAL_ERROR',
        'Erro ao deletar lembrete',
        error instanceof Error ? { message: error.message } : undefined
      )
    );
  }
}

/**
 * Obtém contagem de lembretes pendentes
 */
export async function obterContagemLembretesPendentes(
  usuarioId: number
): Promise<Result<number>> {
  try {
    const count = await contarLembretesPendentes(usuarioId);
    return ok(count);
  } catch (error) {
    console.error('Erro no service ao contar lembretes pendentes:', error);
    return err(
      appError(
        'INTERNAL_ERROR',
        'Erro ao contar lembretes pendentes',
        error instanceof Error ? { message: error.message } : undefined
      )
    );
  }
}

/**
 * Obtém lembretes vencidos (não concluídos e data já passou)
 */
export async function obterLembretesVencidos(
  usuarioId: number
): Promise<Result<Lembrete[]>> {
  try {
    const lembretes = await buscarLembretesVencidos(usuarioId);
    return ok(lembretes);
  } catch (error) {
    console.error('Erro no service ao buscar lembretes vencidos:', error);
    return err(
      appError(
        'INTERNAL_ERROR',
        'Erro ao buscar lembretes vencidos',
        error instanceof Error ? { message: error.message } : undefined
      )
    );
  }
}
