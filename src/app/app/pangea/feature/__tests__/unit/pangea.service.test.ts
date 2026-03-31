import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import {
  criarPangeaBuscaInputMock,
  criarPangeaBuscaResponseMock,
  criarOrgaoDisponivelMock,
} from '../fixtures';

jest.mock('../../repository');

// Mock Supabase service client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn(),
};

jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: jest.fn(() => mockSupabase),
}));

describe('Pangea Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarOrgaosDisponiveis', () => {
    it('deve listar órgãos ativos do banco de dados', async () => {
      // Arrange
      const tribunais = [
        { codigo: 'TST', nome: 'Tribunal Superior do Trabalho', ativo: true },
        { codigo: 'TRT02', nome: 'TRT 2ª Região', ativo: true },
      ];

      mockSupabase.order.mockResolvedValue({ data: tribunais, error: null });

      // Act
      const result = await service.listarOrgaosDisponiveis();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].codigo).toBe('TST');
      expect(mockSupabase.from).toHaveBeenCalledWith('tribunais');
      expect(mockSupabase.eq).toHaveBeenCalledWith('ativo', true);
    });

    it('deve filtrar tribunais não permitidos (TRE*, TSE, TJMS)', async () => {
      // Arrange
      const tribunais = [
        { codigo: 'TST', nome: 'Tribunal Superior do Trabalho', ativo: true },
        { codigo: 'TRE01', nome: 'TRE Acre', ativo: true },
        { codigo: 'TSE', nome: 'Tribunal Superior Eleitoral', ativo: true },
        { codigo: 'TJMS', nome: 'Tribunal de Justiça MS', ativo: true },
        { codigo: 'TRT02', nome: 'TRT 2ª Região', ativo: true },
      ];

      mockSupabase.order.mockResolvedValue({ data: tribunais, error: null });

      // Act
      const result = await service.listarOrgaosDisponiveis();

      // Assert
      expect(result).toHaveLength(2); // Apenas TST e TRT02
      expect(result.find((o) => o.codigo === 'TSE')).toBeUndefined();
      expect(result.find((o) => o.codigo === 'TRE01')).toBeUndefined();
      expect(result.find((o) => o.codigo === 'TJMS')).toBeUndefined();
    });

    it('deve usar cache quando disponível e não expirado', async () => {
      // Arrange
      const tribunais = [criarOrgaoDisponivelMock()];
      mockSupabase.order.mockResolvedValue({ data: [tribunais[0]], error: null });

      // Act - primeira chamada popula o cache
      const result1 = await service.listarOrgaosDisponiveis();

      // Clear mock para verificar que não é chamado novamente
      mockSupabase.from.mockClear();

      // Act - segunda chamada usa cache
      const result2 = await service.listarOrgaosDisponiveis();

      // Assert
      expect(result1).toEqual(result2);
      expect(mockSupabase.from).not.toHaveBeenCalled(); // Cache hit
    });

    it('deve lançar erro quando falha no banco', async () => {
      // Arrange — advance time so any previous cache entry is expired
      const realDateNow = Date.now;
      Date.now = () => realDateNow() + 10 * 60 * 1000; // +10 min

      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      try {
        await expect(service.listarOrgaosDisponiveis()).rejects.toThrow(
          'Erro ao listar tribunais'
        );
      } finally {
        Date.now = realDateNow;
      }
    });
  });

  describe('buscarPrecedentes', () => {
    it('deve buscar precedentes com validação Zod', async () => {
      // Arrange
      const input = criarPangeaBuscaInputMock();
      const response = criarPangeaBuscaResponseMock(2);

      mockSupabase.order.mockResolvedValue({ data: [], error: null });
      (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

      // Act
      const result = await service.buscarPrecedentes(input);

      // Assert
      expect(result).toEqual(response);
      expect(repository.buscarPrecedentesRaw).toHaveBeenCalled();
    });

    it('deve aplicar órgãos padrão quando não fornecidos', async () => {
      // Arrange
      const tribunais = [
        { codigo: 'TST', nome: 'TST', ativo: true },
        { codigo: 'TRT02', nome: 'TRT 2', ativo: true },
      ];

      mockSupabase.order.mockResolvedValue({ data: tribunais, error: null });

      const input = criarPangeaBuscaInputMock({ orgaos: [] });
      const response = criarPangeaBuscaResponseMock();

      (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

      // Act
      await service.buscarPrecedentes(input);

      // Assert
      expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
        filtro: expect.objectContaining({
          orgaos: expect.arrayContaining(['TST', 'TRT02']),
        }),
      });
    });

    it('deve aplicar tipos padrão quando não fornecidos', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const input = criarPangeaBuscaInputMock({ tipos: [] });
      const response = criarPangeaBuscaResponseMock();

      (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

      // Act
      await service.buscarPrecedentes(input);

      // Assert
      expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
        filtro: expect.objectContaining({
          tipos: expect.arrayContaining(['SUM', 'SV', 'RG', 'IAC', 'SIRDR', 'RR', 'CT', 'IRDR', 'IRR', 'PUIL', 'NT', 'OJ']),
        }),
      });
    });

    it('deve converter códigos de tribunal para formato Pangea (TRT1 -> TRT01)', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const input = criarPangeaBuscaInputMock({ orgaos: ['TRT1', 'TRT15'] });
      const response = criarPangeaBuscaResponseMock();

      (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

      // Act
      await service.buscarPrecedentes(input);

      // Assert
      expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
        filtro: expect.objectContaining({
          orgaos: expect.arrayContaining(['TRT01', 'TRT15']),
        }),
      });
    });

    it('deve converter datas de yyyy-mm-dd para dd/mm/yyyy', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const input = criarPangeaBuscaInputMock({
        atualizacaoDesde: '2024-01-15',
        atualizacaoAte: '2024-12-31',
      });
      const response = criarPangeaBuscaResponseMock();

      (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

      // Act
      await service.buscarPrecedentes(input);

      // Assert
      expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
        filtro: expect.objectContaining({
          atualizacaoDesde: '15/01/2024',
          atualizacaoAte: '31/12/2024',
        }),
      });
    });

    it('deve usar tamanhoPagina máximo sempre', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const input = criarPangeaBuscaInputMock({ tamanhoPagina: 100 });
      const response = criarPangeaBuscaResponseMock();

      (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

      // Act
      await service.buscarPrecedentes(input);

      // Assert
      expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
        filtro: expect.objectContaining({
          tamanhoPagina: 10000, // PANGEA_MAX_TAMANHO_PAGINA
          pagina: 1,
        }),
      });
    });

    it('deve lançar erro quando validação Zod falha', async () => {
      // Arrange
      const inputInvalido = {
        buscaGeral: 123, // deve ser string
      };

      // Act & Assert
      await expect(
        service.buscarPrecedentes(inputInvalido as any)
      ).rejects.toThrow();
    });
  });

  describe('toPangeaOrgaoCodigo', () => {
    it('deve adicionar zero à esquerda para códigos de um dígito', () => {
      // Act & Assert
      expect(service.toPangeaOrgaoCodigo('TRT1')).toBe('TRT01');
      expect(service.toPangeaOrgaoCodigo('TRT2')).toBe('TRT02');
      expect(service.toPangeaOrgaoCodigo('TRF3')).toBe('TRF03');
    });

    it('deve manter códigos de dois dígitos', () => {
      // Act & Assert
      expect(service.toPangeaOrgaoCodigo('TRT15')).toBe('TRT15');
      expect(service.toPangeaOrgaoCodigo('TRT24')).toBe('TRT24');
    });

    it('deve normalizar código removendo caracteres especiais', () => {
      // Act & Assert
      expect(service.toPangeaOrgaoCodigo('TRT-1')).toBe('TRT01');
      expect(service.toPangeaOrgaoCodigo('trt 2')).toBe('TRT02');
    });

    it('deve retornar código original quando não é TRT/TRF', () => {
      // Act & Assert
      expect(service.toPangeaOrgaoCodigo('TST')).toBe('TST');
      expect(service.toPangeaOrgaoCodigo('STF')).toBe('STF');
    });
  });
});
