/**
 * Service de Lançamentos Financeiros
 * Casos de uso e orquestração de regras de negócio
 */

import { LancamentosRepository } from '../repository/lancamentos';
import {
    validarCriacaoLancamento,
    validarEfetivacaoLancamento,
    validarCancelamentoLancamento,
    validarEstornoLancamento,
    calcularProximaDataRecorrencia
} from '../domain/lancamentos';
import type { Lancamento, ListarLancamentosParams } from '../types/lancamentos';
import { todayDateString, toDateString } from '@/lib/date-utils';

type EfetivarLancamentoInput = {
    dataEfetivacao?: string;
    formaPagamento?: Lancamento['formaPagamento'];
    contaBancariaId?: number;
};

// ============================================================================
// Service Implementation
// ============================================================================

export const LancamentosService = {
    /**
     * Lista lançamentos financeiros com filtros
     */
    async listar(params: ListarLancamentosParams): Promise<Lancamento[]> {
        return LancamentosRepository.listar(params);
    },

    /**
     * Busca um lançamento por ID
     */
    async buscarPorId(id: number): Promise<Lancamento | null> {
        return LancamentosRepository.buscarPorId(id);
    },

    /**
     * Cria um novo lançamento
     */
    async criar(dados: Partial<Lancamento>): Promise<Lancamento> {
        // Validar regras de negócio
        const validacao = validarCriacaoLancamento(dados);
        if (!validacao.valido) {
            throw new Error(validacao.erros.join('; '));
        }

        // Valores padrão
        const dadosCompletos: Partial<Lancamento> = {
            ...dados,
            status: dados.status || 'pendente',
            dataLancamento: dados.dataLancamento || todayDateString(),
            dataCompetencia: dados.dataCompetencia || dados.dataLancamento || todayDateString(),
            recorrente: dados.recorrente || false,
            anexos: dados.anexos || []
        };

        return LancamentosRepository.criar(dadosCompletos);
    },

    /**
     * Atualiza um lançamento
     */
    async atualizar(id: number, dados: Partial<Lancamento>): Promise<Lancamento> {
        const existente = await LancamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Lançamento não encontrado');
        }

        return LancamentosRepository.atualizar(id, dados);
    },

    /**
     * Exclui um lançamento
     */
    async excluir(id: number): Promise<void> {
        const existente = await LancamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Lançamento não encontrado');
        }

        // Validar se pode ser excluído
        if (existente.status === 'confirmado') {
            throw new Error('Lançamento confirmado não pode ser excluído. Use estorno.');
        }

        return LancamentosRepository.excluir(id);
    },

    /**
     * Efetiva (paga/recebe) um lançamento
     */
    async efetivar(
        id: number,
        dados: EfetivarLancamentoInput
    ): Promise<Lancamento> {
        const existente = await LancamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Lançamento não encontrado');
        }

        const validacao = validarEfetivacaoLancamento(existente);
        if (!validacao.valido) {
            throw new Error(validacao.erros.join('; '));
        }

        return LancamentosRepository.atualizar(id, {
            status: 'confirmado',
            dataEfetivacao: dados.dataEfetivacao || new Date().toISOString(),
            formaPagamento: dados.formaPagamento ?? existente.formaPagamento ?? null,
            contaBancariaId: dados.contaBancariaId ?? existente.contaBancariaId ?? null
        });
    },

    /**
     * Cancela um lançamento
     */
    async cancelar(id: number): Promise<Lancamento> {
        const existente = await LancamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Lançamento não encontrado');
        }

        const validacao = validarCancelamentoLancamento(existente);
        if (!validacao.valido) {
            throw new Error(validacao.erros.join('; '));
        }

        return LancamentosRepository.atualizar(id, { status: 'cancelado' });
    },

    /**
     * Estorna um lançamento
     */
    async estornar(id: number): Promise<Lancamento> {
        const existente = await LancamentosRepository.buscarPorId(id);
        if (!existente) {
            throw new Error('Lançamento não encontrado');
        }

        const validacao = validarEstornoLancamento(existente);
        if (!validacao.valido) {
            throw new Error(validacao.erros.join('; '));
        }

        return LancamentosRepository.atualizar(id, { status: 'estornado' });
    },

    /**
     * Gera próximo lançamento recorrente
     */
    async gerarRecorrente(lancamentoOrigemId: number): Promise<Lancamento> {
        const origem = await LancamentosRepository.buscarPorId(lancamentoOrigemId);
        if (!origem) {
            throw new Error('Lançamento de origem não encontrado');
        }

        if (!origem.recorrente || !origem.frequenciaRecorrencia) {
            throw new Error('Lançamento não é recorrente');
        }

        const novaDataVencimento = calcularProximaDataRecorrencia(
            new Date(origem.dataVencimento || origem.dataLancamento),
            origem.frequenciaRecorrencia
        );

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, ...lancamentoBase } = origem;

        return LancamentosRepository.criar({
            ...lancamentoBase,
            status: 'pendente',
            dataLancamento: todayDateString(),
            dataVencimento: toDateString(novaDataVencimento),
            dataCompetencia: toDateString(novaDataVencimento),
            dataEfetivacao: null,
            lancamentoOrigemId: lancamentoOrigemId,
            anexos: []
        });
    },

    /**
     * Busca lançamentos por parcela de acordo
     */
    async buscarPorParcela(parcelaId: number): Promise<Lancamento[]> {
        return LancamentosRepository.buscarPorParcela(parcelaId);
    },

    /**
     * Busca resumo de vencimentos no formato ResumoVencimentos
     */
    async buscarResumoVencimentos(tipo?: 'receita' | 'despesa'): Promise<import('../types/lancamentos').ResumoVencimentos> {
        const result = await LancamentosRepository.buscarResumoVencimentos(tipo);
        if (!result.success) {
            throw new Error(result.error);
        }

        return {
            vencidas: result.data.vencidas,
            vencendoHoje: result.data.hoje,
            vencendoEm7Dias: result.data.proximos7Dias,
            vencendoEm30Dias: result.data.proximos30Dias,
        };
    },

    /**
     * Conta total de lançamentos
     */
    async contar(params: ListarLancamentosParams): Promise<number> {
        return LancamentosRepository.contar(params);
    }
};
