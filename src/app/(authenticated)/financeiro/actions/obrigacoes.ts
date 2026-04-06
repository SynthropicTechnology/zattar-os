'use server';

import { ObrigacoesService } from '../services/obrigacoes';
import { verificarConsistencia } from '../services/obrigacoes-integracao';
import { revalidatePath } from 'next/cache';
import type { ParcelaComLancamento } from '@/app/(authenticated)/obrigacoes';
import type { ListarLancamentosParams } from '../types/lancamentos';
import { todayDateString } from '@/lib/date-utils';

type ParcelaObrigacao = ParcelaComLancamento;

// ============================================================================
// Types - Response padronizado (success/error)
// ============================================================================

export interface AlertaObrigacao {
    tipo: 'vencida' | 'inconsistencia' | 'repasse_pendente' | 'sincronizacao';
    nivel: 'erro' | 'aviso' | 'info';
    mensagem: string;
    parcelaId?: number;
    acordoId?: number;
    valor?: number;
    dataVencimento?: string;
}

export interface ResumoObrigacoesFinanceiro {
    totalVencidas: number;
    valorTotalVencido: number;
    totalPendentes: number;
    valorTotalPendente: number;
    totalRepassesPendentes: number;
    valorRepassesPendentes: number;
}

export interface ObterResumoObrigacoesResult {
    alertas: AlertaObrigacao[];
    resumo: ResumoObrigacoesFinanceiro;
}

type ActionStatusResponse = { success: true; message?: string } | { success: false; error: string };
type ActionVoidResponse = { success: true } | { success: false; error: string };

type ListarObrigacoesResult = {
    dados: ParcelaObrigacao[];
    meta: {
        total: number;
        pagina: number;
        limite: number;
    };
    resumo: {
        totalVencidas: number;
        valorTotalVencido: number;
        totalPendentes: number;
        valorTotalPendente: number;
    };
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro inesperado.';
}

// ============================================================================
// Server Actions - CRUD
// ============================================================================

/**
 * Sincroniza uma parcela específica
 */
