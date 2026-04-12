import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';

// Helper to create a fresh chainable mock for each test
function createChainableMock(terminalResult: { data?: unknown; error: unknown | null }) {
    const chain: Record<string, jest.Mock> = {};
    const returnChain = () => chain;

    chain.from = jest.fn(returnChain);
    chain.select = jest.fn(returnChain);
    chain.insert = jest.fn(returnChain);
    chain.update = jest.fn(returnChain);
    chain.delete = jest.fn(returnChain);
    chain.eq = jest.fn(returnChain);
    chain.in = jest.fn(returnChain);
    chain.or = jest.fn(returnChain);
    chain.order = jest.fn(returnChain);
    chain.limit = jest.fn(returnChain);
    chain.range = jest.fn(returnChain);
    chain.single = jest.fn().mockResolvedValue(terminalResult);
    chain.maybeSingle = jest.fn().mockResolvedValue(terminalResult);

    // Make the chain itself thenable so `await chain.eq(...)` resolves
    chain.then = jest.fn((resolve: (v: unknown) => void) => {
        return Promise.resolve(terminalResult).then(resolve);
    });

    return chain;
}

let mockDb: ReturnType<typeof createChainableMock>;

jest.mock('@/lib/supabase', () => ({
    createDbClient: jest.fn(() => mockDb),
}));

const USUARIO_ID = 42;

const mockItemRow = {
    id: 'TASK-0001',
    usuario_id: USUARIO_ID,
    title: 'Tarefa teste',
    description: null,
    status: 'pending',
    priority: 'medium',
    due_date: null,
    reminder_at: null,
    starred: false,
    position: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    source: null,
    source_entity_id: null,
    label: 'feature',
};

