'use server';

/**
 * Server Actions para Relatórios Financeiros
 * Consolida funcionalidades de geração de relatórios
 */

import { todayDateString } from '@/lib/date-utils';

// ============================================================================
// Types
// ============================================================================

export interface RelatorioFiltros {
    dataInicio: string;
    dataFim: string;
    tipo?: 'receita' | 'despesa' | 'todos';
    contaBancariaId?: number;
    centroCustoId?: number;
    planoContaId?: number;
    agruparPor?: 'dia' | 'semana' | 'mes' | 'categoria' | 'conta';
}

export interface RelatorioExportacao {
    content: string;
    filename: string;
    contentType: string;
}

type LancamentoRelatorio = {
    dataLancamento: string;
    descricao: string;
    categoria?: string | null;
    tipo: 'receita' | 'despesa';
    valor: number;
    status: string;
    contaBancaria?: string | null;
};

// ============================================================================
// Helpers
// ============================================================================


const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// ============================================================================
// Server Actions - Relatórios Gerais
// ============================================================================

/**
 * Gera relatório de lançamentos em CSV
 */
export async function actionExportarLancamentosCSV(filtros: RelatorioFiltros) {
    try {
        const { dataInicio, dataFim } = filtros;

        if (!dataInicio || !dataFim) {
            return { success: false, error: 'Período é obrigatório' };
        }

        // TODO: Buscar dados do serviço de lançamentos
        // const lancamentos = await LancamentosService.listar({ dataInicio, dataFim, tipo });

        // Mock de dados para estrutura
        const lancamentos: LancamentoRelatorio[] = [];

        const linhas: string[] = [];
        const sep = ',';

        // Cabeçalho
        linhas.push('RELATÓRIO DE LANÇAMENTOS FINANCEIROS');
        linhas.push(`Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`);
        linhas.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
        linhas.push('');

        // Cabeçalho da tabela
        linhas.push([
            'Data',
            'Descrição',
            'Categoria',
            'Tipo',
            'Valor',
            'Status',
            'Conta Bancária',
        ].join(sep));

        // Dados
        for (const l of lancamentos) {
            linhas.push([
                escapeCSV(formatarData(l.dataLancamento)),
                escapeCSV(l.descricao),
                escapeCSV(l.categoria || '-'),
                escapeCSV(l.tipo),
                escapeCSV(l.valor),
                escapeCSV(l.status),
                escapeCSV(l.contaBancaria || '-'),
            ].join(sep));
        }

        const csvContent = linhas.join('\n');

        return {
            success: true,
            data: {
                content: csvContent,
                filename: `lancamentos_${dataInicio}_${dataFim}.csv`,
                contentType: 'text/csv',
            },
        };
    } catch (error) {
        console.error('Erro ao exportar lançamentos:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Gera relatório de contas a pagar em CSV
 */
export async function actionExportarContasPagarCSV(filtros: RelatorioFiltros) {
    try {
        const { dataInicio, dataFim } = filtros;

        if (!dataInicio || !dataFim) {
            return { success: false, error: 'Período é obrigatório' };
        }

        const linhas: string[] = [];
        const sep = ',';

        linhas.push('RELATÓRIO DE CONTAS A PAGAR');
        linhas.push(`Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`);
        linhas.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
        linhas.push('');

        linhas.push([
            'Vencimento',
            'Descrição',
            'Fornecedor',
            'Categoria',
            'Valor',
            'Status',
        ].join(sep));

        // TODO: Popular com dados reais

        const csvContent = linhas.join('\n');

        return {
            success: true,
            data: {
                content: csvContent,
                filename: `contas_pagar_${dataInicio}_${dataFim}.csv`,
                contentType: 'text/csv',
            },
        };
    } catch (error) {
        console.error('Erro ao exportar contas a pagar:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Gera relatório de contas a receber em CSV
 */
export async function actionExportarContasReceberCSV(filtros: RelatorioFiltros) {
    try {
        const { dataInicio, dataFim } = filtros;

        if (!dataInicio || !dataFim) {
            return { success: false, error: 'Período é obrigatório' };
        }

        const linhas: string[] = [];
        const sep = ',';

        linhas.push('RELATÓRIO DE CONTAS A RECEBER');
        linhas.push(`Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`);
        linhas.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
        linhas.push('');

        linhas.push([
            'Vencimento',
            'Descrição',
            'Cliente',
            'Categoria',
            'Valor',
            'Status',
        ].join(sep));

        // TODO: Popular com dados reais

        const csvContent = linhas.join('\n');

        return {
            success: true,
            data: {
                content: csvContent,
                filename: `contas_receber_${dataInicio}_${dataFim}.csv`,
                contentType: 'text/csv',
            },
        };
    } catch (error) {
        console.error('Erro ao exportar contas a receber:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Gera relatório de fluxo de caixa em CSV
 */
export async function actionExportarFluxoCaixaCSV(filtros: RelatorioFiltros) {
    try {
        const { dataInicio, dataFim, agruparPor = 'dia' } = filtros;

        if (!dataInicio || !dataFim) {
            return { success: false, error: 'Período é obrigatório' };
        }

        const linhas: string[] = [];
        const sep = ',';

        linhas.push('RELATÓRIO DE FLUXO DE CAIXA');
        linhas.push(`Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`);
        linhas.push(`Agrupamento: Por ${agruparPor}`);
        linhas.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
        linhas.push('');

        linhas.push([
            'Período',
            'Entradas',
            'Saídas',
            'Saldo',
            'Saldo Acumulado',
        ].join(sep));

        // TODO: Popular com dados reais

        const csvContent = linhas.join('\n');

        return {
            success: true,
            data: {
                content: csvContent,
                filename: `fluxo_caixa_${dataInicio}_${dataFim}.csv`,
                contentType: 'text/csv',
            },
        };
    } catch (error) {
        console.error('Erro ao exportar fluxo de caixa:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Gera relatório de plano de contas em CSV
 */
export async function actionExportarPlanoContasCSV() {
    try {
        const linhas: string[] = [];
        const sep = ',';

        linhas.push('PLANO DE CONTAS');
        linhas.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
        linhas.push('');

        linhas.push([
            'Código',
            'Nome',
            'Tipo',
            'Natureza',
            'Conta Pai',
            'Ativo',
        ].join(sep));

        // TODO: Popular com dados reais do PlanoContasService

        const csvContent = linhas.join('\n');

        return {
            success: true,
            data: {
                content: csvContent,
                filename: `plano_contas_${todayDateString()}.csv`,
                contentType: 'text/csv',
            },
        };
    } catch (error) {
        console.error('Erro ao exportar plano de contas:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Gera relatório de conciliação bancária em CSV
 */
export async function actionExportarConciliacaoCSV(contaBancariaId: number, dataInicio: string, dataFim: string) {
    try {
        if (!contaBancariaId) {
            return { success: false, error: 'Conta bancária é obrigatória' };
        }

        if (!dataInicio || !dataFim) {
            return { success: false, error: 'Período é obrigatório' };
        }

        const linhas: string[] = [];
        const sep = ',';

        linhas.push('RELATÓRIO DE CONCILIAÇÃO BANCÁRIA');
        linhas.push(`Conta Bancária ID: ${contaBancariaId}`);
        linhas.push(`Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`);
        linhas.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
        linhas.push('');

        linhas.push([
            'Data',
            'Descrição Extrato',
            'Valor Extrato',
            'Descrição Sistema',
            'Valor Sistema',
            'Status',
            'Diferença',
        ].join(sep));

        // TODO: Popular com dados reais do ConciliacaoService

        const csvContent = linhas.join('\n');

        return {
            success: true,
            data: {
                content: csvContent,
                filename: `conciliacao_${contaBancariaId}_${dataInicio}_${dataFim}.csv`,
                contentType: 'text/csv',
            },
        };
    } catch (error) {
        console.error('Erro ao exportar conciliação:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Gera relatório de inadimplência em CSV
 */
export async function actionExportarInadimplenciaCSV(dataReferencia?: string) {
    try {
        const dataRef = dataReferencia || todayDateString();

        const linhas: string[] = [];
        const sep = ',';

        linhas.push('RELATÓRIO DE INADIMPLÊNCIA');
        linhas.push(`Data de Referência: ${formatarData(dataRef)}`);
        linhas.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
        linhas.push('');

        linhas.push([
            'Cliente',
            'Vencimento',
            'Dias Atraso',
            'Valor Original',
            'Multa/Juros',
            'Valor Atualizado',
            'Processo',
        ].join(sep));

        // TODO: Popular com dados reais

        const csvContent = linhas.join('\n');

        return {
            success: true,
            data: {
                content: csvContent,
                filename: `inadimplencia_${dataRef}.csv`,
                contentType: 'text/csv',
            },
        };
    } catch (error) {
        console.error('Erro ao exportar inadimplência:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}
