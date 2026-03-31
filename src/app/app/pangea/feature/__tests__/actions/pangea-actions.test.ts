/**
 * Tests for Pangea Server Actions
 *
 * Tests real exported actions with mocked service layer and auth
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  criarOrgaoDisponivelMock,
  criarPangeaBuscaInputMock,
  criarPangeaBuscaResponseMock,
} from '../fixtures';

// Import REAL actions
import {
  actionListarOrgaosPangeaDisponiveis,
  actionBuscarPrecedentesPangea,
} from '../../actions/pangea-actions';

// Mock service layer — use getter to avoid hoisting issue
jest.mock('../../service', () => ({
  get listarOrgaosDisponiveis() { return mockService.listarOrgaosDisponiveis; },
  get buscarPrecedentes() { return mockService.buscarPrecedentes; },
}));

const mockService = {
  listarOrgaosDisponiveis: jest.fn(),
  buscarPrecedentes: jest.fn(),
};

// Mock auth utility — use getter to avoid hoisting issue
jest.mock('@/features/usuarios/actions/utils', () => ({
  get requireAuth() {
    return mockRequireAuth;
  },
}));
const mockRequireAuth = jest.fn();

describe('Pangea Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock auth to succeed by default
    mockRequireAuth.mockResolvedValue({ userId: 1 });
  });

  describe('actionListarOrgaosPangeaDisponiveis', () => {
    it('deve listar órgãos com autenticação', async () => {
      // Arrange
      const orgaos = [
        criarOrgaoDisponivelMock({ codigo: 'TST' }),
        criarOrgaoDisponivelMock({ codigo: 'TRT02' }),
      ];
      mockService.listarOrgaosDisponiveis.mockResolvedValue(orgaos);

      // Act
      const result = await actionListarOrgaosPangeaDisponiveis();

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledWith(['pangea:listar']);
      expect(mockService.listarOrgaosDisponiveis).toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(orgaos);
        expect(result.data).toHaveLength(2);
      }
    });

    it('deve retornar erro quando não autenticado', async () => {
      // Arrange
      mockRequireAuth.mockRejectedValue(new Error('Não autorizado'));

      // Act
      const result = await actionListarOrgaosPangeaDisponiveis();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Não autorizado');
      }
      expect(mockService.listarOrgaosDisponiveis).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.listarOrgaosDisponiveis.mockRejectedValue(
        new Error('Erro ao buscar órgãos')
      );

      // Act
      const result = await actionListarOrgaosPangeaDisponiveis();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao buscar órgãos');
      }
    });

    it('deve retornar lista vazia quando não há órgãos', async () => {
      // Arrange
      mockService.listarOrgaosDisponiveis.mockResolvedValue([]);

      // Act
      const result = await actionListarOrgaosPangeaDisponiveis();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('actionBuscarPrecedentesPangea', () => {
    it('deve buscar precedentes com autenticação', async () => {
      // Arrange
      const input = criarPangeaBuscaInputMock({
        buscaGeral: 'intervalo intrajornada',
        orgaos: ['TST'],
      });

      const response = criarPangeaBuscaResponseMock(5);
      mockService.buscarPrecedentes.mockResolvedValue(response);

      // Act
      const result = await actionBuscarPrecedentesPangea(input);

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledWith(['pangea:listar']);
      expect(mockService.buscarPrecedentes).toHaveBeenCalledWith(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(response);
        expect(result.data.resultados).toHaveLength(5);
      }
    });

    it('deve retornar erro quando não autenticado', async () => {
      // Arrange
      mockRequireAuth.mockRejectedValue(new Error('Não autorizado'));

      const input = criarPangeaBuscaInputMock();

      // Act
      const result = await actionBuscarPrecedentesPangea(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Não autorizado');
      }
      expect(mockService.buscarPrecedentes).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      const input = criarPangeaBuscaInputMock();
      mockService.buscarPrecedentes.mockRejectedValue(
        new Error('Erro ao buscar precedentes no Pangea')
      );

      // Act
      const result = await actionBuscarPrecedentesPangea(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao buscar precedentes no Pangea');
      }
    });

    it('deve aceitar filtros complexos', async () => {
      // Arrange
      const input = criarPangeaBuscaInputMock({
        buscaGeral: 'teste',
        todasPalavras: 'palavra1 palavra2',
        quaisquerPalavras: 'palavra3',
        semPalavras: 'excluir',
        trechoExato: 'trecho literal',
        atualizacaoDesde: '2024-01-01',
        atualizacaoAte: '2024-12-31',
        cancelados: true,
        ordenacao: 'ChronologicalDesc',
        nr: '123',
        orgaos: ['TST', 'TRT02'],
        tipos: ['SUM', 'SV'],
      });

      const response = criarPangeaBuscaResponseMock(10);
      mockService.buscarPrecedentes.mockResolvedValue(response);

      // Act
      const result = await actionBuscarPrecedentesPangea(input);

      // Assert
      expect(mockService.buscarPrecedentes).toHaveBeenCalledWith(input);
      expect(result.success).toBe(true);
    });

    it('deve retornar resultados vazios quando não há precedentes', async () => {
      // Arrange
      const input = criarPangeaBuscaInputMock({
        buscaGeral: 'termo inexistente',
      });

      const response = criarPangeaBuscaResponseMock(0);
      mockService.buscarPrecedentes.mockResolvedValue(response);

      // Act
      const result = await actionBuscarPrecedentesPangea(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resultados).toEqual([]);
        expect(result.data.total).toBe(0);
      }
    });

    it('deve preservar agregações nos resultados', async () => {
      // Arrange
      const input = criarPangeaBuscaInputMock();
      const response = criarPangeaBuscaResponseMock(2);

      response.aggsEspecies = [
        { tipo: 'SUM', total: 10 },
        { tipo: 'SV', total: 5 },
      ];
      response.aggsOrgaos = [
        { tipo: 'TST', total: 15 },
      ];

      mockService.buscarPrecedentes.mockResolvedValue(response);

      // Act
      const result = await actionBuscarPrecedentesPangea(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.aggsEspecies).toHaveLength(2);
        expect(result.data.aggsOrgaos).toHaveLength(1);
        expect(result.data.aggsEspecies[0].total).toBe(10);
      }
    });

    it('deve preservar highlight nos resultados', async () => {
      // Arrange
      const input = criarPangeaBuscaInputMock({ buscaGeral: 'intervalo' });
      const response = criarPangeaBuscaResponseMock(1);

      response.resultados[0].highlight = {
        tese: '<em>intervalo</em> intrajornada',
      };

      mockService.buscarPrecedentes.mockResolvedValue(response);

      // Act
      const result = await actionBuscarPrecedentesPangea(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resultados[0].highlight).toBeDefined();
        expect(result.data.resultados[0].highlight?.tese).toContain('intervalo');
      }
    });

    it('deve lidar com erro de validação de API externa', async () => {
      // Arrange
      const input = criarPangeaBuscaInputMock();

      mockService.buscarPrecedentes.mockRejectedValue(
        new Error('Resposta do Pangea em formato inesperado')
      );

      // Act
      const result = await actionBuscarPrecedentesPangea(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Resposta do Pangea');
      }
    });
  });
});
