/**
 * Repository de Obrigações Jurídicas
 * Camada de acesso a dados (Supabase)
 * Reutiliza repositório base da feature obrigacoes
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import * as ObrigacoesRepoBase from '@/app/app/obrigacoes/repository';
import type {
    AcordoComParcelas,
    ParcelaComLancamento,
    StatusRepasse,
    TipoObrigacao,
    FormaPagamento as ObrigacoesFormaPagamento,
} from '@/app/app/obrigacoes';
import type {
    ListarLancamentosParams,
    Lancamento,
    StatusLancamento,
    FormaPagamento as FinanceiroFormaPagamento,
    FrequenciaRecorrencia,
    AnexoLancamento
} from '../types/lancamentos';

type ParcelaObrigacao = ParcelaComLancamento;
type ObrigacaoJuridica = AcordoComParcelas;

// ============================================================================
// Types Internos (Mapeamento do Banco)
// ============================================================================

interface ParcelaRecord {
    id: number;
    acordo_condenacao_id: number;
    numero_parcela: number;
    valor_bruto_credito_principal: number;
    honorarios_contratuais: number | null;
    honorarios_sucumbenciais: number | null;
    valor_repasse_cliente: number | null;
    data_vencimento: string;
    data_efetivacao: string | null;
    status: 'pendente' | 'recebida' | 'paga' | 'atrasada' | 'cancelada';
    forma_pagamento: string | null;
    status_repasse: string | null;
    declaracao_prestacao_contas_url?: string | null;
    comprovante_repasse_url?: string | null;
    data_repasse?: string | null;
    arquivo_quitacao_reclamante?: string | null;
    data_quitacao_anexada?: string | null;
    created_at: string;
    updated_at: string;

    acordos_condenacoes?: {
        id: number;
        tipo: TipoObrigacao;
        direcao: 'recebimento' | 'pagamento';
        valor_total: number;
        numero_parcelas: number;
        status: string;
        processo_id: number | null;
        acervo?: {
            id: number;
            numero_processo: string;
            nome_parte_autora: string | null;
            nome_parte_re: string | null;
            trt: string | null;
            grau: string | null;
        } | null;
    };

    lancamentos_financeiros?: Array<{
        id: number;
        tipo: 'receita' | 'despesa';
        descricao: string;
        valor: number;
        data_lancamento: string;
        data_vencimento: string | null;
        data_efetivacao: string | null;
        status: string;
        conta_contabil_id: number | null;
        forma_pagamento: string | null;
    }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper: Converte string do banco para FormaPagamento do financeiro
 */
function parseFormaPagamentoFinanceiro(value: string | FinanceiroFormaPagamento | null | undefined): FinanceiroFormaPagamento | null {
    if (!value) return null;
    const valid: FinanceiroFormaPagamento[] = [
        'dinheiro', 'transferencia_bancaria', 'ted', 'pix', 'boleto',
        'cartao_credito', 'cartao_debito', 'cheque', 'deposito_judicial'
    ];
    return valid.includes(value as FinanceiroFormaPagamento) ? (value as FinanceiroFormaPagamento) : null;
}

/**
 * Helper: Converte string do banco para FormaPagamento do módulo obrigacoes
 */
function parseFormaPagamentoObrigacoes(value: string | null | undefined): ObrigacoesFormaPagamento | null {
    if (!value) return null;
    const valid: ObrigacoesFormaPagamento[] = [
        'transferencia_direta', 'deposito_judicial', 'deposito_recursal'
    ];
    return valid.includes(value as ObrigacoesFormaPagamento) ? (value as ObrigacoesFormaPagamento) : null;
}

/**
 * Helper: Converte string do banco para FrequenciaRecorrencia válida
 */
function parseFrequenciaRecorrencia(value: string | FrequenciaRecorrencia | null | undefined): FrequenciaRecorrencia | null {
    if (!value) return null;
    const valid: FrequenciaRecorrencia[] = [
        'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual'
    ];
    return valid.includes(value as FrequenciaRecorrencia) ? (value as FrequenciaRecorrencia) : null;
}

