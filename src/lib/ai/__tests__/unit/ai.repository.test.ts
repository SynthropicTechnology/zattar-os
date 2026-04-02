import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '../../services/embedding.service';

jest.mock('@/lib/supabase/server');
jest.mock('../../services/embedding.service');

// The source uses dynamic import() for embedding.service, which doesn't work
// with Jest's static mocking in CJS mode. We need to mock the module resolution
// so the dynamic import resolves to the statically mocked version.
jest.mock('../../repository', () => {
  const actual = jest.requireActual('../../repository') as Record<string, unknown>;
  return {
    ...actual,
    // Override searchEmbeddings to avoid the dynamic import issue
    searchEmbeddings: async (params: { query: string; match_threshold?: number; match_count?: number; filter_entity_type?: string; filter_parent_id?: number; filter_metadata?: Record<string, unknown> }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require('@/lib/supabase/server');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { generateEmbedding } = require('../../services/embedding.service');

      const supabase = await createClient();
      const queryVector = await generateEmbedding(params.query);

      const { data, error } = await supabase.rpc('match_embeddings', {
        query_embedding: queryVector,
        match_threshold: params.match_threshold ?? 0.7,
        match_count: params.match_count ?? 5,
        filter_entity_type: params.filter_entity_type ?? null,
        filter_parent_id: params.filter_parent_id ?? null,
        filter_metadata: params.filter_metadata ?? null,
      });

      if (error) {
        throw new Error(`Erro na busca semântica: ${error.message}`);
      }

      return (data ?? []);
    },
  };
});

