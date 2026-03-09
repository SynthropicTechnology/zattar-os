/**
 * Serviço de Integração de Obrigações com Sistema Financeiro
 * 
 * Sincroniza parcelas de acordos/condenações com lançamentos financeiros.
 * Implementa lógica de criação, atualização e verificação de consistência.
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { ObrigacoesRepository } from '../repository/obrigacoes';
import type { ParcelaComLancamento } from '@/features/obrigacoes';
import { todayDateString } from '@/lib/date-utils';

type ParcelaObrigacao = ParcelaComLancamento;

// ============================================================================
// Types
// ============================================================================

export interface SincronizacaoParcelaResult {
    sucesso: boolean;
    acao: 'criado' | 'atualizado' | 'ignorado' | 'erro';
    mensagem: string;
    lancamentoId?: number;
    parcelaId: number;
}

export interface SincronizacaoAcordoResult {
    sucesso: boolean;
    mensagem: string;
    erros?: string[];
    totalProcessado?: number;
    totalSucesso?: number;
    totalErro?: number;
}

export interface ConsistenciaResult {
    inconsistente: boolean;
    parcelasSemLancamento: Array<{
        parcelaId: number;
        numeroParcela: number;
        valor: number;
        status: string;
    }>;
    lancamentosSemParcela: Array<{
        lancamentoId: number;
        descricao: string;
        valor: number;
    }>;
    totalParcelas?: number;
    parcelasSincronizadas?: number;
    parcelasPendentes?: number;
    parcelasInconsistentes?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Busca lançamento financeiro vinculado a uma parcela
 */
