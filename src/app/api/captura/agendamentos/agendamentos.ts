// Cliente API para endpoints de agendamentos de captura

import type {
  Agendamento,
  CriarAgendamentoParams,
  AtualizarAgendamentoParams,
} from '@/app/(authenticated)/captura';

export interface AgendamentosApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Lista agendamentos
 */
export async function listarAgendamentos(
  params: {
    pagina?: number;
    limite?: number;
    advogado_id?: number;
    tipo_captura?: string;
    ativo?: boolean;
  } = {}
): Promise<AgendamentosApiResponse<{ agendamentos: Agendamento[]; paginacao: unknown }>> {
  const searchParams = new URLSearchParams();
  if (params.pagina) searchParams.set('pagina', params.pagina.toString());
  if (params.limite) searchParams.set('limite', params.limite.toString());
  if (params.advogado_id) searchParams.set('advogado_id', params.advogado_id.toString());
  if (params.tipo_captura) searchParams.set('tipo_captura', params.tipo_captura);
  if (params.ativo !== undefined) searchParams.set('ativo', params.ativo.toString());

  const response = await fetch(`/api/captura/agendamentos?${searchParams.toString()}`);
  return response.json();
}

/**
 * Busca um agendamento por ID
 */
export async function buscarAgendamento(
  id: number
): Promise<AgendamentosApiResponse<Agendamento>> {
  const response = await fetch(`/api/captura/agendamentos/${id}`);
  return response.json();
}

/**
 * Cria um novo agendamento
 */
export async function criarAgendamento(
  params: CriarAgendamentoParams
): Promise<AgendamentosApiResponse<Agendamento>> {
  const response = await fetch('/api/captura/agendamentos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  return response.json();
}

/**
 * Atualiza um agendamento
 */
export async function atualizarAgendamento(
  id: number,
  params: AtualizarAgendamentoParams
): Promise<AgendamentosApiResponse<Agendamento>> {
  const response = await fetch(`/api/captura/agendamentos/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  return response.json();
}

/**
 * Deleta um agendamento
 */
export async function deletarAgendamento(
  id: number
): Promise<AgendamentosApiResponse<{ message: string }>> {
  const response = await fetch(`/api/captura/agendamentos/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

/**
 * Executa um agendamento manualmente
 */
export async function executarAgendamento(
  id: number
): Promise<AgendamentosApiResponse<{ capture_id: number | null; status: string; message: string }>> {
  const response = await fetch(`/api/captura/agendamentos/${id}/executar`, {
    method: 'POST',
  });
  return response.json();
}