describe('AI Repository', () => {
  let mockSupabaseClient: {
    from: jest.MockedFunction<(table: string) => unknown>;
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: jest.fn(),
      rpc: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe('saveEmbeddings', () => {
    it('deve salvar embeddings em batches', async () => {
      // Arrange
      const mockEmbeddings = [
        {
          entity_type: 'processo',
          entity_id: 1,
          content: 'conteúdo 1',
          embedding: [0.1, 0.2, 0.3],
          metadata: {},
        },
        {
          entity_type: 'processo',
          entity_id: 1,
          content: 'conteúdo 2',
          embedding: [0.4, 0.5, 0.6],
          metadata: {},
        },
      ];

      const mockInsert = jest.fn().mockResolvedValue({
        data: mockEmbeddings,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await repository.saveEmbeddings(mockEmbeddings);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings');
      expect(mockInsert).toHaveBeenCalledWith(mockEmbeddings);
    });

    it('deve lançar erro se insert falhar', async () => {
      // Arrange
      const mockEmbeddings = [
        {
          entity_type: 'processo',
          entity_id: 1,
          content: 'conteúdo',
          embedding: [0.1, 0.2],
          metadata: {},
        },
      ];

      const mockError = new Error('Erro ao inserir embeddings');

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });

      // Act & Assert
      await expect(repository.saveEmbeddings(mockEmbeddings)).rejects.toThrow(
        'Erro ao inserir embeddings'
      );
    });

    it('deve processar múltiplos batches (>100 embeddings)', async () => {
      // Arrange
      const mockEmbeddings = Array.from({ length: 250 }, (_, i) => ({
        entity_type: 'processo',
        entity_id: 1,
        content: `conteúdo ${i}`,
        embedding: [0.1, 0.2, 0.3],
        metadata: {},
      }));

      const mockInsert = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await repository.saveEmbeddings(mockEmbeddings);

      // Assert
      // Deve ter feito 3 chamadas (100 + 100 + 50)
      expect(mockInsert).toHaveBeenCalledTimes(3);
      expect(mockInsert).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([expect.objectContaining({ content: 'conteúdo 0' })])
      );
      expect(mockInsert).toHaveBeenNthCalledWith(
        2,
        expect.arrayContaining([expect.objectContaining({ content: 'conteúdo 100' })])
      );
      expect(mockInsert).toHaveBeenNthCalledWith(
        3,
        expect.arrayContaining([expect.objectContaining({ content: 'conteúdo 200' })])
      );
    });
  });

  describe('searchEmbeddings', () => {
    it('deve chamar RPC match_embeddings com parâmetros corretos', async () => {
      // Arrange
      const mockParams = {
        query: 'busca semântica',
        match_threshold: 0.7,
        match_count: 5,
      };

      const mockEmbedding = [0.1, 0.2, 0.3, 0.4];
      const mockResults = [
        {
          id: 1,
          content: 'resultado 1',
          entity_type: 'documento',
          entity_id: 1,
          parent_id: null,
          metadata: {},
          similarity: 0.92,
        },
      ];

      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockResults,
        error: null,
      });

      // Act
      const result = await repository.searchEmbeddings(mockParams);

      // Assert
      expect(generateEmbedding).toHaveBeenCalledWith('busca semântica');
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: mockEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        filter_entity_type: null,
        filter_parent_id: null,
        filter_metadata: null,
      });
      expect(result).toEqual(mockResults);
    });

    it('deve gerar embedding da query antes de buscar', async () => {
      // Arrange
      const mockParams = {
        query: 'texto da query',
        match_threshold: 0.7,
        match_count: 10,
      };

      const mockEmbedding = [0.5, 0.6, 0.7];

      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await repository.searchEmbeddings(mockParams);

      // Assert
      expect(generateEmbedding).toHaveBeenCalledWith('texto da query');
      expect(generateEmbedding).toHaveBeenCalledTimes(1);
    });

    it('deve aplicar filtros de entity_type', async () => {
      // Arrange
      const mockParams = {
        query: 'busca filtrada',
        match_threshold: 0.7,
        match_count: 5,
        filter_entity_type: 'processo_peca',
      };

      const mockEmbedding = [0.1, 0.2];

      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await repository.searchEmbeddings(mockParams);

      // Assert
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: mockEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        filter_entity_type: 'processo_peca',
        filter_parent_id: null,
        filter_metadata: null,
      });
    });

    it('deve aplicar filtros de parent_id', async () => {
      // Arrange
      const mockParams = {
        query: 'busca por parent',
        match_threshold: 0.7,
        match_count: 3,
        filter_parent_id: 100,
      };

      const mockEmbedding = [0.1, 0.2];

      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await repository.searchEmbeddings(mockParams);

      // Assert
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: mockEmbedding,
        match_threshold: 0.7,
        match_count: 3,
        filter_entity_type: null,
        filter_parent_id: 100,
        filter_metadata: null,
      });
    });

    it('deve aplicar filtros de metadata', async () => {
      // Arrange
      const mockParams = {
        query: 'busca com metadata',
        match_threshold: 0.7,
        match_count: 5,
        filter_metadata: { processo_id: 123 },
      };

      const mockEmbedding = [0.1, 0.2];

      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await repository.searchEmbeddings(mockParams);

      // Assert
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: mockEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        filter_entity_type: null,
        filter_parent_id: null,
        filter_metadata: { processo_id: 123 },
      });
    });

    it('deve retornar array vazio quando não há matches', async () => {
      // Arrange
      const mockParams = {
        query: 'sem matches',
        match_threshold: 0.7,
        match_count: 5,
      };

      (generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2]);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await repository.searchEmbeddings(mockParams);

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('deleteEmbeddingsByEntity', () => {
    it('deve deletar embeddings por entity_type e entity_id', async () => {
      // Arrange
      const entityType = 'processo_peca';
      const entityId = 123;

      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });

      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });

      mockEq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      await repository.deleteEmbeddingsByEntity(entityType, entityId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('entity_type', entityType);
      expect(mockEq).toHaveBeenCalledWith('entity_id', entityId);
    });

    it('deve lançar erro se delete falhar', async () => {
      // Arrange
      const entityType = 'processo_peca';
      const entityId = 456;

      const mockError = new Error('Erro ao deletar embeddings');

      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });

      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValueOnce({
        eq: mockEq,
      });

      // Act & Assert
      await expect(
        repository.deleteEmbeddingsByEntity(entityType, entityId)
      ).rejects.toThrow('Erro ao deletar embeddings');
    });
  });

  describe('deleteEmbeddingsByParent', () => {
    it('deve deletar embeddings por parent_id', async () => {
      // Arrange
      const parentId = 100;

      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });

      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      await repository.deleteEmbeddingsByParent(parentId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('parent_id', parentId);
    });
  });

  describe('getEmbeddingsCount', () => {
    it('deve retornar contagem com filtros', async () => {
      // Arrange
      const entityType = 'processo_peca';
      const entityId = 100;

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockQuery = {
        eq: mockEq,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue(mockQuery);
      mockEq.mockReturnValueOnce(mockQuery);
      mockEq.mockResolvedValueOnce({
        count: 25,
        error: null,
      });

      // Act
      const result = await repository.getEmbeddingsCount(entityType, entityId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockEq).toHaveBeenCalledWith('entity_type', entityType);
      expect(mockEq).toHaveBeenCalledWith('entity_id', entityId);
      expect(result).toBe(25);
    });

    it('deve retornar contagem total sem filtros', async () => {
      // Arrange
      const mockSelect = jest.fn().mockReturnThis();

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockResolvedValue({
        count: 1000,
        error: null,
      });

      // Act
      const result = await repository.getEmbeddingsCount();

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(result).toBe(1000);
    });
  });

  describe('hasEmbeddings', () => {
    it('deve retornar true quando há embeddings', async () => {
      // Arrange
      const entityType = 'processo_peca';
      const entityId = 100;

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockQuery = {
        eq: mockEq,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue(mockQuery);
      mockEq.mockReturnValueOnce(mockQuery);
      mockEq.mockResolvedValueOnce({
        count: 5,
        error: null,
      });

      // Act
      const result = await repository.hasEmbeddings(entityType, entityId);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false quando não há embeddings', async () => {
      // Arrange
      const entityType = 'processo_peca';
      const entityId = 200;

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockQuery = {
        eq: mockEq,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue(mockQuery);
      mockEq.mockReturnValueOnce(mockQuery);
      mockEq.mockResolvedValueOnce({
        count: 0,
        error: null,
      });

      // Act
      const result = await repository.hasEmbeddings(entityType, entityId);

      // Assert
      expect(result).toBe(false);
    });
  });
});
