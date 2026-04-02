'use client';

/**
 * Hook para buscar clientes
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Cliente } from '../types';
import type { ListarClientesParams } from '../types';
import { actionListarClientes } from '../actions/clientes-actions';

interface PaginationInfo {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

interface UseClientesResult {
  clientes: Cliente[];
  paginacao: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar clientes
 */
export const useClientes = (params: ListarClientesParams = {}): UseClientesResult => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [paginacao, setPaginacao] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const tipo_pessoa = params.tipo_pessoa || '';
  const nome = params.nome || '';
  const cpf = params.cpf || '';
  const cnpj = params.cnpj || '';
  const ativo = params.ativo;
  const incluirEndereco = params.incluir_endereco ?? false;
  const incluirProcessos = params.incluir_processos ?? false;

  // Normalizar parâmetros para comparação estável
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      tipo_pessoa,
      nome,
      cpf,
      cnpj,
      ativo,
      incluirEndereco,
      incluirProcessos,
    });
  }, [pagina, limite, busca, tipo_pessoa, nome, cpf, cnpj, ativo, incluirEndereco, incluirProcessos]);

  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarClientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarClientes({
        pagina,
        limite,
        busca: busca || undefined,
        tipo_pessoa: (tipo_pessoa as 'pf' | 'pj' | '') || undefined,
        nome: nome || undefined,
        cpf: cpf || undefined,
        cnpj: cnpj || undefined,
        ativo,
        incluir_endereco: incluirEndereco,
        incluir_processos: incluirProcessos,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar clientes');
      }

      setClientes(result.data.data as Cliente[]);
      setPaginacao({
        pagina: result.data.pagination.page,
        limite: result.data.pagination.limit,
        total: result.data.pagination.total,
        totalPaginas: result.data.pagination.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar clientes';
      setError(errorMessage);
      setClientes([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, tipo_pessoa, nome, cpf, cnpj, ativo, incluirEndereco, incluirProcessos]);

  useEffect(() => {
    // Só executar se os parâmetros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarClientes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    clientes,
    paginacao,
    isLoading,
    error,
    refetch: buscarClientes,
  };
};