// ============================================================================
// Repository Implementation
// ============================================================================

export const ObrigacoesRepository = {
    /**
     * Busca parcelas de um acordo com os lançamentos vinculados
     * Reutiliza repositório base e adiciona lógica de lançamentos
     */
    async buscarParcelasPorAcordo(acordoId: number): Promise<ParcelaObrigacao[]> {
        // Busca parcelas do repositório base
        const parcelasBase = await ObrigacoesRepoBase.buscarParcelasPorAcordo(acordoId);

        // Busca lançamentos para cada parcela
        const supabase = createServiceClient();
        const { data: lancamentos } = await supabase
            .from('lancamentos_financeiros')
            .select('*')
            .eq('acordo_condenacao_id', acordoId);

        // Mapeia parcelas para o formato financeiro
        return parcelasBase.map(p => {
            const lanc = lancamentos?.find(l => l.parcela_id === p.id);
            const lancamentoTyped = lanc ? {
                ...lanc,
                forma_pagamento: parseFormaPagamentoFinanceiro(lanc.forma_pagamento),
                frequencia_recorrencia: parseFrequenciaRecorrencia(lanc.frequencia_recorrencia),
                anexos: (lanc.anexos as AnexoLancamento[]) || [],
                created_by: typeof lanc.created_by === 'number' ? lanc.created_by : null
            } : undefined;
            return mapParcelaToFinanceiro(p, lancamentoTyped);
        });
    },

    /**
     * Busca uma obrigação jurídica completa (Acordo/Condenação) e suas parcelas
     * Reutiliza repositório base
     */
    async buscarObrigacaoJuridica(acordoId: number): Promise<ObrigacaoJuridica | null> {
        const acordoBase = await ObrigacoesRepoBase.buscarAcordoPorId(acordoId);
        if (!acordoBase) return null;

        const parcelas = await this.buscarParcelasPorAcordo(acordoId);

        const parcelasPagas = parcelas.filter(p => p.status === 'paga' || p.status === 'recebida').length;
        const parcelasPendentes = parcelas.filter(p => p.status === 'pendente').length;

        return {
            id: acordoBase.id,
            tipo: acordoBase.tipo as TipoObrigacao,
            direcao: acordoBase.direcao,
            processoId: acordoBase.processoId,
            valorTotal: acordoBase.valorTotal,
            dataVencimentoPrimeiraParcela: acordoBase.dataVencimentoPrimeiraParcela,
            status: acordoBase.status,
            numeroParcelas: acordoBase.numeroParcelas,
            formaDistribuicao: acordoBase.formaDistribuicao,
            percentualEscritorio: acordoBase.percentualEscritorio,
            percentualCliente: acordoBase.percentualCliente,
            honorariosSucumbenciaisTotal: acordoBase.honorariosSucumbenciaisTotal,
            observacoes: acordoBase.observacoes,
            createdAt: acordoBase.createdAt,
            updatedAt: acordoBase.updatedAt,
            createdBy: acordoBase.createdBy,
            parcelas,
            totalParcelas: parcelas.length,
            parcelasPagas,
            parcelasPendentes
        };
    },

    /**
     * Busca parcelas que possuem (ou deveriam possuir) lançamentos financeiros
     */
    async listarParcelasComLancamentos(params: ListarLancamentosParams): Promise<ParcelaObrigacao[]> {
        const supabase = createServiceClient();

        let query = supabase
            .from('parcelas')
            .select(`
                *,
                acordos_condenacoes!inner (
                    id, tipo, direcao, processo_id,
                    acervo!acordos_condenacoes_processo_id_fkey (
                        id, numero_processo, nome_parte_autora, nome_parte_re, trt, grau
                    )
                ),
                lancamentos_financeiros (*)
            `)
            .order('data_vencimento');

        if (params.dataVencimentoInicio) {
            query = query.gte('data_vencimento', params.dataVencimentoInicio);
        }
        if (params.dataVencimentoFim) {
            query = query.lte('data_vencimento', params.dataVencimentoFim);
        }

        const { data, error } = await query;
        if (error) throw new Error(`Erro ao listar parcelas: ${error.message}`);

        return (data || []).map(mapRecordToParcela);
    },

    /**
     * Detecta parcelas sem lançamento financeiro correspondente
     */
    async detectarInconsistencias(acordoId?: number): Promise<ParcelaObrigacao[]> {
        const supabase = createServiceClient();

        let query = supabase
            .from('parcelas')
            .select(`
                *,
                lancamentos_financeiros(id)
            `);

        // Regra: Parcela confirmada DEVE ter lançamento
        query = query.in('status', ['recebida', 'paga']);

        if (acordoId) {
            query = query.eq('acordo_condenacao_id', acordoId);
        }

        const { data, error } = await query;
        if (error) throw new Error(`Erro ao detectar inconsistências: ${error.message}`);

        // Filtrar em memória as que não tem lançamentos
        return (data || [])
            .filter(p => !p.lancamentos_financeiros || p.lancamentos_financeiros.length === 0)
            .map(p => mapRecordToParcela(p as ParcelaRecord));
    },

    /**
     * Busca parcela por ID
     */
    async buscarParcelaPorId(parcelaId: number): Promise<ParcelaObrigacao | null> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('parcelas')
            .select(`
                *,
                lancamentos_financeiros (*)
            `)
            .eq('id', parcelaId)
            .single();

        if (error || !data) return null;
        return mapRecordToParcela(data);
    },

    /**
     * Atualiza uma parcela
     */
    async atualizarParcela(
        parcelaId: number,
        dados: Partial<{
            status: 'pendente' | 'recebida' | 'paga' | 'atrasada' | 'cancelada';
            statusRepasse: StatusRepasse;
            declaracaoPrestacaoContasUrl: string | null;
            comprovanteRepasseUrl: string | null;
            dataRepasse: string | null;
            formaPagamento: string | null;
        }>
    ): Promise<void> {
        const supabase = createServiceClient();

        const record: Record<string, string | null> = {
            updated_at: new Date().toISOString()
        };

        if (dados.status !== undefined) record.status = dados.status;
        if (dados.statusRepasse !== undefined) record.status_repasse = dados.statusRepasse;
        if (dados.declaracaoPrestacaoContasUrl !== undefined) record.declaracao_prestacao_contas_url = dados.declaracaoPrestacaoContasUrl;
        if (dados.comprovanteRepasseUrl !== undefined) record.comprovante_repasse_url = dados.comprovanteRepasseUrl;
        if (dados.dataRepasse !== undefined) record.data_repasse = dados.dataRepasse;
        if (dados.formaPagamento !== undefined) record.forma_pagamento = dados.formaPagamento;

        const { error } = await supabase
            .from('parcelas')
            .update(record)
            .eq('id', parcelaId);

        if (error) throw new Error(`Erro ao atualizar parcela: ${error.message}`);
    },

    /**
     * Lista repasses pendentes de transferência
     */
    async listarRepassesPendentes(): Promise<ParcelaObrigacao[]> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('parcelas')
            .select('*')
            .eq('status_repasse', 'pendente_transferencia')
            .gt('valor_repasse_cliente', 0)
            .order('data_vencimento');

        if (error) throw new Error(`Erro ao listar repasses: ${error.message}`);

        return (data || []).map(mapRecordToParcela);
    },

    /**
     * Calcula totais repassados por cliente
     */
    async calcularTotalRepassadoPorCliente(clienteId: number): Promise<number> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('parcelas')
            .select('valor_repasse_cliente, acordos_condenacoes!inner(cliente_id)')
            .eq('acordos_condenacoes.cliente_id', clienteId)
            .eq('status_repasse', 'repassado');

        if (error) throw new Error(`Erro ao calcular total repassado: ${error.message}`);

        return (data || []).reduce((acc: number, curr: { valor_repasse_cliente: number | null }) => acc + (curr.valor_repasse_cliente || 0), 0);
    },

    /**
     * Lista parcelas por IDs de acordos
     */
    async listarParcelasPorAcordos(acordoIds: number[]): Promise<ParcelaObrigacao[]> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('parcelas')
            .select(`
                *,
                lancamentos_financeiros (*)
            `)
            .in('acordo_condenacao_id', acordoIds)
            .order('data_vencimento');

        if (error) throw new Error(`Erro ao listar parcelas: ${error.message}`);

        return (data || []).map(mapRecordToParcela);
    }
};

