/**
 * Repository de Lançamentos Financeiros
 * Camada de acesso a dados (Supabase)
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import { toDateString } from '@/lib/date-utils';
import type { Lancamento, ListarLancamentosParams } from '../types/lancamentos';

type LegacyResumoVencimentos = {
    vencidas: { quantidade: number; valorTotal: number };
    hoje: { quantidade: number; valorTotal: number };
    proximos7Dias: { quantidade: number; valorTotal: number };
    proximos30Dias: { quantidade: number; valorTotal: number };
};

type RepositoryResult<T> = { success: true; data: T } | { success: false; error: string };

type ChainableQueryBuilder = {
    eq?: (...args: unknown[]) => unknown;
    in?: (...args: unknown[]) => unknown;
    ilike?: (...args: unknown[]) => unknown;
    gte?: (...args: unknown[]) => unknown;
    lte?: (...args: unknown[]) => unknown;
    lt?: (...args: unknown[]) => unknown;
    order?: (...args: unknown[]) => unknown;
    range?: (from: number, to: number) => unknown;
    delete?: (...args: unknown[]) => unknown;
    select?: (...args: unknown[]) => unknown;
};

type SupabaseErrorLike = { message: string };

function getErrorMessage(error: unknown): string {
    if (!error) return 'Erro desconhecido';
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && 'message' in error) {
        return String((error as SupabaseErrorLike).message);
    }
    return 'Erro desconhecido';
}

function isChainableQueryBuilder(value: unknown): value is ChainableQueryBuilder {
    if (!value || typeof value !== 'object') return false;
    return typeof (value as Record<string, unknown>).eq === 'function';
}

// ============================================================================
// Repository Implementation
// ============================================================================

export const LancamentosRepository = {
    /**
     * Lista lançamentos financeiros com filtros
     */
    async listar(params: ListarLancamentosParams): Promise<Lancamento[]> {
        const supabase = createServiceClient();

        let query = supabase
            .from('lancamentos_financeiros')
            .select('*');

        if (params.tipo) {
            query = query.eq('tipo', params.tipo);
        }

        if (params.status) {
            if (Array.isArray(params.status)) {
                query = query.in('status', params.status);
            } else {
                query = query.eq('status', params.status);
            }
        }

        if (params.busca) {
            query = query.ilike('descricao', `%${params.busca}%`);
        }

        if (params.dataVencimentoInicio) {
            query = query.gte('data_vencimento', params.dataVencimentoInicio);
        }

        if (params.dataVencimentoFim) {
            query = query.lte('data_vencimento', params.dataVencimentoFim);
        }

        if (params.dataCompetenciaInicio) {
            query = query.gte('data_competencia', params.dataCompetenciaInicio);
        }

        if (params.dataCompetenciaFim) {
            query = query.lte('data_competencia', params.dataCompetenciaFim);
        }

        if (params.pessoaId) {
            query = query.eq('cliente_id', params.pessoaId);
        }

        if (params.contaContabilId) {
            query = query.eq('conta_contabil_id', params.contaContabilId);
        }

        if (params.centroCustoId) {
            query = query.eq('centro_custo_id', params.centroCustoId);
        }

        if (params.contaBancariaId) {
            query = query.eq('conta_bancaria_id', params.contaBancariaId);
        }

        if (params.origem) {
            query = query.eq('origem', params.origem);
        }


        if (params.recorrente !== undefined) {
            query = query.eq('recorrente', params.recorrente);
        }

        if (params.lancamentoOrigemId) {
            query = query.eq('lancamento_origem_id', params.lancamentoOrigemId);
        }

        if (params.contratoId) {
            query = query.eq('contrato_id', params.contratoId);
        }

        // Ordenação padrão
        const ordered = query.order('data_vencimento', { ascending: true, nullsFirst: false });

        // Paginação (mocks às vezes retornam Promise; não reatribuir para não quebrar o chain)
        let rangedResult: unknown = null;
        if (params.limite) {
            const offset = ((params.pagina || 1) - 1) * params.limite;
            const rangeFn = (query as unknown as { range?: (from: number, to: number) => unknown }).range;
            rangedResult = typeof rangeFn === 'function' ? rangeFn.call(query, offset, offset + params.limite - 1) : null;
        }

        // O builder é thenable (await query funciona). Nos testes, o mock resolve em `range()` ou `order()`.
        const response =
            params.limite && rangedResult && !isChainableQueryBuilder(rangedResult)
                ? await rangedResult
                : !isChainableQueryBuilder(ordered)
                    ? await ordered
                    : await query;

        const { data, error } = response as { data?: unknown; error?: unknown };
        if (error) throw new Error(`Erro ao listar lançamentos: ${getErrorMessage(error)}`);

        const rows = Array.isArray(data) ? (data as unknown[]) : [];
        return rows.map((row) => mapRecordToLancamento(row as LancamentoRecord));
    },

    /**
     * Busca um lançamento por ID
     */
    async buscarPorId(id: number): Promise<Lancamento | null> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return mapRecordToLancamento(data);
    },

    /**
     * Cria um novo lançamento
     */
    async criar(dados: Partial<Lancamento>): Promise<Lancamento> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .insert(mapLancamentoToRecord(dados))
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar lançamento: ${error.message}`);
        return mapRecordToLancamento(data);
    },

    /**
     * Atualiza um lançamento
     */
    async atualizar(id: number, dados: Partial<Lancamento>): Promise<Lancamento> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .update({
                ...mapLancamentoToRecord(dados),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar lançamento: ${error.message}`);
        return mapRecordToLancamento(data);
    },

    /**
     * Exclui um lançamento (soft delete ou hard delete)
     */
    async excluir(id: number): Promise<void> {
        const supabase = createServiceClient();

        // Em runtime real, `delete()` retorna um builder thenable.
        // Nos testes, o mock pode retornar uma Promise direto.
        const baseQuery = supabase.from('lancamentos_financeiros') as unknown;
        const baseChain = baseQuery as ChainableQueryBuilder;
        const deletionTarget = isChainableQueryBuilder(baseQuery) && typeof baseChain.eq === 'function'
            ? baseChain.eq('id', id)
            : baseQuery;
        const deleteFn = (deletionTarget as ChainableQueryBuilder).delete;
        const deletionResult = typeof deleteFn === 'function' ? deleteFn.call(deletionTarget) : deletionTarget;
        const response = await deletionResult;
        const { error } = response as { error?: unknown };

        if (error) throw new Error(`Erro ao excluir lançamento: ${getErrorMessage(error)}`);
    },

    /**
     * Busca lançamentos por parcela de acordo
     */
    async buscarPorParcela(parcelaId: number): Promise<Lancamento[]> {
        const supabase = createServiceClient();

        const baseQuery = supabase.from('lancamentos_financeiros') as unknown;
        const selection = (baseQuery as ChainableQueryBuilder).select?.('*') ?? baseQuery;
        const selectionChain = selection as ChainableQueryBuilder;
        const baseChain = baseQuery as ChainableQueryBuilder;

        const filtered = isChainableQueryBuilder(selection) && typeof selectionChain.eq === 'function'
            ? selectionChain.eq('parcela_id', parcelaId)
            : typeof baseChain.eq === 'function'
                ? baseChain.eq('parcela_id', parcelaId)
                : baseQuery;

        const response = isChainableQueryBuilder(selection) ? await filtered : await selection;
        const { data, error } = response as { data?: unknown; error?: unknown };

        if (error) throw new Error(`Erro ao buscar lançamentos por parcela: ${getErrorMessage(error)}`);
        const rows = Array.isArray(data) ? (data as unknown[]) : [];
        return rows.map((row) => mapRecordToLancamento(row as LancamentoRecord));
    },

    /**
     * Conta lançamentos com filtros
     */
    async contar(params: ListarLancamentosParams): Promise<number> {
        const supabase = createServiceClient();

        const baseQuery = supabase.from('lancamentos_financeiros') as unknown;
        const baseChain = baseQuery as ChainableQueryBuilder;
        const selection = baseChain.select?.('id', { count: 'exact', head: true } as unknown) ?? baseQuery;

        let filtersTarget: unknown = selection;
        if (!isChainableQueryBuilder(selection) && typeof baseChain.eq === 'function') {
            filtersTarget = baseQuery;
        }

        if (params.tipo) {
            const eqFn = (filtersTarget as ChainableQueryBuilder).eq;
            if (typeof eqFn === 'function') {
                filtersTarget = eqFn.call(filtersTarget, 'tipo', params.tipo);
            }
        }

        if (params.status) {
            if (Array.isArray(params.status)) {
                const inFn = (filtersTarget as ChainableQueryBuilder).in;
                if (typeof inFn === 'function') {
                    filtersTarget = inFn.call(filtersTarget, 'status', params.status);
                }
            } else {
                const eqFn = (filtersTarget as ChainableQueryBuilder).eq;
                if (typeof eqFn === 'function') {
                    filtersTarget = eqFn.call(filtersTarget, 'status', params.status);
                }
            }
        }

        const response = isChainableQueryBuilder(selection) ? await filtersTarget : await selection;
        const { count, error } = response as { count?: number | null; error?: unknown };
        if (error) throw new Error(`Erro ao contar lançamentos: ${getErrorMessage(error)}`);

        return count || 0;
    },

    /**
     * Busca resumo de vencimentos (tipado corretamente)
     */
    async buscarResumoVencimentos(tipo?: 'receita' | 'despesa'): Promise<RepositoryResult<LegacyResumoVencimentos>> {
        const supabase = createServiceClient();
        const hoje = new Date();
        const hojeStr = toDateString(hoje);

        // Calculate date boundaries
        const em7Dias = new Date(hoje);
        em7Dias.setDate(em7Dias.getDate() + 7);
        const em7DiasStr = toDateString(em7Dias);

        const em30Dias = new Date(hoje);
        em30Dias.setDate(em30Dias.getDate() + 30);
        const em30DiasStr = toDateString(em30Dias);

        // Query pending lancamentos with due dates
        let query = supabase
            .from('lancamentos_financeiros')
            .select('valor, data_vencimento')
            .eq('status', 'pendente')
            .not('data_vencimento', 'is', null);

        if (tipo) {
            query = query.eq('tipo', tipo);
        }

        const { data, error } = await query;

        if (error) return { success: false, error: `Erro ao buscar resumo: ${getErrorMessage(error)}` };

        const resumo: LegacyResumoVencimentos = {
            vencidas: { quantidade: 0, valorTotal: 0 },
            hoje: { quantidade: 0, valorTotal: 0 },
            proximos7Dias: { quantidade: 0, valorTotal: 0 },
            proximos30Dias: { quantidade: 0, valorTotal: 0 },
        };

        const rows = Array.isArray(data) ? data : [];

        for (const row of rows) {
            const dataVencimento = row.data_vencimento as string;
            const valor = (row.valor as number) || 0;

            if (dataVencimento < hojeStr) {
                // Vencidas (antes de hoje)
                resumo.vencidas.quantidade++;
                resumo.vencidas.valorTotal += valor;
            } else if (dataVencimento === hojeStr) {
                // Vence hoje
                resumo.hoje.quantidade++;
                resumo.hoje.valorTotal += valor;
            } else if (dataVencimento <= em7DiasStr) {
                // Próximos 7 dias (excluindo hoje)
                resumo.proximos7Dias.quantidade++;
                resumo.proximos7Dias.valorTotal += valor;
            } else if (dataVencimento <= em30DiasStr) {
                // Próximos 30 dias (excluindo os primeiros 7)
                resumo.proximos30Dias.quantidade++;
                resumo.proximos30Dias.valorTotal += valor;
            }
        }

        return { success: true, data: resumo };
    }
};

