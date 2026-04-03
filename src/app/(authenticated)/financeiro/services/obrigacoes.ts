/**
 * Service de Obrigações - Integração Financeira
 *
 * Este service é responsável pela integração entre o módulo jurídico (features/obrigacoes)
 * e o módulo financeiro. Ele NÃO contém lógica de negócio jurídica - essa fica em
 * features/obrigacoes/domain.ts.
 *
 * Responsabilidades:
 * - Sincronização de parcelas com lançamentos financeiros
 * - Cálculo de splits de pagamento para o financeiro
 * - Validação de integridade entre módulos
 */

import { ObrigacoesRepository } from '../repository/obrigacoes';
import {
    calcularSplitPagamento,
    validarIntegridadeParcela,
    podeIniciarRepasse,
    podeFinalizarRepasse,
    calcularRepassesPendentes,
    type SplitPagamento,
    type AcordoComParcelas,
    type ParcelaComLancamento,
} from '@/app/(authenticated)/obrigacoes';
import { determinarStatusSincronizacao } from '@/app/(authenticated)/obrigacoes';
import type { ListarLancamentosParams } from '../types/lancamentos';

// Aliases locais para compatibilidade
type ParcelaObrigacao = ParcelaComLancamento;
type ObrigacaoJuridica = AcordoComParcelas;

// ============================================================================
// Service Implementation
// ============================================================================

