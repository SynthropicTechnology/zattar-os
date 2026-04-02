
'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  actionListarSalarios,
  actionBuscarSalario,
  actionBuscarSalariosDoUsuario,
  actionCriarSalario,
  actionAtualizarSalario,
  actionEncerrarVigenciaSalario,
  actionInativarSalario,
  actionExcluirSalario
} from '../actions/salarios-actions';
import { todayDateString } from '@/lib/date-utils';
import {
  SalarioComDetalhes,
  UsuarioResumo,
  ListarSalariosParams,
  CriarSalarioDTO,
  AtualizarSalarioDTO
} from '../domain';

// ============================================================================
// Types
// ============================================================================

interface UseSalariosParams extends ListarSalariosParams {
  incluirTotais?: boolean;
  incluirSemSalario?: boolean;
}

interface UseSalariosResult {
  salarios: SalarioComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  totais: {
    totalFuncionarios: number;
    totalBrutoMensal: number;
  } | null;
  usuariosSemSalario: UsuarioResumo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook Principal
// ============================================================================

export const useSalarios = (params: UseSalariosParams = {}): UseSalariosResult => {
  const [salarios, setSalarios] = useState<SalarioComDetalhes[]>([]);
  const [paginacao, setPaginacao] = useState<UseSalariosResult['paginacao']>(null);
  const [totais, setTotais] = useState<UseSalariosResult['totais']>(null);
  const [usuariosSemSalario, setUsuariosSemSalario] = useState<UsuarioResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarSalarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const actionParams: UseSalariosParams = {
        pagina: params.pagina,
        limite: params.limite,
        busca: params.busca,
        usuarioId: params.usuarioId,
        cargoId: params.cargoId,
        ativo: params.ativo,
        vigente: params.vigente,
        ordenarPor: params.ordenarPor,
        ordem: params.ordem,
        incluirTotais: params.incluirTotais,
        incluirSemSalario: params.incluirSemSalario,
      };

      const result = await actionListarSalarios(actionParams);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar salários');
      }

