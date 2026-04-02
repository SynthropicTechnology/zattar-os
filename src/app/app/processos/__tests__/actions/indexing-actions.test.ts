import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionIndexarPecaProcesso,
  actionIndexarAndamentoProcesso,
  actionReindexarProcesso,
} from '../../actions/indexing-actions';
import { authenticateRequest } from '@/lib/auth';
import { criarUsuarioMock, criarPecaMock, criarAndamentoMock } from '../fixtures';

jest.mock('@/lib/auth');

// Mock createServiceClient for the queueMicrotask insert calls
const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });
jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

// Mock createClient (used in actionReindexarProcesso for reading uploads)
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

// Override queueMicrotask to run synchronously for tests
const originalQueueMicrotask = globalThis.queueMicrotask;
beforeAll(() => {
  globalThis.queueMicrotask = (fn: () => void) => {
    fn();
  };
});
afterAll(() => {
  globalThis.queueMicrotask = originalQueueMicrotask;
});

describe('actionIndexarPecaProcesso', () => {
  const mockUser = criarUsuarioMock();
  const mockPeca = criarPecaMock();

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    // Make sure ENABLE_AI_INDEXING is not 'false'
    delete process.env.ENABLE_AI_INDEXING;
  });

  it('deve retornar erro quando não autenticado', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue(null);

    const result = await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      mockPeca.content_type
    );

    expect(result).toEqual({
      success: false,
      error: 'Não autenticado',
    });
  });

  it('deve retornar sucesso e enfileirar peça para indexação', async () => {
    const result = await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      'application/pdf'
    );

    expect(result.success).toBe(true);
  });

  it('deve incluir metadata com processo_id e indexed_by', async () => {
    await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      mockPeca.content_type
    );

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'processo',
        entity_id: mockPeca.id,
        metadata: expect.objectContaining({
          processo_id: mockPeca.processo_id,
          indexed_by: mockUser.id,
          storage_key: mockPeca.storage_key,
          content_type: mockPeca.content_type,
          tipo: 'processo_peca',
        }),
      })
    );
  });

  it('deve retornar mensagem de desabilitado quando ENABLE_AI_INDEXING=false', async () => {
    process.env.ENABLE_AI_INDEXING = 'false';

    const result = await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      mockPeca.content_type
    );

    expect(result.success).toBe(true);
    expect(result.message).toBe('Indexação desabilitada');
  });
});

describe('actionIndexarAndamentoProcesso', () => {
  const mockUser = criarUsuarioMock();
  const mockAndamento = criarAndamentoMock();

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    delete process.env.ENABLE_AI_INDEXING;
  });

  it('deve retornar erro quando não autenticado', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue(null);

    const result = await actionIndexarAndamentoProcesso(
      mockAndamento.processo_id,
      mockAndamento.id,
      mockAndamento.descricao
    );

    expect(result).toEqual({
      success: false,
      error: 'Não autenticado',
    });
  });

  it('deve enfileirar andamento para indexação', async () => {
    const result = await actionIndexarAndamentoProcesso(
      mockAndamento.processo_id,
      mockAndamento.id,
      mockAndamento.descricao
    );

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'processo',
        entity_id: mockAndamento.id,
        texto: mockAndamento.descricao,
        metadata: expect.objectContaining({
          processo_id: mockAndamento.processo_id,
          indexed_by: mockUser.id,
          tipo: 'processo_andamento',
        }),
      })
    );
  });
});

describe('actionReindexarProcesso', () => {
  const mockUser = criarUsuarioMock();

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    delete process.env.ENABLE_AI_INDEXING;
  });

  it('deve retornar erro quando não autenticado', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue(null);

    const result = await actionReindexarProcesso(100);

    expect(result).toEqual({
      success: false,
      error: 'Não autenticado',
    });
  });

  it('deve retornar mensagem de sucesso com agendamento', async () => {
    const result = await actionReindexarProcesso(100);

    expect(result.success).toBe(true);
    expect(result.message).toContain('agendada');
  });

  it('deve retornar mensagem de desabilitado quando ENABLE_AI_INDEXING=false', async () => {
    process.env.ENABLE_AI_INDEXING = 'false';

    const result = await actionReindexarProcesso(100);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Indexação desabilitada');
  });
});
