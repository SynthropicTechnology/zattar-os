/**
 * @jest-environment node
 *
 * Testes: actionDocumentosStats
 *
 * Verifica que a server action retorna stats corretamente.
 * Roda em node env porque server actions dependem de Next.js server APIs.
 */

// Mock completo do service ANTES de qualquer import
jest.mock('../../services/documentos.service', () => ({
  getDocumentosStats: jest.fn(),
}));

// Mock next/cache
jest.mock('next/cache');

// Mock storage
jest.mock('@/lib/storage/backblaze-b2.service', () => ({
  generatePresignedUrl: jest.fn(),
  uploadToBackblaze: jest.fn(),
}));

// Mock signature services
jest.mock('../../services/signature', () => ({
  downloadFromStorageUrl: jest.fn(),
}));

// Mock authenticatedAction
jest.mock('@/lib/safe-action', () => ({
  authenticatedAction: jest.fn((schema: any, handler: any) => {
    return async (input: unknown) => {
      const validation = schema.safeParse(input);
      if (!validation.success) {
        return {
          success: false,
          error: validation.error.errors[0].message,
          message: 'Validation error',
        };
      }
      try {
        const data = await handler(validation.data, {
          user: { id: 1, nomeCompleto: 'Test User', emailCorporativo: 'test@test.com' },
        });
        return { success: true, data };
      } catch (err: any) {
        return { success: false, error: err.message, message: err.message };
      }
    };
  }),
}));

import { criarStatsMock } from '../fixtures';
import { getDocumentosStats } from '../../services/documentos.service';
import { actionDocumentosStats } from '../../actions/documentos-actions';

const mockGetStats = getDocumentosStats as jest.Mock;

describe('actionDocumentosStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar stats com sucesso', async () => {
    const mockStats = criarStatsMock();
    mockGetStats.mockResolvedValue(mockStats);

    const result = await actionDocumentosStats({});

    expect(result).toEqual({ success: true, data: mockStats });
    expect(mockGetStats).toHaveBeenCalledTimes(1);
  });

  it('deve retornar stats com contagem zerada', async () => {
    const emptyStats = criarStatsMock({
      total: 0,
      rascunhos: 0,
      aguardando: 0,
      concluidos: 0,
      cancelados: 0,
      taxaConclusao: 0,
      tempoMedio: 0,
      trendMensal: [0, 0, 0, 0, 0, 0],
    });
    mockGetStats.mockResolvedValue(emptyStats);

    const result = await actionDocumentosStats({});

    expect(result).toEqual({ success: true, data: emptyStats });
  });

  it('deve tratar erro do service gracefully', async () => {
    mockGetStats.mockRejectedValue(new Error('Erro de conexão com banco'));

    const result = await actionDocumentosStats({});

    expect(result.success).toBe(false);
    expect((result as any).error).toContain('Erro de conexão');
  });

  it('deve retornar taxaConclusao calculada', async () => {
    const stats = criarStatsMock({ taxaConclusao: 70 });
    mockGetStats.mockResolvedValue(stats);

    const result = await actionDocumentosStats({});

    expect(result.success).toBe(true);
    expect((result as any).data.taxaConclusao).toBe(70);
  });

  it('deve retornar trendMensal com 6 posicoes', async () => {
    const stats = criarStatsMock();
    mockGetStats.mockResolvedValue(stats);

    const result = await actionDocumentosStats({});

    expect(result.success).toBe(true);
    expect((result as any).data.trendMensal).toHaveLength(6);
  });
});
