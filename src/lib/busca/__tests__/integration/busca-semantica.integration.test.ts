import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { actionBuscaSemantica, actionBuscaHibrida } from '../../actions/busca-actions';
import * as retrieval from '@/lib/ai/retrieval';
import { authenticatedAction } from '@/lib/safe-action';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/services/embedding.service';

jest.mock('@/lib/safe-action');
jest.mock('@/lib/ai/retrieval');
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/ai/services/embedding.service');

describe('Busca Semântica Integration', () => {
  let mockSupabaseClient: {
    from: jest.MockedFunction<(table: string) => unknown>;
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      from: jest.fn(),
      rpc: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);

    // Mock authenticatedAction to always authenticate
    const mockAuthAction = jest.fn((schema, handler) => {
      return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
    });

    (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);
  });

  it('deve buscar processos por query natural', async () => {
    // Arrange
    const query = 'processos trabalhistas sobre demissão sem justa causa';

    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockProcessos = [
      {
        id: 1,
        texto:
          'Reclamação trabalhista - Demissão sem justa causa - Pedido de indenização',
        metadata: {
          tipo: 'processo',
          id: 100,
          processoId: 100,
          numeroProcesso: '0001234-56.2023.5.02.0001',
          autor: 'João Silva',
          reu: 'Empresa ABC Ltda',
          vara: '1ª Vara do Trabalho',
          data_distribuicao: '2023-06-15',
        },
        similaridade: 0.94,
      },
      {
        id: 2,
        texto:
          'Ação trabalhista sobre dispensa imotivada e pedido de reintegração',
        metadata: {
          tipo: 'processo',
          id: 101,
          processoId: 101,
          numeroProcesso: '0005678-90.2023.5.02.0002',
          autor: 'Maria Santos',
          reu: 'Empresa XYZ S/A',
          vara: '2ª Vara do Trabalho',
        },
        similaridade: 0.89,
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (retrieval.buscaSemantica as jest.Mock).mockResolvedValue(mockProcessos);

    // Act
    const result = await actionBuscaSemantica({
      query,
      limite: 10,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.resultados).toHaveLength(2);
    expect(result.data.resultados[0].tipo).toBe('processo');
    expect(result.data.resultados[0].similaridade).toBeGreaterThan(0.85);
    expect(result.data.resultados[0].numeroProcesso).toBe('0001234-56.2023.5.02.0001');
    expect(retrieval.buscaSemantica).toHaveBeenCalledWith(query, {
      limite: 10,
      threshold: 0.7,
      filtros: {},
    });
  });

  it('deve buscar documentos por similaridade', async () => {
    // Arrange
    const query = 'petições iniciais de ação de cobrança';

    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockDocumentos = [
      {
        id: 10,
        texto: 'Petição Inicial - Ação de Cobrança - Honorários Advocatícios',
        metadata: {
          tipo: 'documento',
          id: 500,
          processoId: 100,
          tipo_documento: 'petição',
          data_criacao: '2023-05-20',
        },
        similaridade: 0.96,
      },
      {
        id: 11,
        texto: 'Inicial de Cobrança - Valores não pagos por serviços prestados',
        metadata: {
          tipo: 'documento',
          id: 501,
          processoId: 101,
          tipo_documento: 'petição',
        },
        similaridade: 0.91,
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (retrieval.buscaSemantica as jest.Mock).mockResolvedValue(mockDocumentos);

    // Act
    const result = await actionBuscaSemantica({
      query,
      tipo: 'documento',
      limite: 5,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.resultados).toHaveLength(2);
    expect(result.data.resultados[0].tipo).toBe('documento');
    expect(retrieval.buscaSemantica).toHaveBeenCalledWith(query, {
      limite: 5,
      threshold: 0.7,
      filtros: { tipo: 'documento' },
    });
  });

  it('deve combinar busca semântica com filtros', async () => {
    // Arrange
    const query = 'acordos trabalhistas com valor superior a 50 mil';

    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

    const mockAcordos = [
      {
        id: 20,
        texto: 'Acordo trabalhista - Valor total: R$ 75.000,00',
        metadata: {
          tipo: 'processo',
          id: 1000,
          processoId: 100,
          valor_total: 75000,
          numero_parcelas: 5,
          status: 'ativo',
        },
        similaridade: 0.93,
      },
      {
        id: 21,
        texto: 'Acordo de indenização - Montante de R$ 120.000,00',
        metadata: {
          tipo: 'processo',
          id: 1001,
          processoId: 102,
          valor_total: 120000,
          numero_parcelas: 10,
          status: 'ativo',
        },
        similaridade: 0.88,
      },
    ];

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (retrieval.buscaHibrida as jest.Mock).mockResolvedValue(mockAcordos);

    // Act
    const result = await actionBuscaHibrida({
      query,
      tipo: 'processo',
      limite: 10,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.resultados).toHaveLength(2);
    expect(result.data.resultados[0].tipo).toBe('processo');
    expect(retrieval.buscaHibrida).toHaveBeenCalledWith(query, {
      limite: 10,
      filtros: { tipo: 'processo' },
    });
  });
});
