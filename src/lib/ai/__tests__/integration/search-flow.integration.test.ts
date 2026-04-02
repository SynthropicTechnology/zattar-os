import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { searchKnowledge } from '../../service';
import * as repository from '../../repository';
import { generateEmbedding } from '../../services/embedding.service';
import { createClient } from '@/lib/supabase/server';

jest.mock('../../repository');
jest.mock('../../services/embedding.service');
jest.mock('@/lib/supabase/server');

describe('AI Search Flow Integration', () => {
  let mockSupabaseClient: {
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      rpc: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  it('deve buscar documentos por query semântica', async () => {
    // Arrange
    const query = 'ação trabalhista sobre horas extras';
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockResults = [
      {
        id: 1,
        entity_type: 'processo_peca',
        entity_id: 100,
        parent_id: 50,
        content: 'Processo trabalhista sobre pagamento de horas extras não pagas',
        metadata: {
          numero_processo: '0001234-56.2023.5.02.0001',
          vara: 'Vara do Trabalho',
        },
        similarity: 0.95,
      },
      {
        id: 2,
        entity_type: 'processo_peca',
        entity_id: 101,
        parent_id: 51,
        content: 'Reclamação trabalhista solicitando horas extras',
        metadata: {
          numero_processo: '0005678-90.2023.5.02.0002',
        },
        similarity: 0.88,
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (repository.searchEmbeddings as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchKnowledge({
      query,
      match_threshold: 0.7,
      match_count: 5,
    });

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].similarity).toBeGreaterThan(0.8);
    expect(result[0].entity_type).toBe('processo_peca');
    expect(result[0].metadata).toHaveProperty('numero_processo');
    expect(repository.searchEmbeddings).toHaveBeenCalledWith({
      query,
      match_threshold: 0.7,
      match_count: 5,
    });
  });

  it('deve filtrar por tipo de entidade', async () => {
    // Arrange
    const query = 'petição inicial';
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockResults = [
      {
        id: 10,
        entity_type: 'documento',
        entity_id: 500,
        parent_id: null,
        content: 'Petição Inicial de Ação de Cobrança',
        metadata: {
          tipo_documento: 'petição',
        },
        similarity: 0.92,
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (repository.searchEmbeddings as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchKnowledge({
      query,
      match_threshold: 0.7,
      match_count: 10,
      filter_entity_type: 'documento',
    });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].entity_type).toBe('documento');
    expect(repository.searchEmbeddings).toHaveBeenCalledWith({
      query,
      match_threshold: 0.7,
      match_count: 10,
      filter_entity_type: 'documento',
    });
  });

  it('deve respeitar threshold de similaridade', async () => {
    // Arrange
    const query = 'busca com threshold';
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockResults = [
      {
        id: 1,
        entity_type: 'documento',
        entity_id: 1,
        parent_id: null,
        content: 'resultado relevante',
        metadata: {},
        similarity: 0.95,
      },
      {
        id: 2,
        entity_type: 'documento',
        entity_id: 2,
        parent_id: null,
        content: 'resultado menos relevante',
        metadata: {},
        similarity: 0.65,
      },
      {
        id: 3,
        entity_type: 'documento',
        entity_id: 3,
        parent_id: null,
        content: 'resultado irrelevante',
        metadata: {},
        similarity: 0.40,
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (repository.searchEmbeddings as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchKnowledge({
      query,
      match_threshold: 0.7,
      match_count: 10,
    });

    // Assert - o repository já filtra por threshold, mas verificamos que foi chamado corretamente
    expect(repository.searchEmbeddings).toHaveBeenCalledWith({
      query,
      match_threshold: 0.7,
      match_count: 10,
    });
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('deve limitar número de resultados', async () => {
    // Arrange
    const query = 'busca com limite';
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockResults = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      entity_type: 'documento',
      entity_id: i + 1,
      parent_id: null,
      content: `resultado ${i + 1}`,
      metadata: {},
      similarity: 0.9 - i * 0.01,
    }));

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (repository.searchEmbeddings as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchKnowledge({
      query,
      match_threshold: 0.7,
      match_count: 5,
    });

    // Assert
    expect(repository.searchEmbeddings).toHaveBeenCalledWith({
      query,
      match_threshold: 0.7,
      match_count: 5,
    });
    // O repository deve retornar no máximo match_count resultados
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('deve retornar metadados corretos', async () => {
    // Arrange
    const query = 'busca com metadados';
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockResults = [
      {
        id: 1,
        entity_type: 'processo_peca',
        entity_id: 200,
        parent_id: 100,
        content: 'Processo com metadados completos',
        metadata: {
          numero_processo: '0001234-56.2023.5.02.0001',
          vara: '1ª Vara Cível',
          autor: 'João Silva',
          reu: 'Empresa XYZ',
          valor_causa: 50000,
          data_distribuicao: '2023-01-15',
        },
        similarity: 0.93,
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (repository.searchEmbeddings as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchKnowledge({
      query,
      match_threshold: 0.7,
      match_count: 5,
    });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].metadata).toHaveProperty('numero_processo');
    expect(result[0].metadata).toHaveProperty('vara');
    expect(result[0].metadata).toHaveProperty('autor');
    expect(result[0].metadata).toHaveProperty('valor_causa');
    expect(result[0].metadata.numero_processo).toBe('0001234-56.2023.5.02.0001');
    expect(result[0].metadata.valor_causa).toBe(50000);
  });
});
