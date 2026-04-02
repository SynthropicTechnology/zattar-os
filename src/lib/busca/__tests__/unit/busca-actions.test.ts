import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionBuscaSemantica,
  actionBuscaHibrida,
  actionObterContextoRAG,
  actionBuscarSimilares,
} from '../../actions/busca-actions';
import { authenticatedAction } from '@/lib/safe-action';
import * as retrieval from '@/lib/ai/retrieval';

jest.mock('@/lib/safe-action');
jest.mock('@/lib/ai/retrieval');

describe('Busca Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionBuscaSemantica', () => {
    it('deve retornar erro quando não autenticado', async () => {
      // Arrange
      const mockAuthAction = jest.fn(() => {
        return async () => ({
          success: false,
          error: 'Não autenticado',
        });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaSemantica({ query: 'teste' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Não autenticado');
    });

    it('deve validar schema de entrada (query mínimo 3 caracteres)', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: 'Query deve ter no mínimo 3 caracteres',
            };
          }
          return handler(input, { userId: 'user123' } as { userId: string });
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaSemantica({ query: 'ab' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Query deve ter no mínimo 3 caracteres');
    });

    it('deve chamar buscaSemantica com parâmetros corretos', async () => {
      // Arrange
      const mockResults = [
        {
          id: 1,
          texto: 'resultado 1',
          metadata: { tipo: 'processo', id: 1, processoId: 100, numeroProcesso: '0001234-56.2023.5.02.0001' },
          similaridade: 0.9,
        },
      ];

      (retrieval.buscaSemantica as jest.Mock).mockResolvedValue(mockResults);

      const mockAuthAction = jest.fn((_, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaSemantica({
        query: 'ação trabalhista',
        limite: 10,
        threshold: 0.7,
      });

      // Assert
      expect(retrieval.buscaSemantica).toHaveBeenCalledWith('ação trabalhista', {
        limite: 10,
        threshold: 0.7,
        filtros: {},
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('query', 'ação trabalhista');
      expect(result.data).toHaveProperty('total', 1);
      expect(result.data).toHaveProperty('resultados');
      expect(result.data.resultados).toHaveLength(1);
    });

    it('deve truncar texto longo nos resultados (>500 caracteres)', async () => {
      // Arrange
      const longText = 'a'.repeat(600);
      const mockResults = [
        {
          id: 1,
          texto: longText,
          metadata: { tipo: 'processo', id: 1 },
          similaridade: 0.9,
        },
      ];

      (retrieval.buscaSemantica as jest.Mock).mockResolvedValue(mockResults);

      const mockAuthAction = jest.fn((_, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaSemantica({ query: 'teste' });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.resultados[0].texto.length).toBeLessThanOrEqual(503); // 500 + '...'
      expect(result.data.resultados[0].texto).toContain('...');
    });

    it('deve aplicar filtros de tipo', async () => {
      // Arrange
      (retrieval.buscaSemantica as jest.Mock).mockResolvedValue([]);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      await actionBuscaSemantica({
        query: 'busca filtrada',
        tipo: 'processo',
      });

      // Assert
      expect(retrieval.buscaSemantica).toHaveBeenCalledWith('busca filtrada', {
        limite: 10,
        threshold: 0.7,
        filtros: { tipo: 'processo' },
      });
    });

    it('deve retornar resultados formatados', async () => {
      // Arrange
      const mockResults = [
        {
          id: 1,
          texto: 'Processo trabalhista',
          metadata: {
            tipo: 'processo',
            id: 100,
            processoId: 100,
            numeroProcesso: '0001234-56.2023.5.02.0001',
          },
          similaridade: 0.95,
        },
        {
          id: 2,
          texto: 'Petição inicial',
          metadata: {
            tipo: 'documento',
            id: 200,
            processoId: 100,
          },
          similaridade: 0.87,
        },
      ];

      (retrieval.buscaSemantica as jest.Mock).mockResolvedValue(mockResults);

      const mockAuthAction = jest.fn((_, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaSemantica({ query: 'teste' });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('query', 'teste');
      expect(result.data).toHaveProperty('total', 2);
      expect(result.data).toHaveProperty('resultados');
      expect(result.data.resultados).toHaveLength(2);
      expect(result.data.resultados[0]).toHaveProperty('id');
      expect(result.data.resultados[0]).toHaveProperty('texto');
      expect(result.data.resultados[0]).toHaveProperty('tipo');
      expect(result.data.resultados[0]).toHaveProperty('similaridade');
      expect(result.data.resultados[0].similaridade).toBe(0.95);
    });
  });

  describe('actionBuscaHibrida', () => {
    it('deve combinar busca semântica e textual', async () => {
      // Arrange
      const mockResults = [
        {
          id: 1,
          texto: 'resultado semântico',
          metadata: { tipo: 'processo', id: 1, processoId: 100 },
          similaridade: 0.9,
        },
        {
          id: 2,
          texto: 'resultado textual',
          metadata: { tipo: 'documento', id: 2, processoId: 100 },
          similaridade: 0.85,
        },
      ];

      (retrieval.buscaHibrida as jest.Mock).mockResolvedValue(mockResults);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaHibrida({
        query: 'busca híbrida',
        limite: 10,
      });

      // Assert
      expect(retrieval.buscaHibrida).toHaveBeenCalledWith('busca híbrida', {
        limite: 10,
        filtros: {},
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('query', 'busca híbrida');
      expect(result.data).toHaveProperty('total', 2);
      expect(result.data).toHaveProperty('resultados');
      expect(result.data.resultados).toHaveLength(2);
    });

    it('deve validar limite máximo (50)', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: validation.error.errors[0].message,
            };
          }
          return handler(input, {} as { userId: string });
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscaHibrida({
        query: 'teste',
        limite: 100,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionObterContextoRAG', () => {
    it('deve retornar contexto formatado para LLM', async () => {
      // Arrange
      const mockContext = {
        contexto: 'Contexto formatado para o LLM baseado em documentos relevantes',
        fontes: [
          {
            id: 1,
            texto: 'Processo 0001234',
            metadata: { tipo: 'processo', id: 1 },
            similaridade: 0.9,
          },
          {
            id: 2,
            texto: 'Petição Inicial',
            metadata: { tipo: 'documento', id: 2 },
            similaridade: 0.85,
          },
        ],
      };

      (retrieval.obterContextoRAG as jest.Mock).mockResolvedValue(mockContext);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionObterContextoRAG({
        query: 'qual o status do processo?',
      });

      // Assert
      expect(retrieval.obterContextoRAG).toHaveBeenCalledWith('qual o status do processo?', 2000);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('query', 'qual o status do processo?');
      expect(result.data).toHaveProperty('contexto');
      expect(result.data).toHaveProperty('fontesUsadas', 2);
      expect(result.data).toHaveProperty('fontes');
      expect(result.data.fontes).toHaveLength(2);
    });

    it('deve respeitar maxTokens', async () => {
      // Arrange
      const mockContext = {
        contexto: 'Contexto reduzido',
        fontes: [
          {
            id: 1,
            texto: 'Processo',
            metadata: { tipo: 'processo', id: 1 },
            similaridade: 0.9,
          },
        ],
      };

      (retrieval.obterContextoRAG as jest.Mock).mockResolvedValue(mockContext);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionObterContextoRAG({
        query: 'teste',
        maxTokens: 100,
      });

      // Assert
      expect(retrieval.obterContextoRAG).toHaveBeenCalledWith('teste', 100);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('contexto');
    });

    it('deve retornar fontes usadas', async () => {
      // Arrange
      const mockContext = {
        contexto: 'Contexto',
        fontes: [
          {
            id: 10,
            texto: 'Processo Trabalhista',
            metadata: {
              tipo: 'processo',
              id: 10,
              numeroProcesso: '0001234-56.2023.5.02.0001',
            },
            similaridade: 0.9,
          },
        ],
      };

      (retrieval.obterContextoRAG as jest.Mock).mockResolvedValue(mockContext);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionObterContextoRAG({ query: 'teste' });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.fontes).toHaveLength(1);
      expect(result.data.fontes[0]).toHaveProperty('tipo');
      expect(result.data.fontes[0]).toHaveProperty('id');
      expect(result.data.fontes[0]).toHaveProperty('similaridade');
    });
  });

  describe('actionBuscarSimilares', () => {
    it('deve buscar documentos similares por tipo e ID', async () => {
      // Arrange
      const mockResults = [
        {
          id: 2,
          texto: 'Processo similar 1',
          metadata: { tipo: 'processo', id: 101 },
          similaridade: 0.92,
        },
        {
          id: 3,
          texto: 'Processo similar 2',
          metadata: { tipo: 'processo', id: 102 },
          similaridade: 0.88,
        },
      ];

      (retrieval.buscarSimilares as jest.Mock).mockResolvedValue(mockResults);

      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => handler(input, { userId: 'user123' } as { userId: string });
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscarSimilares({
        tipo: 'processo',
        id: 100,
        limite: 5,
      });

      // Assert
      expect(retrieval.buscarSimilares).toHaveBeenCalledWith('processo', 100, 5);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('referencia');
      expect(result.data).toHaveProperty('total', 2);
      expect(result.data).toHaveProperty('similares');
      expect(result.data.similares).toHaveLength(2);
    });

    it('deve validar tipo de entidade', async () => {
      // Arrange
      const mockAuthAction = jest.fn((schema, handler) => {
        return async (input: unknown) => {
          const validation = schema.safeParse(input);
          if (!validation.success) {
            return {
              success: false,
              error: validation.error.errors[0].message,
            };
          }
          return handler(input, {} as { userId: string });
        };
      });

      (authenticatedAction as jest.Mock).mockImplementation(mockAuthAction);

      // Act
      const result = await actionBuscarSimilares({
        tipo: 'tipo_invalido' as 'processo' | 'documento' | 'acordo',
        id: 100,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
