/**
 * EXPEDIENTES SERVICE - Camada de Negócio
 */

import 'server-only';

import {
  createExpedienteSchema,
  updateExpedienteSchema,
  baixaExpedienteSchema,
  ListarExpedientesParams,
  Expediente,
} from './domain';
import * as repository from './repository';
import type { ExpedienteInsertInput, ExpedienteUpdateInput } from './repository';
import { Result, err, appError, PaginatedResponse } from '@/types';
import { z } from 'zod';
import { createDbClient } from '@/lib/supabase';

type PlainObject = Record<string, unknown>;

function camelToSnake<TInput extends PlainObject>(obj: TInput): PlainObject {
  const newObj: PlainObject = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
}


export async function criarExpediente(input: z.infer<typeof createExpedienteSchema>): Promise<Result<Expediente>> {
  const validation = createExpedienteSchema.safeParse(input);
  if (!validation.success) {
    return err(appError('VALIDATION_ERROR', 'Dados de entrada inválidos.', validation.error.flatten().fieldErrors));
  }
  const { processoId, tipoExpedienteId } = validation.data;

  if (processoId) {
    const processoExistsResult = await repository.processoExists(processoId);
    if (!processoExistsResult.success || !processoExistsResult.data) {
      return err(appError('NOT_FOUND', 'Processo não encontrado.'));
    }
  }

  if (tipoExpedienteId) {
    const tipoExistsResult = await repository.tipoExpedienteExists(tipoExpedienteId);
    if (!tipoExistsResult.success || !tipoExistsResult.data) {
      return err(appError('NOT_FOUND', 'Tipo de expediente não encontrado.'));
    }
  }

  const dataForRepo = camelToSnake(validation.data) as ExpedienteInsertInput;

  return repository.saveExpediente(dataForRepo);
}

export async function buscarExpediente(id: number): Promise<Result<Expediente | null>> {
  if (id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID do expediente inválido.'));
  }
  return repository.findExpedienteById(id);
}

export async function listarExpedientes(params: ListarExpedientesParams): Promise<Result<PaginatedResponse<Expediente>>> {
  const saneParams = {
    ...params,
    pagina: params.pagina && params.pagina > 0 ? params.pagina : 1,
    limite: params.limite && params.limite > 0 && params.limite <= 100 ? params.limite : 50,
    ordenarPor: params.ordenarPor ?? 'data_prazo_legal_parte',
    ordem: params.ordem ?? 'asc',
  };
  return repository.findAllExpedientes(saneParams);
}

export async function buscarExpedientesPorClienteCPF(cpf: string): Promise<Result<Expediente[]>> {
  if (!cpf || !cpf.trim()) {
    return err(appError('VALIDATION_ERROR', 'CPF é obrigatório.'));
  }
  return repository.findExpedientesByClienteCPF(cpf);
}

export async function atualizarExpediente(id: number, input: z.infer<typeof updateExpedienteSchema>): Promise<Result<Expediente>> {
  if (id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID do expediente inválido.'));
  }
  const validation = updateExpedienteSchema.safeParse(input);
  if (!validation.success) {
    return err(appError('VALIDATION_ERROR', 'Dados de entrada inválidos.', validation.error.flatten().fieldErrors));
  }

  const expedienteResult = await repository.findExpedienteById(id);
  if (!expedienteResult.success) return expedienteResult as Result<Expediente>;
  if (!expedienteResult.data) return err(appError('NOT_FOUND', 'Expediente não encontrado.'));

  const { processoId, tipoExpedienteId } = validation.data;
  if (processoId) {
    const processoExistsResult = await repository.processoExists(processoId);
    if (!processoExistsResult.success || !processoExistsResult.data) {
      return err(appError('NOT_FOUND', 'Processo não encontrado.'));
    }
  }
  if (tipoExpedienteId) {
    const tipoExistsResult = await repository.tipoExpedienteExists(tipoExpedienteId);
    if (!tipoExistsResult.success || !tipoExistsResult.data) {
      return err(appError('NOT_FOUND', 'Tipo de expediente não encontrado.'));
    }
  }

  const dataForRepo = camelToSnake(validation.data) as ExpedienteUpdateInput;


  return repository.updateExpediente(id, dataForRepo, expedienteResult.data);
}

