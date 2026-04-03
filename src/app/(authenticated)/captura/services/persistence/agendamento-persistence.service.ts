// Serviço de persistência para agendamentos de captura

import { createServiceClient } from '@/lib/supabase/service-client';
import type {
  Agendamento,
  CriarAgendamentoParams,
  AtualizarAgendamentoParams,
  ListarAgendamentosParams,
} from '../../types/agendamentos-types';
import type { Paginacao } from '@/app/(authenticated)/captura/types/paginacao';

const TABLE_NAME = 'agendamentos';

/**
 * Cria um novo agendamento
 */
export async function criarAgendamento(
  params: CriarAgendamentoParams & { proxima_execucao?: string }
): Promise<Agendamento> {
  const supabase = createServiceClient();

  // Validar periodicidade e dias_intervalo
  if (params.periodicidade === 'a_cada_N_dias') {
    if (!params.dias_intervalo || params.dias_intervalo <= 0) {
      throw new Error('dias_intervalo é obrigatório e deve ser maior que 0 quando periodicidade = a_cada_N_dias');
    }
  }

  // Preparar dados para inserção
  const insertData: Record<string, unknown> = {
    tipo_captura: params.tipo_captura,
    advogado_id: params.advogado_id,
    credencial_ids: params.credencial_ids,
    periodicidade: params.periodicidade,
    dias_intervalo: params.periodicidade === 'diario' ? null : params.dias_intervalo,
    horario: params.horario,
    ativo: params.ativo !== undefined ? params.ativo : true,
    parametros_extras: params.parametros_extras || null,
  };

  // Se proxima_execucao foi fornecida (deve ser calculada antes), usar ela
  if (params.proxima_execucao) {
    insertData.proxima_execucao = params.proxima_execucao;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar agendamento: ${error.message}`);
  }

  return data as Agendamento;
}

/**
 * Lista agendamentos com paginação e filtros
 */
export async function listarAgendamentos(
  params: ListarAgendamentosParams = {}
): Promise<{ agendamentos: Agendamento[]; paginacao: Paginacao }> {
  const supabase = createServiceClient();

  const pagina = params.pagina || 1;
  const limite = params.limite || 50;

  let query = supabase.from(TABLE_NAME).select('*', { count: 'exact' });

  // Filtros
  if (params.advogado_id !== undefined) {
    query = query.eq('advogado_id', params.advogado_id);
  }

  if (params.tipo_captura) {
    query = query.eq('tipo_captura', params.tipo_captura);
  }

  if (params.ativo !== undefined) {
    query = query.eq('ativo', params.ativo);
  }

  if (params.proxima_execucao_min) {
    query = query.gte('proxima_execucao', params.proxima_execucao_min);
  }

  if (params.proxima_execucao_max) {
    query = query.lte('proxima_execucao', params.proxima_execucao_max);
  }

  // Ordenação
  const ordenarPor = params.ordenar_por || 'proxima_execucao';
  const ordem = params.ordem || 'asc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Paginação
  const inicio = (pagina - 1) * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar agendamentos: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    agendamentos: (data || []) as Agendamento[],
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas,
    },
  };
}

/**
 * Busca um agendamento por ID
 */
export async function buscarAgendamentoPorId(id: number): Promise<Agendamento | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Não encontrado
      return null;
    }
    throw new Error(`Erro ao buscar agendamento: ${error.message}`);
  }

  return data as Agendamento;
}

/**
 * Atualiza um agendamento
 */
export async function atualizarAgendamento(
  id: number,
  params: AtualizarAgendamentoParams & { proxima_execucao?: string; ultima_execucao?: string }
): Promise<Agendamento> {
  const supabase = createServiceClient();

  // Validar periodicidade e dias_intervalo se ambos estão sendo atualizados
  if (params.periodicidade === 'a_cada_N_dias') {
    if (params.dias_intervalo === undefined || params.dias_intervalo === null || params.dias_intervalo <= 0) {
      throw new Error('dias_intervalo é obrigatório e deve ser maior que 0 quando periodicidade = a_cada_N_dias');
    }
  }

  // Preparar dados para atualização
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (params.tipo_captura !== undefined) updateData.tipo_captura = params.tipo_captura;
  if (params.advogado_id !== undefined) updateData.advogado_id = params.advogado_id;
  if (params.credencial_ids !== undefined) updateData.credencial_ids = params.credencial_ids;
  if (params.periodicidade !== undefined) {
    updateData.periodicidade = params.periodicidade;
    // Se mudou para diario, limpar dias_intervalo; se mudou para a_cada_N_dias, garantir que tem valor
    if (params.periodicidade === 'diario') {
      updateData.dias_intervalo = null;
    } else if (params.periodicidade === 'a_cada_N_dias' && params.dias_intervalo === undefined) {
      // Se mudou periodicidade mas não forneceu dias_intervalo, buscar do registro atual
      const atual = await buscarAgendamentoPorId(id);
      if (!atual || atual.dias_intervalo === null) {
        throw new Error('dias_intervalo é obrigatório quando periodicidade = a_cada_N_dias');
      }
      updateData.dias_intervalo = atual.dias_intervalo;
    }
  }
  if (params.dias_intervalo !== undefined) {
    if (params.periodicidade === undefined) {
      // Verificar periodicidade atual
      const atual = await buscarAgendamentoPorId(id);
      if (atual?.periodicidade === 'diario') {
        throw new Error('Não é possível definir dias_intervalo quando periodicidade = diario');
      }
    }
    updateData.dias_intervalo = params.dias_intervalo;
  }
  if (params.horario !== undefined) updateData.horario = params.horario;
  if (params.ativo !== undefined) updateData.ativo = params.ativo;
  if (params.parametros_extras !== undefined) updateData.parametros_extras = params.parametros_extras;
  if (params.proxima_execucao !== undefined) updateData.proxima_execucao = params.proxima_execucao;
  if (params.ultima_execucao !== undefined) updateData.ultima_execucao = params.ultima_execucao;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar agendamento: ${error.message}`);
  }

  return data as Agendamento;
}

/**
 * Deleta um agendamento
 */
export async function deletarAgendamento(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) {
    throw new Error(`Erro ao deletar agendamento: ${error.message}`);
  }
}

/**
 * Busca agendamentos que estão prontos para execução
 * (ativo = true e proxima_execucao <= now())
 */
export async function buscarAgendamentosParaExecutar(): Promise<Agendamento[]> {
  const supabase = createServiceClient();
  const agora = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('ativo', true)
    .lte('proxima_execucao', agora)
    .order('proxima_execucao', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar agendamentos para executar: ${error.message}`);
  }

  return (data || []) as Agendamento[];
}

