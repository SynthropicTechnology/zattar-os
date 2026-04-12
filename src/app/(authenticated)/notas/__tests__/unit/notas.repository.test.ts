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
    chain.order = jest.fn(returnChain);
    chain.single = jest.fn().mockResolvedValue(terminalResult);

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

describe('Notas Repository', () => {
    // ---------------------------------------------------------------------------
    // listEtiquetas
    // ---------------------------------------------------------------------------
    describe('listEtiquetas', () => {
        it('deve listar etiquetas do usuário', async () => {
            const rows = [
                { id: 1, usuario_id: USUARIO_ID, title: 'Urgente', color: '#f00', created_at: '', updated_at: '' },
            ];
            mockDb = createChainableMock({ data: rows, error: null });

            const result = await repository.listEtiquetas(USUARIO_ID);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0]).toEqual({ id: 1, title: 'Urgente', color: '#f00' });
            }
            expect(mockDb.from).toHaveBeenCalledWith('nota_etiquetas');
            expect(mockDb.eq).toHaveBeenCalledWith('usuario_id', USUARIO_ID);
        });

        it('deve retornar erro quando query falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'DB error', code: '500' } });

            const result = await repository.listEtiquetas(USUARIO_ID);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // ---------------------------------------------------------------------------
    // listNotas
    // ---------------------------------------------------------------------------
    describe('listNotas', () => {
        it('deve listar notas não arquivadas com labels', async () => {
            const notaRows = [
                {
                    id: 1, usuario_id: USUARIO_ID, titulo: 'Nota 1', conteudo: 'Conteúdo',
                    is_archived: false, tipo: 'text', items: null, image_url: null,
                    created_at: '', updated_at: '',
                },
            ];

            // listNotas does two queries: first for notas, then for vinculos
            // We need a mock that returns different results for different awaits
            let awaitCount = 0;
            const results = [
                { data: notaRows, error: null },                          // notas query
                { data: [{ nota_id: 1, etiqueta_id: 5 }], error: null }, // vinculos query
            ];

            const chain: Record<string, jest.Mock> = {};
            const returnChain = () => chain;
            chain.from = jest.fn(returnChain);
            chain.select = jest.fn(returnChain);
            chain.eq = jest.fn(returnChain);
            chain.in = jest.fn(returnChain);
            chain.order = jest.fn(returnChain);
            chain.then = jest.fn((resolve: (v: unknown) => void) => {
                return Promise.resolve(results[awaitCount++]).then(resolve);
            });

            mockDb = chain as ReturnType<typeof createChainableMock>;

            const result = await repository.listNotas(USUARIO_ID, false);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].id).toBe(1);
                expect(result.data[0].title).toBe('Nota 1');
                expect(result.data[0].labels).toEqual([5]);
            }
        });

        it('deve retornar lista vazia quando não há notas', async () => {
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

            const result = await repository.listNotas(USUARIO_ID, true);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(0);
            }
        });

        it('deve retornar erro quando query de notas falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'DB error', code: '500' } });

            const result = await repository.listNotas(USUARIO_ID, false);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // ---------------------------------------------------------------------------
    // createEtiqueta
    // ---------------------------------------------------------------------------
    describe('createEtiqueta', () => {
        it('deve criar etiqueta com sucesso', async () => {
            const row = { id: 1, usuario_id: USUARIO_ID, title: 'Nova', color: 'blue', created_at: '', updated_at: '' };
            mockDb = createChainableMock({ data: row, error: null });

            const result = await repository.createEtiqueta(USUARIO_ID, { title: 'Nova', color: 'blue' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ id: 1, title: 'Nova', color: 'blue' });
            }
            expect(mockDb.from).toHaveBeenCalledWith('nota_etiquetas');
            expect(mockDb.insert).toHaveBeenCalledWith({
                usuario_id: USUARIO_ID,
                title: 'Nova',
                color: 'blue',
            });
        });

        it('deve retornar erro quando insert falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Duplicate', code: '23505' } });

            const result = await repository.createEtiqueta(USUARIO_ID, { title: 'X', color: 'red' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // ---------------------------------------------------------------------------
    // updateEtiqueta
    // ---------------------------------------------------------------------------
    describe('updateEtiqueta', () => {
        it('deve atualizar etiqueta com sucesso', async () => {
            const row = { id: 1, usuario_id: USUARIO_ID, title: 'Atualizada', color: 'green', created_at: '', updated_at: '' };
            mockDb = createChainableMock({ data: row, error: null });

            const result = await repository.updateEtiqueta(USUARIO_ID, { id: 1, title: 'Atualizada' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.title).toBe('Atualizada');
            }
            expect(mockDb.update).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Atualizada' })
            );
        });

        it('deve retornar erro quando update falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Not found', code: '404' } });

            const result = await repository.updateEtiqueta(USUARIO_ID, { id: 999, title: 'X' });

            expect(result.success).toBe(false);
        });
    });

    // ---------------------------------------------------------------------------
    // deleteEtiqueta
    // ---------------------------------------------------------------------------
    describe('deleteEtiqueta', () => {
        it('deve excluir etiqueta com sucesso', async () => {
            mockDb = createChainableMock({ data: null, error: null });

            const result = await repository.deleteEtiqueta(USUARIO_ID, 1);

            expect(result.success).toBe(true);
            expect(mockDb.from).toHaveBeenCalledWith('nota_etiquetas');
        });

        it('deve retornar erro quando delete falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'FK constraint', code: '23503' } });

            const result = await repository.deleteEtiqueta(USUARIO_ID, 1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // ---------------------------------------------------------------------------
    // createNota
    // ---------------------------------------------------------------------------
    describe('createNota', () => {
        it('deve criar nota sem labels', async () => {
            const row = {
                id: 1, usuario_id: USUARIO_ID, titulo: 'Nova nota', conteudo: '',
                is_archived: false, tipo: 'text', items: null, image_url: null,
                created_at: '', updated_at: '',
            };
            mockDb = createChainableMock({ data: row, error: null });

            const result = await repository.createNota(USUARIO_ID, {
                title: 'Nova nota',
                type: 'text',
                isArchived: false,
                labels: [],
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(1);
                expect(result.data.title).toBe('Nova nota');
                expect(result.data.labels).toEqual([]);
            }
            expect(mockDb.from).toHaveBeenCalledWith('notas');
        });

        it('deve criar nota com labels e inserir vínculos', async () => {
            const row = {
                id: 2, usuario_id: USUARIO_ID, titulo: 'Com labels', conteudo: 'Conteúdo',
                is_archived: false, tipo: 'text', items: null, image_url: null,
                created_at: '', updated_at: '',
            };

            // createNota does: insert().select().single() for the nota, then insert() for vinculos
            let awaitCount = 0;
            const results = [
                { data: row, error: null },  // nota insert → single()
                { error: null },             // vinculos insert
            ];

            const chain: Record<string, jest.Mock> = {};
            const returnChain = () => chain;
            chain.from = jest.fn(returnChain);
            chain.select = jest.fn(returnChain);
            chain.insert = jest.fn(returnChain);
            chain.single = jest.fn(() => {
                const result = results[awaitCount++];
                return Promise.resolve(result);
            });
            chain.then = jest.fn((resolve: (v: unknown) => void) => {
                return Promise.resolve(results[awaitCount++]).then(resolve);
            });

            mockDb = chain as ReturnType<typeof createChainableMock>;

            const result = await repository.createNota(USUARIO_ID, {
                title: 'Com labels',
                content: 'Conteúdo',
                type: 'text',
                isArchived: false,
                labels: [1, 2],
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.labels).toEqual([1, 2]);
            }
        });

        it('deve retornar erro quando insert de nota falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Insert error', code: '500' } });

            const result = await repository.createNota(USUARIO_ID, {
                title: 'Falha',
                type: 'text',
                isArchived: false,
                labels: [],
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // ---------------------------------------------------------------------------
    // setNotaArquivada
    // ---------------------------------------------------------------------------
    describe('setNotaArquivada', () => {
        it('deve arquivar nota com sucesso', async () => {
            mockDb = createChainableMock({ data: null, error: null });

            const result = await repository.setNotaArquivada(USUARIO_ID, { id: 1, isArchived: true });

            expect(result.success).toBe(true);
            expect(mockDb.from).toHaveBeenCalledWith('notas');
            expect(mockDb.update).toHaveBeenCalledWith({ is_archived: true });
        });

        it('deve retornar erro quando update falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Update error', code: '500' } });

            const result = await repository.setNotaArquivada(USUARIO_ID, { id: 1, isArchived: true });

            expect(result.success).toBe(false);
        });
    });

    // ---------------------------------------------------------------------------
    // deleteNota
    // ---------------------------------------------------------------------------
    describe('deleteNota', () => {
        it('deve excluir nota com sucesso', async () => {
            mockDb = createChainableMock({ data: null, error: null });

            const result = await repository.deleteNota(USUARIO_ID, 1);

            expect(result.success).toBe(true);
            expect(mockDb.from).toHaveBeenCalledWith('notas');
        });

        it('deve retornar erro quando delete falha', async () => {
            mockDb = createChainableMock({ data: null, error: { message: 'Delete error', code: '500' } });

            const result = await repository.deleteNota(USUARIO_ID, 1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });
});
