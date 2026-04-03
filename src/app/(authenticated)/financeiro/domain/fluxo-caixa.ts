/**
 * Domínio de Fluxo de Caixa
 * Entidades e regras de negócio puras (sem dependência de infraestrutura)
 */

import type { Lancamento } from '../types/lancamentos';
import type { ParcelaComLancamento } from '@/app/(authenticated)/obrigacoes';

type ParcelaObrigacao = ParcelaComLancamento;

// ============================================================================
// Types
// ============================================================================

export interface FiltroFluxoCaixa {
    dataInicio?: string;
    dataFim?: string;
    contaBancariaId?: number;
    centroCustoId?: number;
    incluirProjetado?: boolean;
}

export interface FluxoCaixaRealizado {
    receitas: number;
    despesas: number;
    saldo: number;
}

export interface FluxoCaixaProjetado {
    receitas: number;
    despesas: number;
    saldo: number;
}

export interface FluxoCaixaConsolidado {
    realizado: FluxoCaixaRealizado;
    projetado: FluxoCaixaProjetado;
    saldoTotal: number;
    detalhes: {
        lancamentos: Lancamento[];
        projecoes: ProjecaoFluxoCaixa[];
    };
}

export interface ProjecaoFluxoCaixa {
    id: number;
    descricao: string;
    valor: number;
    dataVencimento: string;
    tipo: 'receita' | 'despesa';
    origem: 'parcela' | 'recorrente' | 'manual';
    origemId?: number;
    probabilidade?: number; // 0-100
}

export interface FluxoCaixaDiario {
    data: string;
    saldoInicial: number;
    entradas: number;
    saidas: number;
    saldoFinal: number;
    movimentacoes: {
        id: number;
        descricao: string;
        valor: number;
        tipo: 'entrada' | 'saida';
        origem: string;
    }[];
}

export interface FluxoCaixaPeriodo {
    periodo: string;
    saldoInicial: number;
    totalEntradas: number;
    totalSaidas: number;
    saldoFinal: number;
    variacao: number; // Percentual de variação em relação ao período anterior
}

// ============================================================================
// Regras de Negócio
// ============================================================================

/**
 * Calcula o fluxo de caixa realizado a partir de lançamentos
 */
export function calcularFluxoRealizado(lancamentos: Lancamento[]): FluxoCaixaRealizado {
    const lancamentosConfirmados = lancamentos.filter(l => l.status === 'confirmado');

    const receitas = lancamentosConfirmados
        .filter(l => l.tipo === 'receita')
        .reduce((acc, l) => acc + l.valor, 0);

    const despesas = lancamentosConfirmados
        .filter(l => l.tipo === 'despesa')
        .reduce((acc, l) => acc + l.valor, 0);

    return {
        receitas,
        despesas,
        saldo: receitas - despesas
    };
}

/**
 * Calcula o fluxo de caixa projetado a partir de parcelas e lançamentos pendentes
 */
export function calcularFluxoProjetado(
    lancamentosPendentes: Lancamento[],
    parcelasPendentes: ParcelaObrigacao[]
): FluxoCaixaProjetado {
    // Lançamentos pendentes
    const receitasLancamentos = lancamentosPendentes
        .filter(l => l.tipo === 'receita')
        .reduce((acc, l) => acc + l.valor, 0);

    const despesasLancamentos = lancamentosPendentes
        .filter(l => l.tipo === 'despesa')
        .reduce((acc, l) => acc + l.valor, 0);

    // Parcelas pendentes (sem lançamento vinculado)
    const parcelasSemLancamento = parcelasPendentes.filter(p => !p.lancamentoId);

    // Para simplificar, assumimos que parcelas são receitas (acordos de recebimento)
    // Em implementação real, precisaria verificar a direção do acordo
    // Calcula o valor total da parcela (principal + honorários)
    const receitasParcelas = parcelasSemLancamento.reduce((acc, p) => {
        const valorTotal = p.valorBrutoCreditoPrincipal + p.honorariosContratuais + p.honorariosSucumbenciais;
        return acc + valorTotal;
    }, 0);

    return {
        receitas: receitasLancamentos + receitasParcelas,
        despesas: despesasLancamentos,
        saldo: (receitasLancamentos + receitasParcelas) - despesasLancamentos
    };
}

/**
 * Converte parcelas em projeções de fluxo de caixa
 */
export function converterParcelasEmProjecoes(
    parcelas: ParcelaObrigacao[],
    direcao: 'recebimento' | 'pagamento'
): ProjecaoFluxoCaixa[] {
    return parcelas
        .filter(p => p.status === 'pendente' && !p.lancamentoId)
        .map(p => {
            const valorTotal = p.valorBrutoCreditoPrincipal + p.honorariosContratuais + p.honorariosSucumbenciais;
            return {
                id: p.id,
                descricao: `Parcela ${p.numeroParcela} - Acordo #${p.acordoCondenacaoId}`,
                valor: valorTotal,
                dataVencimento: p.dataVencimento,
                tipo: direcao === 'recebimento' ? 'receita' as const : 'despesa' as const,
                origem: 'parcela' as const,
                origemId: p.acordoCondenacaoId,
                probabilidade: 80 // Parcelas de acordos têm alta probabilidade
            };
        });
}

/**
 * Agrupa fluxo de caixa por período
 */
