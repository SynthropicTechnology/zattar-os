import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import { ok, err, appError } from '@/types';

jest.mock('../../repository');

const USUARIO_ID = 42;

describe('Notas Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ---------------------------------------------------------------------------
    // listarDadosNotas
    // ---------------------------------------------------------------------------
    describe('listarDadosNotas', () => {
        it('deve retornar payload com notas e etiquetas', async () => {
            const labels = [{ id: 1, title: 'Urgente', color: '#f00' }];
            const notes = [
                { id: 1, title: 'Nota 1', labels: [1], isArchived: false, type: 'text' as const },
            ];

            (repository.listEtiquetas as jest.Mock).mockResolvedValue(ok(labels));
            (repository.listNotas as jest.Mock).mockResolvedValue(ok(notes));

            const result = await service.listarDadosNotas(USUARIO_ID);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toHaveLength(1);
                expect(result.data.labels).toHaveLength(1);
            }
            expect(repository.listEtiquetas).toHaveBeenCalledWith(USUARIO_ID);
            expect(repository.listNotas).toHaveBeenCalledWith(USUARIO_ID, false);
        });

        it('deve passar includeArchived ao repository', async () => {
            (repository.listEtiquetas as jest.Mock).mockResolvedValue(ok([]));
            (repository.listNotas as jest.Mock).mockResolvedValue(ok([]));

            await service.listarDadosNotas(USUARIO_ID, { includeArchived: true });

            expect(repository.listNotas).toHaveBeenCalledWith(USUARIO_ID, true);
        });

        it('deve retornar erro quando listEtiquetas falha', async () => {
            (repository.listEtiquetas as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro DB'))
            );

            const result = await service.listarDadosNotas(USUARIO_ID);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });

        it('deve retornar erro quando listNotas falha', async () => {
            (repository.listEtiquetas as jest.Mock).mockResolvedValue(ok([]));
            (repository.listNotas as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro DB'))
            );

            const result = await service.listarDadosNotas(USUARIO_ID);

            expect(result.success).toBe(false);
        });
    });

    // ---------------------------------------------------------------------------
    // criarNota
    // ---------------------------------------------------------------------------
    describe('criarNota', () => {
        it('deve criar nota com input mínimo', async () => {
            const nota = { id: 1, title: 'Nova', labels: [], isArchived: false, type: 'text' as const };
            (repository.createNota as jest.Mock).mockResolvedValue(ok(nota));

            const result = await service.criarNota(USUARIO_ID, { title: 'Nova' });

            expect(result.success).toBe(true);
            expect(repository.createNota).toHaveBeenCalledWith(
                USUARIO_ID,
                expect.objectContaining({ title: 'Nova', type: 'text', isArchived: false, labels: [] })
            );
        });

        it('deve criar nota com tipo checklist e labels', async () => {
            const nota = { id: 2, title: 'Check', labels: [1], isArchived: false, type: 'checklist' as const };
            (repository.createNota as jest.Mock).mockResolvedValue(ok(nota));

            const result = await service.criarNota(USUARIO_ID, {
                title: 'Check',
                type: 'checklist',
                labels: [1],
                items: [{ text: 'Item', checked: false }],
            });

            expect(result.success).toBe(true);
            expect(repository.createNota).toHaveBeenCalledWith(
                USUARIO_ID,
                expect.objectContaining({ type: 'checklist', labels: [1] })
            );
        });

        it('deve retornar erro de validação para título vazio', async () => {
            const result = await service.criarNota(USUARIO_ID, { title: '' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
            expect(repository.createNota).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------------------
    // atualizarNota
    // ---------------------------------------------------------------------------
    describe('atualizarNota', () => {
        it('deve atualizar nota com sucesso', async () => {
            const nota = { id: 1, title: 'Atualizada', labels: [], isArchived: false, type: 'text' as const };
            (repository.updateNota as jest.Mock).mockResolvedValue(ok(nota));

            const result = await service.atualizarNota(USUARIO_ID, { id: 1, title: 'Atualizada' });

            expect(result.success).toBe(true);
            expect(repository.updateNota).toHaveBeenCalledWith(
                USUARIO_ID,
                expect.objectContaining({ id: 1, title: 'Atualizada' })
            );
        });

        it('deve retornar erro quando nenhuma alteração informada', async () => {
            const result = await service.atualizarNota(USUARIO_ID, { id: 1 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
                expect(result.error.message).toContain('Nenhuma alteração');
            }
            expect(repository.updateNota).not.toHaveBeenCalled();
        });

        it('deve retornar erro de validação para id inválido', async () => {
            const result = await service.atualizarNota(USUARIO_ID, { id: 0, title: 'X' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });
    });

    // ---------------------------------------------------------------------------
    // arquivarNota
    // ---------------------------------------------------------------------------
    describe('arquivarNota', () => {
        it('deve arquivar nota com sucesso', async () => {
            (repository.setNotaArquivada as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await service.arquivarNota(USUARIO_ID, { id: 1, isArchived: true });

            expect(result.success).toBe(true);
            expect(repository.setNotaArquivada).toHaveBeenCalledWith(
                USUARIO_ID,
                { id: 1, isArchived: true }
            );
        });

        it('deve desarquivar nota', async () => {
            (repository.setNotaArquivada as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await service.arquivarNota(USUARIO_ID, { id: 1, isArchived: false });

            expect(result.success).toBe(true);
        });

        it('deve retornar erro de validação para id inválido', async () => {
            const result = await service.arquivarNota(USUARIO_ID, { id: -1, isArchived: true });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });
    });

    // ---------------------------------------------------------------------------
    // excluirNota
    // ---------------------------------------------------------------------------
    describe('excluirNota', () => {
        it('deve excluir nota com sucesso', async () => {
            (repository.deleteNota as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await service.excluirNota(USUARIO_ID, { id: 1 });

            expect(result.success).toBe(true);
            expect(repository.deleteNota).toHaveBeenCalledWith(USUARIO_ID, 1);
        });

        it('deve retornar erro de validação para id inválido', async () => {
            const result = await service.excluirNota(USUARIO_ID, { id: 0 });

            expect(result.success).toBe(false);
        });

        it('deve propagar erro do repository', async () => {
            (repository.deleteNota as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro ao excluir'))
            );

            const result = await service.excluirNota(USUARIO_ID, { id: 1 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });

    // ---------------------------------------------------------------------------
    // criarEtiqueta
    // ---------------------------------------------------------------------------
    describe('criarEtiqueta', () => {
        it('deve criar etiqueta com sucesso', async () => {
            const label = { id: 1, title: 'Urgente', color: '#ff0000' };
            (repository.createEtiqueta as jest.Mock).mockResolvedValue(ok(label));

            const result = await service.criarEtiqueta(USUARIO_ID, { title: 'Urgente', color: '#ff0000' });

            expect(result.success).toBe(true);
            expect(repository.createEtiqueta).toHaveBeenCalledWith(
                USUARIO_ID,
                { title: 'Urgente', color: '#ff0000' }
            );
        });

        it('deve rejeitar título vazio', async () => {
            const result = await service.criarEtiqueta(USUARIO_ID, { title: '', color: 'red' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });
    });

    // ---------------------------------------------------------------------------
    // atualizarEtiqueta
    // ---------------------------------------------------------------------------
    describe('atualizarEtiqueta', () => {
        it('deve atualizar etiqueta com sucesso', async () => {
            const label = { id: 1, title: 'Novo nome', color: '#00f' };
            (repository.updateEtiqueta as jest.Mock).mockResolvedValue(ok(label));

            const result = await service.atualizarEtiqueta(USUARIO_ID, { id: 1, title: 'Novo nome' });

            expect(result.success).toBe(true);
            expect(repository.updateEtiqueta).toHaveBeenCalledWith(
                USUARIO_ID,
                expect.objectContaining({ id: 1, title: 'Novo nome' })
            );
        });

        it('deve rejeitar id inválido', async () => {
            const result = await service.atualizarEtiqueta(USUARIO_ID, { id: 0 });

            expect(result.success).toBe(false);
        });
    });

    // ---------------------------------------------------------------------------
    // excluirEtiqueta
    // ---------------------------------------------------------------------------
    describe('excluirEtiqueta', () => {
        it('deve excluir etiqueta com sucesso', async () => {
            (repository.deleteEtiqueta as jest.Mock).mockResolvedValue(ok(undefined));

            const result = await service.excluirEtiqueta(USUARIO_ID, { id: 1 });

            expect(result.success).toBe(true);
            expect(repository.deleteEtiqueta).toHaveBeenCalledWith(USUARIO_ID, 1);
        });

        it('deve retornar erro de validação para id inválido', async () => {
            const result = await service.excluirEtiqueta(USUARIO_ID, { id: -1 });

            expect(result.success).toBe(false);
        });

        it('deve propagar erro do repository', async () => {
            (repository.deleteEtiqueta as jest.Mock).mockResolvedValue(
                err(appError('DATABASE_ERROR', 'Erro ao excluir'))
            );

            const result = await service.excluirEtiqueta(USUARIO_ID, { id: 1 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('DATABASE_ERROR');
            }
        });
    });
});
