import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../repository');
jest.mock('@/lib/event-aggregation/service', () => ({
    listarTodosEventos: jest.fn().mockResolvedValue([]),
    atualizarStatusEntidadeOrigem: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock('@/lib/event-aggregation/domain', () => ({
    mapSourceStatusToTarefaStatus: jest.fn().mockReturnValue('todo'),
    calcularPrioridade: jest.fn().mockReturnValue('medium'),
}));

import * as service from '../../service';
import * as repository from '../../repository';
import { ok, err, appError } from '@/types';

const USUARIO_ID = 42;

const mockTask = {
    id: 'TASK-0001',
    title: 'Tarefa teste',
    status: 'todo' as const,
    label: 'feature' as const,
    priority: 'medium' as const,
    starred: false,
    assignees: [],
    assignedTo: [],
    subTasks: [],
    comments: [],
    files: [],
};

describe('Tarefas Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // listarTarefas
    // =========================================================================
    describe('listarTarefas', () => {
        it('deve listar tarefas com sucesso', async () => {
            (repository.listTasks as jest.Mock).mockResolvedValue(ok([mockTask]));

            const result = await service.listarTarefas(USUARIO_ID);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].id).toBe('TASK-0001');
            }
            expect(repository.listTasks).toHaveBeenCalledWith(USUARIO_ID, {});
        });

        it('deve passar parâmetros de filtro ao repository', async () => {
            (repository.listTasks as jest.Mock).mockResolvedValue(ok([]));

            await service.listarTarefas(USUARIO_ID, { status: 'done', priority: 'high' });

            expect(repository.listTasks).toHaveBeenCalledWith(USUARIO_ID, { status: 'done', priority: 'high' });
        });

        it('deve retornar erro de validação para params inválidos', async () => {
            const result = await service.listarTarefas(USUARIO_ID, { status: 'invalid' as never });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
            expect(repository.listTasks).not.toHaveBeenCalled();
        });

        it('deve propagar erro do repository', async () => {
            (repository.listTasks as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro DB'))
            );

            const result = await service.listarTarefas(USUARIO_ID);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // =========================================================================
    // buscarTarefa
    // =========================================================================
    describe('buscarTarefa', () => {
        it('deve buscar tarefa por id', async () => {
            (repository.getTaskById as jest.Mock).mockResolvedValue(ok(mockTask));

            const result = await service.buscarTarefa(USUARIO_ID, 'TASK-0001');

            expect(result.success).toBe(true);
            expect(repository.getTaskById).toHaveBeenCalledWith(USUARIO_ID, 'TASK-0001');
        });

        it('deve retornar erro para id vazio', async () => {
            const result = await service.buscarTarefa(USUARIO_ID, '');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
            expect(repository.getTaskById).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // criarTarefa
    // =========================================================================
    describe('criarTarefa', () => {
        it('deve criar tarefa com input válido', async () => {
            (repository.createTask as jest.Mock).mockResolvedValue(ok(mockTask));

            const result = await service.criarTarefa(USUARIO_ID, {
                title: 'Nova tarefa',
                status: 'todo',
                label: 'feature',
                priority: 'medium',
            });

            expect(result.success).toBe(true);
            expect(repository.createTask).toHaveBeenCalledWith(
                USUARIO_ID,
                expect.objectContaining({ title: 'Nova tarefa', status: 'todo' })
            );
        });

        it('deve retornar erro de validação para título vazio', async () => {
            const result = await service.criarTarefa(USUARIO_ID, {
                title: '',
                status: 'todo',
                label: 'feature',
                priority: 'medium',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
            expect(repository.createTask).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // atualizarTarefa
    // =========================================================================
    describe('atualizarTarefa', () => {
        it('deve atualizar tarefa com sucesso', async () => {
            (repository.updateTask as jest.Mock).mockResolvedValue(ok({ ...mockTask, title: 'Atualizada' }));

            const result = await service.atualizarTarefa(USUARIO_ID, { id: 'TASK-0001', title: 'Atualizada' });

            expect(result.success).toBe(true);
            expect(repository.updateTask).toHaveBeenCalledWith(
                USUARIO_ID,
                expect.objectContaining({ id: 'TASK-0001', title: 'Atualizada' })
            );
        });

        it('deve retornar erro de validação para id vazio', async () => {
            const result = await service.atualizarTarefa(USUARIO_ID, { id: '', title: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });
    });

    // =========================================================================
    // removerTarefa
    // =========================================================================
    describe('removerTarefa', () => {
        it('deve remover tarefa com sucesso', async () => {
            (repository.deleteTask as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await service.removerTarefa(USUARIO_ID, 'TASK-0001');

            expect(result.success).toBe(true);
            expect(repository.deleteTask).toHaveBeenCalledWith(USUARIO_ID, 'TASK-0001');
        });

        it('deve retornar erro para id vazio', async () => {
            const result = await service.removerTarefa(USUARIO_ID, '');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });

        it('deve propagar erro do repository', async () => {
            (repository.deleteTask as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro ao excluir'))
            );

            const result = await service.removerTarefa(USUARIO_ID, 'TASK-0001');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // =========================================================================
    // criarSubtarefa
    // =========================================================================
    describe('criarSubtarefa', () => {
        it('deve criar subtarefa com input válido', async () => {
            (repository.createSubTask as jest.Mock).mockResolvedValue(ok(mockTask));

            const result = await service.criarSubtarefa(USUARIO_ID, { taskId: 'T-1', title: 'Sub' });

            expect(result.success).toBe(true);
            expect(repository.createSubTask).toHaveBeenCalledWith(
                USUARIO_ID,
                { taskId: 'T-1', title: 'Sub' }
            );
        });

        it('deve retornar erro de validação para título vazio', async () => {
            const result = await service.criarSubtarefa(USUARIO_ID, { taskId: 'T-1', title: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });
    });

    // =========================================================================
    // atualizarSubtarefa
    // =========================================================================
    describe('atualizarSubtarefa', () => {
        it('deve atualizar subtarefa com sucesso', async () => {
            (repository.updateSubTask as jest.Mock).mockResolvedValue(ok(mockTask));

            const result = await service.atualizarSubtarefa(USUARIO_ID, { taskId: 'T-1', subTaskId: 'ST-1', completed: true });

            expect(result.success).toBe(true);
            expect(repository.updateSubTask).toHaveBeenCalledWith(
                USUARIO_ID,
                { taskId: 'T-1', subTaskId: 'ST-1', completed: true }
            );
        });
    });

    // =========================================================================
    // removerSubtarefa
    // =========================================================================
    describe('removerSubtarefa', () => {
        it('deve remover subtarefa com sucesso', async () => {
            (repository.deleteSubTask as jest.Mock).mockResolvedValue(ok(mockTask));

            const result = await service.removerSubtarefa(USUARIO_ID, { taskId: 'T-1', subTaskId: 'ST-1' });

            expect(result.success).toBe(true);
            expect(repository.deleteSubTask).toHaveBeenCalledWith(
                USUARIO_ID,
                { taskId: 'T-1', subTaskId: 'ST-1' }
            );
        });
    });

    // =========================================================================
    // adicionarComentario
    // =========================================================================
    describe('adicionarComentario', () => {
        it('deve adicionar comentário com sucesso', async () => {
            (repository.addComment as jest.Mock).mockResolvedValue(ok(mockTask));

            const result = await service.adicionarComentario(USUARIO_ID, { taskId: 'T-1', body: 'Comentário' });

            expect(result.success).toBe(true);
            expect(repository.addComment).toHaveBeenCalledWith(
                USUARIO_ID,
                { taskId: 'T-1', body: 'Comentário' }
            );
        });

        it('deve retornar erro para body vazio', async () => {
            const result = await service.adicionarComentario(USUARIO_ID, { taskId: 'T-1', body: '' });

            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // removerComentario
    // =========================================================================
    describe('removerComentario', () => {
        it('deve remover comentário com sucesso', async () => {
            (repository.deleteComment as jest.Mock).mockResolvedValue(ok(mockTask));

            const result = await service.removerComentario(USUARIO_ID, { taskId: 'T-1', commentId: 'C-1' });

            expect(result.success).toBe(true);
        });
    });

    // =========================================================================
    // adicionarAnexo
    // =========================================================================
    describe('adicionarAnexo', () => {
        it('deve adicionar anexo com sucesso', async () => {
            (repository.addFile as jest.Mock).mockResolvedValue(ok(mockTask));

            const result = await service.adicionarAnexo(USUARIO_ID, { taskId: 'T-1', name: 'doc.pdf', url: '/files/doc.pdf' });

            expect(result.success).toBe(true);
            expect(repository.addFile).toHaveBeenCalledWith(
                USUARIO_ID,
                expect.objectContaining({ taskId: 'T-1', name: 'doc.pdf' })
            );
        });

        it('deve rejeitar anexo com URL muito grande', async () => {
            const result = await service.adicionarAnexo(USUARIO_ID, {
                taskId: 'T-1',
                name: 'big.pdf',
                url: 'x'.repeat(2_500_001),
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
            expect(repository.addFile).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // removerAnexo
    // =========================================================================
    describe('removerAnexo', () => {
        it('deve remover anexo com sucesso', async () => {
            (repository.removeFile as jest.Mock).mockResolvedValue(ok(mockTask));

            const result = await service.removerAnexo(USUARIO_ID, { taskId: 'T-1', fileId: 'F-1' });

            expect(result.success).toBe(true);
        });
    });

    // =========================================================================
    // materializarTarefaVirtual
    // =========================================================================
    describe('materializarTarefaVirtual', () => {
        it('deve materializar tarefa virtual nova', async () => {
            (repository.findTaskBySource as jest.Mock).mockResolvedValue(ok(null));
            (repository.createTaskWithSource as jest.Mock).mockResolvedValue(ok(mockTask));

            const result = await service.materializarTarefaVirtual(USUARIO_ID, {
                title: 'Audiência X',
                status: 'todo',
                label: 'audiencia',
                priority: 'high',
                source: 'audiencias',
                sourceEntityId: '123',
            });

            expect(result.success).toBe(true);
            expect(repository.findTaskBySource).toHaveBeenCalledWith(USUARIO_ID, 'audiencias', '123');
            expect(repository.createTaskWithSource).toHaveBeenCalled();
        });

        it('deve retornar tarefa existente se já materializada', async () => {
            const existing = { ...mockTask, source: 'audiencias', sourceEntityId: '123' };
            (repository.findTaskBySource as jest.Mock).mockResolvedValue(ok(existing));

            const result = await service.materializarTarefaVirtual(USUARIO_ID, {
                title: 'Audiência X',
                status: 'todo',
                label: 'audiencia',
                priority: 'high',
                source: 'audiencias',
                sourceEntityId: '123',
            });

            expect(result.success).toBe(true);
            expect(repository.createTaskWithSource).not.toHaveBeenCalled();
        });

        it('deve retornar erro de validação para input inválido', async () => {
            const result = await service.materializarTarefaVirtual(USUARIO_ID, {
                title: '',
                status: 'todo',
                label: 'audiencia',
                priority: 'high',
                source: 'audiencias',
                sourceEntityId: '123',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });
    });

    // =========================================================================
    // listarQuadros
    // =========================================================================
    describe('listarQuadros', () => {
        it('deve retornar quadros sistema + custom', async () => {
            const customQuadro = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                usuarioId: USUARIO_ID,
                titulo: 'Meu Quadro',
                tipo: 'custom' as const,
                source: null,
                ordem: 5,
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };
            (repository.listQuadrosCustom as jest.Mock).mockResolvedValue(ok([customQuadro]));

            const result = await service.listarQuadros(USUARIO_ID);

            expect(result.success).toBe(true);
            if (result.success) {
                // 4 sistema + 1 custom
                expect(result.data.length).toBe(5);
            }
        });

        it('deve retornar apenas quadros sistema quando custom falha', async () => {
            (repository.listQuadrosCustom as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro'))
            );

            const result = await service.listarQuadros(USUARIO_ID);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.length).toBe(4);
            }
        });
    });

    // =========================================================================
    // criarQuadroCustom
    // =========================================================================
    describe('criarQuadroCustom', () => {
        it('deve criar quadro custom com sucesso', async () => {
            const quadro = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                usuarioId: USUARIO_ID,
                titulo: 'Novo Quadro',
                tipo: 'custom' as const,
                source: null,
                ordem: 5,
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };
            (repository.createQuadroCustom as jest.Mock).mockResolvedValue(ok(quadro));

            const result = await service.criarQuadroCustom(USUARIO_ID, { titulo: 'Novo Quadro' });

            expect(result.success).toBe(true);
        });

        it('deve rejeitar título vazio', async () => {
            const result = await service.criarQuadroCustom(USUARIO_ID, { titulo: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });
    });

    // =========================================================================
    // excluirQuadroCustom
    // =========================================================================
    describe('excluirQuadroCustom', () => {
        it('deve excluir quadro custom com sucesso', async () => {
            (repository.deleteQuadroCustom as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await service.excluirQuadroCustom(USUARIO_ID, {
                quadroId: '550e8400-e29b-41d4-a716-446655440000',
            });

            expect(result.success).toBe(true);
        });

        it('deve rejeitar exclusão de quadro sistema', async () => {
            const result = await service.excluirQuadroCustom(USUARIO_ID, {
                quadroId: 'sys-expedientes',
            });

            // sys-expedientes is not a valid UUID, so it fails validation
            expect(result.success).toBe(false);
        });
    });
});
