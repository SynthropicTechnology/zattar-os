import { createDbClient } from '@/lib/supabase';
import { Result, ok, err, appError, PaginatedResponse } from '@/types';
import { fromSnakeToCamel, fromCamelToSnake, camelToSnakeKey } from '@/lib/utils';
import {
  Audiencia,
  EnderecoPresencial,
  ListarAudienciasParams,
  StatusAudiencia,
} from './domain';
import {
  getAudienciaColumnsFull,
  getAudienciaColumnsComOrigem,
} from './domain';
import {
  withCache,
  generateCacheKey,
  CACHE_PREFIXES,
  getCached,
  setCached,
  deleteCached,
} from '@/lib/redis/cache-utils';
import { invalidateAudienciasCache } from '@/lib/redis/invalidation';
import { logQuery } from '@/lib/supabase/query-logger';

type AudienciaRow = Record<string, unknown>;

function converterParaAudiencia(data: AudienciaRow): Audiencia {
  const converted = fromSnakeToCamel(data) as unknown as Audiencia;
  if (data.endereco_presencial && typeof data.endereco_presencial === 'object') {
    converted.enderecoPresencial = fromSnakeToCamel(data.endereco_presencial) as EnderecoPresencial;
  }
  // Campos de origem (fonte da verdade - 1º grau)
  // Esses campos vêm da view audiencias_com_origem
  if ('trt_origem' in data) {
    converted.trtOrigem = data.trt_origem as string;
  }
  if ('polo_ativo_origem' in data) {
    converted.poloAtivoOrigem = data.polo_ativo_origem as string;
  }
  if ('polo_passivo_origem' in data) {
    converted.poloPassivoOrigem = data.polo_passivo_origem as string;
  }
  if ('orgao_julgador_origem' in data) {
    converted.orgaoJulgadorOrigem = data.orgao_julgador_origem as string;
  }
  return converted;
}

export async function findAudienciaById(id: number): Promise<Result<Audiencia | null>> {
  try {
    const cacheKey = `${CACHE_PREFIXES.audiencias}:id:${id}`;
    const cached = await getCached<Audiencia>(cacheKey);
    if (cached) return ok(cached);

    const db = createDbClient();
    // Usar view com dados de origem (1º grau) para partes corretas
    const { data, error } = await logQuery(
      'audiencias.findAudienciaById',
      async () => {
        const result = await db
          .from('audiencias_com_origem')
          .select(getAudienciaColumnsComOrigem())
          .eq('id', id)
          .single();
        return result;
      }
    );

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      console.error('Error finding audiencia by id:', error);
      return err(appError('DATABASE_ERROR', 'Erro ao buscar audiência.', { code: error.code }));
    }

    if (data) {
      const audiencia = converterParaAudiencia(data as unknown as AudienciaRow);
      await setCached(cacheKey, audiencia, 600);
      return ok(audiencia);
    }

    return ok(null);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Unexpected error finding audiencia:', e);
    return err(appError('DATABASE_ERROR', 'Erro inesperado ao buscar audiência.', { originalError: message }));
  }
}

