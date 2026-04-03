/**
 * Repository de Fluxo de Caixa
 * Camada de acesso a dados (Supabase)
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { LancamentosRepository } from './lancamentos';
import { ObrigacoesRepository } from './obrigacoes';
import type { Lancamento } from '../types/lancamentos';
import type { ParcelaComLancamento } from '@/app/(authenticated)/obrigacoes';
import type { FiltroFluxoCaixa, FluxoCaixaDiario } from '../domain/fluxo-caixa';

type ParcelaObrigacao = ParcelaComLancamento;

type ContaBancariaRecord = {
    id: number;
    nome: string;
    banco: string | null;
    agencia: string | null;
    conta: string | null;
    ativo: boolean;
};

type CentroCustoRecord = {
    id: number;
    nome: string;
    codigo: string;
    ativo: boolean;
};

type FluxoCaixaResumo = {
    realizado: FluxoCaixaResumoSegmento;
    projetado: FluxoCaixaResumoSegmento;
    total: FluxoCaixaResumoSegmento;
};

type FluxoCaixaResumoSegmento = {
    receitas: number;
    despesas: number;
    saldo: number;
};

// ============================================================================
// Repository Implementation
// ============================================================================

export const FluxoCaixaRepository = {
    /**
     * Busca lançamentos para fluxo de caixa realizado
     */
    async buscarLancamentosRealizados(filtro: FiltroFluxoCaixa): Promise<Lancamento[]> {
        return LancamentosRepository.listar({
            dataCompetenciaInicio: filtro.dataInicio,
            dataCompetenciaFim: filtro.dataFim,
            contaBancariaId: filtro.contaBancariaId,
            centroCustoId: filtro.centroCustoId,
            status: 'confirmado'
        });
    },

    /**
     * Busca lançamentos pendentes para projeção
     */
    async buscarLancamentosPendentes(filtro: FiltroFluxoCaixa): Promise<Lancamento[]> {
        return LancamentosRepository.listar({
            dataVencimentoInicio: filtro.dataInicio,
            dataVencimentoFim: filtro.dataFim,
            contaBancariaId: filtro.contaBancariaId,
            centroCustoId: filtro.centroCustoId,
            status: 'pendente'
        });
    },

    /**
     * Busca parcelas pendentes (obrigações jurídicas)
     */
    async buscarParcelasPendentes(filtro: FiltroFluxoCaixa): Promise<ParcelaObrigacao[]> {
        return ObrigacoesRepository.listarParcelasComLancamentos({
            dataVencimentoInicio: filtro.dataInicio,
            dataVencimentoFim: filtro.dataFim
        }).then(parcelas => parcelas.filter(p => p.status === 'pendente'));
    },

    /**
     * Busca saldo inicial de uma conta bancária
     */
    async buscarSaldoInicial(contaBancariaId: number, data: string): Promise<number> {
        const supabase = createServiceClient();

        // Soma todos os lançamentos confirmados anteriores à data
        const { data: lancamentos, error } = await supabase
            .from('lancamentos_financeiros')
            .select('tipo, valor')
            .eq('conta_bancaria_id', contaBancariaId)
            .eq('status', 'confirmado')
            .lt('data_efetivacao', data);

        if (error) throw new Error(`Erro ao buscar saldo inicial: ${error.message}`);

        return (lancamentos || []).reduce((saldo, l) => {
            return saldo + (l.tipo === 'receita' ? l.valor : -l.valor);
        }, 0);
    },

    /**
     * Busca movimentações diárias
     */
    async buscarMovimentacoesDiarias(
        contaBancariaId: number,
        dataInicio: string,
        dataFim: string
    ): Promise<FluxoCaixaDiario[]> {
        const supabase = createServiceClient();

        const { data: lancamentos, error } = await supabase
            .from('lancamentos_financeiros')
            .select('*')
            .eq('conta_bancaria_id', contaBancariaId)
            .eq('status', 'confirmado')
            .gte('data_efetivacao', dataInicio)
            .lte('data_efetivacao', dataFim)
            .order('data_efetivacao');

        if (error) throw new Error(`Erro ao buscar movimentações: ${error.message}`);

        // Agrupar por data
        const movimentacoesPorDia = new Map<string, FluxoCaixaDiario>();
        let saldoAcumulado = await this.buscarSaldoInicial(contaBancariaId, dataInicio);

        // Gerar todas as datas do período
        const datas = gerarIntervaloDatas(dataInicio, dataFim);

        for (const data of datas) {
            const lancamentosDoDia = (lancamentos || []).filter(
                l => l.data_efetivacao?.substring(0, 10) === data
            );

            const entradas = lancamentosDoDia
                .filter(l => l.tipo === 'receita')
                .reduce((acc, l) => acc + l.valor, 0);

            const saidas = lancamentosDoDia
                .filter(l => l.tipo === 'despesa')
                .reduce((acc, l) => acc + l.valor, 0);

            const saldoInicial = saldoAcumulado;
            const saldoFinal = saldoInicial + entradas - saidas;

            movimentacoesPorDia.set(data, {
                data,
                saldoInicial,
                entradas,
                saidas,
                saldoFinal,
                movimentacoes: lancamentosDoDia.map(l => ({
                    id: l.id,
                    descricao: l.descricao,
                    valor: l.valor,
                    tipo: l.tipo === 'receita' ? 'entrada' as const : 'saida' as const,
                    origem: l.origem
                }))
            });

            saldoAcumulado = saldoFinal;
        }

        return Array.from(movimentacoesPorDia.values());
    },

    /**
     * Busca resumo do fluxo de caixa para dashboard
     */
    async buscarResumoFluxoCaixa(filtro: FiltroFluxoCaixa): Promise<FluxoCaixaResumo> {
        const [realizados, pendentes] = await Promise.all([
            this.buscarLancamentosRealizados(filtro),
            this.buscarLancamentosPendentes(filtro)
        ]);

        const receitasRealizadas = realizados
            .filter(l => l.tipo === 'receita')
            .reduce((acc, l) => acc + l.valor, 0);

        const despesasRealizadas = realizados
            .filter(l => l.tipo === 'despesa')
            .reduce((acc, l) => acc + l.valor, 0);

        const receitasPendentes = pendentes
            .filter(l => l.tipo === 'receita')
            .reduce((acc, l) => acc + l.valor, 0);

        const despesasPendentes = pendentes
            .filter(l => l.tipo === 'despesa')
            .reduce((acc, l) => acc + l.valor, 0);

        return {
            realizado: {
                receitas: receitasRealizadas,
                despesas: despesasRealizadas,
                saldo: receitasRealizadas - despesasRealizadas
            },
            projetado: {
                receitas: receitasPendentes,
                despesas: despesasPendentes,
                saldo: receitasPendentes - despesasPendentes
            },
            total: {
                receitas: receitasRealizadas + receitasPendentes,
                despesas: despesasRealizadas + despesasPendentes,
                saldo: (receitasRealizadas + receitasPendentes) - (despesasRealizadas + despesasPendentes)
            }
        };
    },

    /**
     * Busca contas bancárias disponíveis
     */
    async listarContasBancarias(): Promise<ContaBancariaRecord[]> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('contas_bancarias')
            .select('id, nome, banco, agencia, conta, ativo')
            .eq('ativo', true)
            .order('nome');

        if (error) throw new Error(`Erro ao listar contas bancárias: ${error.message}`);

        const registros = (data ?? []) as ContaBancariaRecord[];
        return registros;
    },

    /**
     * Busca centros de custo disponíveis
     */
    async listarCentrosCusto(): Promise<CentroCustoRecord[]> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('centros_custo')
            .select('id, nome, codigo, ativo')
            .eq('ativo', true)
            .order('nome');

        if (error) throw new Error(`Erro ao listar centros de custo: ${error.message}`);

        const registros = (data ?? []) as CentroCustoRecord[];
        return registros;
    }
};

// ============================================================================
// Helpers
// ============================================================================

function gerarIntervaloDatas(dataInicio: string, dataFim: string): string[] {
    const datas: string[] = [];
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    const atual = new Date(inicio);
    while (atual <= fim) {
        datas.push(atual.toISOString().substring(0, 10));
        atual.setDate(atual.getDate() + 1);
    }

    return datas;
}
