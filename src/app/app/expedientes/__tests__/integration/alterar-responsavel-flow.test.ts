/**
 * INTEGRATION TESTS — Alterar Responsável (Full Flow)
 *
 * Testa o fluxo completo de atribuição de responsável:
 * - Single: actionAtualizarExpediente → service → repository
 * - Bulk: actionBulkTransferirResponsavel → atribuirResponsavel (RPC)
 * - Edge cases, autenticação, validação Zod, parcial failures
 */

import {
  atribuirResponsavel,
  atualizarExpediente,
  listarExpedientes,
} from '../../service';
import {
  findExpedienteById,
  updateExpediente,
  findAllExpedientes,
} from '../../repository';
import { ok, err, appError } from '@/types';
import {
  mockExpediente,
  buildMultipleExpedientes,
} from '@/testing/integration-helpers';
import { createDbClient } from '@/lib/supabase';

jest.mock('../../repository');
jest.mock('@/lib/supabase');

// =============================================================================
// HELPERS
// =============================================================================

function createMockDb(overrides?: {
  rpcResult?: { data: unknown; error: unknown };
  sessionUser?: { id: string } | null;
  usuarioData?: { id: number } | null;
}) {
  const defaults = {
    rpcResult: { data: null, error: null },
    sessionUser: { id: 'auth-user-abc' },
    usuarioData: { id: 1 },
  };
  const opts = { ...defaults, ...overrides };

  const mockRpc = jest.fn().mockResolvedValue(opts.rpcResult);
  const mockGetSession = jest.fn().mockResolvedValue({
    data: { session: opts.sessionUser ? { user: opts.sessionUser } : null },
    error: null,
  });
  const mockSingle = jest.fn().mockResolvedValue({
    data: opts.usuarioData,
    error: opts.usuarioData ? null : { message: 'not found', code: 'PGRST116' },
  });
  const mockFrom = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingle,
      }),
    }),
    insert: jest.fn().mockResolvedValue({ error: null }),
  });

  const db = {
    rpc: mockRpc,
    auth: { getSession: mockGetSession },
    from: mockFrom,
  };

  (createDbClient as jest.Mock).mockReturnValue(db);

  return { db, mockRpc, mockGetSession, mockFrom, mockSingle };
}

// =============================================================================
// FLUXO SINGLE — atribuirResponsavel → RPC
// =============================================================================

describe('Integration: Atribuição Single de Responsável', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve atribuir responsável e chamar RPC corretamente', async () => {
    const { mockRpc } = createMockDb();

    const result = await atribuirResponsavel(42, 7);

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 42,
      p_responsavel_id: 7,
      p_usuario_executou_id: 1,
    });
  });

  it('deve remover responsável (null) via RPC', async () => {
    const { mockRpc } = createMockDb();

    const result = await atribuirResponsavel(42, null);

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 42,
      p_responsavel_id: null,
      p_usuario_executou_id: 1,
    });
  });

  it('deve propagar erro do RPC', async () => {
    createMockDb({
      rpcResult: { data: null, error: { message: 'Responsável inválido', code: '23503' } },
    });

    const result = await atribuirResponsavel(42, 999);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toContain('Responsável inválido');
    }
  });

  it('deve falhar quando não autenticado', async () => {
    createMockDb({ sessionUser: null });

    const result = await atribuirResponsavel(42, 7);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('deve falhar quando usuário não existe na tabela', async () => {
    createMockDb({ usuarioData: null });

    const result = await atribuirResponsavel(42, 7);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('deve aceitar usuarioExecutouId explícito sem buscar sessão', async () => {
    const { mockGetSession, mockRpc } = createMockDb();

    await atribuirResponsavel(42, 7, 55);

    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 42,
      p_responsavel_id: 7,
      p_usuario_executou_id: 55,
    });
  });
});

// =============================================================================
// FLUXO SINGLE — atualizarExpediente com responsavelId (via FormData path)
// =============================================================================

describe('Integration: Atualizar Expediente (responsavelId via repository)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve transferir responsável de um usuário para outro', async () => {
    const original = mockExpediente({ id: 1, responsavelId: 3 });
    const updated = mockExpediente({ id: 1, responsavelId: 8 });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(original));
    (updateExpediente as jest.Mock).mockResolvedValue(ok(updated));

    const result = await atualizarExpediente(1, { responsavelId: 8 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.responsavelId).toBe(8);
    }
    // Verifica que o camelToSnake converteu corretamente
    expect(updateExpediente).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ responsavel_id: 8 }),
      original,
    );
  });

  it('deve limpar responsável (null) preservando histórico', async () => {
    const original = mockExpediente({ id: 1, responsavelId: 5 });
    const updated = mockExpediente({ id: 1, responsavelId: null });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(original));
    (updateExpediente as jest.Mock).mockResolvedValue(ok(updated));

    const result = await atualizarExpediente(1, { responsavelId: null });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.responsavelId).toBeNull();
    }
    // Verifica que dados anteriores são preservados
    expect(updateExpediente).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ responsavel_id: null }),
      original,
    );
  });

  it('deve falhar se expediente não encontrado', async () => {
    (findExpedienteById as jest.Mock).mockResolvedValue(ok(null));

    const result = await atualizarExpediente(99, { responsavelId: 8 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(updateExpediente).not.toHaveBeenCalled();
  });

  it('deve falhar se findExpedienteById retornar erro', async () => {
    (findExpedienteById as jest.Mock).mockResolvedValue(
      err(appError('DATABASE_ERROR', 'Connection reset'))
    );

    const result = await atualizarExpediente(1, { responsavelId: 8 });

    expect(result.success).toBe(false);
    expect(updateExpediente).not.toHaveBeenCalled();
  });
});

