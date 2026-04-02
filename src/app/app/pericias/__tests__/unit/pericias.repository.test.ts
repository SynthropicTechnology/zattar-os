import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import { criarPericiaMock } from '../fixtures';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  is: jest.fn(() => mockSupabaseClient),
  or: jest.fn(() => mockSupabaseClient),
  gte: jest.fn(() => mockSupabaseClient),
  lt: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
  maybeSingle: jest.fn(),
};

jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn(() => mockSupabaseClient),
}));

describe('Perícias Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllPericias', () => {
    it('deve buscar todas as perícias com paginação', async () => {
      // Arrange
      const pericias = [
        criarPericiaMock({ id: 1 }),
        criarPericiaMock({ id: 2 }),
      ];

      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: pericias,
        error: null,
        count: 2,
      });

      // Act
      const result = await repository.findAllPericias({
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pericias');
      expect(mockSupabaseClient.select).toHaveBeenCalled();
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('prazo_entrega', {
        ascending: true,
      });
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 49);
    });

    it('deve aplicar filtro de busca', async () => {
      // Arrange
      mockSupabaseClient.or.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await repository.findAllPericias({
        busca: 'João Silva',
      });

      // Assert
      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        expect.stringContaining('João Silva')
      );
    });

    it('deve aplicar filtros de trt, grau e situação', async () => {
      // Arrange
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await repository.findAllPericias({
        trt: '02',
        grau: 'primeiro_grau',
        situacaoCodigo: 'L',
      });

      // Assert
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('trt', '02');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('grau', 'primeiro_grau');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('situacao_codigo', 'L');
    });

    it('deve filtrar por responsável específico', async () => {
      // Arrange
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await repository.findAllPericias({
        responsavelId: 5,
      });

      // Assert
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('responsavel_id', 5);
    });

    it('deve filtrar por sem responsável (null)', async () => {
      // Arrange
      mockSupabaseClient.is.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await repository.findAllPericias({
        responsavelId: 'null',
      });

      // Assert
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('responsavel_id', null);
    });

    it('deve filtrar por range de prazo de entrega', async () => {
      // Arrange
      mockSupabaseClient.gte.mockReturnThis();
      mockSupabaseClient.lt.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await repository.findAllPericias({
        prazoEntregaInicio: '2024-01-01',
        prazoEntregaFim: '2024-12-31',
      });

      // Assert
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('prazo_entrega', '2024-01-01');
      expect(mockSupabaseClient.lt).toHaveBeenCalledWith('prazo_entrega', '2025-01-01'); // Próximo dia
    });

    it('deve filtrar por filtros booleanos', async () => {
      // Arrange
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await repository.findAllPericias({
        laudoJuntado: true,
        segredoJustica: false,
        prioridadeProcessual: true,
        arquivado: false,
      });

      // Assert
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('laudo_juntado', true);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('segredo_justica', false);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('prioridade_processual', true);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('arquivado', false);
    });

    it('deve retornar erro de banco de dados', async () => {
      // Arrange
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        error: { message: 'database error', code: '500' },
        count: null,
      });

      // Act
      const result = await repository.findAllPericias({});

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('findPericiaById', () => {
    it('deve buscar perícia por ID com joins', async () => {
      // Arrange
      const pericia = criarPericiaMock({ id: 1 });

      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: pericia,
        error: null,
      });

      // Act
      const result = await repository.findPericiaById(1);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pericias');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 1);
      expect(mockSupabaseClient.maybeSingle).toHaveBeenCalled();
    });

    it('deve retornar null quando perícia não encontrada', async () => {
      // Arrange
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await repository.findPericiaById(999);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('deve retornar erro ao falhar busca', async () => {
      // Arrange
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'database error', code: '500' },
      });

      // Act
      const result = await repository.findPericiaById(1);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('atribuirResponsavelPericia', () => {
    it('deve atribuir responsável e atualizar updated_at', async () => {
      // Arrange
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockResolvedValue({
        error: null,
      });

      // Act
      const result = await repository.atribuirResponsavelPericia(1, 5);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          responsavel_id: 5,
          updated_at: expect.any(String),
        })
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 1);
    });

    it('deve retornar erro ao falhar atualização', async () => {
      // Arrange
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockResolvedValue({
        error: { message: 'database error', code: '500' },
      });

      // Act
      const result = await repository.atribuirResponsavelPericia(1, 5);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('adicionarObservacaoPericia', () => {
    it('deve adicionar observação e atualizar updated_at', async () => {
      // Arrange
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockResolvedValue({
        error: null,
      });

      // Act
      const result = await repository.adicionarObservacaoPericia(
        1,
        'Nova observação'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          observacoes: 'Nova observação',
          updated_at: expect.any(String),
        })
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 1);
    });
  });

  describe('listEspecialidadesPericia', () => {
    it('deve listar especialidades ativas ordenadas', async () => {
      // Arrange
      const especialidades = [
        { id: 1, descricao: 'Medicina do Trabalho' },
        { id: 2, descricao: 'Engenharia de Segurança' },
      ];

      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.limit.mockResolvedValue({
        data: especialidades,
        error: null,
      });

      // Act
      const result = await repository.listEspecialidadesPericia();

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('especialidades_pericia');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('ativo', true);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('descricao', {
        ascending: true,
      });
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(500);
    });

    it('deve retornar array vazio quando não há dados', async () => {
      // Arrange
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.limit.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await repository.listEspecialidadesPericia();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});