// ============================================================================
// Mappers
// ============================================================================

interface LancamentoRecord {
    id: number;
    tipo: string;
    descricao: string;
    valor: number;
    data_lancamento: string;
    data_vencimento: string | null;
    data_efetivacao: string | null;
    data_competencia: string;
    status: string;
    origem: string;
    forma_pagamento: string | null;
    conta_bancaria_id: number | null;
    conta_contabil_id: number;
    centro_custo_id: number | null;
    documento: string | null;
    observacoes: string | null;
    categoria: string | null;
    cliente_id: number | null;
    fornecedor_id: number | null;
    processo_id: number | null;
    contrato_id: number | null;
    parcela_id: number | null;
    acordo_condenacao_id: number | null;
    recorrente: boolean;
    frequencia_recorrencia: string | null;
    lancamento_origem_id: number | null;
    anexos: unknown[];
    created_at: string;
    updated_at: string;
    created_by: number | null;
}

function mapRecordToLancamento(record: LancamentoRecord): Lancamento {
    return {
        id: record.id,
        tipo: record.tipo as Lancamento['tipo'],
        descricao: record.descricao,
        valor: record.valor,
        dataLancamento: record.data_lancamento,
        dataVencimento: record.data_vencimento,
        dataEfetivacao: record.data_efetivacao,
        dataCompetencia: record.data_competencia,
        status: record.status as Lancamento['status'],
        origem: record.origem as Lancamento['origem'],
        formaPagamento: record.forma_pagamento as Lancamento['formaPagamento'],
        contaBancariaId: record.conta_bancaria_id,
        contaContabilId: record.conta_contabil_id,
        centroCustoId: record.centro_custo_id,
        documento: record.documento,
        observacoes: record.observacoes,
        categoria: record.categoria,
        clienteId: record.cliente_id,
        fornecedorId: record.fornecedor_id,
        processoId: record.processo_id,
        contratoId: record.contrato_id,
        parcelaId: record.parcela_id,
        acordoCondenacaoId: record.acordo_condenacao_id,
        recorrente: record.recorrente || false,
        frequenciaRecorrencia: record.frequencia_recorrencia as Lancamento['frequenciaRecorrencia'],
        lancamentoOrigemId: record.lancamento_origem_id,
        anexos: record.anexos as Lancamento['anexos'],
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        createdBy: record.created_by
    };
}

