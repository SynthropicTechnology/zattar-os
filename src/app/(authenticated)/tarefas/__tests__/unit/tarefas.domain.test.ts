import { describe, it, expect } from '@jest/globals';
import {
    taskStatusSchema,
    taskLabelSchema,
    taskPrioritySchema,
    taskAssigneeSchema,
    taskSubTaskSchema,
    taskCommentSchema,
    taskFileSchema,
    taskSchema,
    createTaskSchema,
    updateTaskSchema,
    listTasksSchema,
    createSubTaskSchema,
    updateSubTaskSchema,
    deleteSubTaskSchema,
    addCommentSchema,
    deleteCommentSchema,
    addFileSchema,
    removeFileSchema,
    materializeVirtualTaskSchema,
    quadroTipoSchema,
    quadroSourceSchema,
    quadroSchema,
    criarQuadroCustomSchema,
    excluirQuadroCustomSchema,
    reordenarTarefasSchema,
    systemBoardDndSchema,
    getSystemBoardBySlug,
    QUADROS_SISTEMA,
    SYSTEM_BOARD_DEFINITIONS,
} from '../../domain';

describe('Tarefas Domain', () => {
    // =========================================================================
    // Enum Schemas
    // =========================================================================
    describe('taskStatusSchema', () => {
        it('deve aceitar todos os status válidos', () => {
            const valid = ['backlog', 'todo', 'in progress', 'done', 'canceled'];
            for (const s of valid) {
                expect(taskStatusSchema.parse(s)).toBe(s);
            }
        });

        it('deve rejeitar status inválido', () => {
            expect(() => taskStatusSchema.parse('open')).toThrow();
        });
    });

    describe('taskLabelSchema', () => {
        it('deve aceitar labels válidas', () => {
            const valid = ['bug', 'feature', 'documentation', 'audiencia', 'expediente', 'pericia', 'obrigacao'];
            for (const l of valid) {
                expect(taskLabelSchema.parse(l)).toBe(l);
            }
        });

        it('deve rejeitar label inválida', () => {
            expect(() => taskLabelSchema.parse('task')).toThrow();
        });
    });

    describe('taskPrioritySchema', () => {
        it('deve aceitar prioridades válidas', () => {
            expect(taskPrioritySchema.parse('low')).toBe('low');
            expect(taskPrioritySchema.parse('medium')).toBe('medium');
            expect(taskPrioritySchema.parse('high')).toBe('high');
        });

        it('deve rejeitar prioridade inválida', () => {
            expect(() => taskPrioritySchema.parse('critical')).toThrow();
        });
    });

    // =========================================================================
    // Sub-Entity Schemas
    // =========================================================================
    describe('taskAssigneeSchema', () => {
        it('deve aceitar assignee válido', () => {
            const assignee = { id: 1, name: 'João', email: 'joao@test.com', avatarUrl: null };
            expect(taskAssigneeSchema.parse(assignee)).toEqual(assignee);
        });

        it('deve aceitar assignee sem email e avatar', () => {
            const parsed = taskAssigneeSchema.parse({ id: 1, name: 'Maria' });
            expect(parsed.id).toBe(1);
            expect(parsed.name).toBe('Maria');
        });

        it('deve rejeitar id não positivo', () => {
            expect(() => taskAssigneeSchema.parse({ id: 0, name: 'X' })).toThrow();
        });

        it('deve rejeitar nome vazio', () => {
            expect(() => taskAssigneeSchema.parse({ id: 1, name: '' })).toThrow();
        });
    });

    describe('taskSubTaskSchema', () => {
        it('deve aceitar subtarefa válida', () => {
            const sub = { id: 'st-1', title: 'Subtarefa', completed: false, position: 0 };
            expect(taskSubTaskSchema.parse(sub)).toEqual(sub);
        });

        it('deve rejeitar título vazio', () => {
            expect(() => taskSubTaskSchema.parse({ id: 'st-1', title: '', completed: false, position: 0 })).toThrow();
        });

        it('deve rejeitar posição negativa', () => {
            expect(() => taskSubTaskSchema.parse({ id: 'st-1', title: 'X', completed: false, position: -1 })).toThrow();
        });
    });

    describe('taskCommentSchema', () => {
        it('deve aceitar comentário válido', () => {
            const comment = { id: 'c-1', body: 'Comentário', createdAt: '2024-01-01T00:00:00Z' };
            expect(taskCommentSchema.parse(comment)).toEqual(comment);
        });

        it('deve rejeitar body vazio', () => {
            expect(() => taskCommentSchema.parse({ id: 'c-1', body: '', createdAt: '2024-01-01' })).toThrow();
        });
    });

    describe('taskFileSchema', () => {
        it('deve aceitar arquivo válido', () => {
            const file = { id: 'f-1', name: 'doc.pdf', url: '/files/doc.pdf', type: 'application/pdf', size: 1024, uploadedAt: '2024-01-01T00:00:00Z' };
            expect(taskFileSchema.parse(file)).toEqual(file);
        });

        it('deve aceitar arquivo sem type e size', () => {
            const parsed = taskFileSchema.parse({ id: 'f-1', name: 'doc.pdf', url: '/files/doc.pdf', uploadedAt: '2024-01-01' });
            expect(parsed.type).toBeUndefined();
            expect(parsed.size).toBeUndefined();
        });
    });

    // =========================================================================
    // Task Schema
    // =========================================================================
    describe('taskSchema', () => {
        const validTask = {
            id: 'TASK-0001',
            title: 'Minha tarefa',
            status: 'todo' as const,
            label: 'feature' as const,
            priority: 'medium' as const,
        };

        it('deve aceitar tarefa com campos mínimos (defaults aplicados)', () => {
            const parsed = taskSchema.parse(validTask);
            expect(parsed.id).toBe('TASK-0001');
            expect(parsed.starred).toBe(false);
            expect(parsed.assignees).toEqual([]);
            expect(parsed.subTasks).toEqual([]);
            expect(parsed.comments).toEqual([]);
            expect(parsed.files).toEqual([]);
        });

        it('deve aceitar tarefa completa', () => {
            const full = {
                ...validTask,
                description: 'Descrição',
                dueDate: '2024-12-31',
                reminderDate: '2024-12-30T10:00:00Z',
                starred: true,
                assignees: [{ id: 1, name: 'João' }],
                subTasks: [{ id: 'st-1', title: 'Sub', completed: false, position: 0 }],
                comments: [{ id: 'c-1', body: 'Nota', createdAt: '2024-01-01' }],
                files: [{ id: 'f-1', name: 'doc.pdf', url: '/f', uploadedAt: '2024-01-01' }],
                position: 5,
                quadroId: '550e8400-e29b-41d4-a716-446655440000',
                source: 'audiencias',
                sourceEntityId: '123',
            };
            const parsed = taskSchema.parse(full);
            expect(parsed.starred).toBe(true);
            expect(parsed.assignees).toHaveLength(1);
        });

        it('deve rejeitar tarefa sem id', () => {
            expect(() => taskSchema.parse({ ...validTask, id: undefined })).toThrow();
        });

        it('deve rejeitar tarefa com título vazio', () => {
            expect(() => taskSchema.parse({ ...validTask, title: '' })).toThrow();
        });
    });

    // =========================================================================
    // Create / Update / List Schemas
    // =========================================================================
    describe('createTaskSchema', () => {
        it('deve aceitar input mínimo', () => {
            const parsed = createTaskSchema.parse({
                title: 'Nova tarefa',
                status: 'todo',
                label: 'feature',
                priority: 'medium',
            });
            expect(parsed.title).toBe('Nova tarefa');
        });

        it('deve rejeitar título vazio', () => {
            expect(() => createTaskSchema.parse({ title: '', status: 'todo', label: 'feature', priority: 'medium' })).toThrow();
        });
    });

    describe('updateTaskSchema', () => {
        it('deve aceitar atualização parcial', () => {
            const parsed = updateTaskSchema.parse({ id: 'TASK-0001', title: 'Novo título' });
            expect(parsed.id).toBe('TASK-0001');
            expect(parsed.title).toBe('Novo título');
        });

        it('deve aceitar apenas id', () => {
            const parsed = updateTaskSchema.parse({ id: 'TASK-0001' });
            expect(parsed.id).toBe('TASK-0001');
            expect(parsed.title).toBeUndefined();
        });

        it('deve rejeitar id vazio', () => {
            expect(() => updateTaskSchema.parse({ id: '' })).toThrow();
        });
    });

    describe('listTasksSchema', () => {
        it('deve aceitar objeto vazio', () => {
            expect(listTasksSchema.parse({})).toEqual({});
        });

        it('deve aceitar filtros válidos', () => {
            const parsed = listTasksSchema.parse({ status: 'done', priority: 'high', search: 'test' });
            expect(parsed.status).toBe('done');
            expect(parsed.priority).toBe('high');
        });
    });

    // =========================================================================
    // Sub-Entity Action Schemas
    // =========================================================================
    describe('createSubTaskSchema', () => {
        it('deve aceitar input válido', () => {
            const parsed = createSubTaskSchema.parse({ taskId: 'TASK-1', title: 'Sub' });
            expect(parsed.taskId).toBe('TASK-1');
        });

        it('deve rejeitar taskId vazio', () => {
            expect(() => createSubTaskSchema.parse({ taskId: '', title: 'Sub' })).toThrow();
        });
    });

    describe('updateSubTaskSchema', () => {
        it('deve aceitar input válido', () => {
            const parsed = updateSubTaskSchema.parse({ taskId: 'T-1', subTaskId: 'ST-1', completed: true });
            expect(parsed.completed).toBe(true);
        });
    });

    describe('deleteSubTaskSchema', () => {
        it('deve aceitar input válido', () => {
            expect(deleteSubTaskSchema.parse({ taskId: 'T-1', subTaskId: 'ST-1' })).toEqual({ taskId: 'T-1', subTaskId: 'ST-1' });
        });
    });

    describe('addCommentSchema', () => {
        it('deve aceitar input válido', () => {
            const parsed = addCommentSchema.parse({ taskId: 'T-1', body: 'Comentário' });
            expect(parsed.body).toBe('Comentário');
        });

        it('deve rejeitar body vazio', () => {
            expect(() => addCommentSchema.parse({ taskId: 'T-1', body: '' })).toThrow();
        });
    });

    describe('deleteCommentSchema', () => {
        it('deve aceitar input válido', () => {
            expect(deleteCommentSchema.parse({ taskId: 'T-1', commentId: 'C-1' })).toEqual({ taskId: 'T-1', commentId: 'C-1' });
        });
    });

    describe('addFileSchema', () => {
        it('deve aceitar input válido', () => {
            const parsed = addFileSchema.parse({ taskId: 'T-1', name: 'doc.pdf', url: '/files/doc.pdf' });
            expect(parsed.name).toBe('doc.pdf');
        });

        it('deve rejeitar nome vazio', () => {
            expect(() => addFileSchema.parse({ taskId: 'T-1', name: '', url: '/f' })).toThrow();
        });
    });

    describe('removeFileSchema', () => {
        it('deve aceitar input válido', () => {
            expect(removeFileSchema.parse({ taskId: 'T-1', fileId: 'F-1' })).toEqual({ taskId: 'T-1', fileId: 'F-1' });
        });
    });

    describe('materializeVirtualTaskSchema', () => {
        it('deve aceitar input válido', () => {
            const parsed = materializeVirtualTaskSchema.parse({
                title: 'Audiência X',
                status: 'todo',
                label: 'audiencia',
                priority: 'high',
                source: 'audiencias',
                sourceEntityId: '123',
            });
            expect(parsed.source).toBe('audiencias');
        });

        it('deve rejeitar source vazio', () => {
            expect(() => materializeVirtualTaskSchema.parse({
                title: 'X', status: 'todo', label: 'feature', priority: 'low', source: '', sourceEntityId: '1',
            })).toThrow();
        });
    });

    // =========================================================================
    // Quadro Schemas
    // =========================================================================
    describe('quadroTipoSchema', () => {
        it('deve aceitar tipos válidos', () => {
            expect(quadroTipoSchema.parse('sistema')).toBe('sistema');
            expect(quadroTipoSchema.parse('custom')).toBe('custom');
        });

        it('deve rejeitar tipo inválido', () => {
            expect(() => quadroTipoSchema.parse('outro')).toThrow();
        });
    });

    describe('quadroSourceSchema', () => {
        it('deve aceitar sources válidas', () => {
            const valid = ['expedientes', 'audiencias', 'pericias', 'obrigacoes'];
            for (const s of valid) {
                expect(quadroSourceSchema.parse(s)).toBe(s);
            }
        });
    });

    describe('quadroSchema', () => {
        it('deve aceitar quadro válido', () => {
            const quadro = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                usuarioId: 1,
                titulo: 'Meu Quadro',
                tipo: 'custom' as const,
                source: null,
                ordem: 0,
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
            };
            const parsed = quadroSchema.parse(quadro);
            expect(parsed.titulo).toBe('Meu Quadro');
        });
    });

    describe('criarQuadroCustomSchema', () => {
        it('deve aceitar input válido', () => {
            const parsed = criarQuadroCustomSchema.parse({ titulo: 'Novo Quadro' });
            expect(parsed.titulo).toBe('Novo Quadro');
        });

        it('deve rejeitar título vazio', () => {
            expect(() => criarQuadroCustomSchema.parse({ titulo: '' })).toThrow();
        });

        it('deve rejeitar título com mais de 100 caracteres', () => {
            expect(() => criarQuadroCustomSchema.parse({ titulo: 'a'.repeat(101) })).toThrow();
        });
    });

    describe('excluirQuadroCustomSchema', () => {
        it('deve aceitar UUID válido', () => {
            const parsed = excluirQuadroCustomSchema.parse({ quadroId: '550e8400-e29b-41d4-a716-446655440000' });
            expect(parsed.quadroId).toBe('550e8400-e29b-41d4-a716-446655440000');
        });

        it('deve rejeitar UUID inválido', () => {
            expect(() => excluirQuadroCustomSchema.parse({ quadroId: 'not-a-uuid' })).toThrow();
        });
    });

    describe('reordenarTarefasSchema', () => {
        it('deve aceitar input válido', () => {
            const parsed = reordenarTarefasSchema.parse({ tarefaId: 'T-1', novaPosicao: 3 });
            expect(parsed.novaPosicao).toBe(3);
        });

        it('deve rejeitar posição negativa', () => {
            expect(() => reordenarTarefasSchema.parse({ tarefaId: 'T-1', novaPosicao: -1 })).toThrow();
        });
    });

    describe('systemBoardDndSchema', () => {
        it('deve aceitar input válido', () => {
            const parsed = systemBoardDndSchema.parse({
                source: 'audiencias',
                entityId: '123',
                targetColumnId: 'marcadas',
            });
            expect(parsed.source).toBe('audiencias');
        });

        it('deve rejeitar source inválida', () => {
            expect(() => systemBoardDndSchema.parse({
                source: 'invalid',
                entityId: '123',
                targetColumnId: 'col',
            })).toThrow();
        });
    });

    // =========================================================================
    // Constants & Helpers
    // =========================================================================
    describe('QUADROS_SISTEMA', () => {
        it('deve conter 4 quadros sistema', () => {
            expect(QUADROS_SISTEMA).toHaveLength(4);
        });

        it('deve ter IDs com prefixo sys-', () => {
            for (const q of QUADROS_SISTEMA) {
                expect(q.id).toMatch(/^sys-/);
            }
        });
    });

    describe('SYSTEM_BOARD_DEFINITIONS', () => {
        it('deve conter 4 definições', () => {
            expect(SYSTEM_BOARD_DEFINITIONS).toHaveLength(4);
        });

        it('cada definição deve ter pelo menos uma coluna', () => {
            for (const def of SYSTEM_BOARD_DEFINITIONS) {
                expect(def.columns.length).toBeGreaterThan(0);
            }
        });
    });

    describe('getSystemBoardBySlug', () => {
        it('deve retornar definição para slug válido', () => {
            const board = getSystemBoardBySlug('expedientes');
            expect(board).toBeDefined();
            expect(board!.titulo).toBe('Expedientes');
        });

        it('deve retornar undefined para slug inválido', () => {
            expect(getSystemBoardBySlug('inexistente')).toBeUndefined();
        });
    });
});