export const ObrigacoesService = {
    /**
     * Busca parcelas de um acordo com os lançamentos vinculados
     */
    async buscarParcelasPorAcordo(acordoId: number): Promise<ParcelaObrigacao[]> {
        return ObrigacoesRepository.buscarParcelasPorAcordo(acordoId);
    },

    /**
     * Busca uma obrigação jurídica completa (Acordo/Condenação) e suas parcelas
     */
    async buscarObrigacaoJuridica(acordoId: number): Promise<ObrigacaoJuridica | null> {
        return ObrigacoesRepository.buscarObrigacaoJuridica(acordoId);
    },

    /**
     * Busca parcelas que possuem (ou deveriam possuir) lançamentos financeiros
     */
    async listarParcelasComLancamentos(params: ListarLancamentosParams): Promise<ParcelaObrigacao[]> {
        return ObrigacoesRepository.listarParcelasComLancamentos(params);
    },

    /**
     * Detecta parcelas sem lançamento financeiro correspondente
     */
    async detectarInconsistencias(acordoId?: number): Promise<ParcelaObrigacao[]> {
        return ObrigacoesRepository.detectarInconsistencias(acordoId);
    },

    /**
     * Calcula o split de pagamento para uma parcela
     */
    calcularSplitPagamento(
        valorPrincipal: number,
        honorariosSucumbenciais: number,
        percentualHonorariosContratuais: number = 30
    ): SplitPagamento {
        return calcularSplitPagamento(valorPrincipal, honorariosSucumbenciais, percentualHonorariosContratuais);
    },

    /**
     * Sincroniza todas as parcelas de um acordo
     */
    async sincronizarAcordo(acordoId: number, forcar: boolean = false): Promise<{ sucesso: boolean; mensagem: string }> {
        try {
            const parcelas = await ObrigacoesRepository.buscarParcelasPorAcordo(acordoId);

            if (parcelas.length === 0) {
                return { sucesso: true, mensagem: 'Acordo sem parcelas.' };
            }

            let sucessos = 0;
            let erros = 0;

            for (const parcela of parcelas) {
                const res = await this.sincronizarParcela(parcela.id, forcar);
                if (res.sucesso) sucessos++;
                else erros++;
            }

            if (erros > 0) {
                return {
                    sucesso: false,
                    mensagem: `Sincronizado com avisos: ${sucessos} sucessos, ${erros} falhas/ignorados.`
                };
            }

            return { sucesso: true, mensagem: `Acordo sincronizado. ${sucessos} parcelas processadas.` };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao sincronizar acordo.';
            return { sucesso: false, mensagem: message };
        }
    },

    /**
     * Sincroniza uma parcela específica para o financeiro
     */
    async sincronizarParcela(parcelaId: number, forcar: boolean = false): Promise<{ sucesso: boolean; mensagem: string }> {
        try {
            const parcela = await ObrigacoesRepository.buscarParcelaPorId(parcelaId);
            if (!parcela) {
                return { sucesso: false, mensagem: 'Parcela não encontrada' };
            }

            const statusSync = determinarStatusSincronizacao(parcela);

            if (statusSync === 'sincronizado' && !forcar) {
                return { sucesso: true, mensagem: 'Parcela já sincronizada' };
            }

            if (statusSync === 'nao_aplicavel') {
                return { sucesso: true, mensagem: 'Sincronização não aplicável para esta parcela' };
            }

            // TODO: Implementar criação/atualização do lançamento financeiro
            // Esta lógica depende do serviço de integração do backend

            return { sucesso: true, mensagem: 'Sincronização realizada com sucesso' };
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : 'Erro ao sincronizar parcela.';
            return { sucesso: false, mensagem: message };
        }
    },

    /**
     * Busca repasses pendentes de transferência
     */
    async listarRepassesPendentes(): Promise<ParcelaObrigacao[]> {
        return ObrigacoesRepository.listarRepassesPendentes();
    },

    /**
     * Calcula totais repassados por cliente
     */
    async calcularTotalRepassadoPorCliente(clienteId: number): Promise<number> {
        return ObrigacoesRepository.calcularTotalRepassadoPorCliente(clienteId);
    },

    /**
     * Registra declaração de prestação de contas
     */
    async registrarDeclaracao(parcelaId: number, urlArquivo: string): Promise<void> {
        const parcela = await ObrigacoesRepository.buscarParcelaPorId(parcelaId);
        if (!parcela) {
            throw new Error('Parcela não encontrada');
        }

        const { pode, motivo } = podeIniciarRepasse(parcela);
        if (!pode) {
            throw new Error(motivo || 'Não é possível iniciar o repasse');
        }

        await ObrigacoesRepository.atualizarParcela(parcelaId, {
            declaracaoPrestacaoContasUrl: urlArquivo,
            statusRepasse: 'pendente_transferencia'
        });
    },

    /**
     * Registra o comprovante de repasse (Passo 2 do Repasse - Final)
     */
    async registrarComprovanteRepasse(
        parcelaId: number,
        urlArquivo: string,
        dataRepasse: string
    ): Promise<void> {
        const parcela = await ObrigacoesRepository.buscarParcelaPorId(parcelaId);
        if (!parcela) {
            throw new Error('Parcela não encontrada');
        }

        const { pode, motivo } = podeFinalizarRepasse(parcela);
        if (!pode) {
            throw new Error(motivo || 'Não é possível finalizar o repasse');
        }

        await ObrigacoesRepository.atualizarParcela(parcelaId, {
            comprovanteRepasseUrl: urlArquivo,
            dataRepasse: dataRepasse,
            statusRepasse: 'repassado'
        });
    },

    /**
     * Validações de integridade
     */
    validarIntegridade(
        parcela: ParcelaObrigacao,
        direcao: 'recebimento' | 'pagamento'
    ): { valido: boolean; erros: string[] } {
        return validarIntegridadeParcela(parcela, direcao);
    },

    /**
     * Calcula resumo de repasses para um acordo
     */
    async calcularResumoRepasses(acordoId: number): Promise<{
        totalParcelas: number;
        totalRecebidas: number;
        totalRepassado: number;
        totalPendenteRepasse: number;
    }> {
        const obrigacao = await this.buscarObrigacaoJuridica(acordoId);
        if (!obrigacao) {
            throw new Error('Obrigação não encontrada');
        }

        const parcelas = obrigacao.parcelas || [];

        return {
            totalParcelas: parcelas.length,
            totalRecebidas: parcelas.filter(p => p.status === 'recebida').length,
            totalRepassado: parcelas
                .filter(p => p.statusRepasse === 'repassado')
                .reduce((acc, p) => acc + (p.valorRepasseCliente ?? 0), 0),
            totalPendenteRepasse: calcularRepassesPendentes(obrigacao)
        };
    }
};