// ============================================================================
// Mappers
// ============================================================================

/**
 * Converte Parcela do domínio de obrigações para formato financeiro
 */
function mapParcelaToFinanceiro(
    parcela: {
        id: number;
        acordoCondenacaoId: number;
        numeroParcela: number;
        valorBrutoCreditoPrincipal: number;
        honorariosContratuais: number | null;
        honorariosSucumbenciais: number | null;
        valorRepasseCliente: number | null;
        dataVencimento: string;
        dataEfetivacao: string | null;
        status: 'pendente' | 'recebida' | 'paga' | 'atrasada' | 'cancelada';
        statusRepasse: StatusRepasse | null;
        formaPagamento: string | null;
        declaracaoPrestacaoContasUrl?: string | null;
        comprovanteRepasseUrl?: string | null;
        dataRepasse?: string | null;
        arquivoQuitacaoReclamante?: string | null;
        dataQuitacaoAnexada?: string | null;
    },
    lancamento?: {
        id: number;
        tipo: 'receita' | 'despesa';
        descricao: string;
        valor: number;
        data_lancamento: string;
        data_vencimento: string | null;
        data_efetivacao: string | null;
        data_competencia?: string | null;
        status: string;
        forma_pagamento: string | null; // Vem como string do banco
        conta_bancaria_id?: number | null;
        conta_contabil_id?: number | null;
        centro_custo_id?: number | null;
        documento?: string | null;
        observacoes?: string | null;
        categoria?: string | null;
        cliente_id?: number | null;
        processo_id?: number | null;
        contrato_id?: number | null;
        parcela_id?: number | null;
        acordo_condenacao_id?: number | null;
        recorrente?: boolean;
        frequencia_recorrencia?: string | null; // Vem como string do banco
        lancamento_origem_id?: number | null;
        anexos?: unknown[]; // Vem como JSONB do banco
        created_at?: string;
        updated_at?: string;
        created_by?: number | null;
    }
): ParcelaObrigacao {
    return {
        id: parcela.id,
        acordoCondenacaoId: parcela.acordoCondenacaoId,
        numeroParcela: parcela.numeroParcela,
        valorBrutoCreditoPrincipal: parcela.valorBrutoCreditoPrincipal,
        honorariosContratuais: parcela.honorariosContratuais || 0,
        honorariosSucumbenciais: parcela.honorariosSucumbenciais || 0,
        valorRepasseCliente: parcela.valorRepasseCliente,
        dataVencimento: parcela.dataVencimento,
        dataEfetivacao: parcela.dataEfetivacao,
        status: parcela.status,
        formaPagamento: parseFormaPagamentoObrigacoes(parcela.formaPagamento),
        statusRepasse: parcela.statusRepasse || 'nao_aplicavel',
        editadoManualmente: false,
        declaracaoPrestacaoContasUrl: parcela.declaracaoPrestacaoContasUrl || null,
        dataDeclaracaoAnexada: null,
        comprovanteRepasseUrl: parcela.comprovanteRepasseUrl || null,
        dataRepasse: parcela.dataRepasse || null,
        usuarioRepasseId: null,
        arquivoQuitacaoReclamante: parcela.arquivoQuitacaoReclamante || null,
        dataQuitacaoAnexada: parcela.dataQuitacaoAnexada || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dadosPagamento: null,
        lancamentoId: lancamento?.id || null
    };
}

