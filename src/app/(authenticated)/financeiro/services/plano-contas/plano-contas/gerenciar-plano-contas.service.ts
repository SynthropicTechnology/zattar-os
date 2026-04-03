/**
 * Serviço de negócio para gerenciamento do Plano de Contas
 * Operações de criação, atualização e deleção
 */

import {
  criarPlanoConta as criarPersistence,
  atualizarPlanoConta as atualizarPersistence,
  desativarPlanoConta as desativarPersistence,
  ativarPlanoConta as ativarPersistence,
  deletarPlanoConta as deletarPersistence,
  verificarCodigoExistente,
} from '../persistence/plano-contas-persistence.service';
import type {
  CriarPlanoContaDTO,
  AtualizarPlanoContaDTO,
  PlanoConta,
} from '@/app/(authenticated)/financeiro/domain/plano-contas';

/**
 * Criar nova conta no plano de contas
 */
export const criarPlanoConta = async (
  data: CriarPlanoContaDTO,
  usuarioId: number
): Promise<PlanoConta> => {
  // Validar campos obrigatórios
  if (!data.codigo || data.codigo.trim() === '') {
    throw new Error('Código é obrigatório');
  }

  if (!data.nome || data.nome.trim() === '') {
    throw new Error('Nome é obrigatório');
  }

  if (!data.tipoConta) {
    throw new Error('Tipo de conta é obrigatório');
  }

  if (!data.natureza) {
    throw new Error('Natureza é obrigatória');
  }

  if (!data.nivel) {
    throw new Error('Nível é obrigatório');
  }

  // Verificar se código já existe
  const codigoExiste = await verificarCodigoExistente(data.codigo.trim());
  if (codigoExiste) {
    throw new Error('Código de conta já existe');
  }

  return criarPersistence(data, usuarioId);
};

/**
 * Atualizar conta existente
 */
export const atualizarPlanoConta = async (
  id: number,
  data: AtualizarPlanoContaDTO
): Promise<PlanoConta> => {
  if (!id || id <= 0) {
    throw new Error('ID inválido');
  }

  // Validar que ao menos um campo foi fornecido
  const temAlteracao =
    data.nome !== undefined ||
    data.descricao !== undefined ||
    data.tipoConta !== undefined ||
    data.natureza !== undefined ||
    data.contaPaiId !== undefined ||
    data.ordemExibicao !== undefined ||
    data.ativo !== undefined;

  if (!temAlteracao) {
    throw new Error('Nenhuma alteração fornecida');
  }

  // Validar nome se fornecido
  if (data.nome !== undefined && data.nome.trim() === '') {
    throw new Error('Nome não pode ser vazio');
  }

  return atualizarPersistence(id, data);
};

/**
 * Desativar conta (soft delete)
 */
export const desativarPlanoConta = async (id: number): Promise<void> => {
  if (!id || id <= 0) {
    throw new Error('ID inválido');
  }

  return desativarPersistence(id);
};

/**
 * Ativar conta
 */
export const ativarPlanoConta = async (id: number): Promise<void> => {
  if (!id || id <= 0) {
    throw new Error('ID inválido');
  }

  return ativarPersistence(id);
};

/**
 * Deletar conta permanentemente
 */
export const deletarPlanoConta = async (id: number): Promise<void> => {
  if (!id || id <= 0) {
    throw new Error('ID inválido');
  }

  return deletarPersistence(id);
};

/**
 * Alternar status ativo/inativo
 */
export const alternarStatusPlanoConta = async (
  id: number,
  ativo: boolean
): Promise<void> => {
  if (ativo) {
    return ativarPlanoConta(id);
  } else {
    return desativarPlanoConta(id);
  }
};
