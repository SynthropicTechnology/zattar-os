'use server';

/**
 * Server Actions para Clientes
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
  createClienteSchema,
  updateClienteSchema,
  type CreateClienteInput,
  type UpdateClienteInput,
  type ListarClientesParams,
} from '../domain';
import * as service from '../service';

// =============================================================================
// SCHEMAS AUXILIARES
// =============================================================================

const listarClientesSchema = z.object({
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

const clienteSugestoesSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
});

// =============================================================================
// ACTIONS DE LEITURA (safe-action)
// =============================================================================

/**
 * Lista clientes com paginacao e filtros
 */
export const actionListarClientesSafe = authenticatedAction(
  listarClientesSchema,
  async (params) => {
    const result = await service.listarClientes(params);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

/**
 * Busca um cliente pelo ID
 */
export const actionBuscarClienteSafe = authenticatedAction(
  idSchema,
  async ({ id }) => {
    const result = await service.buscarCliente(id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    if (!result.data) {
      throw new Error('Cliente nao encontrado');
    }
    return result.data;
  }
);

/**
 * Lista clientes para sugestoes (autocomplete)
 */
export const actionListarClientesSugestoesSafe = authenticatedAction(
  clienteSugestoesSchema,
  async (params) => {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const result = await service.listarClientes({ pagina: 1, limite: limit });
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const options = result.data.data.map((c) => ({
      id: c.id,
      label: c.nome,
      cpf: c.tipo_pessoa === 'pf' ? c.cpf : undefined,
      cnpj: c.tipo_pessoa === 'pj' ? c.cnpj : undefined,
    }));
    return { options };
  }
);

// =============================================================================
// ACTIONS DE ESCRITA (safe-action)
// =============================================================================

/**
 * Cria um novo cliente (para uso com useActionState)
 */
export const actionCriarClienteSafe = authenticatedFormAction(
  createClienteSchema,
  async (data) => {
    const result = await service.criarCliente(data as CreateClienteInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/partes/clientes');
    revalidatePath('/app/partes');
    return result.data;
  }
);

/**
 * Atualiza um cliente existente
 */
export const actionAtualizarClienteSafe = authenticatedAction(
  z.object({
    id: z.number().min(1),
    data: updateClienteSchema,
  }),
  async ({ id, data }) => {
    const result = await service.atualizarCliente(id, data as UpdateClienteInput);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/partes/clientes');
    revalidatePath(`/app/partes/clientes/${id}`);
    revalidatePath('/app/partes');
    return result.data;
  }
);

/**
 * Desativa um cliente (soft delete)
 */
export const actionDesativarClienteSafe = authenticatedAction(
  idSchema,
  async ({ id }) => {
    const result = await service.desativarCliente(id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/partes/clientes');
    revalidatePath(`/app/partes/clientes/${id}`);
    revalidatePath('/app/partes');
    return null;
  }
);

// =============================================================================
// AÇÕES EM MASSA
// =============================================================================

/**
 * Desativa múltiplos clientes em massa (soft delete)
 */
export async function actionDesativarClientesEmMassa(ids: number[]) {
  try {
    const result = await service.desativarClientesEmMassa(ids);
    if (!result.success) {
      return { success: false, message: result.error.message };
    }
    revalidatePath('/app/partes/clientes');
    revalidatePath('/app/partes');
    return {
      success: true,
      message: `${result.data} cliente${result.data > 1 ? 's' : ''} desativado${result.data > 1 ? 's' : ''} com sucesso`,
    };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

// =============================================================================
// LEGACY EXPORTS (mantidos para retrocompatibilidade durante migracao)
// Serao removidos apos atualizacao de todos os consumidores
// =============================================================================

export async function actionListarClientes(params: ListarClientesParams = {}) {
  try {
    const result = await service.listarClientes(params);
    if (!result.success) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarCliente(id: number) {
  try {
    const result = await service.buscarCliente(id);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Cliente nao encontrado' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarCliente(id: number, input: Parameters<typeof service.atualizarCliente>[1]) {
  try {
    const result = await service.atualizarCliente(id, input);
    if (!result.success) return { success: false, error: result.error.message };
    revalidatePath('/app/partes');
    revalidatePath(`/app/partes/clientes/${id}`);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionListarClientesSugestoes(params?: { limit?: number; search?: string }) {
  try {
    const limit = Math.min(Math.max(params?.limit ?? 20, 1), 100);
    const result = await service.listarClientes({
      pagina: 1,
      limite: limit,
      busca: params?.search,
    });
    if (!result.success) return { success: false, error: result.error.message };

    const options = result.data.data.map((c) => ({
      id: c.id,
      label: c.nome,
      cpf: c.tipo_pessoa === 'pf' ? c.cpf : undefined,
      cnpj: c.tipo_pessoa === 'pj' ? c.cnpj : undefined,
    }));

    return { success: true, data: { options } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Busca clientes para uso em combobox/autocomplete
 * Otimizado para performance com limite fixo de resultados
 */
export async function actionBuscarClientesParaCombobox(query: string = '') {
  try {
    const result = await service.listarClientes({
      busca: query,
      limite: 50, // Limite fixo para performance
      pagina: 1,
      ativo: true, // Apenas clientes ativos
    });

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    // Retornar apenas id e nome para reduzir payload
    const options = result.data.data.map(cliente => ({
      id: cliente.id,
      nome: cliente.nome,
    }));

    return { success: true, data: options };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// =============================================================================
// BUSCAS POR CPF/CNPJ (para MCP Tools - FASE 1)
// =============================================================================

/**
 * Busca cliente por CPF com endereco e processos relacionados
 */
export async function actionBuscarClientePorCPF(cpf: string) {
  try {
    const result = await service.buscarClientePorCPF(cpf);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Cliente nao encontrado' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Busca cliente por CNPJ com endereco e processos relacionados
 */
export async function actionContarClientes() {
  try {
    const result = await service.contarClientes();
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Conta clientes e calcula variação percentual em relação ao mês anterior
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

export async function actionContarClientesComEstatisticas(dateFilter?: DashboardDateFilterInput) {
  try {
    // Para "Tudo", não faz sentido comparar com período anterior.
    if (dateFilter?.mode === 'all') {
      const resultAtual = await service.contarClientes();
      if (!resultAtual.success) return { success: false, error: resultAtual.error.message };
      return {
        success: true,
        data: { total: resultAtual.data, variacaoPercentual: null, comparacaoLabel: '' },
      };
    }

    if (dateFilter?.mode === 'range') {
      const range = normalizeRangeFromInput({ from: dateFilter.from, to: dateFilter.to });
      if (!range) {
        return { success: false, error: 'Período inválido' };
      }

      const atualResult = await service.contarClientesEntreDatas(range.from, range.to);
      if (!atualResult.success) return { success: false, error: atualResult.error.message };

      const prev = computePreviousPeriod(range);
      const prevResult = await service.contarClientesEntreDatas(prev.from, prev.to);
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
    const resultAtual = await service.contarClientes();
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
    const resultMesAnterior = await service.contarClientesAteData(ultimoDiaMesAnterior);
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
      // Se não havia clientes no mês anterior e agora há, é 100% de crescimento
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

/**
 * Conta clientes agrupados por estado
 */
export async function actionContarClientesPorEstado(limite: number = 4, dateFilter?: DashboardDateFilterInput) {
  try {
    if (dateFilter?.mode === 'range') {
      const range = normalizeRangeFromInput({ from: dateFilter.from, to: dateFilter.to });
      if (!range) return { success: false, error: 'Período inválido' };

      const result = await service.contarClientesPorEstadoComFiltro({
        limite,
        dataInicio: range.from,
        dataFim: range.to,
      });
      if (!result.success) return { success: false, error: result.error.message };
      return { success: true, data: result.data };
    }

    const result = await service.contarClientesPorEstado(limite);
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarClientePorCNPJ(cnpj: string) {
  try {
    const result = await service.buscarClientePorCNPJ(cnpj);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Cliente nao encontrado' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