export async function findAllAudiencias(params: ListarAudienciasParams): Promise<Result<PaginatedResponse<Audiencia>>> {
  try {
    const cacheKey = generateCacheKey(CACHE_PREFIXES.audiencias, params);

    return await withCache(
      cacheKey,
      async () => {
        const db = createDbClient();
        // Usar view com dados de origem (1º grau) para partes corretas
        let query = db.from('audiencias_com_origem').select(getAudienciaColumnsComOrigem(), { count: 'exact' });

        if (params.busca) {
          query = query.or(
            `numero_processo.ilike.%${params.busca}%,` +
            `polo_ativo_nome.ilike.%${params.busca}%,` +
            `polo_passivo_nome.ilike.%${params.busca}%,` +
            `observacoes.ilike.%${params.busca}%`
          );
        }

        if (params.trt) {
          if (Array.isArray(params.trt)) query = query.in('trt', params.trt);
          else query = query.eq('trt', params.trt);
        }
        if (params.grau) {
          if (Array.isArray(params.grau)) query = query.in('grau', params.grau);
          else query = query.eq('grau', params.grau);
        }
        if (params.status) {
          if (Array.isArray(params.status)) query = query.in('status', params.status);
          else query = query.eq('status', params.status);
        }
        if (params.modalidade) {
          if (Array.isArray(params.modalidade)) query = query.in('modalidade', params.modalidade);
          else query = query.eq('modalidade', params.modalidade);
        }
        if (params.tipoAudienciaId) {
          if (Array.isArray(params.tipoAudienciaId)) query = query.in('tipo_audiencia_id', params.tipoAudienciaId);
          else query = query.eq('tipo_audiencia_id', params.tipoAudienciaId);
        }

        if (params.responsavelId === 'null' || params.semResponsavel) {
          query = query.is('responsavel_id', null);
        } else if (Array.isArray(params.responsavelId)) {
          const ids = params.responsavelId.filter(id => id !== 'null');
          const hasNull = params.responsavelId.includes('null');

          if (hasNull && ids.length > 0) {
            // Mix of specific IDs and NULL
            // Use OR syntax: responsavel_id.in.(1,2),responsavel_id.is.null
            query = query.or(`responsavel_id.in.(${ids.join(',')}),responsavel_id.is.null`);
          } else if (hasNull) {
            // Only NULL
            query = query.is('responsavel_id', null);
          } else if (ids.length > 0) {
            // Only IDs
            query = query.in('responsavel_id', ids);
          }
        } else if (params.responsavelId) {
          query = query.eq('responsavel_id', params.responsavelId);
        }

        if (params.dataInicioInicio) query = query.gte('data_inicio', params.dataInicioInicio);
        if (params.dataInicioFim) query = query.lte('data_inicio', params.dataInicioFim);
        if (params.dataFimInicio) query = query.gte('data_fim', params.dataFimInicio);
        if (params.dataFimFim) query = query.lte('data_fim', params.dataFimFim);

        const page = params.pagina || 1;
        const limit = params.limite || 10;
        const offset = (page - 1) * limit;

        query = query.range(offset, offset + limit - 1);

        const sortBy = params.ordenarPor || 'dataInicio';
        const ascending = params.ordem ? params.ordem === 'asc' : true;
        query = query.order(camelToSnakeKey(sortBy), { ascending });

        const { data, error, count } = await logQuery('audiencias.findAllAudiencias', async () => {
          const result = await query;
          return result;
        });

        if (error) {
          console.error('Error finding all audiencias:', error);
          return err(appError('DATABASE_ERROR', 'Erro ao listar audiências.', { code: error.code }));
        }

        const total = count || 0;
        const totalPages = total ? Math.ceil(total / limit) : 1;

        return ok({
          data: (data || []).map((item) => converterParaAudiencia(item as unknown as Record<string, unknown>)),
          pagination: {
            page: page,
            limit: limit,
            total: total,
            totalPages: totalPages,
            hasMore: page < totalPages,
          },
        });
      },
      300
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Unexpected error finding all audiencias:', e);
    return err(appError('DATABASE_ERROR', 'Erro inesperado ao listar audiências.', { originalError: message }));
  }
}

/**
 * Helper para Portal do Cliente: lista audiências associadas a um CPF.
 *
 * Estratégia:
 * - resolve cliente pelo CPF
 * - encontra processos vinculados ao cliente via `processo_partes`
 * - lista audiências desses processos
 */
export async function findAudienciasByClienteCpf(
  cpf: string
): Promise<Result<Audiencia[]>> {
  try {
    const db = createDbClient();
    const cpfNormalizado = cpf.replace(/\D/g, "");

    const { data: cliente, error: errorCliente } = await db
      .from("clientes")
      .select("id")
      .eq("cpf", cpfNormalizado)
      .eq("ativo", true)
      .single();

    if (errorCliente || !cliente) {
      return ok([]);
    }

    const { data: participacoes, error: errorPart } = await db
      .from("processo_partes")
      .select("processo_id")
      .eq("tipo_entidade", "cliente")
      .eq("entidade_id", cliente.id);

    if (errorPart || !participacoes || participacoes.length === 0) {
      return ok([]);
    }

    const processoIds = participacoes
      .map((p) => (p as { processo_id?: number }).processo_id)
      .filter((id): id is number => typeof id === "number");

    if (processoIds.length === 0) {
      return ok([]);
    }

    const { data, error } = await db
      .from("audiencias")
      .select(getAudienciaColumnsFull())
      .in("processo_id", processoIds)
      .order("data_inicio", { ascending: true });

    if (error) {
      console.error("Error finding audiencias by cpf:", error);
      return err(
        appError("DATABASE_ERROR", "Erro ao listar audiências por CPF.", {
          code: error.code,
        })
      );
    }

    return ok((data || []).map((item) => converterParaAudiencia(item as unknown as Record<string, unknown>)));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Unexpected error finding audiencias by cpf:", e);
    return err(
      appError("DATABASE_ERROR", "Erro inesperado ao listar audiências por CPF.", {
        originalError: message,
      })
    );
  }
}

export async function findAudienciasByClienteCnpj(
  cnpj: string
): Promise<Result<Audiencia[]>> {
  try {
    const db = createDbClient();
    const cnpjNormalizado = cnpj.replace(/\D/g, "");

    const { data: cliente, error: errorCliente } = await db
      .from("clientes")
      .select("id")
      .eq("cnpj", cnpjNormalizado)
      .eq("ativo", true)
      .single();

    if (errorCliente || !cliente) {
      return ok([]);
    }

    const { data: participacoes, error: errorPart } = await db
      .from("processo_partes")
      .select("processo_id")
      .eq("tipo_entidade", "cliente")
      .eq("entidade_id", cliente.id);

    if (errorPart || !participacoes || participacoes.length === 0) {
      return ok([]);
    }

    const processoIds = participacoes
      .map((p) => (p as { processo_id?: number }).processo_id)
      .filter((id): id is number => typeof id === "number");

    if (processoIds.length === 0) {
      return ok([]);
    }

    const { data, error } = await db
      .from("audiencias")
      .select(getAudienciaColumnsFull())
      .in("processo_id", processoIds)
      .order("data_inicio", { ascending: true });

    if (error) {
      console.error("Error finding audiencias by cnpj:", error);
      return err(
        appError("DATABASE_ERROR", "Erro ao listar audiências por CNPJ.", {
          code: error.code,
        })
      );
    }

    return ok((data || []).map((item) => converterParaAudiencia(item as unknown as Record<string, unknown>)));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Unexpected error finding audiencias by cnpj:", e);
    return err(
      appError("DATABASE_ERROR", "Erro inesperado ao listar audiências por CNPJ.", {
        originalError: message,
      })
    );
  }
}

export async function findAudienciasByProcessoId(
  processoId: number,
  status?: StatusAudiencia
): Promise<Result<Audiencia[]>> {
  try {
    const db = createDbClient();

    let query = db
      .from("audiencias")
      .select(getAudienciaColumnsFull())
      .eq("processo_id", processoId)
      .order("data_inicio", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error finding audiencias by processo:", error);
      return err(
        appError("DATABASE_ERROR", "Erro ao listar audiências por processo.", {
          code: error.code,
        })
      );
    }

    return ok((data || []).map((item) => converterParaAudiencia(item as unknown as Record<string, unknown>)));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Unexpected error finding audiencias by processo:", e);
    return err(
      appError("DATABASE_ERROR", "Erro inesperado ao listar audiências por processo.", {
        originalError: message,
      })
    );
  }
}

export async function processoExists(processoId: number): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from('acervo')
      .select('id')
      .eq('id', processoId)
      .single();
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking processo existence:', error);
      return err(appError('DATABASE_ERROR', 'Erro ao verificar processo.', { code: error.code }));
    }
    return ok(!!data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Unexpected error checking processo existence:', e);
    return err(appError('DATABASE_ERROR', 'Erro inesperado ao verificar processo.', { originalError: message }));
  }
}

