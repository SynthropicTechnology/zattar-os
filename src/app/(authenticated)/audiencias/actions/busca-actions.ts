'use server';

import * as service from '../service';
import { StatusAudiencia, Audiencia } from '../domain';
import type { ActionResult } from './audiencias-actions';

// =============================================================================
// BUSCAS POR CPF/CNPJ (para MCP Tools - FASE 1)
// =============================================================================

/**
 * Busca audiências vinculadas a um cliente por CPF
 */
export async function actionBuscarAudienciasPorCPF(
  cpf: string,
  status?: StatusAudiencia
): Promise<ActionResult<Audiencia[]>> {
  try {
    if (!cpf || !cpf.trim()) {
      return {
        success: false,
        error: 'CPF invalido',
        message: 'CPF e obrigatorio',
      };
    }

    const result = await service.buscarAudienciasPorClienteCPF(cpf, status);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: `${result.data.length} audiência(s) encontrada(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Erro ao buscar audiências.',
    };
  }
}

/**
 * Busca audiências vinculadas a um cliente por CNPJ
 */
export async function actionBuscarAudienciasPorCNPJ(
  cnpj: string,
  status?: StatusAudiencia
): Promise<ActionResult<Audiencia[]>> {
  try {
    if (!cnpj || !cnpj.trim()) {
      return {
        success: false,
        error: 'CNPJ invalido',
        message: 'CNPJ e obrigatorio',
      };
    }

    const result = await service.buscarAudienciasPorClienteCNPJ(cnpj, status);
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: `${result.data.length} audiência(s) encontrada(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Erro ao buscar audiências.',
    };
  }
}

// =============================================================================
// BUSCAS POR NUMERO DE PROCESSO (para MCP Tools - FASE 2)
// =============================================================================

/**
 * Busca audiências de um processo específico pelo número processual
 */
export async function actionBuscarAudienciasPorNumeroProcesso(
  numeroProcesso: string,
  status?: StatusAudiencia
): Promise<ActionResult<Audiencia[]>> {
  try {
    if (!numeroProcesso || !numeroProcesso.trim()) {
      return {
        success: false,
        error: 'Numero invalido',
        message: 'Numero do processo e obrigatorio',
      };
    }

    const result = await service.buscarAudienciasPorNumeroProcesso(
      numeroProcesso.trim(),
      status
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    return {
      success: true,
      data: result.data,
      message: `${result.data.length} audiência(s) encontrada(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Erro ao buscar audiências.',
    };
  }
}
