/**
 * Tests for Tarefas Server Actions
 *
 * Tests real exported actions with mocked service layer, auth session, and cache revalidation.
 * All tarefas actions (except actionListarTarefas) use `authenticatedAction` from @/lib/safe-action which:
 * 1. Calls authenticateRequest() for auth
 * 2. Validates input with Zod schema
 * 3. Executes handler with validated data + user context
 * 4. Returns ActionResult<T> ({ success, data/error, message })
 *
 * actionListarTarefas is a manual implementation that follows the same pattern.
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

// Mock auth session
const mockUser = {
    id: 42,
    nomeCompleto: 'Teste Tarefas',
    emailCorporativo: 'teste@zattar.com',
};

jest.mock('@/lib/auth/session', () => ({
    authenticateRequest: jest.fn(async () => mockUser),
}));

// Mock service layer
jest.mock('../../service', () => ({
    listarTarefas: jest.fn(),
    buscarTarefa: jest.fn(),
    criarTarefa: jest.fn(),
    atualizarTarefa: jest.fn(),
    removerTarefa: jest.fn(),
    materializarTarefaVirtual: jest.fn(),
    criarSubtarefa: jest.fn(),
    atualizarSubtarefa: jest.fn(),
    removerSubtarefa: jest.fn(),
    adicionarComentario: jest.fn(),
    removerComentario: jest.fn(),
    adicionarAnexo: jest.fn(),
    removerAnexo: jest.fn(),
    listarQuadros: jest.fn(),
    criarQuadroCustom: jest.fn(),
    excluirQuadroCustom: jest.fn(),
    reordenarTarefas: jest.fn(),
    atualizarStatusViaQuadroSistema: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth/session';

// Import REAL actions (after mocks)
import {
    actionListarTarefas,
    actionListarTarefasSafe,
    actionBuscarTarefa,
    actionCriarTarefa,
    actionAtualizarTarefa,
    actionRemoverTarefa,
    actionMarcarComoDone,
    actionMarcarComoTodo,
    actionMaterializarTarefaVirtual,
    actionCriarSubtarefa,
    actionAtualizarSubtarefa,
    actionRemoverSubtarefa,
    actionAdicionarComentario,
    actionRemoverComentario,
    actionAdicionarAnexo,
    actionRemoverAnexo,
    actionListarQuadros,
    actionCriarQuadroCustom,
    actionExcluirQuadroCustom,
    actionReordenarTarefas,
    actionAtualizarStatusQuadroSistema,
    actionMoverTarefaParaQuadro,
} from '../../actions/tarefas-actions';

// Import mocked service
import * as mockService from '../../service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockTarefa = {
    id: 'TASK-0001',
    title: 'Tarefa teste',
    status: 'todo' as const,
    label: 'feature' as const,
    priority: 'medium' as const,
    description: 'Descrição da tarefa',
    dueDate: null,
    reminderDate: null,
    starred: false,
    assignees: [],
    assignedTo: [],
    subTasks: [],
    comments: [],
    files: [],
    position: 0,
    quadroId: null,
};

const mockQuadro = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    usuarioId: 42,
    titulo: 'Meu Quadro',
    tipo: 'custom' as const,
    source: null,
    icone: 'Star',
    ordem: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

const validCreateInput = {
    title: 'Nova tarefa',
    status: 'todo' as const,
    label: 'feature' as const,
    priority: 'medium' as const,
};

describe('Tarefas Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    });

    // =========================================================================
    // actionListarTarefas (manual implementation, not authenticatedAction)
    // =========================================================================
    describe('actionListarTarefas', () => {
        it('deve listar tarefas com sucesso', async () => {
            (mockService.listarTarefas as jest.Mock).mockResolvedValue(ok([mockTarefa]));

            const result = await actionListarTarefas({});

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual([mockTarefa]);
            }
            expect(mockService.listarTarefas).toHaveBeenCalledWith(mockUser.id, {});
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarTarefas as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro ao buscar tarefas'))
            );

            const result = await actionListarTarefas({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao buscar tarefas');
            }
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionListarTarefas({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
        });

        it('deve tratar exceções inesperadas', async () => {
            (mockService.listarTarefas as jest.Mock).mockRejectedValue(new Error('Conexão perdida'));

            const result = await actionListarTarefas({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Conexão perdida');
            }
        });
    });

    // =========================================================================
    // actionListarTarefasSafe
    // =========================================================================
    describe('actionListarTarefasSafe', () => {
        it('deve listar tarefas com sucesso via safe action', async () => {
            (mockService.listarTarefas as jest.Mock).mockResolvedValue(ok([mockTarefa]));

            const result = await actionListarTarefasSafe({});

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual([mockTarefa]);
            }
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionListarTarefasSafe({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.listarTarefas as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro ao buscar'))
            );

            const result = await actionListarTarefasSafe({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao buscar');
            }
        });
    });

    // =========================================================================
    // actionBuscarTarefa
    // =========================================================================
    describe('actionBuscarTarefa', () => {
        it('deve buscar tarefa por ID com sucesso', async () => {
            (mockService.buscarTarefa as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const result = await actionBuscarTarefa({ id: 'TASK-0001' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockTarefa);
            }
            expect(mockService.buscarTarefa).toHaveBeenCalledWith(mockUser.id, 'TASK-0001');
        });

        it('deve rejeitar input com id vazio (validação Zod)', async () => {
            const result = await actionBuscarTarefa({ id: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.buscarTarefa).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionBuscarTarefa({ id: 'TASK-0001' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
            expect(mockService.buscarTarefa).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionCriarTarefa
    // =========================================================================
    describe('actionCriarTarefa', () => {
        it('deve criar tarefa e revalidar cache', async () => {
            (mockService.criarTarefa as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const result = await actionCriarTarefa(validCreateInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockTarefa);
            }
            expect(mockService.criarTarefa).toHaveBeenCalledWith(mockUser.id, validCreateInput);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.criarTarefa as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro ao criar tarefa'))
            );

            const result = await actionCriarTarefa(validCreateInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro ao criar tarefa');
            }
        });

        it('deve rejeitar input com título vazio (validação Zod)', async () => {
            const result = await actionCriarTarefa({ ...validCreateInput, title: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.criarTarefa).not.toHaveBeenCalled();
        });

        it('deve rejeitar input com status inválido (validação Zod)', async () => {
            const result = await actionCriarTarefa({ ...validCreateInput, status: 'invalid' as any });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.criarTarefa).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionCriarTarefa(validCreateInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
            expect(mockService.criarTarefa).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionAtualizarTarefa
    // =========================================================================
    describe('actionAtualizarTarefa', () => {
        it('deve atualizar tarefa e revalidar cache', async () => {
            const updated = { ...mockTarefa, title: 'Atualizada' };
            (mockService.atualizarTarefa as jest.Mock).mockResolvedValue(ok(updated));

            const input = { id: 'TASK-0001', title: 'Atualizada' };
            const result = await actionAtualizarTarefa(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(updated);
            }
            expect(mockService.atualizarTarefa).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.atualizarTarefa as jest.Mock).mockResolvedValue(
                err(appError('NOT_FOUND', 'Tarefa não encontrada'))
            );

            const result = await actionAtualizarTarefa({ id: 'TASK-999', title: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Tarefa não encontrada');
            }
        });

        it('deve rejeitar input com id vazio (validação Zod)', async () => {
            const result = await actionAtualizarTarefa({ id: '', title: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.atualizarTarefa).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionRemoverTarefa
    // =========================================================================
    describe('actionRemoverTarefa', () => {
        it('deve remover tarefa e revalidar cache', async () => {
            (mockService.removerTarefa as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await actionRemoverTarefa({ id: 'TASK-0001' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ success: true });
            }
            expect(mockService.removerTarefa).toHaveBeenCalledWith(mockUser.id, 'TASK-0001');
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve retornar erro quando service falha', async () => {
            (mockService.removerTarefa as jest.Mock).mockResolvedValue(
                err(appError('NOT_FOUND', 'Tarefa não encontrada'))
            );

            const result = await actionRemoverTarefa({ id: 'TASK-999' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Tarefa não encontrada');
            }
        });

        it('deve rejeitar input com id vazio (validação Zod)', async () => {
            const result = await actionRemoverTarefa({ id: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.removerTarefa).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // actionMarcarComoDone / actionMarcarComoTodo
    // =========================================================================
    describe('actionMarcarComoDone', () => {
        it('deve marcar tarefa como done e revalidar cache', async () => {
            const done = { ...mockTarefa, status: 'done' };
            (mockService.atualizarTarefa as jest.Mock).mockResolvedValue(ok(done));

            const result = await actionMarcarComoDone({ id: 'TASK-0001' });

            expect(result.success).toBe(true);
            expect(mockService.atualizarTarefa).toHaveBeenCalledWith(mockUser.id, { id: 'TASK-0001', status: 'done' });
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve rejeitar id vazio (validação Zod)', async () => {
            const result = await actionMarcarComoDone({ id: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.atualizarTarefa).not.toHaveBeenCalled();
        });
    });

    describe('actionMarcarComoTodo', () => {
        it('deve marcar tarefa como todo e revalidar cache', async () => {
            (mockService.atualizarTarefa as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const result = await actionMarcarComoTodo({ id: 'TASK-0001' });

            expect(result.success).toBe(true);
            expect(mockService.atualizarTarefa).toHaveBeenCalledWith(mockUser.id, { id: 'TASK-0001', status: 'todo' });
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });
    });

    // =========================================================================
    // actionMaterializarTarefaVirtual
    // =========================================================================
    describe('actionMaterializarTarefaVirtual', () => {
        const validMaterializeInput = {
            title: 'Audiência materializada',
            status: 'todo' as const,
            label: 'audiencia' as const,
            priority: 'high' as const,
            source: 'audiencias',
            sourceEntityId: 'AUD-001',
        };

        it('deve materializar tarefa virtual e revalidar cache', async () => {
            (mockService.materializarTarefaVirtual as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const result = await actionMaterializarTarefaVirtual(validMaterializeInput);

            expect(result.success).toBe(true);
            expect(mockService.materializarTarefaVirtual).toHaveBeenCalledWith(mockUser.id, validMaterializeInput);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve rejeitar input sem source (validação Zod)', async () => {
            const result = await actionMaterializarTarefaVirtual({ ...validMaterializeInput, source: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.materializarTarefaVirtual).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Subtarefas
    // =========================================================================
    describe('actionCriarSubtarefa', () => {
        it('deve criar subtarefa e revalidar cache', async () => {
            const withSub = { ...mockTarefa, subTasks: [{ id: 'sub-1', title: 'Sub', completed: false, position: 0 }] };
            (mockService.criarSubtarefa as jest.Mock).mockResolvedValue(ok(withSub));

            const input = { taskId: 'TASK-0001', title: 'Sub' };
            const result = await actionCriarSubtarefa(input);

            expect(result.success).toBe(true);
            expect(mockService.criarSubtarefa).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve rejeitar input com título vazio (validação Zod)', async () => {
            const result = await actionCriarSubtarefa({ taskId: 'TASK-0001', title: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.criarSubtarefa).not.toHaveBeenCalled();
        });
    });

    describe('actionAtualizarSubtarefa', () => {
        it('deve atualizar subtarefa e revalidar cache', async () => {
            (mockService.atualizarSubtarefa as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const input = { taskId: 'TASK-0001', subTaskId: 'sub-1', completed: true };
            const result = await actionAtualizarSubtarefa(input);

            expect(result.success).toBe(true);
            expect(mockService.atualizarSubtarefa).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve rejeitar input sem subTaskId (validação Zod)', async () => {
            const result = await actionAtualizarSubtarefa({ taskId: 'TASK-0001', subTaskId: '', completed: true });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.atualizarSubtarefa).not.toHaveBeenCalled();
        });
    });

    describe('actionRemoverSubtarefa', () => {
        it('deve remover subtarefa e revalidar cache', async () => {
            (mockService.removerSubtarefa as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const input = { taskId: 'TASK-0001', subTaskId: 'sub-1' };
            const result = await actionRemoverSubtarefa(input);

            expect(result.success).toBe(true);
            expect(mockService.removerSubtarefa).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });
    });

    // =========================================================================
    // Comentários
    // =========================================================================
    describe('actionAdicionarComentario', () => {
        it('deve adicionar comentário e revalidar cache', async () => {
            const withComment = { ...mockTarefa, comments: [{ id: 'c-1', body: 'Comentário', createdAt: '2024-01-01' }] };
            (mockService.adicionarComentario as jest.Mock).mockResolvedValue(ok(withComment));

            const input = { taskId: 'TASK-0001', body: 'Comentário' };
            const result = await actionAdicionarComentario(input);

            expect(result.success).toBe(true);
            expect(mockService.adicionarComentario).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve rejeitar input com body vazio (validação Zod)', async () => {
            const result = await actionAdicionarComentario({ taskId: 'TASK-0001', body: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.adicionarComentario).not.toHaveBeenCalled();
        });
    });

    describe('actionRemoverComentario', () => {
        it('deve remover comentário e revalidar cache', async () => {
            (mockService.removerComentario as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const input = { taskId: 'TASK-0001', commentId: 'c-1' };
            const result = await actionRemoverComentario(input);

            expect(result.success).toBe(true);
            expect(mockService.removerComentario).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });
    });

    // =========================================================================
    // Anexos
    // =========================================================================
    describe('actionAdicionarAnexo', () => {
        it('deve adicionar anexo e revalidar cache', async () => {
            (mockService.adicionarAnexo as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const input = { taskId: 'TASK-0001', name: 'doc.pdf', url: 'https://storage.example.com/doc.pdf' };
            const result = await actionAdicionarAnexo(input);

            expect(result.success).toBe(true);
            expect(mockService.adicionarAnexo).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve rejeitar input com name vazio (validação Zod)', async () => {
            const result = await actionAdicionarAnexo({ taskId: 'TASK-0001', name: '', url: 'https://x.com/f' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.adicionarAnexo).not.toHaveBeenCalled();
        });
    });

    describe('actionRemoverAnexo', () => {
        it('deve remover anexo e revalidar cache', async () => {
            (mockService.removerAnexo as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const input = { taskId: 'TASK-0001', fileId: 'f-1' };
            const result = await actionRemoverAnexo(input);

            expect(result.success).toBe(true);
            expect(mockService.removerAnexo).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });
    });

    // =========================================================================
    // Quadros (Kanban Boards)
    // =========================================================================
    describe('actionListarQuadros', () => {
        it('deve listar quadros com sucesso', async () => {
            (mockService.listarQuadros as jest.Mock).mockResolvedValue(ok([mockQuadro]));

            const result = await actionListarQuadros({});

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual([mockQuadro]);
            }
            expect(mockService.listarQuadros).toHaveBeenCalledWith(mockUser.id);
        });

        it('deve retornar erro quando não autenticado', async () => {
            (authenticateRequest as jest.Mock).mockResolvedValue(null);

            const result = await actionListarQuadros({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Não autenticado');
            }
        });
    });

    describe('actionCriarQuadroCustom', () => {
        it('deve criar quadro custom e revalidar cache', async () => {
            (mockService.criarQuadroCustom as jest.Mock).mockResolvedValue(ok(mockQuadro));

            const input = { titulo: 'Meu Quadro', icone: 'Star' };
            const result = await actionCriarQuadroCustom(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(mockQuadro);
            }
            expect(mockService.criarQuadroCustom).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve rejeitar input com título vazio (validação Zod)', async () => {
            const result = await actionCriarQuadroCustom({ titulo: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.criarQuadroCustom).not.toHaveBeenCalled();
        });
    });

    describe('actionExcluirQuadroCustom', () => {
        it('deve excluir quadro custom e revalidar cache', async () => {
            (mockService.excluirQuadroCustom as jest.Mock).mockResolvedValue(ok(undefined));

            const input = { quadroId: '550e8400-e29b-41d4-a716-446655440000' };
            const result = await actionExcluirQuadroCustom(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ success: true });
            }
            expect(mockService.excluirQuadroCustom).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve rejeitar input com quadroId inválido (validação Zod)', async () => {
            const result = await actionExcluirQuadroCustom({ quadroId: 'not-a-uuid' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.excluirQuadroCustom).not.toHaveBeenCalled();
        });
    });

    describe('actionReordenarTarefas', () => {
        it('deve reordenar tarefa e revalidar cache', async () => {
            (mockService.reordenarTarefas as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const input = { tarefaId: 'TASK-0001', novaPosicao: 2, novoStatus: 'in progress' as const };
            const result = await actionReordenarTarefas(input);

            expect(result.success).toBe(true);
            expect(mockService.reordenarTarefas).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve rejeitar input com tarefaId vazio (validação Zod)', async () => {
            const result = await actionReordenarTarefas({ tarefaId: '', novaPosicao: 0 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.reordenarTarefas).not.toHaveBeenCalled();
        });
    });

    describe('actionAtualizarStatusQuadroSistema', () => {
        it('deve atualizar status via quadro sistema e revalidar cache', async () => {
            (mockService.atualizarStatusViaQuadroSistema as jest.Mock).mockResolvedValue(ok(undefined));

            const input = { source: 'expedientes' as const, entityId: 'EXP-001', targetColumnId: 'baixados' };
            const result = await actionAtualizarStatusQuadroSistema(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ success: true });
            }
            expect(mockService.atualizarStatusViaQuadroSistema).toHaveBeenCalledWith(mockUser.id, input);
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve rejeitar source inválido (validação Zod)', async () => {
            const result = await actionAtualizarStatusQuadroSistema({
                source: 'invalid' as any,
                entityId: 'EXP-001',
                targetColumnId: 'baixados',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.atualizarStatusViaQuadroSistema).not.toHaveBeenCalled();
        });
    });

    describe('actionMoverTarefaParaQuadro', () => {
        it('deve mover tarefa para outro quadro e revalidar cache', async () => {
            (mockService.reordenarTarefas as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const input = { tarefaId: 'TASK-0001', quadroId: '550e8400-e29b-41d4-a716-446655440000' };
            const result = await actionMoverTarefaParaQuadro(input);

            expect(result.success).toBe(true);
            expect(mockService.reordenarTarefas).toHaveBeenCalledWith(mockUser.id, {
                tarefaId: 'TASK-0001',
                novaPosicao: 0,
                quadroId: '550e8400-e29b-41d4-a716-446655440000',
            });
            expect(revalidatePath).toHaveBeenCalledWith('/app/tarefas');
        });

        it('deve mover tarefa para quadro null (sem quadro)', async () => {
            (mockService.reordenarTarefas as jest.Mock).mockResolvedValue(ok(mockTarefa));

            const result = await actionMoverTarefaParaQuadro({ tarefaId: 'TASK-0001', quadroId: null });

            expect(result.success).toBe(true);
            expect(mockService.reordenarTarefas).toHaveBeenCalledWith(mockUser.id, {
                tarefaId: 'TASK-0001',
                novaPosicao: 0,
                quadroId: null,
            });
        });

        it('deve rejeitar tarefaId vazio (validação Zod)', async () => {
            const result = await actionMoverTarefaParaQuadro({ tarefaId: '', quadroId: null });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Erro de validação');
            }
            expect(mockService.reordenarTarefas).not.toHaveBeenCalled();
        });
    });
});