export async function realizarBaixa(id: number, input: z.infer<typeof baixaExpedienteSchema>, userId: number): Promise<Result<Expediente>> {
  const validation = baixaExpedienteSchema.safeParse({ ...input, expedienteId: id });
  if (!validation.success) {
    return err(appError('VALIDATION_ERROR', 'Dados de entrada inválidos.', validation.error.flatten().fieldErrors));
  }

  const expedienteResult = await repository.findExpedienteById(id);
  if (!expedienteResult.success) return expedienteResult as Result<Expediente>;
  const expediente = expedienteResult.data;
  if (!expediente) return err(appError('NOT_FOUND', 'Expediente não encontrado.'));
  if (expediente.baixadoEm) return err(appError('BAD_REQUEST', 'Expediente já está baixado.'));

  const { protocoloId, justificativaBaixa, dataBaixa, resultadoDecisao } = validation.data;
  const baixaResult = await repository.baixarExpediente(id, {
    protocoloId: protocoloId,
    justificativaBaixa: justificativaBaixa,
    baixadoEm: dataBaixa,
    resultadoDecisao: resultadoDecisao,
  });

  if (baixaResult.success) {
    const db = createDbClient();
    const { error: rpcError } = await db.rpc('registrar_baixa_expediente', {
      p_expediente_id: id,
      p_usuario_id: userId,
      p_protocolo_id: protocoloId || null,
      p_justificativa: justificativaBaixa || null,
    });

    if (rpcError) {
      // O log de auditoria falhou, mas a baixa já foi feita.
      // Por questões de auditoria, isso é crítico. Logamos o erro mas não falhamos a operação.
      console.error('[CRITICAL] Falha ao registrar log de auditoria de baixa de expediente:', {
        expedienteId: id,
        userId: userId,
        rpcError: rpcError,
      });
    }
  }

  return baixaResult;
}

export async function reverterBaixa(id: number, userId: number): Promise<Result<Expediente>> {
  if (id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID do expediente inválido.'));
  }

  const expedienteResult = await repository.findExpedienteById(id);
  if (!expedienteResult.success) return expedienteResult as Result<Expediente>;
  const expediente = expedienteResult.data;
  if (!expediente) return err(appError('NOT_FOUND', 'Expediente não encontrado.'));
  if (!expediente.baixadoEm) return err(appError('BAD_REQUEST', 'Expediente não está baixado.'));

  const { protocoloId, justificativaBaixa } = expediente;

  const reversaoResult = await repository.reverterBaixaExpediente(id);

  if (reversaoResult.success) {
    const db = createDbClient();
    const { error: rpcError } = await db.rpc('registrar_reversao_baixa_expediente', {
      p_expediente_id: id,
      p_usuario_id: userId,
      p_protocolo_id_anterior: protocoloId,
      p_justificativa_anterior: justificativaBaixa,
    });
    if (rpcError) {
      console.error('Falha ao registrar log de reversão de baixa:', rpcError);
    }
  }

  return reversaoResult;
}

export async function atribuirResponsavel(
  expedienteId: number,
  responsavelId: number | null,
  usuarioExecutouId?: number // Optional param if coming from frontend context
): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    let userId = usuarioExecutouId;
    if (!userId) {
      const { data: { session } } = await db.auth.getSession();
      if (session?.user?.id) {
        const { data: userData } = await db.from('usuarios').select('id').eq('auth_user_id', session.user.id).single();
        userId = userData?.id;
      }
    }

    if (!userId) return err(appError('UNAUTHORIZED', 'Usuário não autenticado.'));

    const { error } = await db.rpc('atribuir_responsavel_pendente', {
      p_pendente_id: expedienteId,
      p_responsavel_id: responsavelId,
      p_usuario_executou_id: userId
    });

    if (error) {
      return err(appError('DATABASE_ERROR', error.message));
    }

    return { success: true, data: true };

  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao atribuir responsável.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function atualizarTipoDescricao(
  expedienteId: number,
  tipoExpedienteId: number | null,
  descricaoArquivos?: string | null,
  usuarioExecutouId?: number
): Promise<Result<Expediente>> {
  const db = createDbClient();
  let userId = usuarioExecutouId;
  if (!userId) {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user?.id) {
      const { data: userData } = await db.from('usuarios').select('id').eq('auth_user_id', session.user.id).single();
      userId = userData?.id;
    }
  }
  if (!userId) return err(appError('UNAUTHORIZED', 'Usuário não autenticado.'));

  const currentResult = await repository.findExpedienteById(expedienteId);
  if (!currentResult.success || !currentResult.data) return err(appError('NOT_FOUND', 'Expediente não encontrado.'));
  const current = currentResult.data;

  const repoUpdateInput = {
    tipo_expediente_id: tipoExpedienteId,
    descricao_arquivos: descricaoArquivos,
    updated_at: new Date().toISOString()
  };

  const updateResult = await repository.updateExpediente(expedienteId, repoUpdateInput, current);
  if (!updateResult.success) return updateResult;

  await db.from('logs_alteracao').insert({
    tipo_entidade: 'expedientes',
    entidade_id: expedienteId,
    tipo_evento: 'alteracao_tipo_descricao',
    usuario_que_executou_id: userId,
    dados_evento: {
      tipo_expediente_id_anterior: current.tipoExpedienteId,
      tipo_expediente_id_novo: tipoExpedienteId,
      descricao_arquivos_anterior: current.descricaoArquivos,
      descricao_arquivos_novo: descricaoArquivos,
      alterado_em: new Date().toISOString(),
    },
  });

  return {
    success: true,
    data: updateResult.data,
  };
}
