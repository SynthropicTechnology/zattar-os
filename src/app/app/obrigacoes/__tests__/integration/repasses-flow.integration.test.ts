/**
 * Testes de Integração - Fluxo de Repasses
 *
 * Testa os fluxos de repasses: listar pendentes, anexar declaração e registrar repasse.
 * Valida regras de negócio como exigência de declaração antes do repasse.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import { ObrigacoesRepository } from '../../repository';
import {
  criarParcelaRecebidaMock,
} from '../fixtures';
import type { RepassePendente, RegistrarRepasseParams } from '../../domain';

jest.mock('../../repository');

const mockObrigacoesRepository = ObrigacoesRepository as jest.Mocked<typeof ObrigacoesRepository>;

// =============================================================================
// FIXTURES
// =============================================================================

function criarRepassePendenteMockDb(overrides: Partial<RepassePendente> = {}): RepassePendente {
  return {
    parcelaId: 1,
    acordoCondenacaoId: 1,
    numeroParcela: 1,
    valorBrutoCreditoPrincipal: 5000,
    valorRepasseCliente: 3500,
    statusRepasse: 'pendente_declaracao',
    dataEfetivacao: '2024-01-16',
    arquivoDeclaracaoPrestacaoContas: null,
    dataDeclaracaoAnexada: null,
    processoId: 100,
    tipo: 'acordo',
    acordoValorTotal: 10000,
    percentualCliente: 70,
    acordoNumeroParcelas: 2,
    ...overrides,
  };
}

// =============================================================================
// TESTES
// =============================================================================

describe('Repasses Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarRepassesPendentes', () => {
    it('deve listar repasses pendentes sem filtros', async () => {
      const repassesPendentes = [
        criarRepassePendenteMockDb({ parcelaId: 1, valorRepasseCliente: 3500 }),
        criarRepassePendenteMockDb({ parcelaId: 2, valorRepasseCliente: 7000 }),
      ];

      mockObrigacoesRepository.listarRepassesPendentes.mockResolvedValue(repassesPendentes);

      const result = await service.listarRepassesPendentes();

      expect(result).toHaveLength(2);
      expect(result[0].valorRepasseCliente).toBe(3500);
      expect(result[1].valorRepasseCliente).toBe(7000);
      expect(mockObrigacoesRepository.listarRepassesPendentes).toHaveBeenCalled();
    });

    it('deve listar repasses pendentes com filtros', async () => {
      const filtros = {
        statusRepasse: 'pendente_transferencia' as const,
        processoId: 100,
      };

      const repassesFiltrados = [
        criarRepassePendenteMockDb({
          parcelaId: 3,
          statusRepasse: 'pendente_transferencia',
          processoId: 100,
        }),
      ];

      mockObrigacoesRepository.listarRepassesPendentes.mockResolvedValue(repassesFiltrados);

      const result = await service.listarRepassesPendentes(filtros);

      expect(result).toHaveLength(1);
      expect(mockObrigacoesRepository.listarRepassesPendentes).toHaveBeenCalledWith(filtros);
    });

    it('deve retornar lista vazia quando não há repasses', async () => {
      mockObrigacoesRepository.listarRepassesPendentes.mockResolvedValue([]);

      const result = await service.listarRepassesPendentes();

      expect(result).toHaveLength(0);
    });
  });

  describe('anexarDeclaracaoPrestacaoContas', () => {
    it('deve anexar declaração de prestação de contas', async () => {
      const parcelaId = 1;
      const declaracaoUrl = 'https://storage.example.com/declaracao.pdf';

      mockObrigacoesRepository.anexarDeclaracaoPrestacaoContas.mockResolvedValue(undefined);

      await service.anexarDeclaracaoPrestacaoContas(parcelaId, declaracaoUrl);

      expect(mockObrigacoesRepository.anexarDeclaracaoPrestacaoContas).toHaveBeenCalledWith(
        parcelaId,
        declaracaoUrl
      );
    });
  });

  describe('registrarRepasse', () => {
    it('deve registrar repasse com comprovante quando declaração está anexada', async () => {
      const parcelaId = 1;
      const dados: RegistrarRepasseParams = {
        arquivoComprovantePath: 'https://storage.example.com/comprovante-repasse.pdf',
        usuarioRepasseId: 10,
        dataRepasse: '2024-01-22',
      };

      // Parcela com declaração anexada
      const parcelaComDeclaracao = criarParcelaRecebidaMock({
        id: parcelaId,
        declaracaoPrestacaoContasUrl: 'https://storage.example.com/declaracao.pdf',
      });

      mockObrigacoesRepository.buscarParcelaPorId.mockResolvedValue(parcelaComDeclaracao);
      mockObrigacoesRepository.registrarRepasse.mockResolvedValue(undefined);

      await service.registrarRepasse(parcelaId, dados);

      expect(mockObrigacoesRepository.buscarParcelaPorId).toHaveBeenCalledWith(parcelaId);
      expect(mockObrigacoesRepository.registrarRepasse).toHaveBeenCalledWith(parcelaId, dados);
    });

    it('deve rejeitar repasse quando declaração não está anexada', async () => {
      const parcelaId = 1;
      const dados: RegistrarRepasseParams = {
        arquivoComprovantePath: 'https://storage.example.com/comprovante-repasse.pdf',
        usuarioRepasseId: 10,
      };

      // Parcela SEM declaração
      const parcelaSemDeclaracao = criarParcelaRecebidaMock({
        id: parcelaId,
        declaracaoPrestacaoContasUrl: null,
      });

      mockObrigacoesRepository.buscarParcelaPorId.mockResolvedValue(parcelaSemDeclaracao);

      await expect(
        service.registrarRepasse(parcelaId, dados)
      ).rejects.toThrow('Declaração de prestação de contas obrigatória');

      expect(mockObrigacoesRepository.registrarRepasse).not.toHaveBeenCalled();
    });

    it('deve rejeitar repasse quando parcela não é encontrada', async () => {
      const parcelaId = 999;
      const dados: RegistrarRepasseParams = {
        arquivoComprovantePath: 'https://storage.example.com/comprovante-repasse.pdf',
        usuarioRepasseId: 10,
      };

      mockObrigacoesRepository.buscarParcelaPorId.mockResolvedValue(null);

      await expect(
        service.registrarRepasse(parcelaId, dados)
      ).rejects.toThrow('Parcela não encontrada');

      expect(mockObrigacoesRepository.registrarRepasse).not.toHaveBeenCalled();
    });
  });

  describe('fluxo completo: declaração -> repasse', () => {
    it('deve completar fluxo de anexar declaração e depois registrar repasse', async () => {
      const parcelaId = 1;
      const declaracaoUrl = 'https://storage.example.com/declaracao.pdf';
      const comprovantePath = 'https://storage.example.com/comprovante.pdf';

      // Step 1: Anexar declaração
      mockObrigacoesRepository.anexarDeclaracaoPrestacaoContas.mockResolvedValue(undefined);
      await service.anexarDeclaracaoPrestacaoContas(parcelaId, declaracaoUrl);

      expect(mockObrigacoesRepository.anexarDeclaracaoPrestacaoContas).toHaveBeenCalledWith(
        parcelaId,
        declaracaoUrl
      );

      // Step 2: Registrar repasse (agora com declaração)
      const parcelaComDeclaracao = criarParcelaRecebidaMock({
        id: parcelaId,
        declaracaoPrestacaoContasUrl: declaracaoUrl,
        statusRepasse: 'pendente_transferencia',
      });

      mockObrigacoesRepository.buscarParcelaPorId.mockResolvedValue(parcelaComDeclaracao);
      mockObrigacoesRepository.registrarRepasse.mockResolvedValue(undefined);

      const dadosRepasse: RegistrarRepasseParams = {
        arquivoComprovantePath: comprovantePath,
        usuarioRepasseId: 10,
        dataRepasse: '2024-01-22',
      };

      await service.registrarRepasse(parcelaId, dadosRepasse);

      expect(mockObrigacoesRepository.registrarRepasse).toHaveBeenCalledWith(parcelaId, dadosRepasse);
    });
  });
});