export async function actionSincronizarParcela(parcelaId: number, forcar: boolean = false): Promise<ActionStatusResponse> {
    try {
        const result = await ObrigacoesService.sincronizarParcela(parcelaId, forcar);
        revalidatePath('/app/financeiro');
        revalidatePath('/app/obrigacoes');
        if (result.sucesso) {
            return { success: true, message: result.mensagem };
        }
        return { success: false, error: result.mensagem };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Registra declaração de prestação de contas
 */
export async function actionRegistrarDeclaracao(parcelaId: number, urlArquivo: string): Promise<ActionVoidResponse> {
    try {
        await ObrigacoesService.registrarDeclaracao(parcelaId, urlArquivo);
        revalidatePath('/app/financeiro');
        return { success: true };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Gera repasse para cliente
 */
export async function actionGerarRepasse(parcelaId: number, urlArquivo: string, dataRepasse: string): Promise<ActionVoidResponse> {
    try {
        await ObrigacoesService.registrarComprovanteRepasse(parcelaId, urlArquivo, dataRepasse);
        revalidatePath('/app/financeiro');
        return { success: true };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Sincroniza todas as parcelas de um acordo
 */
export async function actionSincronizarAcordo(acordoId: number, forcar: boolean = false): Promise<ActionStatusResponse> {
    try {
        const result = await ObrigacoesService.sincronizarAcordo(acordoId, forcar);
        revalidatePath('/app/financeiro');
        revalidatePath('/app/obrigacoes');
        revalidatePath(`/app/obrigacoes/${acordoId}`);
        if (result.sucesso) {
            return { success: true, message: result.mensagem };
        }
        return { success: false, error: result.mensagem };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Verifica consistência entre parcelas e lançamentos financeiros
 */
export async function actionVerificarConsistencia(acordoId: number) {
    try {
        const data = await verificarConsistencia(acordoId);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Obtém resumo de obrigações com alertas e métricas
 */
export async function actionObterResumoObrigacoes(): Promise<{ success: true; data: ObterResumoObrigacoesResult } | { success: false; error: string }> {
    try {
        const today = todayDateString();

        // Buscar parcelas pendentes e inconsistências em paralelo
        const [parcelasPendentes, inconsistencias, repassesPendentes] = await Promise.all([
            ObrigacoesService.listarParcelasComLancamentos({ dataVencimentoFim: today }),
            ObrigacoesService.detectarInconsistencias(),
            ObrigacoesService.listarRepassesPendentes()
        ]);

        // Calcular vencidas
        const vencidas = parcelasPendentes.filter(p => p.status === 'pendente' && p.dataVencimento < today);
        const pendentes = parcelasPendentes.filter(p => p.status === 'pendente');

        // Construir alertas
        const alertas: AlertaObrigacao[] = [];

        // Alertas de vencidas
        vencidas.forEach(p => {
            alertas.push({
                tipo: 'vencida',
                nivel: 'erro',
                mensagem: `Parcela vencida em ${p.dataVencimento}`,
                parcelaId: p.id,
                acordoId: p.acordoCondenacaoId,
                valor: p.valorBrutoCreditoPrincipal,
                dataVencimento: p.dataVencimento
            });
        });

        // Alertas de inconsistências
        inconsistencias.forEach(p => {
            alertas.push({
                tipo: 'inconsistencia',
                nivel: 'aviso',
                mensagem: 'Parcela sem lançamento financeiro correspondente',
                parcelaId: p.id,
                acordoId: p.acordoCondenacaoId,
                valor: p.valorBrutoCreditoPrincipal
            });
        });

        // Alertas de repasses pendentes
        repassesPendentes.forEach(p => {
            alertas.push({
                tipo: 'repasse_pendente',
                nivel: 'info',
                mensagem: 'Repasse pendente de transferência',
                parcelaId: p.id,
                acordoId: p.acordoCondenacaoId,
                valor: p.valorRepasseCliente ?? 0
            });
        });

        // Calcular resumo
        const resumo: ResumoObrigacoesFinanceiro = {
            totalVencidas: vencidas.length,
            valorTotalVencido: vencidas.reduce((acc, p) => acc + p.valorBrutoCreditoPrincipal, 0),
            totalPendentes: pendentes.length,
            valorTotalPendente: pendentes.reduce((acc, p) => acc + p.valorBrutoCreditoPrincipal, 0),
            totalRepassesPendentes: repassesPendentes.length,
            valorRepassesPendentes: repassesPendentes.reduce((acc, p) => acc + (p.valorRepasseCliente ?? 0), 0)
        };

        return {
            success: true,
            data: { alertas, resumo }
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Obtém alertas financeiros (inconsistências)
 */
export async function actionObterAlertasFinanceiros(): Promise<{ success: true; data: AlertaObrigacao[] } | { success: false; error: string }> {
    try {
        const inconsistencias = await ObrigacoesService.detectarInconsistencias();

        const alertas: AlertaObrigacao[] = inconsistencias.map(p => ({
            tipo: 'inconsistencia' as const,
            nivel: 'aviso' as const,
            mensagem: 'Parcela sem lançamento financeiro correspondente',
            parcelaId: p.id,
            acordoId: p.acordoCondenacaoId,
            valor: p.valorBrutoCreditoPrincipal
        }));

        return { success: true, data: alertas };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Lista obrigações com paginação
 */
export async function actionListarObrigacoes(
    params: ListarLancamentosParams
): Promise<{ success: true; data: ListarObrigacoesResult } | { success: false; error: string }> {
    try {
        const dados = await ObrigacoesService.listarParcelasComLancamentos(params);

        // Calcular resumo básico
        const today = todayDateString();
        const vencidas = dados.filter(p => p.status === 'pendente' && p.dataVencimento < today);
        const pendentes = dados.filter(p => p.status === 'pendente');

        return {
            success: true,
            data: {
                dados,
                meta: {
                    total: dados.length,
                    pagina: params.pagina || 1,
                    limite: params.limite || 50
                },
                resumo: {
                    totalVencidas: vencidas.length,
                    valorTotalVencido: vencidas.reduce((acc, p) => acc + p.valorBrutoCreditoPrincipal, 0),
                    totalPendentes: pendentes.length,
                    valorTotalPendente: pendentes.reduce((acc, p) => acc + p.valorBrutoCreditoPrincipal, 0)
                }
            }
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}
