/**
 * Tests for Expedientes Server Actions
 *
 * Tests real exported actions with mocked service layer, auth, and cache revalidation.
 *
 * The expedientes module has two action files:
 * 1. expediente-actions.ts — Core CRUD + baixa/reverter actions
 * 2. expediente-bulk-actions.ts — Bulk transfer and bulk baixa actions
 *
 * Actions use different auth patterns:
 * - actionCriarExpediente: authenticateRequest from @/lib/auth
 * - actionAtualizarExpediente: no explicit auth (relies on RLS)
 * - actionBaixarExpediente / actionReverterBaixa: createSupabaseClient for user lookup
 * - actionListarExpedientes: no explicit auth (relies on RLS)
 * - Bulk actions: authenticateRequest + createSupabaseClient for user lookup
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
jest.mock('next/cache');
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
    })),
}));

// Mock next/server (after() used in actionCriarExpediente)
jest.mock('next/server', () => ({
    after: jest.fn((fn: () => void) => fn()),
}));

// Mock auth
const mockUser = {
    id: 1,
    nomeCompleto: 'Teste Expedientes',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

// Mock Supabase client (used by baixa/reverter/bulk actions)
const mockSupabaseUser = { id: 'auth-uuid-123' };
const mockSupabaseClient = {
    auth: {
        getUser: jest.fn(async () => ({
            data: { user: mockSupabaseUser },
            error: null,
        })),
    },
    from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
            single: jest.fn(async () => ({
                data: { id: 1 },
                error: null,
            })),
        }),
    })),
};

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(async () => mockSupabaseClient),
}));

// Mock service layer
jest.mock('../../service', () => ({
    criarExpediente: jest.fn(),
    atualizarExpediente: jest.fn(),
    realizarBaixa: jest.fn(),
    reverterBaixa: jest.fn(),
    listarExpedientes: jest.fn(),
    atribuirResponsavel: jest.fn(),
}));

// Mock documentos service (used in after() hook of actionCriarExpediente)
jest.mock('@/app/(authenticated)/documentos/service', () => ({
    listarUploads: jest.fn(async () => ({ uploads: [] })),
}));

// Mock AI indexing (used in after() hook)
jest.mock('@/lib/ai/services/indexing.service', () => ({
    indexDocument: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';

// Import REAL actions (after mocks)
import {
    actionCriarExpediente,
    actionAtualizarExpediente,
    actionBaixarExpediente,
    actionReverterBaixa,
    actionListarExpedientes,
} from '../../actions/expediente-actions';

import {
    actionBulkTransferirResponsavel,
    actionBulkBaixar,
} from '../../actions/expediente-bulk-actions';

// Import mocked service
import * as mockService from '../../service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createFormData(entries: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(entries)) {
        fd.append(key, value);
    }
    return fd;
}

const mockExpediente = {
    id: 1,
    numeroProcesso: '0001234-56.2025.5.01.0001',
    trt: 'TRT1',
    grau: 'primeiro_grau',
    dataPrazoLegalParte: '2025-06-15',
    origem: 'manual',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
};

const validCreateFormData = () => {
    // The action extracts ALL fields from FormData via formData.get().
    // Fields not present return null, which Zod z.string().optional() rejects.
    // Real browser forms always send fields (as empty strings), so we replicate that.
    const fd = new FormData();
    fd.append('numeroProcesso', '0001234-56.2025.5.01.0001');
    fd.append('trt', 'TRT1');
    fd.append('grau', 'primeiro_grau');
    fd.append('dataPrazoLegalParte', '2025-06-15');
    fd.append('origem', 'manual');
    fd.append('descricaoOrgaoJulgador', '');
    fd.append('classeJudicial', '');
    fd.append('numero', '');
    fd.append('segredoJustica', 'false');
    fd.append('codigoStatusProcesso', '');
    fd.append('prioridadeProcessual', 'false');
    fd.append('nomeParteAutora', '');
    fd.append('nomeParteRe', '');
    fd.append('dataAutuacao', '');
    fd.append('juizoDigital', 'false');
    fd.append('dataArquivamento', '');
    fd.append('idDocumento', '');
    fd.append('dataCienciaParte', '');
    fd.append('observacoes', '');
    return fd;
};

// ===========================================================================
// Tests — expediente-actions.ts
// ===========================================================================
describe('Expediente Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        mockSupabaseClient.auth.getUser.mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
        });
        mockSupabaseClient.from.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
                single: jest.fn(async () => ({
                    data: { id: 1 },
                    error: null,
                })),
            }),
        });
    });

    // =========================================================================
    // actionCriarExpediente
    // =========================================================================
    describe('actionCriarExpediente', () => {
        it('deve criar expediente com sucesso e revalidar cache', async () => {
            (mockService.criarExpediente as jest.Mock).mockResolvedValue({
                success: true,
                data: mockExpediente,
            });

            const result = await actionCriarExpediente(null, validCreateFormData());

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ id: 1 });
                expect(result.message).toContain('sucesso');
            }
            expect(authenticateRequest).toHaveBeenCalled();
            expect(mockService.criarExpediente).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/app/expedientes', 'layout');
        });

        it('deve rejeitar input com campos obrigatórios faltando (validação Zod)', async () => {
            const fd = createFormData({ trt: 'TRT1' }); // missing numeroProcesso, grau, dataPrazoLegalParte

            const result = await actionCriarExpediente(null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('validação');
            }
            expect(mockService.criarExpediente).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockService.criarExpediente as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Erro ao criar expediente' },
            });

            const result = await actionCriarExpediente(null, validCreateFormData());

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao criar expediente');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.criarExpediente as jest.Mock).mockRejectedValue(
                new Error('DB connection error'),
            );

            const result = await actionCriarExpediente(null, validCreateFormData());

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('DB connection error');
            }
        });

        it('deve retornar erro quando authenticateRequest falha', async () => {
            (authenticateRequest as jest.Mock).mockRejectedValue(
                new Error('Não autenticado'),
            );

            const result = await actionCriarExpediente(null, validCreateFormData());

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
        });
    });

    // =========================================================================
    // actionAtualizarExpediente
    // =========================================================================
    describe('actionAtualizarExpediente', () => {
        it('deve atualizar expediente com sucesso e revalidar cache', async () => {
            (mockService.atualizarExpediente as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...mockExpediente, observacoes: 'Atualizado' },
            });

            const fd = createFormData({ observacoes: 'Atualizado' });
            const result = await actionAtualizarExpediente(1, null, fd);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ id: mockExpediente.id });
                expect(result.message).toContain('atualizado');
            }
            expect(mockService.atualizarExpediente).toHaveBeenCalledWith(1, expect.any(Object));
            expect(revalidatePath).toHaveBeenCalledWith('/app/expedientes', 'layout');
        });

        it('deve retornar erro quando ID é inválido', async () => {
            const fd = createFormData({ observacoes: 'Teste' });
            const result = await actionAtualizarExpediente(0, null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('ID inválido');
            }
            expect(mockService.atualizarExpediente).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockService.atualizarExpediente as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Expediente não encontrado' },
            });

            const fd = createFormData({ observacoes: 'Teste' });
            const result = await actionAtualizarExpediente(999, null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Expediente não encontrado');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.atualizarExpediente as jest.Mock).mockRejectedValue(
                new Error('DB error'),
            );

            const fd = createFormData({ observacoes: 'Teste' });
            const result = await actionAtualizarExpediente(1, null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('DB error');
            }
        });
    });

    // =========================================================================
    // actionBaixarExpediente
    // =========================================================================
    describe('actionBaixarExpediente', () => {
        it('deve baixar expediente com sucesso e revalidar cache', async () => {
            (mockService.realizarBaixa as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...mockExpediente, baixadoEm: '2025-06-15' },
            });

            const fd = createFormData({
                expedienteId: '1',
                protocoloId: 'PROT-001',
            });
            const result = await actionBaixarExpediente(null, fd);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ id: mockExpediente.id });
                expect(result.message).toContain('baixado');
            }
            expect(mockService.realizarBaixa).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ expedienteId: 1, protocoloId: 'PROT-001' }),
                1,
            );
            expect(revalidatePath).toHaveBeenCalledWith('/app/expedientes', 'layout');
        });

        it('deve retornar erro quando expedienteId é inválido', async () => {
            const fd = createFormData({ expedienteId: '0' });
            const result = await actionBaixarExpediente(null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('ID inválido');
            }
            expect(mockService.realizarBaixa).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado via Supabase', async () => {
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Not authenticated'),
            });

            const fd = createFormData({
                expedienteId: '1',
                protocoloId: 'PROT-001',
            });
            const result = await actionBaixarExpediente(null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
            expect(mockService.realizarBaixa).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando usuário não encontrado no sistema', async () => {
            mockSupabaseClient.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    single: jest.fn(async () => ({
                        data: null,
                        error: new Error('Not found'),
                    })),
                }),
            });

            const fd = createFormData({
                expedienteId: '1',
                protocoloId: 'PROT-001',
            });
            const result = await actionBaixarExpediente(null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Usuário não encontrado');
            }
        });

        it('deve retornar erro quando service retorna falha com VALIDATION_ERROR', async () => {
            (mockService.realizarBaixa as jest.Mock).mockResolvedValue({
                success: false,
                error: {
                    message: 'Protocolo ou justificativa obrigatória',
                    code: 'VALIDATION_ERROR',
                    details: { protocoloId: ['Campo obrigatório'] },
                },
            });

            const fd = createFormData({
                expedienteId: '1',
            });
            const result = await actionBaixarExpediente(null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors).toBeDefined();
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.realizarBaixa as jest.Mock).mockRejectedValue(
                new Error('DB error'),
            );

            const fd = createFormData({
                expedienteId: '1',
                protocoloId: 'PROT-001',
            });
            const result = await actionBaixarExpediente(null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('DB error');
            }
        });
    });

    // =========================================================================
    // actionReverterBaixa
    // =========================================================================
    describe('actionReverterBaixa', () => {
        it('deve reverter baixa com sucesso e revalidar cache', async () => {
            (mockService.reverterBaixa as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...mockExpediente, baixadoEm: null },
            });

            const result = await actionReverterBaixa(1, null, new FormData());

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ id: mockExpediente.id });
                expect(result.message).toContain('revertida');
            }
            expect(mockService.reverterBaixa).toHaveBeenCalledWith(1, 1);
            expect(revalidatePath).toHaveBeenCalledWith('/app/expedientes', 'layout');
        });

        it('deve retornar erro quando ID é inválido', async () => {
            const result = await actionReverterBaixa(0, null, new FormData());

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('ID inválido');
            }
            expect(mockService.reverterBaixa).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado via Supabase', async () => {
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Not authenticated'),
            });

            const result = await actionReverterBaixa(1, null, new FormData());

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
            expect(mockService.reverterBaixa).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockService.reverterBaixa as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Expediente não está baixado' },
            });

            const result = await actionReverterBaixa(1, null, new FormData());

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Expediente não está baixado');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.reverterBaixa as jest.Mock).mockRejectedValue(
                new Error('Connection refused'),
            );

            const result = await actionReverterBaixa(1, null, new FormData());

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Connection refused');
            }
        });
    });

    // =========================================================================
    // actionListarExpedientes
    // =========================================================================
    describe('actionListarExpedientes', () => {
        const mockPaginatedResult = {
            items: [mockExpediente],
            paginacao: { pagina: 1, limite: 10, total: 1, totalPaginas: 1 },
        };

        it('deve listar expedientes com sucesso', async () => {
            (mockService.listarExpedientes as jest.Mock).mockResolvedValue({
                success: true,
                data: mockPaginatedResult,
            });

            const result = await actionListarExpedientes({ pagina: 1, limite: 10 });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockPaginatedResult);
            }
            expect(mockService.listarExpedientes).toHaveBeenCalledWith({ pagina: 1, limite: 10 });
        });

        it('deve retornar erro quando service retorna falha', async () => {
            (mockService.listarExpedientes as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Erro ao listar' },
            });

            const result = await actionListarExpedientes({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao listar');
            }
        });

        it('deve tratar exceção do service', async () => {
            (mockService.listarExpedientes as jest.Mock).mockRejectedValue(
                new Error('Timeout'),
            );

            const result = await actionListarExpedientes({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Timeout');
            }
        });
    });
});

// ===========================================================================
// Tests — expediente-bulk-actions.ts
// ===========================================================================
describe('Expediente Bulk Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
        mockSupabaseClient.auth.getUser.mockResolvedValue({
            data: { user: mockSupabaseUser },
            error: null,
        });
        mockSupabaseClient.from.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
                single: jest.fn(async () => ({
                    data: { id: 1 },
                    error: null,
                })),
            }),
        });
    });

    // =========================================================================
    // actionBulkTransferirResponsavel
    // =========================================================================
    describe('actionBulkTransferirResponsavel', () => {
        it('deve transferir responsável em massa com sucesso', async () => {
            (mockService.atribuirResponsavel as jest.Mock).mockResolvedValue({
                success: true,
                data: mockExpediente,
            });

            const fd = createFormData({ responsavelId: '2' });
            const result = await actionBulkTransferirResponsavel([1, 2, 3], null, fd);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ sucessos: 3, total: 3 });
                expect(result.message).toContain('transferido');
            }
            expect(authenticateRequest).toHaveBeenCalled();
            expect(mockService.atribuirResponsavel).toHaveBeenCalledTimes(3);
            expect(revalidatePath).toHaveBeenCalledWith('/app/expedientes', 'layout');
        });

        it('deve retornar erro quando formData não é FormData', async () => {
            const result = await actionBulkTransferirResponsavel([1], null, null);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Dados inválidos');
            }
        });

        it('deve retornar erro de validação quando expedienteIds está vazio', async () => {
            const fd = createFormData({ responsavelId: '2' });
            const result = await actionBulkTransferirResponsavel([], null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('validação');
            }
        });

        it('deve retornar erro quando não autenticado via authenticateRequest', async () => {
            (authenticateRequest as jest.Mock).mockRejectedValue(
                new Error('Não autenticado'),
            );

            const fd = createFormData({ responsavelId: '2' });
            const result = await actionBulkTransferirResponsavel([1], null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
        });

        it('deve retornar erro quando não autenticado via Supabase', async () => {
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Not authenticated'),
            });

            const fd = createFormData({ responsavelId: '2' });
            const result = await actionBulkTransferirResponsavel([1], null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
        });

        it('deve reportar falhas parciais quando alguns expedientes falham', async () => {
            (mockService.atribuirResponsavel as jest.Mock)
                .mockResolvedValueOnce({ success: true, data: mockExpediente })
                .mockResolvedValueOnce({ success: false, error: { message: 'Erro' } });

            const fd = createFormData({ responsavelId: '2' });
            const result = await actionBulkTransferirResponsavel([1, 2], null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('1 expediente(s) atualizado(s)');
                expect(result.message).toContain('1 falha(s)');
            }
        });
    });

    // =========================================================================
    // actionBulkBaixar
    // =========================================================================
    describe('actionBulkBaixar', () => {
        it('deve baixar expedientes em massa com sucesso', async () => {
            (mockService.realizarBaixa as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...mockExpediente, baixadoEm: '2025-06-15' },
            });

            const fd = createFormData({ justificativaBaixa: 'Prazo vencido' });
            const result = await actionBulkBaixar([1, 2], null, fd);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ sucessos: 2, total: 2 });
                expect(result.message).toContain('baixado');
            }
            expect(authenticateRequest).toHaveBeenCalled();
            expect(mockService.realizarBaixa).toHaveBeenCalledTimes(2);
            expect(revalidatePath).toHaveBeenCalledWith('/app/expedientes', 'layout');
        });

        it('deve retornar erro quando formData não é FormData', async () => {
            const result = await actionBulkBaixar([1], null, null);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Dados inválidos');
            }
        });

        it('deve retornar erro de validação quando justificativa está vazia', async () => {
            const fd = createFormData({ justificativaBaixa: '' });
            const result = await actionBulkBaixar([1], null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('validação');
            }
        });

        it('deve retornar erro quando não autenticado via Supabase', async () => {
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Not authenticated'),
            });

            const fd = createFormData({ justificativaBaixa: 'Prazo vencido' });
            const result = await actionBulkBaixar([1], null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
        });

        it('deve reportar falhas parciais quando alguns expedientes falham', async () => {
            (mockService.realizarBaixa as jest.Mock)
                .mockResolvedValueOnce({ success: true, data: mockExpediente })
                .mockResolvedValueOnce({ success: false, error: { message: 'Erro' } });

            const fd = createFormData({ justificativaBaixa: 'Prazo vencido' });
            const result = await actionBulkBaixar([1, 2], null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('1 expediente(s) baixado(s)');
                expect(result.message).toContain('1 falha(s)');
            }
        });

        it('deve tratar exceção inesperada', async () => {
            (authenticateRequest as jest.Mock).mockRejectedValue(
                new Error('Erro interno'),
            );

            const fd = createFormData({ justificativaBaixa: 'Prazo vencido' });
            const result = await actionBulkBaixar([1], null, fd);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro interno');
            }
        });
    });
});