export async function tipoAudienciaExists(tipoId: number): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from('tipo_audiencia')
      .select('id')
      .eq('id', tipoId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking tipo_audiencia existence:', error);
      return err(appError('DATABASE_ERROR', 'Erro ao verificar tipo de audiência.', { code: error.code }));
    }
    return ok(!!data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Unexpected error checking tipo_audiencia existence:', e);
    return err(appError('DATABASE_ERROR', 'Erro inesperado ao verificar tipo de audiência.', { originalError: message }));
  }
}

export async function saveAudiencia(input: Partial<Audiencia>): Promise<Result<Audiencia>> {
  try {
    const db = createDbClient();
    const snakeInput = fromCamelToSnake(input) as Record<string, unknown>;
    const { data, error } = await db
      .from('audiencias')
      .insert(snakeInput)
      .select()
      .single();

    if (error) {
      console.error('Error saving audiencia:', error);
      return err(appError('DATABASE_ERROR', 'Erro ao salvar audiência.', { code: error.code }));
    }

    const audiencia = converterParaAudiencia(data);
    await invalidateAudienciasCache();
    return ok(audiencia);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Unexpected error saving audiencia:', e);
    return err(appError('DATABASE_ERROR', 'Erro inesperado ao salvar audiência.', { originalError: message }));
  }
}

