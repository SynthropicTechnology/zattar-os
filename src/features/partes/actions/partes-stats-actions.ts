'use server';

/**
 * Partes Stats Actions
 *
 * Agrega contagens de todas as 4 entidades do módulo Partes em paralelo
 * para alimentar o painel Glass UI do dashboard.
 */

import * as service from '../service';

// =============================================================================
// HELPERS
// =============================================================================

function primeiroDiaMesCorrente(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
}

function ultimoDiaMesCorrente(): Date {
  const agora = new Date();
  const ultimo = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
  return ultimo;
}

// =============================================================================
// ACTION PRINCIPAL
// =============================================================================

export interface PartesTipoCounts {
  total: number;
  novosMes: number;
}

export interface ContarPartesPorTipoData {
  clientes: PartesTipoCounts;
  partesContrarias: PartesTipoCounts;
  terceiros: PartesTipoCounts;
  representantes: PartesTipoCounts;
}

/**
 * Conta todas as 4 entidades de Partes em paralelo.
 * Retorna totais gerais e novos registros no mês corrente.
 */
export async function actionContarPartesPorTipo(): Promise<
  | { success: true; data: ContarPartesPorTipoData }
  | { success: false; error: string }
> {
  try {
    const iniciaMes = primeiroDiaMesCorrente();
    const fimMes = ultimoDiaMesCorrente();

    const [
      clientesTotal,
      clientesMes,
      partesTotal,
      partesMes,
      terceirosTotal,
      terceirosMes,
      representantesTotal,
      representantesMes,
    ] = await Promise.all([
      service.contarClientes(),
      service.contarClientesEntreDatas(iniciaMes, fimMes),
      service.contarPartesContrarias(),
      service.contarPartesContrariasEntreDatas(iniciaMes, fimMes),
      service.contarTerceiros(),
      service.contarTerceirosEntreDatas(iniciaMes, fimMes),
      service.contarRepresentantes(),
      service.contarRepresentantesEntreDatas(iniciaMes, fimMes),
    ]);

    return {
      success: true,
      data: {
        clientes: {
          total: clientesTotal.success ? clientesTotal.data : 0,
          novosMes: clientesMes.success ? clientesMes.data : 0,
        },
        partesContrarias: {
          total: partesTotal.success ? partesTotal.data : 0,
          novosMes: partesMes.success ? partesMes.data : 0,
        },
        terceiros: {
          total: terceirosTotal.success ? terceirosTotal.data : 0,
          novosMes: terceirosMes.success ? terceirosMes.data : 0,
        },
        representantes: {
          total: representantesTotal.success ? representantesTotal.data : 0,
          novosMes: representantesMes.success ? representantesMes.data : 0,
        },
      },
    };
  } catch (error) {
    return { success: false, error: 'Erro ao contar partes' };
  }
}
