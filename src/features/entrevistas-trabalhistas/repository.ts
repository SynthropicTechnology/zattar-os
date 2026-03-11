import { createDbClient } from '@/lib/supabase';
import { type Result, ok, err, appError } from '@/types';
import type {
  EntrevistaTrabalhista,
  EntrevistaAnexo,
  CreateEntrevistaInput,
  CreateAnexoInput,
  RespostasEntrevista,
  TipoLitigio,
} from './domain';
import { getModulosPorTrilha } from './domain';

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_ENTREVISTAS = 'entrevistas_trabalhistas';
const TABLE_ANEXOS = 'entrevista_anexos';

// =============================================================================
// CONVERSORES (snake_case DB → camelCase TS)
// =============================================================================

function converterParaEntrevista(data: Record<string, unknown>): EntrevistaTrabalhista {
  return {
    id: data.id as number,
    contratoId: data.contrato_id as number,
    tipoLitigio: data.tipo_litigio as EntrevistaTrabalhista['tipoLitigio'],
    perfilReclamante: data.perfil_reclamante as string | null,
    status: data.status as EntrevistaTrabalhista['status'],
    moduloAtual: (data.modulo_atual as string) ?? 'no_zero',
    respostas: (data.respostas as RespostasEntrevista) ?? {},
    notasOperador: data.notas_operador as Record<string, string> | null,
    testemunhasMapeadas: (data.testemunhas_mapeadas as boolean) ?? false,
    createdBy: data.created_by as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function converterParaAnexo(data: Record<string, unknown>): EntrevistaAnexo {
  return {
    id: data.id as number,
    entrevistaId: data.entrevista_id as number,
    modulo: data.modulo as string,
    noReferencia: data.no_referencia as string | null,
    tipoAnexo: data.tipo_anexo as string,
    arquivoUrl: data.arquivo_url as string,
    descricao: data.descricao as string | null,
    createdAt: data.created_at as string,
  };
}

// =============================================================================
// ENTREVISTA — LEITURA
// =============================================================================

export async function findByContratoId(
  contratoId: number,
): Promise<Result<EntrevistaTrabalhista | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_ENTREVISTAS)
      .select('*')
      .eq('contrato_id', contratoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return ok(null);
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(converterParaEntrevista(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar entrevista por contrato',
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

export async function findById(
  id: number,
): Promise<Result<EntrevistaTrabalhista | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_ENTREVISTAS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return ok(null);
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(converterParaEntrevista(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar entrevista',
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

// =============================================================================
// ENTREVISTA — ESCRITA
// =============================================================================

export async function create(
  input: CreateEntrevistaInput,
): Promise<Result<EntrevistaTrabalhista>> {
  try {
    const db = createDbClient();
    const dadosInsercao: Record<string, unknown> = {
      contrato_id: input.contratoId,
      tipo_litigio: input.tipoLitigio,
      perfil_reclamante: input.perfilReclamante ?? null,
      status: 'em_andamento',
      modulo_atual: getModulosPorTrilha(input.tipoLitigio as TipoLitigio)[0],
      respostas: {},
      notas_operador: {},
      testemunhas_mapeadas: false,
      created_by: input.createdBy ?? null,
    };

    const { data, error } = await db
      .from(TABLE_ENTREVISTAS)
      .insert(dadosInsercao)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return err(appError('VALIDATION_ERROR', 'Já existe uma entrevista para este contrato', { code: error.code }));
      }
      return err(appError('DATABASE_ERROR', `Erro ao criar entrevista: ${error.message}`, { code: error.code }));
    }

    return ok(converterParaEntrevista(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao criar entrevista',
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

export async function updateRespostas(
  id: number,
  modulo: string,
  respostasModulo: Record<string, unknown>,
  notaOperador?: string,
): Promise<Result<EntrevistaTrabalhista>> {
  try {
    const db = createDbClient();

    // Buscar respostas atuais para fazer merge
    const { data: current, error: fetchError } = await db
      .from(TABLE_ENTREVISTAS)
      .select('respostas, notas_operador')
      .eq('id', id)
      .single();

    if (fetchError) {
      return err(appError('DATABASE_ERROR', fetchError.message, { code: fetchError.code }));
    }

    const respostasAtuais = (current?.respostas as Record<string, unknown>) ?? {};
    const notasAtuais = (current?.notas_operador as Record<string, string>) ?? {};

    // Merge: sobrescreve apenas o módulo atualizado
    const respostasMerged = {
      ...respostasAtuais,
      [modulo]: respostasModulo,
    };

    const notasMerged = notaOperador
      ? { ...notasAtuais, [modulo]: notaOperador }
      : notasAtuais;

    const { data: updated, error } = await db
      .from(TABLE_ENTREVISTAS)
      .update({
        respostas: respostasMerged,
        notas_operador: notasMerged,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao salvar respostas: ${error.message}`, { code: error.code }));
    }

    return ok(converterParaEntrevista(updated as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar respostas',
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

export async function updateStatus(
  id: number,
  status: string,
): Promise<Result<EntrevistaTrabalhista>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_ENTREVISTAS)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao atualizar status: ${error.message}`, { code: error.code }));
    }

    return ok(converterParaEntrevista(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar status da entrevista',
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

export async function updateModuloAtual(
  id: number,
  moduloAtual: string,
): Promise<Result<EntrevistaTrabalhista>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_ENTREVISTAS)
      .update({ modulo_atual: moduloAtual })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao atualizar módulo: ${error.message}`, { code: error.code }));
    }

    return ok(converterParaEntrevista(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar módulo atual',
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

export async function updateTestemunhas(
  id: number,
  testemunhasMapeadas: boolean,
): Promise<Result<EntrevistaTrabalhista>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_ENTREVISTAS)
      .update({ testemunhas_mapeadas: testemunhasMapeadas })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(converterParaEntrevista(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar testemunhas',
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

// =============================================================================
// ANEXOS
// =============================================================================

export async function findAnexos(
  entrevistaId: number,
  modulo?: string,
): Promise<Result<EntrevistaAnexo[]>> {
  try {
    const db = createDbClient();
    let query = db
      .from(TABLE_ANEXOS)
      .select('*')
      .eq('entrevista_id', entrevistaId)
      .order('created_at', { ascending: false });

    if (modulo) {
      query = query.eq('modulo', modulo);
    }

    const { data, error } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const anexos = (data ?? []).map((row) =>
      converterParaAnexo(row as Record<string, unknown>),
    );

    return ok(anexos);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar anexos',
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

export async function createAnexo(
  input: CreateAnexoInput,
): Promise<Result<EntrevistaAnexo>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from(TABLE_ANEXOS)
      .insert({
        entrevista_id: input.entrevistaId,
        modulo: input.modulo,
        no_referencia: input.noReferencia ?? null,
        tipo_anexo: input.tipoAnexo,
        arquivo_url: input.arquivoUrl,
        descricao: input.descricao ?? null,
      })
      .select()
      .single();

    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao criar anexo: ${error.message}`, { code: error.code }));
    }

    return ok(converterParaAnexo(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao criar anexo',
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

export async function deleteAnexo(
  id: number,
): Promise<Result<void>> {
  try {
    const db = createDbClient();
    const { error } = await db
      .from(TABLE_ANEXOS)
      .delete()
      .eq('id', id);

    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao excluir anexo: ${error.message}`, { code: error.code }));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao excluir anexo',
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
}