export async function updateAudiencia(id: number, input: Partial<Audiencia>, audienciaExistente: Audiencia): Promise<Result<Audiencia>> {
  try {
    const db = createDbClient();
    const snakeInput = fromCamelToSnake(input) as Record<string, unknown>;
    // Preserve previous state for auditing
    snakeInput.dados_anteriores = fromCamelToSnake(audienciaExistente);

    const { data, error } = await db
      .from('audiencias')
      .update(snakeInput)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating audiencia:', error);
      return err(appError('DATABASE_ERROR', 'Erro ao atualizar audiência.', { code: error.code }));
    }

    const audiencia = converterParaAudiencia(data);
    await deleteCached(`${CACHE_PREFIXES.audiencias}:id:${id}`);
    await invalidateAudienciasCache();
    return ok(audiencia);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Unexpected error updating audiencia:', e);
    return err(appError('DATABASE_ERROR', 'Erro inesperado ao atualizar audiência.', { originalError: message }));
  }
}

export async function atualizarObservacoes(id: number, observacoes: string | null): Promise<Result<Audiencia>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from('audiencias')
      .update({ observacoes })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating audiencia observacoes:', error);
      return err(appError('DATABASE_ERROR', 'Erro ao atualizar observações da audiência.', { code: error.code }));
    }

    const audiencia = converterParaAudiencia(data);
    await deleteCached(`${CACHE_PREFIXES.audiencias}:id:${id}`);
    await invalidateAudienciasCache();
    return ok(audiencia);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Unexpected error updating audiencia observacoes:', e);
    return err(appError('DATABASE_ERROR', 'Erro inesperado ao atualizar observações.', { originalError: message }));
  }
}

export async function atualizarUrlVirtual(id: number, urlAudienciaVirtual: string | null): Promise<Result<Audiencia>> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from('audiencias')
      .update({ url_audiencia_virtual: urlAudienciaVirtual })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating audiencia url virtual:', error);
      return err(appError('DATABASE_ERROR', 'Erro ao atualizar URL da audiência virtual.', { code: error.code }));
    }

    const audiencia = converterParaAudiencia(data);
    await deleteCached(`${CACHE_PREFIXES.audiencias}:id:${id}`);
    await invalidateAudienciasCache();
    return ok(audiencia);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Unexpected error updating audiencia url virtual:', e);
    return err(appError('DATABASE_ERROR', 'Erro inesperado ao atualizar URL virtual.', { originalError: message }));
  }
}

export async function atualizarEnderecoPresencial(id: number, enderecoPresencial: EnderecoPresencial | null): Promise<Result<Audiencia>> {
  try {
    const db = createDbClient();
    const endereco = enderecoPresencial ? fromCamelToSnake(enderecoPresencial) : null;
    const { data, error } = await db
      .from('audiencias')
      .update({ endereco_presencial: endereco })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating audiencia endereco presencial:', error);
      return err(appError('DATABASE_ERROR', 'Erro ao atualizar endereço presencial da audiência.', { code: error.code }));
    }

    const audiencia = converterParaAudiencia(data);
    await deleteCached(`${CACHE_PREFIXES.audiencias}:id:${id}`);
    await invalidateAudienciasCache();
    return ok(audiencia);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Unexpected error updating audiencia endereco presencial:', e);
    return err(appError('DATABASE_ERROR', 'Erro inesperado ao atualizar endereço presencial.', { originalError: message }));
  }
}

export async function atualizarStatus(id: number, status: StatusAudiencia, statusDescricao?: string): Promise<Result<Audiencia>> {
  try {
    const db = createDbClient();
    const updateData: Partial<AudienciaRow> = { status };
    if (statusDescricao) {
      updateData.status_descricao = statusDescricao;
    }
    const { data, error } = await db
      .from('audiencias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating audiencia status:', error);
      return err(appError('DATABASE_ERROR', 'Erro ao atualizar status da audiência.', { code: error.code }));
    }

    const audiencia = converterParaAudiencia(data);
    await deleteCached(`${CACHE_PREFIXES.audiencias}:id:${id}`);
    await invalidateAudienciasCache();
    return ok(audiencia);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Unexpected error updating audiencia status:', e);
    return err(appError('DATABASE_ERROR', 'Erro inesperado ao atualizar status da audiência.', { originalError: message }));
  }
}

// ============================================================================
// AI Agent Persistence (migrado de backend/audiencias/services/persistence)
// ============================================================================

import type { AudienciaClienteCpfRow } from './domain';

export interface BuscarAudienciasPorCpfResult {
  cliente: {
    id: number;
    nome: string;
    cpf: string;
  } | null;
  audiencias: AudienciaClienteCpfRow[];
}

