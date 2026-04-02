
'use server'

import { revalidatePath } from 'next/cache';
import * as service from '../service';
import { criarAcordoComParcelasSchema, type StatusAcordo, type TipoObrigacao, type DirecaoPagamento } from '../domain';
import { AtualizarAcordoParams, ListarAcordosParams } from '../types';

export async function actionListarAcordos(params: ListarAcordosParams) {
  try {
    const data = await service.listarAcordos(params);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarAcordo(id: number) {
  try {
    const data = await service.buscarAcordoPorId(id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarAcordoComParcelas(formData: FormData | object) {
  try {
    const params = (formData instanceof FormData
      ? Object.fromEntries(formData)
      : formData) as Record<string, FormDataEntryValue | number | string>;
    
    // Type coercion for numbers if coming from FormData
    if (formData instanceof FormData) {
        // Simple helper to parse numbers
        const keysToNumber = ['processoId', 'valorTotal', 'numeroParcelas', 'percentualEscritorio', 'honorariosSucumbenciaisTotal', 'intervaloEntreParcelas'];
        keysToNumber.forEach(k => {
            if (params[k]) params[k] = Number(params[k]);
        });
    }

    const validacao = criarAcordoComParcelasSchema.safeParse(params);
    if (!validacao.success) {
      return { success: false, error: validacao.error.errors[0].message };
    }

    const data = await service.criarAcordoComParcelas(validacao.data);
    revalidatePath('/app/acordos-condenacoes');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarAcordo(id: number, dados: AtualizarAcordoParams) {
  try {
    const data = await service.atualizarAcordo(id, dados);
    revalidatePath('/app/acordos-condenacoes');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}


export async function actionDeletarAcordo(id: number) {
  try {
    await service.deletarAcordo(id);
    revalidatePath('/app/acordos-condenacoes');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionListarObrigacoesPorPeriodo(
  params: {
    dataInicio: string;
    dataFim: string;
    incluirSemData?: boolean;
    status?: StatusAcordo;
    tipo?: TipoObrigacao;
    direcao?: DirecaoPagamento;
    busca?: string;
  }
) {
  try {
    // Reutiliza o serviço de listar acordos mas com limite alto para calendário
    const result = await service.listarAcordos({
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      status: params.status,
      tipo: params.tipo,
      direcao: params.direcao,
      busca: params.busca,
      limite: 1000,
    });

    return { success: true, data: result.acordos };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar obrigações',
    };
  }
}

// =============================================================================
// BUSCAS POR CPF/CNPJ (para MCP Tools - FASE 1)
// =============================================================================

/**
 * Busca acordos e condenações vinculados a um cliente por CPF
 */
export async function actionBuscarAcordosPorCPF(
  cpf: string,
  tipo?: TipoObrigacao,
  status?: StatusAcordo
) {
  try {
    if (!cpf || !cpf.trim()) {
      return {
        success: false,
        error: 'CPF invalido',
      };
    }

    const result = await service.buscarAcordosPorClienteCPF(cpf, tipo, status);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar acordos',
    };
  }
}

/**
 * Busca acordos e condenações vinculados a um cliente por CNPJ
 */
export async function actionBuscarAcordosPorCNPJ(
  cnpj: string,
  tipo?: TipoObrigacao,
  status?: StatusAcordo
) {
  try {
    if (!cnpj || !cnpj.trim()) {
      return {
        success: false,
        error: 'CNPJ invalido',
      };
    }

    const result = await service.buscarAcordosPorClienteCNPJ(cnpj, tipo, status);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar acordos',
    };
  }
}

// =============================================================================
// BUSCAS POR NUMERO DE PROCESSO (para MCP Tools - FASE 2)
// =============================================================================

/**
 * Busca acordos e condenações de um processo específico pelo número processual
 */
export async function actionBuscarAcordosPorNumeroProcesso(
  numeroProcesso: string,
  tipo?: TipoObrigacao
) {
  try {
    if (!numeroProcesso || !numeroProcesso.trim()) {
      return {
        success: false,
        error: 'Numero do processo invalido',
      };
    }

    const result = await service.buscarAcordosPorNumeroProcesso(numeroProcesso, tipo);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar acordos',
    };
  }
}



