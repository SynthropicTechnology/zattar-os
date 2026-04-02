/**
 * Funções de compatibilidade para migração de imports antigos
 * Mantém compatibilidade com código que usa nomes em português (PorCPF)
 * ao invés de inglês (ByCPF)
 */

import type { Cliente, ParteContraria, Terceiro, CreateClienteInput, CreateParteContrariaInput, UpdateParteContrariaInput, CreateTerceiroInput } from './domain';
import {
  upsertClienteByCPF,
  findClienteByCPF,
  upsertClienteByCNPJ,
  findClienteByCNPJ,
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  saveParteContraria,
  updateParteContraria,
  upsertTerceiroByCPF,
  upsertTerceiroByCNPJ,
  findTerceiroByCPF,
  findTerceiroByCNPJ,
  saveTerceiro,
} from './repository';

// Clientes - Compatibilidade
export async function upsertClientePorCPF(
  cpf: string,
  input: CreateClienteInput
): Promise<{ cliente: Cliente; created: boolean }> {
  const result = await upsertClienteByCPF(cpf, input);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function buscarClientePorCPF(cpf: string): Promise<Cliente | null> {
  const result = await findClienteByCPF(cpf);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function upsertClientePorCNPJ(
  cnpj: string,
  input: CreateClienteInput
): Promise<{ cliente: Cliente; created: boolean }> {
  const result = await upsertClienteByCNPJ(cnpj, input);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function buscarClientePorCNPJ(cnpj: string): Promise<Cliente | null> {
  const result = await findClienteByCNPJ(cnpj);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

// Partes Contrárias - Compatibilidade
export async function upsertParteContrariaPorCPF(
  cpf: string,
  input: CreateParteContrariaInput
): Promise<{ parteContraria: ParteContraria; created: boolean }> {
  const result = await findParteContrariaByCPF(cpf);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  if (result.data) {
    const updateResult = await updateParteContraria(result.data.id, input as UpdateParteContrariaInput, result.data);
    if (!updateResult.success) {
      throw new Error(updateResult.error.message);
    }
    return { parteContraria: updateResult.data, created: false };
  }
  
  const createResult = await saveParteContraria(input);
  if (!createResult.success) {
    throw new Error(createResult.error.message);
  }
  return { parteContraria: createResult.data, created: true };
}

export async function buscarParteContrariaPorCPF(cpf: string): Promise<ParteContraria | null> {
  const result = await findParteContrariaByCPF(cpf);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function upsertParteContrariaPorCNPJ(
  cnpj: string,
  input: CreateParteContrariaInput
): Promise<{ parteContraria: ParteContraria; created: boolean }> {
  const result = await findParteContrariaByCNPJ(cnpj);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  if (result.data) {
    const updateResult = await updateParteContraria(result.data.id, input as UpdateParteContrariaInput, result.data);
    if (!updateResult.success) {
      throw new Error(updateResult.error.message);
    }
    return { parteContraria: updateResult.data, created: false };
  }
  
  const createResult = await saveParteContraria(input);
  if (!createResult.success) {
    throw new Error(createResult.error.message);
  }
  return { parteContraria: createResult.data, created: true };
}

export async function buscarParteContrariaPorCNPJ(cnpj: string): Promise<ParteContraria | null> {
  const result = await findParteContrariaByCNPJ(cnpj);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

/**
 * Cria uma parte contrária sem documento (CPF/CNPJ)
 *
 * Usado para casos especiais como:
 * - Órgãos julgadores em mandados de segurança (Juízo da Vara, Tribunal, etc.)
 * - Entidades públicas sem CNPJ cadastrado no PJE
 */
export async function criarParteContrariaSemDocumento(
  input: CreateParteContrariaInput
): Promise<{ parteContraria: ParteContraria; created: boolean }> {
  const result = await saveParteContraria(input);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return { parteContraria: result.data, created: true };
}

// Terceiros - Compatibilidade
export async function upsertTerceiroPorCPF(
  cpf: string,
  input: CreateTerceiroInput
): Promise<{ terceiro: Terceiro; created: boolean }> {
  const result = await upsertTerceiroByCPF(cpf, input);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function buscarTerceiroPorCPF(cpf: string): Promise<Terceiro | null> {
  const result = await findTerceiroByCPF(cpf);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function upsertTerceiroPorCNPJ(
  cnpj: string,
  input: CreateTerceiroInput
): Promise<{ terceiro: Terceiro; created: boolean }> {
  const result = await upsertTerceiroByCNPJ(cnpj, input);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function buscarTerceiroPorCNPJ(cnpj: string): Promise<Terceiro | null> {
  const result = await findTerceiroByCNPJ(cnpj);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function criarTerceiroSemDocumento(
  input: CreateTerceiroInput
): Promise<{ terceiro: Terceiro; created: boolean }> {
  const result = await saveTerceiro(input);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return { terceiro: result.data, created: true };
}

