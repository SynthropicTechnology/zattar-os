'use server';

/**
 * Server Actions para Partes Contrarias
 *
 * Utiliza wrapper safe-action para:
 * - Autenticacao automatica
 * - Validacao com Zod
 * - Tipagem forte
 * - Error handling consistente
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  authenticatedAction,
  authenticatedFormAction,
} from '@/lib/safe-action';
import {
  createParteContrariaSchema,
  updateParteContrariaSchema,
  type CreateParteContrariaInput,
  type UpdateParteContrariaInput,
  type ListarPartesContrariasParams,
} from '../domain';
import * as service from '../service';

// =============================================================================
// SCHEMAS AUXILIARES
// =============================================================================

const listarPartesContrariasSchema = z.object({
  pagina: z.number().min(1).optional().default(1),
  limite: z.number().min(1).max(100).optional().default(20),
  busca: z.string().optional(),
  tipo_pessoa: z.enum(['pf', 'pj']).optional(),
  ativo: z.boolean().optional(),
  ordenarPor: z.string().optional(),
  ordem: z.enum(['asc', 'desc']).optional(),
});

const idSchema = z.object({
  id: z.number().min(1, 'ID invalido'),
});

// =============================================================================
// ACTIONS DE LEITURA (safe-action)
// =============================================================================

/**
 * Lista partes contrarias com paginacao e filtros
 */
