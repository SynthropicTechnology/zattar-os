'use server';

import {
  findClienteByCPF,
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  findAllPartesContrarias,
  searchPartesContrariaComEndereco,
} from '@/app/(authenticated)/partes/server';
import { normalizarDocumento } from '@/app/(authenticated)/partes';
import type { Cliente, ParteContraria, ParteContrariaComEndereco } from '@/app/(authenticated)/partes/types';

/**
 * Busca um cliente por CPF
 */
export async function searchClienteByCPF(cpf: string): Promise<{
  success: boolean;
  data?: Cliente | null;
  error?: string;
}> {
  try {
    if (!cpf || cpf.trim().length === 0) {
      return { success: false, error: 'CPF é obrigatório' };
    }

    const result = await findClienteByCPF(cpf);

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Busca uma parte contrária por CPF, CNPJ ou nome
 */
export async function searchParteContraria(params: {
  cpf?: string;
  cnpj?: string;
  nome?: string;
}): Promise<{
  success: boolean;
  data?: ParteContraria | null;
  error?: string;
}> {
  try {
    const { cpf, cnpj, nome } = params;

    if (!cpf && !cnpj && !nome) {
      return { success: false, error: 'Informe CPF, CNPJ ou nome para buscar' };
    }

    if (cpf && cpf.trim().length > 0) {
      const cpfNormalizado = normalizarDocumento(cpf);
      const result = await findParteContrariaByCPF(cpfNormalizado);

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      if (result.data) {
        return { success: true, data: result.data };
      }
    }

    if (cnpj && cnpj.trim().length > 0) {
      const cnpjNormalizado = normalizarDocumento(cnpj);
      const result = await findParteContrariaByCNPJ(cnpjNormalizado);

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      if (result.data) {
        return { success: true, data: result.data };
      }
    }

    if (nome && nome.trim().length > 0) {
      const result = await findAllPartesContrarias({
        busca: nome.trim(),
        limite: 1,
      });

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      if (result.data.data.length > 0) {
        return { success: true, data: result.data.data[0] };
      }
    }

    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Busca partes contrárias por termo com endereço populado (para typeahead)
 */
export async function searchPartesContrariasList(busca: string): Promise<{
  success: boolean;
  data?: ParteContrariaComEndereco[];
  error?: string;
}> {
  try {
    if (!busca || busca.trim().length < 2) {
      return { success: true, data: [] };
    }

    const result = await searchPartesContrariaComEndereco(busca.trim(), 10);

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