function mapRecordToParcela(record: ParcelaRecord): ParcelaObrigacao {
    const lancamento = record.lancamentos_financeiros?.[0];

    return {
        id: record.id,
        acordoCondenacaoId: record.acordo_condenacao_id,
        numeroParcela: record.numero_parcela,
        valorBrutoCreditoPrincipal: record.valor_bruto_credito_principal,
        honorariosContratuais: record.honorarios_contratuais || 0,
        honorariosSucumbenciais: record.honorarios_sucumbenciais || 0,
        valorRepasseCliente: record.valor_repasse_cliente,
        dataVencimento: record.data_vencimento,
        dataEfetivacao: record.data_efetivacao,
        status: record.status,
        formaPagamento: parseFormaPagamentoObrigacoes(record.forma_pagamento),
        statusRepasse: (record.status_repasse as StatusRepasse) || 'nao_aplicavel',
        editadoManualmente: false,
        declaracaoPrestacaoContasUrl: record.declaracao_prestacao_contas_url || null,
        dataDeclaracaoAnexada: null,
        comprovanteRepasseUrl: record.comprovante_repasse_url || null,
        dataRepasse: record.data_repasse || null,
        usuarioRepasseId: null,
        arquivoQuitacaoReclamante: record.arquivo_quitacao_reclamante || null,
        dataQuitacaoAnexada: record.data_quitacao_anexada || null,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        dadosPagamento: null,
        lancamentoId: lancamento?.id || null
    };
}

