/**
 * Tests for Notas Server Actions
 *
 * Tests real exported actions with mocked service layer, auth session, and cache revalidation.
 * All notas actions use `authenticatedAction` from @/lib/safe-action which:
 * 1. Calls authenticateRequest() for auth
 * 2. Validates input with Zod schema
 * 3. Executes handler with validated data + user context
 * 4. Returns ActionResult<T> ({ success, data/error, message })
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ok, err, appError } from '@/types';

// Mock dependencies
jest.mock('next/cache');
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
    })),
}));

// Mock auth session — authenticatedAction calls authenticateRequest internally
const mockUser = {
    id: 42,
    nomeCompleto: 'Teste Notas',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth/session', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

// Mock service layer
jest.mock('../../service', () => ({
    listarDadosNotas: jest.fn(),
    criarNota: jest.fn(),
    atualizarNota: jest.fn(),
    arquivarNota: jest.fn(),
    excluirNota: jest.fn(),
    criarEtiqueta: jest.fn(),
    atualizarEtiqueta: jest.fn(),
    excluirEtiqueta: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth/session';

// Import REAL actions (after mocks)
import {
    actionListarDadosNotas,
    actionCriarNota,
    actionAtualizarNota,
    actionArquivarNota,
    actionExcluirNota,
    actionCriarEtiqueta,
    actionAtualizarEtiqueta,
    actionExcluirEtiqueta,
    actionPingNotas,
} from '../../actions/notas-actions';

// Import mocked service
import * as mockService from '../../service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockNotasPayload = {
    notes: [
        { id: 1, title: 'Nota 1', labels: [1], isArchived: false, type: 'text' as const },
    ],
    labels: [{ id: 1, title: 'Urgente', color: '#f00' }],
};

const mockNota = {
    id: 1,
    title: 'Nota criada',
    content: 'Conteúdo',
    labels: [],
    isArchived: false,
    type: 'text' as const,
};

const mockEtiqueta = { id: 1, title: 'Urgente', color: '#ff0000' };

describe('Notas Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Restore default auth mock
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    });

    // =========================================================================
    // actionListarDadosNotas
    // =========================================================================
    describe('actionListarDadosNotas', () => {
        it('deve listar notas com sucesso', async () => {
            (mockService.listarDadosNotas as jest.Mock).mockResolvedValue(ok(mockNotasPayload));

            const result = await actionListarDadosNotas({});

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockNotasPayload);
            }
            expect(mockService.listarDadosNotas).toHaveBeenCalledWith(mockUser.id, {});
        });

        it('deve passar includeArchived ao service', async () => {
            (mockService.listarDadosNotas as jest.Mock).mockResolvedValue(ok(mockNotasPayload));

            await actionListarDadosNotas({ includeArchived: true });

            expect(mockService.listarDadosNotas).toHaveBeenCalledWith(mockUser.id, { includeArchived: true });
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarDadosNotas as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro ao buscar notas'))
            );

            const result = await actionListarDadosNotas({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao buscar notas');
            }
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionListarDadosNotas({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
        });
    });

    // =========================================================================
    // actionCriarNota
    // =========================================================================
    describe('actionCriarNota', () => {
        it('deve criar nota e revalidar cache', async () => {
            (mockService.criarNota as jest.Mock).mockResolvedValue(ok(mockNota));

            const input = { title: 'Nova nota', content: 'Conteúdo' };
            const result = await actionCriarNota(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockNota);
            }
            expect(mockService.criarNota).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/notas');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criarNota as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro ao criar nota'))
            );

            const result = await actionCriarNota({ title: 'Teste' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao criar nota');
            }
        });

        it('deve rejeitar input com título vazio (validação Zod)', async () => {
            const result = await actionCriarNota({ title: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            // Service should NOT be called when validation fails
            expect(mockService.criarNota).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionCriarNota({ title: 'Teste' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
            expect(mockService.criarNota).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionAtualizarNota
    // =========================================================================
    describe('actionAtualizarNota', () => {
        it('deve atualizar nota e revalidar cache', async () => {
            const updated = { ...mockNota, title: 'Atualizada' };
            (mockService.atualizarNota as jest.Mock).mockResolvedValue(ok(updated));

            const input = { id: 1, title: 'Atualizada' };
            const result = await actionAtualizarNota(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(updated);
            }
            expect(mockService.atualizarNota).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/notas');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarNota as jest.Mock).mockResolvedValue(
                err(appError('NOT_FOUND', 'Nota não encontrada'))
            );

            const result = await actionAtualizarNota({ id: 999, title: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Nota não encontrada');
            }
        });

        it('deve rejeitar input com id inválido (validação Zod)', async () => {
            const result = await actionAtualizarNota({ id: -1, title: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.atualizarNota).not.toHaveBeenCalled();
        });
    });


    // =========================================================================
    // actionArquivarNota
    // =========================================================================
    describe('actionArquivarNota', () => {
        it('deve arquivar nota e revalidar cache', async () => {
            (mockService.arquivarNota as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await actionArquivarNota({ id: 1, isArchived: true });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ success: true });
            }
            expect(mockService.arquivarNota).toHaveBeenCalledWith(mockUser.id, { id: 1, isArchived: true });
            expect(revalidatePath).toHaveBeenCalledWith('/app/notas');
        });

        it('deve desarquivar nota', async () => {
            (mockService.arquivarNota as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await actionArquivarNota({ id: 1, isArchived: false });

            expect(result.success).toBe(true);
            expect(mockService.arquivarNota).toHaveBeenCalledWith(mockUser.id, { id: 1, isArchived: false });
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.arquivarNota as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro ao arquivar'))
            );

            const result = await actionArquivarNota({ id: 1, isArchived: true });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao arquivar');
            }
        });

        it('deve rejeitar input sem isArchived (validação Zod)', async () => {
            const result = await actionArquivarNota({ id: 1 } as any);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.arquivarNota).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionExcluirNota
    // =========================================================================
    describe('actionExcluirNota', () => {
        it('deve excluir nota e revalidar cache', async () => {
            (mockService.excluirNota as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await actionExcluirNota({ id: 1 });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ success: true });
            }
            expect(mockService.excluirNota).toHaveBeenCalledWith(mockUser.id, { id: 1 });
            expect(revalidatePath).toHaveBeenCalledWith('/app/notas');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.excluirNota as jest.Mock).mockResolvedValue(
                err(appError('NOT_FOUND', 'Nota não encontrada'))
            );

            const result = await actionExcluirNota({ id: 999 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Nota não encontrada');
            }
        });

        it('deve rejeitar input com id inválido (validação Zod)', async () => {
            const result = await actionExcluirNota({ id: 0 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.excluirNota).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionCriarEtiqueta
    // =========================================================================
    describe('actionCriarEtiqueta', () => {
        it('deve criar etiqueta e revalidar cache', async () => {
            (mockService.criarEtiqueta as jest.Mock).mockResolvedValue(ok(mockEtiqueta));

            const input = { title: 'Urgente', color: '#ff0000' };
            const result = await actionCriarEtiqueta(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockEtiqueta);
            }
            expect(mockService.criarEtiqueta).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/notas');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criarEtiqueta as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro ao criar etiqueta'))
            );

            const result = await actionCriarEtiqueta({ title: 'Teste', color: '#000' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao criar etiqueta');
            }
        });

        it('deve rejeitar input com título vazio (validação Zod)', async () => {
            const result = await actionCriarEtiqueta({ title: '', color: '#000' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.criarEtiqueta).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com cor vazia (validação Zod)', async () => {
            const result = await actionCriarEtiqueta({ title: 'Teste', color: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.criarEtiqueta).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionAtualizarEtiqueta
    // =========================================================================
    describe('actionAtualizarEtiqueta', () => {
        it('deve atualizar etiqueta e revalidar cache', async () => {
            const updated = { ...mockEtiqueta, title: 'Importante' };
            (mockService.atualizarEtiqueta as jest.Mock).mockResolvedValue(ok(updated));

            const input = { id: 1, title: 'Importante' };
            const result = await actionAtualizarEtiqueta(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(updated);
            }
            expect(mockService.atualizarEtiqueta).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/notas');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarEtiqueta as jest.Mock).mockResolvedValue(
                err(appError('NOT_FOUND', 'Etiqueta não encontrada'))
            );

            const result = await actionAtualizarEtiqueta({ id: 999, title: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Etiqueta não encontrada');
            }
        });

        it('deve rejeitar input com id inválido (validação Zod)', async () => {
            const result = await actionAtualizarEtiqueta({ id: -5, title: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.atualizarEtiqueta).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionExcluirEtiqueta
    // =========================================================================
    describe('actionExcluirEtiqueta', () => {
        it('deve excluir etiqueta e revalidar cache', async () => {
            (mockService.excluirEtiqueta as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await actionExcluirEtiqueta({ id: 1 });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ success: true });
            }
            expect(mockService.excluirEtiqueta).toHaveBeenCalledWith(mockUser.id, { id: 1 });
            expect(revalidatePath).toHaveBeenCalledWith('/app/notas');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.excluirEtiqueta as jest.Mock).mockResolvedValue(
                err(appError('NOT_FOUND', 'Etiqueta não encontrada'))
            );

            const result = await actionExcluirEtiqueta({ id: 999 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Etiqueta não encontrada');
            }
        });

        it('deve rejeitar input com id inválido (validação Zod)', async () => {
            const result = await actionExcluirEtiqueta({ id: 0 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.excluirEtiqueta).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionPingNotas
    // =========================================================================
    describe('actionPingNotas', () => {
        it('deve retornar ok quando autenticado', async () => {
            const result = await actionPingNotas({});

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ ok: true });
            }
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionPingNotas({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
        });
    });
});
