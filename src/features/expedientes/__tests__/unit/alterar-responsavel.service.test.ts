/**
 * UNIT TESTS — Alterar Responsável (Service Layer)
 *
 * Testa atribuirResponsavel e atualizarExpediente com foco no campo responsavelId.
 * Cobre: validação, RPC, autenticação, edge cases.
 */

import {
  atribuirResponsavel,
  atualizarExpediente,
  atualizarTipoDescricao,
} from '../../service';
import {
  findExpedienteById,
  updateExpediente,
  updateResponsavel,
} from '../../repository';
import { ok, err, appError } from '@/types';
import { createDbClient } from '@/lib/supabase';
import { mockExpediente } from '@/testing/integration-helpers';

// Mock dependencies
jest.mock('../../repository');
jest.mock('@/lib/supabase');

// =============================================================================
// atribuirResponsavel
// =============================================================================

describe('atribuirResponsavel', () => {
  let mockRpc: jest.Mock;
  let mockGetSession: jest.Mock;
  let mockFrom: jest.Mock;
  let mockDb: Record<string, unknown>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });
    mockGetSession = jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'auth-uuid-123' } } },
      error: null,
    });
    mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 42 }, error: null }),
        }),
      }),
    });

    mockDb = {
      rpc: mockRpc,
      auth: { getSession: mockGetSession },
      from: mockFrom,
    };

    (createDbClient as jest.Mock).mockReturnValue(mockDb);
  });

  // ── Sucesso ──────────────────────────────────────────────────────────

  it('deve atribuir responsável via RPC com usuarioExecutouId explícito', async () => {
    const result = await atribuirResponsavel(10, 5, 99);

    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 10,
      p_responsavel_id: 5,
      p_usuario_executou_id: 99,
    });
    // Não deve buscar sessão quando userId é fornecido
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('deve permitir remover responsável passando null', async () => {
    const result = await atribuirResponsavel(10, null, 99);

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 10,
      p_responsavel_id: null,
      p_usuario_executou_id: 99,
    });
  });

  it('deve buscar usuário via sessão quando usuarioExecutouId não fornecido', async () => {
    const result = await atribuirResponsavel(10, 5);

    expect(result.success).toBe(true);
    expect(mockGetSession).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith('usuarios');
    expect(mockRpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 10,
      p_responsavel_id: 5,
      p_usuario_executou_id: 42, // ID retornado pelo mock de usuarios
    });
  });

  // ── Erros de autenticação ────────────────────────────────────────────

  it('deve retornar UNAUTHORIZED se sessão não existir e userId não fornecido', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await atribuirResponsavel(10, 5);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('deve retornar UNAUTHORIZED se usuário não encontrado na tabela usuarios', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const result = await atribuirResponsavel(10, 5);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // ── Erros de banco ───────────────────────────────────────────────────

  it('deve retornar DATABASE_ERROR se RPC falhar', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Constraint violation', code: '23503' },
    });

    const result = await atribuirResponsavel(10, 999, 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toContain('Constraint violation');
    }
  });

  it('deve capturar exceções inesperadas e retornar DATABASE_ERROR', async () => {
    mockRpc.mockRejectedValue(new Error('Connection timeout'));

    const result = await atribuirResponsavel(10, 5, 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
    }
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  it('deve funcionar com responsavelId = 0 (tratado como falsy mas válido como number)', async () => {
    // 0 é passado ao RPC — depende do banco aceitar ou não
    const result = await atribuirResponsavel(10, 0, 1);

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 10,
      p_responsavel_id: 0,
      p_usuario_executou_id: 1,
    });
  });
});

// =============================================================================
// atualizarExpediente (foco em responsavelId)
// =============================================================================

describe('atualizarExpediente — responsavelId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const existingExpediente = mockExpediente({
    id: 1,
    responsavelId: 5,
  });

  it('deve atualizar responsavelId para outro usuário', async () => {
    (findExpedienteById as jest.Mock).mockResolvedValue(ok(existingExpediente));
    (updateExpediente as jest.Mock).mockResolvedValue(
      ok(mockExpediente({ ...existingExpediente, responsavelId: 10 }))
    );

    const result = await atualizarExpediente(1, { responsavelId: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.responsavelId).toBe(10);
    }
    expect(updateExpediente).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ responsavel_id: 10 }),
      existingExpediente
    );
  });

  it('deve permitir limpar responsável com null', async () => {
    (findExpedienteById as jest.Mock).mockResolvedValue(ok(existingExpediente));
    (updateExpediente as jest.Mock).mockResolvedValue(
      ok(mockExpediente({ ...existingExpediente, responsavelId: null }))
    );

    const result = await atualizarExpediente(1, { responsavelId: null });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.responsavelId).toBeNull();
    }
  });

  it('deve falhar se expediente não existir', async () => {
    (findExpedienteById as jest.Mock).mockResolvedValue(ok(null));

    const result = await atualizarExpediente(1, { responsavelId: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(updateExpediente).not.toHaveBeenCalled();
  });

  it('deve falhar com ID inválido (0)', async () => {
    const result = await atualizarExpediente(0, { responsavelId: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('deve falhar com ID negativo', async () => {
    const result = await atualizarExpediente(-1, { responsavelId: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('deve preservar dados anteriores na atualização', async () => {
    (findExpedienteById as jest.Mock).mockResolvedValue(ok(existingExpediente));
    (updateExpediente as jest.Mock).mockResolvedValue(
      ok(mockExpediente({ ...existingExpediente, responsavelId: 10 }))
    );

    await atualizarExpediente(1, { responsavelId: 10 });

    expect(updateExpediente).toHaveBeenCalledWith(
      1,
      expect.anything(),
      existingExpediente // expedienteExistente passado para auditoria
    );
  });

  it('deve propagar erro do repository', async () => {
    (findExpedienteById as jest.Mock).mockResolvedValue(ok(existingExpediente));
    (updateExpediente as jest.Mock).mockResolvedValue(
      err(appError('DATABASE_ERROR', 'FK constraint failed'))
    );

    const result = await atualizarExpediente(1, { responsavelId: 999 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
    }
  });
});