export async function buscarAudienciasPorCpf(
  cpf: string
): Promise<BuscarAudienciasPorCpfResult> {
  const supabase = createDbClient(); // Usando createDbClient do FSD

  // Normalizar CPF (remover formatação)
  const cpfNormalizado = cpf.replace(/\D/g, '');

  console.log('🔍 [BuscarAudienciasCPF] Buscando audiências para CPF:', cpfNormalizado);

  // Buscar cliente
  const { data: cliente, error: errorCliente } = await supabase
    .from('clientes')
    .select('id, nome, cpf')
    .eq('cpf', cpfNormalizado)
    .eq('ativo', true)
    .single();

  if (errorCliente || !cliente) {
    console.log('ℹ️ [BuscarAudienciasCPF] Cliente não encontrado:', cpfNormalizado);
    return { cliente: null, audiencias: [] };
  }

  // Buscar processo_partes do cliente
  const { data: participacoes, error: errorPart } = await supabase
    .from('processo_partes')
    .select('processo_id, tipo_parte, polo')
    .eq('tipo_entidade', 'cliente')
    .eq('entidade_id', cliente.id);

  if (errorPart || !participacoes || participacoes.length === 0) {
    console.log('ℹ️ [BuscarAudienciasCPF] Nenhuma participação encontrada');
    return {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
      },
      audiencias: [],
    };
  }

  // Buscar audiências dos processos
  const processoIds = participacoes.map(p => p.processo_id);

  const { data: audienciasData, error: errorAudiencias } = await supabase
    .from('audiencias')
    .select(`
      id,
      id_pje,
      numero_processo,
      trt,
      grau,
      data_inicio,
      data_fim,
      hora_inicio,
      hora_fim,
      status,
      status_descricao,
      modalidade,
      url_audiencia_virtual,
      endereco_presencial,
      presenca_hibrida,
      polo_ativo_nome,
      polo_passivo_nome,
      segredo_justica,
      observacoes,
      sala_audiencia_nome,
      processo_id,
      tipo_audiencia!tipo_audiencia_id(descricao),
      orgao_julgador!orgao_julgador_id(descricao),
      classe_judicial!classe_judicial_id(descricao)
    `)
    .in('processo_id', processoIds)
    .order('data_inicio', { ascending: true });

  if (errorAudiencias) {
    console.error('❌ [BuscarAudienciasCPF] Erro ao buscar audiências:', errorAudiencias);
    throw new Error(`Erro ao buscar audiências: ${errorAudiencias.message}`);
  }

  if (!audienciasData || audienciasData.length === 0) {
    console.log('ℹ️ [BuscarAudienciasCPF] Nenhuma audiência encontrada');
    return {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
      },
      audiencias: [],
    };
  }

  // Mapear para formato esperado
  const audiencias: AudienciaClienteCpfRow[] = audienciasData.map(aud => {
    const participacao = participacoes.find(p => p.processo_id === aud.processo_id);

    return {
      audiencia_id: aud.id,
      id_pje: aud.id_pje,
      numero_processo: aud.numero_processo,
      trt: aud.trt,
      grau: aud.grau as 'primeiro_grau' | 'segundo_grau',
      data_inicio: aud.data_inicio,
      data_fim: aud.data_fim,
      hora_inicio: aud.hora_inicio,
      hora_fim: aud.hora_fim,
      status: aud.status,
      status_descricao: aud.status_descricao,
      modalidade: aud.modalidade as 'virtual' | 'presencial' | 'hibrida' | null,
      url_audiencia_virtual: aud.url_audiencia_virtual,
      endereco_presencial: aud.endereco_presencial as Record<string, unknown> | null,
      presenca_hibrida: aud.presenca_hibrida as 'advogado' | 'cliente' | null,
      polo_ativo_nome: aud.polo_ativo_nome,
      polo_passivo_nome: aud.polo_passivo_nome,
      segredo_justica: aud.segredo_justica,
      observacoes: aud.observacoes,
      tipo_audiencia_descricao: (aud.tipo_audiencia as unknown as { descricao: string } | null)?.descricao || null,
      orgao_julgador_descricao: (aud.orgao_julgador as unknown as { descricao: string } | null)?.descricao || null,
      sala_audiencia_nome: aud.sala_audiencia_nome,
      classe_judicial_descricao: (aud.classe_judicial as unknown as { descricao: string } | null)?.descricao || null,
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      cpf: cliente.cpf,
      tipo_parte: participacao?.tipo_parte || 'OUTRO',
      polo: participacao?.polo || 'NEUTRO',
    };
  });

  return {
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf,
    },
    audiencias,
  };
}