describe('Tarefas Repository', () => {
    // =========================================================================
    // listTasks
    // =========================================================================
    describe('listTasks', () => {
        it('deve listar tarefas com sucesso', async () => {
            // listTasks does: main query, then 4 parallel queries for relations
            let awaitCount = 0;
            const results = [
                { data: [mockItemRow], error: null },       // main items query
                { data: [], error: null },                   // assignees
                { data: [], error: null },                   // subtasks
                { data: [], error: null },                   // comments
                { data: [], error: null },                   // files
            ];

            const chain: Record<string, jest.Mock> = {};
            const returnChain = () => chain;
            chain.from = jest.fn(returnChain);
            chain.select = jest.fn(returnChain);
            chain.eq = jest.fn(returnChain);
            chain.in = jest.fn(returnChain);
            chain.or = jest.fn(returnChain);
            chain.order = jest.fn(returnChain);
            chain.limit = jest.fn(returnChain);
            chain.range = jest.fn(returnChain);
            chain.then = jest.fn((resolve: (v: unknown) => void) => {
                return Promise.resolve(results[awaitCount++]).then(resolve);
            });

            mockDb = chain as ReturnType<typeof createChainableMock>;

            const result = await repository.listTasks(USUARIO_ID);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].id).toBe('TASK-0001');
                expect(result.data[0].title).toBe('Tarefa teste');
                expect(result.data[0].status).toBe('todo'); // 'pending' maps to 'todo'
            }
            expect(chain.from).toHaveBeenCalledWith('todo_items');
        });

        it('deve retornar lista vazia quando não há tarefas', async () => {
            const chain: Record<string, jest.Mock> = {};
            const returnChain = () => chain;
            chain.from = jest.fn(returnChain);
            chain.select = jest.fn(returnChain);
            chain.eq = jest.fn(returnChain);
            chain.order = jest.fn(returnChain);
            chain.then = jest.fn((resolve: (v: unknown) => void) => {
                return Promise.resolve({ data: [], error: null }).then(resolve);
            });

            mockDb = chain as ReturnType<typeof createChainableMock>;

            const result = await repository.listTasks(USUARIO_ID);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(0);
            }
        });

        it('deve retornar erro quando query falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'DB error', code: '500' } });

            const result = await repository.listTasks(USUARIO_ID);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // =========================================================================
    // getTaskById
    // =========================================================================
    describe('getTaskById', () => {
        it('deve buscar tarefa por id com sucesso', async () => {
            let awaitCount = 0;
            const results = [
                { data: mockItemRow, error: null },          // main query (maybeSingle)
                { data: [], error: null },                   // assignees
                { data: [], error: null },                   // subtasks
                { data: [], error: null },                   // comments
                { data: [], error: null },                   // files
            ];

            const chain: Record<string, jest.Mock> = {};
            const returnChain = () => chain;
            chain.from = jest.fn(returnChain);
            chain.select = jest.fn(returnChain);
            chain.eq = jest.fn(returnChain);
            chain.in = jest.fn(returnChain);
            chain.order = jest.fn(returnChain);
            chain.maybeSingle = jest.fn(() => Promise.resolve(results[awaitCount++]));
            chain.then = jest.fn((resolve: (v: unknown) => void) => {
                return Promise.resolve(results[awaitCount++]).then(resolve);
            });

            mockDb = chain as ReturnType<typeof createChainableMock>;

            const result = await repository.getTaskById(USUARIO_ID, 'TASK-0001');

            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.id).toBe('TASK-0001');
            }
        });

        it('deve retornar null quando tarefa não existe', async () => {
            const chain: Record<string, jest.Mock> = {};
            const returnChain = () => chain;
            chain.from = jest.fn(returnChain);
            chain.select = jest.fn(returnChain);
            chain.eq = jest.fn(returnChain);
            chain.maybeSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));

            mockDb = chain as ReturnType<typeof createChainableMock>;

            const result = await repository.getTaskById(USUARIO_ID, 'NONEXISTENT');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBeNull();
            }
        });

        it('deve retornar erro quando query falha', async () => {
            const chain: Record<string, jest.Mock> = {};
            const returnChain = () => chain;
            chain.from = jest.fn(returnChain);
            chain.select = jest.fn(returnChain);
            chain.eq = jest.fn(returnChain);
            chain.maybeSingle = jest.fn(() => Promise.resolve({ data: null, error: { message: 'DB error', code: '500' } }));

            mockDb = chain as ReturnType<typeof createChainableMock>;

            const result = await repository.getTaskById(USUARIO_ID, 'TASK-0001');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // =========================================================================
    // createTask
    // =========================================================================
    describe('createTask', () => {
        it('deve criar tarefa com sucesso', async () => {
            // createTask: insert().select().single() then getTaskById internally
            // We need to handle multiple awaits
            let awaitCount = 0;
            const results = [
                { data: mockItemRow, error: null },          // insert → single
                // getTaskById calls: maybeSingle, then 4 relation queries
                { data: mockItemRow, error: null },          // getTaskById maybeSingle
                { data: [], error: null },                   // assignees
                { data: [], error: null },                   // subtasks
                { data: [], error: null },                   // comments
                { data: [], error: null },                   // files
            ];

            const chain: Record<string, jest.Mock> = {};
            const returnChain = () => chain;
            chain.from = jest.fn(returnChain);
            chain.select = jest.fn(returnChain);
            chain.insert = jest.fn(returnChain);
            chain.eq = jest.fn(returnChain);
            chain.in = jest.fn(returnChain);
            chain.order = jest.fn(returnChain);
            chain.single = jest.fn(() => Promise.resolve(results[awaitCount++]));
            chain.maybeSingle = jest.fn(() => Promise.resolve(results[awaitCount++]));
            chain.then = jest.fn((resolve: (v: unknown) => void) => {
                return Promise.resolve(results[awaitCount++]).then(resolve);
            });

            mockDb = chain as ReturnType<typeof createChainableMock>;

            const result = await repository.createTask(USUARIO_ID, {
                title: 'Nova tarefa',
                status: 'todo',
                label: 'feature',
                priority: 'medium',
            });

            expect(result.success).toBe(true);
            expect(chain.from).toHaveBeenCalledWith('todo_items');
            expect(chain.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    usuario_id: USUARIO_ID,
                    title: 'Nova tarefa',
                    status: 'pending', // 'todo' maps to 'pending'
                })
            );
        });

        it('deve retornar erro quando insert falha', async () => {
            const chain: Record<string, jest.Mock> = {};
            const returnChain = () => chain;
            chain.from = jest.fn(returnChain);
            chain.select = jest.fn(returnChain);
            chain.insert = jest.fn(returnChain);
            chain.single = jest.fn(() => Promise.resolve({ data: null, error: { message: 'Insert error', code: '500' } }));

            mockDb = chain as ReturnType<typeof createChainableMock>;

            const result = await repository.createTask(USUARIO_ID, {
                title: 'Falha',
                status: 'todo',
                label: 'feature',
                priority: 'medium',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // =========================================================================
    // deleteTask
    // =========================================================================
    describe('deleteTask', () => {
        it('deve excluir tarefa com sucesso', async () => {
            mockDb = createChainableMock({ data: null, error: null });

            const result = await repository.deleteTask(USUARIO_ID, 'TASK-0001');

            expect(result.success).toBe(true);
            expect(mockDb.from).toHaveBeenCalledWith('todo_items');
        });

        it('deve retornar erro quando delete falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Delete error', code: '500' } });

            const result = await repository.deleteTask(USUARIO_ID, 'TASK-0001');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // =========================================================================
    // addComment
    // =========================================================================
    describe('addComment', () => {
        it('deve adicionar comentário com sucesso', async () => {
            // addComment: insert, then getTaskById
            let awaitCount = 0;
            const results = [
                { error: null },                             // insert comment
                { data: mockItemRow, error: null },          // getTaskById maybeSingle
                { data: [], error: null },                   // assignees
                { data: [], error: null },                   // subtasks
                { data: [], error: null },                   // comments
                { data: [], error: null },                   // files
            ];

            const chain: Record<string, jest.Mock> = {};
            const returnChain = () => chain;
            chain.from = jest.fn(returnChain);
            chain.select = jest.fn(returnChain);
            chain.insert = jest.fn(returnChain);
            chain.eq = jest.fn(returnChain);
            chain.in = jest.fn(returnChain);
            chain.order = jest.fn(returnChain);
            chain.maybeSingle = jest.fn(() => Promise.resolve(results[awaitCount++]));
            chain.then = jest.fn((resolve: (v: unknown) => void) => {
                return Promise.resolve(results[awaitCount++]).then(resolve);
            });

            mockDb = chain as ReturnType<typeof createChainableMock>;

            const result = await repository.addComment(USUARIO_ID, { taskId: 'TASK-0001', body: 'Comentário' });

            expect(result.success).toBe(true);
            expect(chain.from).toHaveBeenCalledWith('todo_comments');
            expect(chain.insert).toHaveBeenCalledWith({ todo_id: 'TASK-0001', body: 'Comentário' });
        });

        it('deve retornar erro quando insert falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Insert error', code: '500' } });

            const result = await repository.addComment(USUARIO_ID, { taskId: 'T-1', body: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // =========================================================================
    // deleteComment
    // =========================================================================
    describe('deleteComment', () => {
        it('deve retornar erro quando delete falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Delete error', code: '500' } });

            const result = await repository.deleteComment(USUARIO_ID, { taskId: 'T-1', commentId: 'C-1' });

            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // addFile
    // =========================================================================
    describe('addFile', () => {
        it('deve retornar erro quando insert falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Insert error', code: '500' } });

            const result = await repository.addFile(USUARIO_ID, { taskId: 'T-1', name: 'doc.pdf', url: '/f' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // =========================================================================
    // listQuadrosCustom
    // =========================================================================
    describe('listQuadrosCustom', () => {
        it('deve listar quadros custom com sucesso', async () => {
            const quadroRow = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                usuario_id: USUARIO_ID,
                titulo: 'Meu Quadro',
                tipo: 'custom',
                source: null,
                icone: null,
                ordem: 5,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };
            mockDb = createChainableMock({ data: [quadroRow], error: null });

            const result = await repository.listQuadrosCustom(USUARIO_ID);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].titulo).toBe('Meu Quadro');
                expect(result.data[0].tipo).toBe('custom');
            }
            expect(mockDb.from).toHaveBeenCalledWith('quadros');
        });

        it('deve retornar lista vazia quando tabela quadros não existe', async () => {
            mockDb = createChainableMock({
                data: null,
                error: { message: "Could not find the table 'public.quadros' in the schema cache", code: 'PGRST205' },
            });

            const result = await repository.listQuadrosCustom(USUARIO_ID);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(0);
            }
        });

        it('deve retornar erro para outros erros de DB', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Connection error', code: '500' } });

            const result = await repository.listQuadrosCustom(USUARIO_ID);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // =========================================================================
    // updateTaskPosition
    // =========================================================================
    describe('updateTaskPosition', () => {
        it('deve atualizar posição com sucesso', async () => {
            mockDb = createChainableMock({ data: null, error: null });

            const result = await repository.updateTaskPosition('TASK-0001', 5);

            expect(result.success).toBe(true);
            expect(mockDb.from).toHaveBeenCalledWith('todo_items');
            expect(mockDb.update).toHaveBeenCalledWith({ position: 5 });
        });

        it('deve retornar erro quando update falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Update error', code: '500' } });

            const result = await repository.updateTaskPosition('TASK-0001', 5);

            expect(result.success).toBe(false);
        });
    });

    // =========================================================================
    // updateTaskQuadro
    // =========================================================================
    describe('updateTaskQuadro', () => {
        it('deve atualizar quadro com sucesso', async () => {
            mockDb = createChainableMock({ data: null, error: null });

            const result = await repository.updateTaskQuadro('TASK-0001', '550e8400-e29b-41d4-a716-446655440000');

            expect(result.success).toBe(true);
            expect(mockDb.update).toHaveBeenCalledWith({ quadro_id: '550e8400-e29b-41d4-a716-446655440000' });
        });

        it('deve aceitar quadroId null', async () => {
            mockDb = createChainableMock({ data: null, error: null });

            const result = await repository.updateTaskQuadro('TASK-0001', null);

            expect(result.success).toBe(true);
            expect(mockDb.update).toHaveBeenCalledWith({ quadro_id: null });
        });

        it('deve retornar erro de infra quando coluna quadro_id não existe', async () => {
            mockDb = createChainableMock({
                data: null,
                error: { message: "Could not find the column 'quadro_id' of 'todo_items' in the schema cache", code: '42703' },
            });

            const result = await repository.updateTaskQuadro('TASK-0001', 'some-id');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });
    });
});