export const actionListarPartesContrariasSafe = authenticatedAction(
  listarPartesContrariasSchema,
  async (params) => {
    const result = await service.listarPartesContrarias(params);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

/**
 * Busca uma parte contraria pelo ID
 */
export const actionBuscarParteContrariaSafe = authenticatedAction(
  idSchema,
  async ({ id }) => {
    const result = await service.buscarParteContraria(id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    if (!result.data) {
      throw new Error('Parte contraria nao encontrada');
    }
    return result.data;
  }
);

// =============================================================================
// ACTIONS DE ESCRITA (safe-action)
// =============================================================================

/**
 * Cria uma nova parte contraria (para uso com useActionState)
 */
export const actionCriarParteContrariaSafe = authenticatedFormAction(
  createParteContrariaSchema,
  async (data) => {
    const result = await service.criarParteContraria(data as CreateParteContrariaInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/partes/partes-contrarias');
    revalidatePath('/app/partes');
    return result.data;
  }
);

/**
 * Atualiza uma parte contraria existente
 */
export const actionAtualizarParteContrariaSafe = authenticatedAction(
  z.object({
    id: z.number().min(1),
    data: updateParteContrariaSchema,
  }),
  async ({ id, data }) => {
    const result = await service.atualizarParteContraria(id, data as UpdateParteContrariaInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/partes/partes-contrarias');
    revalidatePath(`/app/partes/partes-contrarias/${id}`);
    revalidatePath('/app/partes');
    return result.data;
  }
);

// =============================================================================
// AÇÕES EM MASSA
// =============================================================================

/**
 * Desativa múltiplas partes contrárias em massa (soft delete)
 */
export async function actionDesativarPartesContrariasEmMassa(ids: number[]) {
  try {
    const result = await service.desativarPartesContrariasEmMassa(ids);
    if (!result.success) {
      return { success: false, message: result.error.message };
    }
    revalidatePath('/app/partes/partes-contrarias');
    revalidatePath('/app/partes');
    return {
      success: true,
      message: `${result.data} parte${result.data > 1 ? 's' : ''} contrária${result.data > 1 ? 's' : ''} desativada${result.data > 1 ? 's' : ''} com sucesso`,
    };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

// =============================================================================
// LEGACY EXPORTS (mantidos para retrocompatibilidade durante migracao)
// Serao removidos apos atualizacao de todos os consumidores
// =============================================================================

export async function actionListarPartesContrarias(params: ListarPartesContrariasParams = {}) {
  try {
    const result = await service.listarPartesContrarias(params);
    if (!result.success) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarParteContraria(id: number) {
  try {
    const result = await service.buscarParteContraria(id);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Parte contraria nao encontrada' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarParteContraria(id: number, input: Parameters<typeof service.atualizarParteContraria>[1]) {
  try {
    const result = await service.atualizarParteContraria(id, input);
    if (!result.success) return { success: false, error: result.error.message };
    revalidatePath('/app/partes');
    revalidatePath(`/app/partes/partes-contrarias/${id}`);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Busca partes contrarias para uso em combobox/autocomplete
 * Otimizado para performance com limite fixo de resultados
 */
/**
 * Conta partes contrárias e calcula variação percentual em relação ao mês anterior
 */
type DashboardDateFilterInput =
  | { mode: 'all' }
  | { mode: 'range'; from: string; to: string };

function normalizeRangeFromInput(input: { from: string; to: string }): { from: Date; to: Date } | null {
  const from = new Date(input.from);
  const to = new Date(input.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  if (from.getTime() > to.getTime()) return null;
  return { from, to };
}

function computePreviousPeriod(range: { from: Date; to: Date }): { from: Date; to: Date } {
  const durationMs = range.to.getTime() - range.from.getTime();
  const prevTo = new Date(range.from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: prevFrom, to: prevTo };
}

export async function actionContarPartesContrariasComEstatisticas(dateFilter?: DashboardDateFilterInput) {
  try {
    // Para "Tudo", não faz sentido comparar com período anterior.
    if (dateFilter?.mode === 'all') {
      const resultAtual = await service.contarPartesContrarias();
      if (!resultAtual.success) return { success: false, error: resultAtual.error.message };
      return {
        success: true,
        data: { total: resultAtual.data, variacaoPercentual: null, comparacaoLabel: '' },
      };
    }

    if (dateFilter?.mode === 'range') {
      const range = normalizeRangeFromInput({ from: dateFilter.from, to: dateFilter.to });
      if (!range) return { success: false, error: 'Período inválido' };

      const atualResult = await service.contarPartesContrariasEntreDatas(range.from, range.to);
      if (!atualResult.success) return { success: false, error: atualResult.error.message };

      const prev = computePreviousPeriod(range);

      const prevResult = await service.contarPartesContrariasEntreDatas(prev.from, prev.to);
      if (!prevResult.success) {
        return {
          success: true,
          data: { total: atualResult.data, variacaoPercentual: null, comparacaoLabel: 'em relação ao período anterior' },
        };
      }

      const totalAtual = atualResult.data;
      const totalPrev = prevResult.data;
      let variacaoPercentual: number | null = null;
      if (totalPrev > 0) variacaoPercentual = ((totalAtual - totalPrev) / totalPrev) * 100;
      else if (totalAtual > 0) variacaoPercentual = 100;

      return {
        success: true,
        data: { total: totalAtual, variacaoPercentual, comparacaoLabel: 'em relação ao período anterior' },
      };
    }

    // Total atual
    const resultAtual = await service.contarPartesContrarias();
    if (!resultAtual.success) {
      return { success: false, error: resultAtual.error.message };
    }

    // Data do final do mês anterior
    const agora = new Date();
    const primeiroDiaMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual);
    ultimoDiaMesAnterior.setDate(0); // Vai para o último dia do mês anterior
    ultimoDiaMesAnterior.setHours(23, 59, 59, 999);

    // Total do mês anterior
    const resultMesAnterior = await service.contarPartesContrariasAteData(ultimoDiaMesAnterior);
    if (!resultMesAnterior.success) {
      // Se falhar, retorna apenas o total atual sem estatística
      return {
        success: true,
        data: {
          total: resultAtual.data,
          variacaoPercentual: null,
        },
      };
    }

    const totalAtual = resultAtual.data;
    const totalMesAnterior = resultMesAnterior.data;

    // Calcular variação percentual
    let variacaoPercentual: number | null = null;
    if (totalMesAnterior > 0) {
      variacaoPercentual = ((totalAtual - totalMesAnterior) / totalMesAnterior) * 100;
    } else if (totalAtual > 0) {
      // Se não havia partes contrárias no mês anterior e agora há, é 100% de crescimento
      variacaoPercentual = 100;
    }

    return {
      success: true,
      data: {
        total: totalAtual,
        variacaoPercentual,
        comparacaoLabel: 'em relação ao mês anterior',
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarPartesContrariasParaCombobox(query: string = '') {
  try {
    const result = await service.listarPartesContrarias({
      busca: query,
      limite: 50, // Limite fixo para performance
      pagina: 1,
      // Nota: tabela usa 'ativo' (boolean), não 'situacao'
    });

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    // Retornar apenas id e nome para reduzir payload
    const options = result.data.data.map(parte => ({
      id: parte.id,
      nome: parte.nome,
    }));

    return { success: true, data: options };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
