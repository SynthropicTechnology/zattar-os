/**
 * Serviço de negócio para listagem do Plano de Contas
 */

import {
  listarPlanoContas as listarPlanoContasPersistence,
  buscarPlanoContaPorId as buscarPorIdPersistence,
  buscarPlanoContaPorCodigo as buscarPorCodigoPersistence,
  listarContasSinteticas as listarSinteticasPersistence,
} from '../persistence/plano-contas-persistence.service';
import type {
  ListarPlanoContasParams,
  ListarPlanoContasResponse,
  PlanoContaComPai,
  PlanoConta,
} from '@/app/(authenticated)/financeiro/domain/plano-contas';

/**
 * Obter listagem de plano de contas com filtros e paginação
 */
export const obterPlanoContas = async (
  params: ListarPlanoContasParams
): Promise<ListarPlanoContasResponse> => {
  // Validar limites
  const limite = Math.min(params.limite || 50, 100);
  const pagina = Math.max(params.pagina || 1, 1);

  return listarPlanoContasPersistence({
    ...params,
    pagina,
    limite,
  });
};

/**
 * Obter conta por ID
 */
export const obterPlanoContaPorId = async (
  id: number
): Promise<PlanoContaComPai | null> => {
  if (!id || id <= 0) {
    throw new Error('ID inválido');
  }

  return buscarPorIdPersistence(id);
};

/**
 * Obter conta por código
 */
export const obterPlanoContaPorCodigo = async (
  codigo: string
): Promise<PlanoContaComPai | null> => {
  if (!codigo || codigo.trim() === '') {
    throw new Error('Código inválido');
  }

  return buscarPorCodigoPersistence(codigo.trim());
};

/**
 * Listar contas sintéticas ativas (para seletores de conta pai)
 */
export const listarContasSinteticas = async (): Promise<PlanoConta[]> => {
  return listarSinteticasPersistence();
};