export function agruparPorPeriodo(
    lancamentos: Lancamento[],
    projecoes: ProjecaoFluxoCaixa[],
    agrupamento: 'dia' | 'semana' | 'mes'
): FluxoCaixaPeriodo[] {
    const movimentacoes = [
        ...lancamentos.map(l => ({
            data: l.dataEfetivacao || l.dataVencimento || l.dataLancamento,
            valor: l.valor,
            tipo: l.tipo,
            confirmado: l.status === 'confirmado'
        })),
        ...projecoes.map(p => ({
            data: p.dataVencimento,
            valor: p.valor,
            tipo: p.tipo,
            confirmado: false
        }))
    ];

    // Agrupar por período
    const grupos = new Map<string, { entradas: number; saidas: number }>();

    movimentacoes.forEach(m => {
        const chave = formatarChavePeriodo(m.data, agrupamento);
        const grupo = grupos.get(chave) || { entradas: 0, saidas: 0 };

        if (m.tipo === 'receita') {
            grupo.entradas += m.valor;
        } else {
            grupo.saidas += m.valor;
        }

        grupos.set(chave, grupo);
    });

    // Converter para array ordenado
    const periodos = Array.from(grupos.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([periodo, valores]) => ({
            periodo,
            saldoInicial: 0, // Será calculado abaixo
            totalEntradas: valores.entradas,
            totalSaidas: valores.saidas,
            saldoFinal: 0, // Será calculado abaixo
            variacao: 0 // Será calculado abaixo
        }));

    // Calcular saldos acumulados
    let saldoAcumulado = 0;
    periodos.forEach((p, index) => {
        p.saldoInicial = saldoAcumulado;
        p.saldoFinal = saldoAcumulado + p.totalEntradas - p.totalSaidas;

        if (index > 0) {
            const anterior = periodos[index - 1];
            const saldoAnterior = anterior.saldoFinal;
            p.variacao = saldoAnterior !== 0
                ? ((p.saldoFinal - saldoAnterior) / Math.abs(saldoAnterior)) * 100
                : 0;
        }

        saldoAcumulado = p.saldoFinal;
    });

    return periodos;
}

/**
 * Formata a chave de período para agrupamento
 */
function formatarChavePeriodo(dataStr: string, agrupamento: 'dia' | 'semana' | 'mes'): string {
    const data = new Date(dataStr);

    switch (agrupamento) {
        case 'dia':
            return dataStr.substring(0, 10); // YYYY-MM-DD

        case 'semana':
            // Retorna o primeiro dia da semana (domingo)
            const primeiroDiaSemana = new Date(data);
            primeiroDiaSemana.setDate(data.getDate() - data.getDay());
            return primeiroDiaSemana.toISOString().substring(0, 10);

        case 'mes':
            return dataStr.substring(0, 7); // YYYY-MM
    }
}

/**
 * Calcula indicadores de saúde financeira
 */
export function calcularIndicadoresSaude(fluxo: FluxoCaixaConsolidado): {
    liquidezImediata: number;
    coberturaDespesas: number; // Meses que o saldo cobre
    tendencia: 'positiva' | 'negativa' | 'estável';
} {
    const mediaDespesasMensal = fluxo.realizado.despesas > 0
        ? fluxo.realizado.despesas
        : fluxo.projetado.despesas;

    const coberturaDespesas = mediaDespesasMensal > 0
        ? fluxo.saldoTotal / mediaDespesasMensal
        : Infinity;

    let tendencia: 'positiva' | 'negativa' | 'estável' = 'estável';
    if (fluxo.projetado.saldo > 0) {
        tendencia = 'positiva';
    } else if (fluxo.projetado.saldo < 0) {
        tendencia = 'negativa';
    }

    return {
        liquidezImediata: fluxo.realizado.saldo,
        coberturaDespesas,
        tendencia
    };
}

/**
 * Gera alerta se o saldo projetado ficar negativo
 */
export function verificarAlertasCaixa(
    periodos: FluxoCaixaPeriodo[]
): { tipo: 'perigo' | 'atencao' | 'ok'; mensagem: string }[] {
    const alertas: { tipo: 'perigo' | 'atencao' | 'ok'; mensagem: string }[] = [];

    periodos.forEach(p => {
        if (p.saldoFinal < 0) {
            alertas.push({
                tipo: 'perigo',
                mensagem: `Saldo negativo projetado para ${p.periodo}: R$ ${p.saldoFinal.toFixed(2)}`
            });
        } else if (p.variacao < -20) {
            alertas.push({
                tipo: 'atencao',
                mensagem: `Queda de ${Math.abs(p.variacao).toFixed(1)}% no saldo em ${p.periodo}`
            });
        }
    });

    if (alertas.length === 0) {
        alertas.push({
            tipo: 'ok',
            mensagem: 'Fluxo de caixa saudável para o período analisado'
        });
    }

    return alertas;
}

// ============================================================================
// Constantes
// ============================================================================

export const AGRUPAMENTOS_PERIODO = {
    dia: 'Diário',
    semana: 'Semanal',
    mes: 'Mensal'
} as const;

export const LIMIAR_ALERTA_SALDO_BAIXO = 10000; // R$ 10.000
export const LIMIAR_VARIACAO_ATENCAO = -20; // -20%
