import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as aiService from '../../service';
import * as repository from '../../repository';
import * as indexingService from '../../services/indexing.service';

jest.mock('../../repository');
jest.mock('../../services/indexing.service');

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchKnowledge', () => {
    it('deve buscar embeddings com sucesso', async () => {
      // Arrange
      const mockParams = {
        query: 'teste de busca semântica',
        match_threshold: 0.7,
        match_count: 5,
      };
      const mockResults = [
        {
          id: 1,
          content: 'resultado 1',
          entity_type: 'processo' as const,
          entity_id: 1,
          parent_id: null,
          metadata: {},
          similarity: 0.95,
        },
        {
          id: 2,
          content: 'resultado 2',
          entity_type: 'processo' as const,
          entity_id: 2,
          parent_id: null,
          metadata: {},
          similarity: 0.87,
        },
      ];

      (repository.searchEmbeddings as jest.Mock).mockResolvedValue(
        mockResults
      );

      // Act
      const result = await aiService.searchKnowledge(mockParams);

      // Assert
      expect(result).toEqual(mockResults);
      expect(repository.searchEmbeddings).toHaveBeenCalledWith(mockParams);
      expect(repository.searchEmbeddings).toHaveBeenCalledTimes(1);
    });

    it('deve passar parâmetros corretos para repository', async () => {
      // Arrange
      const mockParams = {
        query: 'busca com filtros',
        match_threshold: 0.7,
        match_count: 10,
        filter_entity_type: 'processo' as const,
        filter_parent_id: 123,
      };

      (repository.searchEmbeddings as jest.Mock).mockResolvedValue([]);

      // Act
      await aiService.searchKnowledge(mockParams);

      // Assert
      expect(repository.searchEmbeddings).toHaveBeenCalledWith({
        query: 'busca com filtros',
        match_threshold: 0.7,
        match_count: 10,
        filter_entity_type: 'processo',
        filter_parent_id: 123,
      });
    });

    it('deve retornar array vazio quando não há resultados', async () => {
      // Arrange
      const mockParams = {
        query: 'sem resultados',
        match_threshold: 0.7,
        match_count: 5,
      };

      (repository.searchEmbeddings as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await aiService.searchKnowledge(mockParams);

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('indexDocument', () => {
    it('deve indexar documento com sucesso', async () => {
      // Arrange
      const mockDocument = {
        entity_type: 'processo' as const,
        entity_id: 100,
        storage_provider: 'supabase' as const,
        storage_key: 'documents/processo-100.pdf',
        content_type: 'application/pdf',
      };

      (indexingService.indexDocument as jest.Mock).mockResolvedValue(
        undefined
      );

      // Act
      await aiService.indexDocument(mockDocument);

      // Assert
      expect(indexingService.indexDocument).toHaveBeenCalledWith(mockDocument);
    });

    it('deve chamar indexing service com parâmetros corretos', async () => {
      // Arrange
      const mockDocument = {
        entity_type: 'documento' as const,
        entity_id: 200,
        storage_provider: 'backblaze' as const,
        storage_key: 'uploads/peticao-inicial.pdf',
        content_type: 'application/pdf',
        metadata: {
          titulo: 'Petição Inicial',
        },
      };

      (indexingService.indexDocument as jest.Mock).mockResolvedValue(
        undefined
      );

      // Act
      await aiService.indexDocument(mockDocument);

      // Assert
      expect(indexingService.indexDocument).toHaveBeenCalledWith({
        entity_type: 'documento',
        entity_id: 200,
        storage_provider: 'backblaze',
        storage_key: 'uploads/peticao-inicial.pdf',
        content_type: 'application/pdf',
        metadata: {
          titulo: 'Petição Inicial',
        },
      });
      expect(indexingService.indexDocument).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteEmbeddings', () => {
    it('deve deletar embeddings por entidade', async () => {
      // Arrange
      const entityType = 'processo';
      const entityId = 123;

      (repository.deleteEmbeddingsByEntity as jest.Mock).mockResolvedValue(
        undefined
      );

      // Act
      await aiService.deleteEmbeddings(entityType, entityId);

      // Assert
      expect(repository.deleteEmbeddingsByEntity).toHaveBeenCalledWith(
        entityType,
        entityId
      );
    });

    it('deve deletar embeddings por parent', async () => {
      // Arrange
      const parentId = 456;

      (repository.deleteEmbeddingsByParent as jest.Mock).mockResolvedValue(
        undefined
      );

      // Act
      await aiService.deleteEmbeddingsByParent(parentId);

      // Assert
      expect(repository.deleteEmbeddingsByParent).toHaveBeenCalledWith(
        parentId
      );
    });
  });

  describe('isIndexed', () => {
    it('deve retornar true quando entidade está indexada', async () => {
      // Arrange
      const entityType = 'processo';
      const entityId = 100;

      (repository.hasEmbeddings as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await aiService.isIndexed(entityType, entityId);

      // Assert
      expect(result).toBe(true);
      expect(repository.hasEmbeddings).toHaveBeenCalledWith(
        entityType,
        entityId
      );
    });

    it('deve retornar false quando entidade não está indexada', async () => {
      // Arrange
      const entityType = 'processo';
      const entityId = 200;

      (repository.hasEmbeddings as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await aiService.isIndexed(entityType, entityId);

      // Assert
      expect(result).toBe(false);
      expect(repository.hasEmbeddings).toHaveBeenCalledWith(
        entityType,
        entityId
      );
    });
  });

  describe('getEmbeddingsCount', () => {
    it('deve retornar contagem total', async () => {
      // Arrange
      (repository.getEmbeddingsCount as jest.Mock).mockResolvedValue(1000);

      // Act
      const result = await aiService.getEmbeddingsCount();

      // Assert
      expect(result).toBe(1000);
      expect(repository.getEmbeddingsCount).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });

    it('deve retornar contagem por entidade', async () => {
      // Arrange
      const entityType = 'processo';

      (repository.getEmbeddingsCount as jest.Mock).mockResolvedValue(150);

      // Act
      const result = await aiService.getEmbeddingsCount(entityType);

      // Assert
      expect(result).toBe(150);
      expect(repository.getEmbeddingsCount).toHaveBeenCalledWith(
        entityType,
        undefined
      );
    });

    it('deve retornar contagem por entidade e ID', async () => {
      // Arrange
      const entityType = 'processo';
      const entityId = 300;

      (repository.getEmbeddingsCount as jest.Mock).mockResolvedValue(8);

      // Act
      const result = await aiService.getEmbeddingsCount(entityType, entityId);

      // Assert
      expect(result).toBe(8);
      expect(repository.getEmbeddingsCount).toHaveBeenCalledWith(
        entityType,
        entityId
      );
    });
  });
});