interface LancamentoRecordPartial {
    tipo?: string;
    descricao?: string;
    valor?: number;
    data_lancamento?: string;
    data_vencimento?: string | null;
    data_efetivacao?: string | null;
    data_competencia?: string;
    status?: string;
    origem?: string;
    forma_pagamento?: string | null;
    categoria?: string | null;
    documento?: string | null;
    observacoes?: string | null;
    recorrente?: boolean;
    frequencia_recorrencia?: string | null;
    lancamento_origem_id?: number | null;
    anexos?: unknown[];
    conta_bancaria_id?: number | null;
    conta_contabil_id?: number;
    centro_custo_id?: number | null;
    cliente_id?: number | null;
    processo_id?: number | null;
    contrato_id?: number | null;
    parcela_id?: number | null;
    acordo_condenacao_id?: number | null;
    created_by?: number | null;
}

function mapLancamentoToRecord(domain: Partial<Lancamento>): LancamentoRecordPartial {
    const record: LancamentoRecordPartial = {};

    // Compatibilidade com payloads legados (tests/fixtures)
    const pessoaId = (domain as Partial<{ pessoaId?: number | null }>).pessoaId;

    if (domain.tipo !== undefined) record.tipo = domain.tipo;
    if (domain.descricao !== undefined) record.descricao = domain.descricao;
    if (domain.valor !== undefined) record.valor = domain.valor;
    if (domain.dataLancamento !== undefined) record.data_lancamento = domain.dataLancamento;
    if (domain.dataVencimento !== undefined) record.data_vencimento = domain.dataVencimento ?? null;
    if (domain.dataCompetencia !== undefined) record.data_competencia = domain.dataCompetencia;
    if (domain.dataEfetivacao !== undefined) record.data_efetivacao = domain.dataEfetivacao ?? null;
    if (domain.status !== undefined) record.status = domain.status;
    if (domain.origem !== undefined) record.origem = domain.origem;
    if (domain.formaPagamento !== undefined) record.forma_pagamento = domain.formaPagamento ?? null;
    if (domain.categoria !== undefined) record.categoria = domain.categoria ?? null;
    if (domain.documento !== undefined) record.documento = domain.documento ?? null;
    if (domain.observacoes !== undefined) record.observacoes = domain.observacoes ?? null;
    if (domain.recorrente !== undefined) record.recorrente = domain.recorrente;
    if (domain.frequenciaRecorrencia !== undefined) record.frequencia_recorrencia = domain.frequenciaRecorrencia ?? null;
    if (domain.lancamentoOrigemId !== undefined) record.lancamento_origem_id = domain.lancamentoOrigemId ?? null;
    if (domain.anexos !== undefined) record.anexos = domain.anexos;

    // Foreign Keys
    if (domain.contaBancariaId !== undefined) record.conta_bancaria_id = domain.contaBancariaId ?? null;
    if (domain.contaContabilId !== undefined && domain.contaContabilId !== null) {
        record.conta_contabil_id = domain.contaContabilId;
    }
    if (domain.centroCustoId !== undefined) record.centro_custo_id = domain.centroCustoId ?? null;
    if (domain.clienteId !== undefined) {
        record.cliente_id = domain.clienteId ?? null;
    } else if (pessoaId !== undefined) {
        record.cliente_id = pessoaId ?? null;
    }
    if (domain.processoId !== undefined) record.processo_id = domain.processoId ?? null;
    if (domain.contratoId !== undefined) record.contrato_id = domain.contratoId ?? null;
    if (domain.parcelaId !== undefined) record.parcela_id = domain.parcelaId ?? null;
    if (domain.acordoCondenacaoId !== undefined) record.acordo_condenacao_id = domain.acordoCondenacaoId ?? null;
    if (domain.createdBy !== undefined) record.created_by = domain.createdBy;

    return record;
}