// =============================================================================
// FLUXO BULK — atribuirResponsavel em lote (simula actionBulkTransferirResponsavel)
// =============================================================================

describe('Integration: Bulk Transfer de Responsável', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve transferir responsável para múltiplos expedientes', async () => {
    const { mockRpc } = createMockDb();

    const ids = [1, 2, 3];
    const results = await Promise.allSettled(
      ids.map((id) => atribuirResponsavel(id, 10, 1))
    );

    const successes = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    expect(successes).toBe(3);
    expect(mockRpc).toHaveBeenCalledTimes(3);
  });

  it('deve lidar com falhas parciais', async () => {
    const { mockRpc } = createMockDb();

    // Primeiro e terceiro sucesso, segundo falha
    mockRpc
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'FK error', code: '23503' } })
      .mockResolvedValueOnce({ data: null, error: null });

    const ids = [1, 2, 3];
    const results = await Promise.allSettled(
      ids.map((id) => atribuirResponsavel(id, 10, 1))
    );

    const successes = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failures = results.length - successes;

    expect(successes).toBe(2);
    expect(failures).toBe(1);
  });

  it('deve remover responsável em massa (null)', async () => {
    const { mockRpc } = createMockDb();

    const ids = [4, 5];
    const results = await Promise.allSettled(
      ids.map((id) => atribuirResponsavel(id, null, 1))
    );

    const successes = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    expect(successes).toBe(2);
    expect(mockRpc).toHaveBeenCalledTimes(2);
    for (const call of mockRpc.mock.calls) {
      expect(call[1].p_responsavel_id).toBeNull();
    }
  });

  it('deve continuar processando mesmo com exceção em um item', async () => {
    const { mockRpc } = createMockDb();

    // Segunda chamada rejeita (exceção, não erro de retorno)
    mockRpc
      .mockResolvedValueOnce({ data: null, error: null })
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: null, error: null });

    const ids = [1, 2, 3];
    const results = await Promise.allSettled(
      ids.map((id) => atribuirResponsavel(id, 10, 1))
    );

    // allSettled não rejeita, então todos são resolvidos
    expect(results).toHaveLength(3);

    // Primeiro e terceiro sucesso
    const fulfilled = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    );
    expect(fulfilled).toHaveLength(2);

    // Segundo é fulfilled mas com success: false (catch interno do service)
    const failedResult = results[1];
    expect(failedResult.status).toBe('fulfilled');
    if (failedResult.status === 'fulfilled') {
      expect(failedResult.value.success).toBe(false);
    }
  });
});

// =============================================================================
// FLUXO E2E-LIKE — Atribuir → Listar com filtro
// =============================================================================

describe('Integration: Atribuir e depois Listar com filtro de responsável', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve filtrar expedientes por responsavelId após atribuição', async () => {
    // Simula que 3 expedientes têm responsavelId = 10
    const expedientes = buildMultipleExpedientes(3, { responsavelId: 10 });

    (findAllExpedientes as jest.Mock).mockResolvedValue(
      ok({
        data: expedientes,
        pagination: { page: 1, limit: 50, total: 3, totalPages: 1, hasMore: false },
      })
    );

    const result = await listarExpedientes({ responsavelId: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data).toHaveLength(3);
      expect(result.data.data.every((e) => e.responsavelId === 10)).toBe(true);
    }

    expect(findAllExpedientes).toHaveBeenCalledWith(
      expect.objectContaining({ responsavelId: 10 })
    );
  });

  it('deve filtrar expedientes sem responsável (semResponsavel)', async () => {
    const expedientes = buildMultipleExpedientes(2, { responsavelId: null });

    (findAllExpedientes as jest.Mock).mockResolvedValue(
      ok({
        data: expedientes,
        pagination: { page: 1, limit: 50, total: 2, totalPages: 1, hasMore: false },
      })
    );

    const result = await listarExpedientes({ semResponsavel: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.every((e) => e.responsavelId === null)).toBe(true);
    }
  });

  it('deve filtrar por responsavelId = "null" (string especial)', async () => {
    (findAllExpedientes as jest.Mock).mockResolvedValue(
      ok({
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false },
      })
    );

    const result = await listarExpedientes({ responsavelId: 'null' });

    expect(result.success).toBe(true);
    expect(findAllExpedientes).toHaveBeenCalledWith(
      expect.objectContaining({ responsavelId: 'null' })
    );
  });
});

// =============================================================================
// EDGE CASES — Concorrência e estado inconsistente
// =============================================================================

describe('Integration: Edge Cases de Responsável', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve lidar com atribuição ao mesmo responsável (idempotente)', async () => {
    const { mockRpc } = createMockDb();

    // Atribuir responsável 5 duas vezes ao mesmo expediente
    const result1 = await atribuirResponsavel(1, 5, 1);
    const result2 = await atribuirResponsavel(1, 5, 1);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  it('deve lidar com atualização concorrente via atualizarExpediente', async () => {
    const original = mockExpediente({ id: 1, responsavelId: null });

    // Simula duas atualizações concorrentes
    (findExpedienteById as jest.Mock).mockResolvedValue(ok(original));
    (updateExpediente as jest.Mock)
      .mockResolvedValueOnce(ok(mockExpediente({ ...original, responsavelId: 5 })))
      .mockResolvedValueOnce(ok(mockExpediente({ ...original, responsavelId: 10 })));

    const [r1, r2] = await Promise.all([
      atualizarExpediente(1, { responsavelId: 5 }),
      atualizarExpediente(1, { responsavelId: 10 }),
    ]);

    // Ambas devem ter sucesso (last-write-wins no banco)
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });
});