// Helper function for future use when mapping DB records to domain objects
function _mapRecordToLancamento(record: {
    id: number;
    tipo: 'receita' | 'despesa';
    descricao: string;
    valor: number;
    data_lancamento: string;
    data_vencimento: string | null;
    data_efetivacao: string | null;
    data_competencia?: string | null;
    status: string;
    forma_pagamento: string | null; // Vem como string do banco
    conta_bancaria_id?: number | null;
    conta_contabil_id?: number | null;
    centro_custo_id?: number | null;
    documento?: string | null;
    observacoes?: string | null;
    categoria?: string | null;
    cliente_id?: number | null;
    fornecedor_id?: number | null;
    processo_id?: number | null;
    contrato_id?: number | null;
    parcela_id?: number | null;
    acordo_condenacao_id?: number | null;
    recorrente?: boolean;
    frequencia_recorrencia?: string | null; // Vem como string do banco
    lancamento_origem_id?: number | null;
    anexos?: unknown[]; // Vem como JSONB do banco
    created_at?: string;
    updated_at?: string;
    created_by?: number | null;
}): Lancamento {
    return {
        id: record.id,
        tipo: record.tipo,
        descricao: record.descricao,
        valor: record.valor,
        dataLancamento: record.data_lancamento,
        dataVencimento: record.data_vencimento,
        dataEfetivacao: record.data_efetivacao,
        dataCompetencia: record.data_competencia || '',
        status: mapStatusLancamento(record.status),
        origem: 'acordo_judicial',
        formaPagamento: parseFormaPagamentoFinanceiro(record.forma_pagamento),
        contaBancariaId: record.conta_bancaria_id || null,
        contaContabilId: record.conta_contabil_id || 0,
        centroCustoId: record.centro_custo_id || null,
        documento: record.documento || null,
        observacoes: record.observacoes || null,
        categoria: record.categoria || null,
        clienteId: record.cliente_id || null,
        fornecedorId: record.fornecedor_id || null,
        processoId: record.processo_id || null,
        contratoId: record.contrato_id || null,
        parcelaId: record.parcela_id || null,
        acordoCondenacaoId: record.acordo_condenacao_id || null,
        recorrente: record.recorrente || false,
        frequenciaRecorrencia: parseFrequenciaRecorrencia(record.frequencia_recorrencia),
        lancamentoOrigemId: record.lancamento_origem_id || null,
        anexos: Array.isArray(record.anexos) ? record.anexos as AnexoLancamento[] : [],
        createdAt: record.created_at || '',
        updatedAt: record.updated_at || '',
        createdBy: record.created_by || null
    };
}

function mapStatusLancamento(status: string): StatusLancamento {
    if (status === 'confirmado' || status === 'pago' || status === 'recebido') return 'confirmado';
    if (status === 'cancelado') return 'cancelado';
    if (status === 'estornado') return 'estornado';
    return 'pendente';
}