async function buscarLancamentoPorParcela(parcelaId: number) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .eq('parcela_id', parcelaId)
        .eq('origem', 'acordo_judicial')
        .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao buscar lançamento: ${error.message}`);
    }
    
    return data || null;
}

/**
 * Busca conta contábil padrão para tipo de lançamento
 */
async function buscarContaContabilPadrao(tipo: 'receita' | 'despesa'): Promise<number | null> {
    const supabase = createServiceClient();
    
    // Busca conta contábil padrão baseada no tipo
    // Prioridade: busca conta com código específico para receitas/despesas
    const codigoConta = tipo === 'receita' ? '4.1.01' : '3.1.01'; // Receitas ou Despesas
    
    const { data, error } = await supabase
        .from('plano_contas')
        .select('id')
        .eq('codigo', codigoConta)
        .order('id')
        .limit(1)
        .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
        console.warn(`Erro ao buscar conta contábil padrão: ${error.message}`);
        return null;
    }
    
    return data?.id || null;
}

/**
 * Busca ID do usuário pelo auth_user_id
 */
async function buscarUsuarioIdPorAuthId(authUserId: string): Promise<number | null> {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
        console.warn(`Erro ao buscar usuário: ${error.message}`);
        return null;
    }
    
    return data?.id || null;
}

/**
 * Mapeia forma de pagamento da parcela para forma de pagamento financeiro
 */
function mapearFormaPagamento(formaParcela: string | null): string {
    if (!formaParcela) return 'transferencia_bancaria';
    
    const mapeamento: Record<string, string> = {
        'transferencia_direta': 'transferencia_bancaria',
        'deposito_judicial': 'deposito_judicial',
        'deposito_recursal': 'deposito_judicial',
    };
    
    return mapeamento[formaParcela] || 'transferencia_bancaria';
}

/**
 * Calcula valor total do lançamento (principal + honorários sucumbenciais)
 */
function calcularValorTotal(parcela: ParcelaObrigacao): number {
    const principal = parcela.valorBrutoCreditoPrincipal || 0;
    const sucumbenciais = parcela.honorariosSucumbenciais || 0;
    return principal + sucumbenciais;
}

/**
 * Cria descrição do lançamento financeiro
 */
function criarDescricaoLancamento(parcela: ParcelaObrigacao, acordo: { tipo: string; numero_parcelas: number }): string {
    const tipo = acordo.tipo === 'acordo' ? 'Acordo' : 'Condenação';
    return `${tipo} - Parcela ${parcela.numeroParcela}/${acordo.numero_parcelas}`;
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Sincroniza uma parcela específica para o sistema financeiro
 * 
 * @param parcelaId - ID da parcela a sincronizar
 * @param forcar - Se true, força sincronização mesmo se já existir lançamento
 * @returns Resultado da sincronização
 */
export async function sincronizarParcelaParaFinanceiro(
    parcelaId: number,
    forcar: boolean = false
): Promise<SincronizacaoParcelaResult> {
    try {
        // 1. Buscar parcela
        const parcela = await ObrigacoesRepository.buscarParcelaPorId(parcelaId);
        
        if (!parcela) {
            return {
                sucesso: false,
                acao: 'erro',
                mensagem: `Parcela ${parcelaId} não encontrada`,
                parcelaId,
            };
        }
        
        // 2. Buscar acordo
        const supabase = createServiceClient();
        const { data: acordo, error: acordoError } = await supabase
            .from('acordos_condenacoes')
            .select('*')
            .eq('id', parcela.acordoCondenacaoId)
            .single();
        
        if (acordoError || !acordo) {
            return {
                sucesso: false,
                acao: 'erro',
                mensagem: 'Acordo não encontrado para esta parcela',
                parcelaId,
            };
        }
        
        // 3. Verificar se parcela está efetivada
        if (!parcela.dataEfetivacao && !forcar) {
            return {
                sucesso: true,
                acao: 'ignorado',
                mensagem: 'Parcela não efetivada. Sincronização não aplicável.',
                parcelaId,
            };
        }
        
        // 4. Verificar se já existe lançamento
        const lancamentoExistente = await buscarLancamentoPorParcela(parcelaId);
        
        if (lancamentoExistente && !forcar) {
            return {
                sucesso: true,
                acao: 'ignorado',
                mensagem: 'Lançamento já existe para esta parcela',
                lancamentoId: lancamentoExistente.id,
                parcelaId,
            };
        }
        
        // 5. Determinar tipo de lançamento baseado na direção do acordo
        const tipoLancamento: 'receita' | 'despesa' = acordo.direcao === 'recebimento' ? 'receita' : 'despesa';
        
        // 6. Buscar conta contábil padrão
        const contaContabilId = await buscarContaContabilPadrao(tipoLancamento);
        
        if (!contaContabilId) {
            return {
                sucesso: false,
                acao: 'erro',
                mensagem: 'Conta contábil padrão não encontrada. Configure o plano de contas.',
                parcelaId,
            };
        }
        
        // 7. Buscar usuário (se houver created_by)
        let usuarioId: number | null = null;
        if (acordo.created_by) {
            usuarioId = await buscarUsuarioIdPorAuthId(acordo.created_by);
        }
        
        // 8. Calcular valores
        const valorTotal = calcularValorTotal(parcela);
        const descricao = criarDescricaoLancamento(parcela, acordo);
        const formaPagamento = mapearFormaPagamento(parcela.formaPagamento || null);
        
        // 9. Criar ou atualizar lançamento
        
        const lancamentoData = {
            tipo: tipoLancamento,
            descricao,
            valor: valorTotal,
            data_lancamento: todayDateString(),
            data_competencia: parcela.dataVencimento.split('T')[0],
            data_vencimento: parcela.dataVencimento.split('T')[0],
            data_efetivacao: parcela.dataEfetivacao ? parcela.dataEfetivacao.split('T')[0] : null,
            status: (parcela.dataEfetivacao ? 'confirmado' : 'pendente') as 'confirmado' | 'pendente',
            origem: 'acordo_judicial' as const,
            forma_pagamento: formaPagamento,
            conta_contabil_id: contaContabilId,
            acordo_condenacao_id: acordo.id,
            parcela_id: parcelaId,
            created_by: usuarioId,
            dados_adicionais: {
                numero_parcela: parcela.numeroParcela,
                total_parcelas: acordo.numero_parcelas,
                valor_principal: parcela.valorBrutoCreditoPrincipal,
                honorarios_sucumbenciais: parcela.honorariosSucumbenciais,
                honorarios_contratuais: parcela.honorariosContratuais,
                tipo_acordo: acordo.tipo,
                direcao: acordo.direcao,
            } as import('@/lib/supabase/database.types').Json,
        };
        
        let lancamentoId: number;
        
        if (lancamentoExistente && forcar) {
            // Atualizar lançamento existente
            const { data, error } = await supabase
                .from('lancamentos_financeiros')
                .update(lancamentoData)
                .eq('id', lancamentoExistente.id)
                .select('id')
                .single();
            
            if (error) {
                throw new Error(`Erro ao atualizar lançamento: ${error.message}`);
            }
            
            lancamentoId = data.id;
            
            return {
                sucesso: true,
                acao: 'atualizado',
                mensagem: 'Lançamento atualizado com sucesso',
                lancamentoId,
                parcelaId,
            };
        } else {
            // Criar novo lançamento
            const { data, error } = await supabase
                .from('lancamentos_financeiros')
                .insert(lancamentoData)
                .select('id')
                .single();
            
            if (error) {
                throw new Error(`Erro ao criar lançamento: ${error.message}`);
            }
            
            lancamentoId = data.id;
            
            return {
                sucesso: true,
                acao: 'criado',
                mensagem: 'Lançamento criado com sucesso',
                lancamentoId,
                parcelaId,
            };
        }
    } catch (error) {
        const mensagem = error instanceof Error ? error.message : 'Erro desconhecido ao sincronizar parcela';
        return {
            sucesso: false,
            acao: 'erro',
            mensagem,
            parcelaId,
        };
    }
}

/**
 * Sincroniza todas as parcelas de um acordo
 * 
 * @param acordoId - ID do acordo a sincronizar
 * @param forcar - Se true, força sincronização mesmo se já existir lançamento
 * @returns Resultado da sincronização
 */
export async function sincronizarAcordoCompleto(
    acordoId: number,
    forcar: boolean = false
): Promise<SincronizacaoAcordoResult> {
    try {
        const supabase = createServiceClient();
        
        // 1. Buscar acordo
        const { data: acordo, error: acordoError } = await supabase
            .from('acordos_condenacoes')
            .select('*')
            .eq('id', acordoId)
            .single();
        
        if (acordoError || !acordo) {
            return {
                sucesso: false,
                mensagem: `Acordo ${acordoId} não encontrado`,
                erros: [`Acordo ${acordoId} não encontrado`],
            };
        }
        
        // 2. Verificar se acordo está cancelado
        if (acordo.status === 'cancelado') {
            return {
                sucesso: false,
                mensagem: 'Não é possível sincronizar acordo cancelado',
                erros: ['Acordo cancelado não pode ser sincronizado'],
            };
        }
        
        // 3. Buscar todas as parcelas do acordo
        const parcelas = await ObrigacoesRepository.buscarParcelasPorAcordo(acordoId);
        
        if (parcelas.length === 0) {
            return {
                sucesso: true,
                mensagem: 'Acordo sem parcelas para sincronizar',
                totalProcessado: 0,
                totalSucesso: 0,
                totalErro: 0,
            };
        }
        
        // 4. Sincronizar parcelas em lotes
        const erros: string[] = [];
        let totalSucesso = 0;
        let totalErro = 0;
        
        const CONCURRENCY_LIMIT = 5;
        const chunks = [];

        for (let i = 0; i < parcelas.length; i += CONCURRENCY_LIMIT) {
            chunks.push(parcelas.slice(i, i + CONCURRENCY_LIMIT));
        }

        for (const chunk of chunks) {
            const promises = chunk.map(parcela =>
                sincronizarParcelaParaFinanceiro(parcela.id, forcar)
                    .then(resultado => ({ resultado, parcela }))
            );
            
            const resultados = await Promise.all(promises);

            for (const { resultado, parcela } of resultados) {
                if (resultado.sucesso) {
                    totalSucesso++;
                } else {
                    totalErro++;
                    erros.push(`Parcela ${parcela.numeroParcela}: ${resultado.mensagem}`);
                }
            }
        }
        
        return {
            sucesso: totalErro === 0,
            mensagem: totalErro === 0
                ? `Acordo sincronizado com sucesso. ${totalSucesso} parcelas processadas.`
                : `Sincronização concluída com avisos: ${totalSucesso} sucessos, ${totalErro} falhas.`,
            erros: erros.length > 0 ? erros : undefined,
            totalProcessado: parcelas.length,
            totalSucesso,
            totalErro,
        };
    } catch (error) {
        const mensagem = error instanceof Error ? error.message : 'Erro desconhecido ao sincronizar acordo';
        return {
            sucesso: false,
            mensagem,
            erros: [mensagem],
        };
    }
}

/**
 * Verifica consistência entre parcelas e lançamentos financeiros
 * 
 * @param acordoId - ID do acordo a verificar (opcional, se não informado verifica todos)
 * @returns Resultado da verificação de consistência
 */
export async function verificarConsistencia(acordoId?: number): Promise<ConsistenciaResult> {
    try {
        // Buscar parcelas sem lançamentos
        const parcelasSemLancamento = await ObrigacoesRepository.detectarInconsistencias(acordoId);
        
        // Buscar lançamentos órfãos (sem parcela válida)
        const supabase = createServiceClient();
        let query = supabase
            .from('lancamentos_financeiros')
            .select('id, descricao, valor, parcela_id')
            .eq('origem', 'acordo_judicial')
            .is('parcela_id', null);
        
        if (acordoId) {
            query = query.eq('acordo_condenacao_id', acordoId);
        }
        
        const { data: lancamentosOrfaos, error } = await query;
        
        if (error) {
            throw new Error(`Erro ao buscar lançamentos órfãos: ${error.message}`);
        }
        
        const lancamentosSemParcela = (lancamentosOrfaos || []).map(l => ({
            lancamentoId: l.id,
            descricao: l.descricao,
            valor: l.valor,
        }));

        let stats = {};
        if (acordoId) {
            const parcelas = await ObrigacoesRepository.buscarParcelasPorAcordo(acordoId);
            const totalParcelas = parcelas.length;
            
            // Buscar lançamentos vinculados para contar sincronizados
            const { count: sincronizadasCount } = await supabase
                .from('lancamentos_financeiros')
                .select('*', { count: 'exact', head: true })
                .eq('acordo_condenacao_id', acordoId)
                .not('parcela_id', 'is', null);

            stats = {
                totalParcelas,
                parcelasSincronizadas: sincronizadasCount || 0,
                parcelasPendentes: totalParcelas - (sincronizadasCount || 0) - parcelasSemLancamento.length,
                parcelasInconsistentes: parcelasSemLancamento.length
            };
        }
        
        return {
            inconsistente: parcelasSemLancamento.length > 0 || lancamentosSemParcela.length > 0,
            parcelasSemLancamento: parcelasSemLancamento.map(p => ({
                parcelaId: p.id,
                numeroParcela: p.numeroParcela,
                valor: calcularValorTotal(p),
                status: p.status,
            })),
            lancamentosSemParcela,
            ...stats
        };
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : 'Erro desconhecido ao verificar consistência'
        );
    }
}

/**
 * Reverte sincronização de uma parcela (remove lançamento financeiro)
 * 
 * @param parcelaId - ID da parcela
 * @returns Resultado da reversão
 */
export async function reverterSincronizacao(parcelaId: number): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
        const lancamento = await buscarLancamentoPorParcela(parcelaId);
        
        if (!lancamento) {
            return {
                sucesso: false,
                mensagem: 'Lançamento não encontrado para esta parcela',
            };
        }
        
        const supabase = createServiceClient();
        
        const { error } = await supabase
            .from('lancamentos_financeiros')
            .delete()
            .eq('id', lancamento.id);
        
        if (error) {
            throw new Error(`Erro ao reverter sincronização: ${error.message}`);
        }
        
        return {
            sucesso: true,
            mensagem: 'Sincronização revertida com sucesso',
        };
    } catch (error) {
        const mensagem = error instanceof Error ? error.message : 'Erro desconhecido ao reverter sincronização';
        return {
            sucesso: false,
            mensagem,
        };
    }
}