      setSalarios(result.data.items);
      setPaginacao(result.data.paginacao);
      setTotais(result.data.totais || null);
      setUsuariosSemSalario(result.data.usuariosSemSalario || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar salários';
      setError(errorMessage);
      setSalarios([]);
      setPaginacao(null);
      setTotais(null);
      setUsuariosSemSalario([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.pagina,
    params.limite,
    params.busca,
    params.usuarioId,
    params.cargoId,
    params.ativo,
    params.vigente,
    params.ordenarPor,
    params.ordem,
    params.incluirTotais,
    params.incluirSemSalario,
  ]);

  useEffect(() => {
    buscarSalarios();
  }, [buscarSalarios]);

  return {
    salarios,
    paginacao,
    totais,
    usuariosSemSalario,
    isLoading,
    error,
    refetch: buscarSalarios,
  };
};

// ============================================================================
// Hook para Salário Individual
// ============================================================================

interface UseSalarioResult {
  salario: SalarioComDetalhes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSalario = (id: number | null): UseSalarioResult => {
  const [salario, setSalario] = useState<SalarioComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarSalario = useCallback(async () => {
    if (!id) {
      setSalario(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionBuscarSalario(id);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar salário');
      }

      setSalario(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar salário';
      setError(errorMessage);
      setSalario(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    buscarSalario();
  }, [buscarSalario]);

  return {
    salario,
    isLoading,
    error,
    refetch: buscarSalario,
  };
};

// ============================================================================
// Mutation Functions
// ============================================================================

interface MutationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const criarSalario = async (dados: CriarSalarioDTO): Promise<MutationResult<SalarioComDetalhes>> => {
  try {
    const formData = new FormData();
    formData.append('usuarioId', dados.usuarioId.toString());
    formData.append('salarioBruto', dados.salarioBruto.toString());
    formData.append('dataInicioVigencia', dados.dataInicioVigencia);
    if (dados.cargoId) formData.append('cargoId', dados.cargoId.toString());
    if (dados.observacoes) formData.append('observacoes', dados.observacoes);

    const result = await actionCriarSalario(formData);
    return result as MutationResult<SalarioComDetalhes>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao criar salário' };
  }
};

export const atualizarSalario = async (id: number, dados: AtualizarSalarioDTO): Promise<MutationResult<SalarioComDetalhes>> => {
  try {
    const formData = new FormData();
    if (dados.salarioBruto !== undefined) formData.append('salarioBruto', dados.salarioBruto.toString());
    if (dados.cargoId !== undefined) formData.append('cargoId', dados.cargoId?.toString() || '');
    if (dados.dataFimVigencia !== undefined) formData.append('dataFimVigencia', dados.dataFimVigencia?.toString() || '');
    if (dados.observacoes !== undefined) formData.append('observacoes', dados.observacoes || '');
    if (dados.ativo !== undefined) formData.append('ativo', dados.ativo.toString());

    const result = await actionAtualizarSalario(id, formData);
    return result as MutationResult<SalarioComDetalhes>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao atualizar salário' };
  }
};

export const encerrarVigenciaSalario = async (id: number, dataFim: string): Promise<MutationResult<SalarioComDetalhes>> => {
  try {
    const result = await actionEncerrarVigenciaSalario(id, dataFim);
    return result as MutationResult<SalarioComDetalhes>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao encerrar vigência' };
  }
};

export const inativarSalario = async (id: number): Promise<MutationResult<SalarioComDetalhes>> => {
  try {
    const result = await actionInativarSalario(id);
    return result as MutationResult<SalarioComDetalhes>;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao inativar salário' };
  }
};

export const excluirSalario = async (id: number): Promise<MutationResult> => {
  try {
    const result = await actionExcluirSalario(id);
    return result;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao excluir salário' };
  }
};

// ============================================================================
// Hook para Salários de um Usuário
// ============================================================================

interface UseSalariosDoUsuarioParams {
  usuarioId: number | null;
  vigente?: boolean;
  dataReferencia?: string;
}

interface UseSalariosDoUsuarioResult {
  salarios: SalarioComDetalhes[];
  salarioVigente: SalarioComDetalhes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSalariosDoUsuario = (params: UseSalariosDoUsuarioParams): UseSalariosDoUsuarioResult => {
  const [salarios, setSalarios] = useState<SalarioComDetalhes[]>([]);
  const [salarioVigente, setSalarioVigente] = useState<SalarioComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarSalariosDoUsuario = useCallback(async () => {
    if (!params.usuarioId) {
      setSalarios([]);
      setSalarioVigente(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionBuscarSalariosDoUsuario(params.usuarioId!);
      
      if (!result.success || !result.data) {
         // Handle "not found" if needed, but repository returns empty array usually
         throw new Error(result.error || 'Erro ao buscar salários');
      }

      const items = result.data;
      
      // Client-side filtering if API doesn't support it fully via standard action
      // Or we can invoke repository specialized function via action.
      // `actionBuscarSalariosDoUsuario` calls `service.buscarSalariosDoUsuario` which returns ALL salaries.
      // We process them here to match legacy behavior.
      
      if (params.vigente) {
        const dataRef = params.dataReferencia || todayDateString();
        const vigente = items.find(s => 
            s.ativo && 
            s.dataInicioVigencia <= dataRef && 
            (!s.dataFimVigencia || s.dataFimVigencia >= dataRef)
        );
        
        if (vigente) {
            setSalarioVigente(vigente);
            setSalarios([vigente]);
        } else {
            setSalarioVigente(null);
            setSalarios([]);
        }
      } else {
        setSalarios(items);
        setSalarioVigente(items[0] || null);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar salários do usuário';
      setError(errorMessage);
      setSalarios([]);
      setSalarioVigente(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.usuarioId, params.vigente, params.dataReferencia]);

  useEffect(() => {
    buscarSalariosDoUsuario();
  }, [buscarSalariosDoUsuario]);

  return {
    salarios,
    salarioVigente,
    isLoading,
    error,
    refetch: buscarSalariosDoUsuario,
  };
};
