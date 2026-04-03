// Serviço de aplicação para listar agendamentos

import { listarAgendamentos as listarAgendamentosPersistence } from '../persistence/agendamento-persistence.service';
import type { ListarAgendamentosParams } from '../../types/agendamentos-types';
import type { Paginacao } from '@/app/(authenticated)/captura/types/paginacao';

export interface ListarAgendamentosResult {
  agendamentos: Array<{
    id: number;
    tipo_captura: string;
    advogado_id: number;
    credencial_ids: number[];
    periodicidade: string;
    dias_intervalo: number | null;
    horario: string;
    ativo: boolean;
    parametros_extras: Record<string, unknown> | null;
    ultima_execucao: string | null;
    proxima_execucao: string;
    created_at: string;
    updated_at: string;
  }>;
  paginacao: Paginacao;
}

/**
 * Lista agendamentos com filtros e paginação
 */
export async function listarAgendamentos(
  params: ListarAgendamentosParams = {}
): Promise<ListarAgendamentosResult> {
  return await listarAgendamentosPersistence(params);
}

