import { describe, it, expect } from '@jest/globals';
import {
    noteTypeSchema,
    noteChecklistItemSchema,
    noteLabelSchema,
    noteSchema,
    notasPayloadSchema,
    listNotasSchema,
    createNotaSchema,
    updateNotaSchema,
    deleteNotaSchema,
    setNotaArquivadaSchema,
    createEtiquetaSchema,
    updateEtiquetaSchema,
    deleteEtiquetaSchema,
} from '../../domain';

describe('Notas Domain', () => {
    describe('noteTypeSchema', () => {
        it('deve aceitar tipos válidos', () => {
            expect(noteTypeSchema.parse('text')).toBe('text');
            expect(noteTypeSchema.parse('checklist')).toBe('checklist');
            expect(noteTypeSchema.parse('image')).toBe('image');
        });

        it('deve rejeitar tipo inválido', () => {
            expect(() => noteTypeSchema.parse('audio')).toThrow();
        });
    });

    describe('noteChecklistItemSchema', () => {
        it('deve aceitar item válido', () => {
            const item = { text: 'Tarefa 1', checked: false };
            expect(noteChecklistItemSchema.parse(item)).toEqual(item);
        });

        it('deve rejeitar item sem texto', () => {
            expect(() => noteChecklistItemSchema.parse({ text: '', checked: false })).toThrow();
        });

        it('deve rejeitar item sem campo checked', () => {
            expect(() => noteChecklistItemSchema.parse({ text: 'Tarefa' })).toThrow();
        });
    });

    describe('noteLabelSchema', () => {
        it('deve aceitar etiqueta válida', () => {
            const label = { id: 1, title: 'Urgente', color: '#ff0000' };
            expect(noteLabelSchema.parse(label)).toEqual(label);
        });

        it('deve rejeitar id não positivo', () => {
            expect(() => noteLabelSchema.parse({ id: 0, title: 'X', color: 'red' })).toThrow();
        });

        it('deve rejeitar título vazio', () => {
            expect(() => noteLabelSchema.parse({ id: 1, title: '', color: 'red' })).toThrow();
        });
    });

    describe('noteSchema', () => {
        it('deve aceitar nota válida completa', () => {
            const nota = {
                id: 1,
                title: 'Minha nota',
                content: 'Conteúdo',
                labels: [1, 2],
                isArchived: false,
                type: 'text' as const,
                items: [{ text: 'Item', checked: true }],
                image: 'https://example.com/img.png',
            };
            const parsed = noteSchema.parse(nota);
            expect(parsed.id).toBe(1);
            expect(parsed.type).toBe('text');
        });

        it('deve aceitar nota com campos opcionais ausentes', () => {
            const nota = {
                id: 1,
                title: 'Nota simples',
                labels: [],
                isArchived: false,
                type: 'text' as const,
            };
            const parsed = noteSchema.parse(nota);
            expect(parsed.content).toBeUndefined();
            expect(parsed.items).toBeUndefined();
            expect(parsed.image).toBeUndefined();
        });

        it('deve rejeitar nota sem id', () => {
            expect(() =>
                noteSchema.parse({ title: 'X', labels: [], isArchived: false, type: 'text' })
            ).toThrow();
        });
    });

    describe('notasPayloadSchema', () => {
        it('deve aceitar payload válido', () => {
            const payload = {
                notes: [{ id: 1, title: 'N', labels: [], isArchived: false, type: 'text' as const }],
                labels: [{ id: 1, title: 'L', color: 'blue' }],
            };
            const parsed = notasPayloadSchema.parse(payload);
            expect(parsed.notes).toHaveLength(1);
            expect(parsed.labels).toHaveLength(1);
        });

        it('deve aceitar payload vazio', () => {
            const parsed = notasPayloadSchema.parse({ notes: [], labels: [] });
            expect(parsed.notes).toHaveLength(0);
        });
    });

    describe('listNotasSchema', () => {
        it('deve aceitar objeto vazio', () => {
            expect(listNotasSchema.parse({})).toEqual({});
        });

        it('deve aceitar includeArchived', () => {
            expect(listNotasSchema.parse({ includeArchived: true })).toEqual({ includeArchived: true });
        });
    });

    describe('createNotaSchema', () => {
        it('deve aceitar input mínimo válido', () => {
            const parsed = createNotaSchema.parse({ title: 'Nova nota' });
            expect(parsed.title).toBe('Nova nota');
        });

        it('deve aceitar input completo', () => {
            const input = {
                title: 'Nota completa',
                content: 'Conteúdo',
                type: 'checklist' as const,
                labels: [1, 2],
                items: [{ text: 'Item', checked: false }],
                image: 'img.png',
                isArchived: false,
            };
            const parsed = createNotaSchema.parse(input);
            expect(parsed.type).toBe('checklist');
            expect(parsed.labels).toEqual([1, 2]);
        });

        it('deve rejeitar título vazio', () => {
            expect(() => createNotaSchema.parse({ title: '' })).toThrow();
        });

        it('deve rejeitar título com mais de 200 caracteres', () => {
            expect(() => createNotaSchema.parse({ title: 'a'.repeat(201) })).toThrow();
        });

        it('deve fazer trim no título', () => {
            const parsed = createNotaSchema.parse({ title: '  Nota  ' });
            expect(parsed.title).toBe('Nota');
        });
    });

    describe('updateNotaSchema', () => {
        it('deve aceitar atualização parcial', () => {
            const parsed = updateNotaSchema.parse({ id: 1, title: 'Novo título' });
            expect(parsed.id).toBe(1);
            expect(parsed.title).toBe('Novo título');
        });

        it('deve aceitar apenas id (sem alterações)', () => {
            const parsed = updateNotaSchema.parse({ id: 1 });
            expect(parsed.id).toBe(1);
        });

        it('deve rejeitar id não positivo', () => {
            expect(() => updateNotaSchema.parse({ id: 0 })).toThrow();
        });
    });

    describe('deleteNotaSchema', () => {
        it('deve aceitar id válido', () => {
            expect(deleteNotaSchema.parse({ id: 5 })).toEqual({ id: 5 });
        });

        it('deve rejeitar id negativo', () => {
            expect(() => deleteNotaSchema.parse({ id: -1 })).toThrow();
        });
    });

    describe('setNotaArquivadaSchema', () => {
        it('deve aceitar input válido', () => {
            const parsed = setNotaArquivadaSchema.parse({ id: 1, isArchived: true });
            expect(parsed.isArchived).toBe(true);
        });

        it('deve rejeitar sem isArchived', () => {
            expect(() => setNotaArquivadaSchema.parse({ id: 1 })).toThrow();
        });
    });

    describe('createEtiquetaSchema', () => {
        it('deve aceitar etiqueta válida', () => {
            const parsed = createEtiquetaSchema.parse({ title: 'Urgente', color: '#ff0000' });
            expect(parsed.title).toBe('Urgente');
        });

        it('deve rejeitar título vazio', () => {
            expect(() => createEtiquetaSchema.parse({ title: '', color: 'red' })).toThrow();
        });

        it('deve rejeitar título com mais de 80 caracteres', () => {
            expect(() => createEtiquetaSchema.parse({ title: 'a'.repeat(81), color: 'red' })).toThrow();
        });

        it('deve rejeitar cor vazia', () => {
            expect(() => createEtiquetaSchema.parse({ title: 'X', color: '' })).toThrow();
        });
    });

    describe('updateEtiquetaSchema', () => {
        it('deve aceitar atualização parcial', () => {
            const parsed = updateEtiquetaSchema.parse({ id: 1, title: 'Novo nome' });
            expect(parsed.title).toBe('Novo nome');
        });

        it('deve aceitar apenas id', () => {
            const parsed = updateEtiquetaSchema.parse({ id: 1 });
            expect(parsed.id).toBe(1);
        });

        it('deve rejeitar id não positivo', () => {
            expect(() => updateEtiquetaSchema.parse({ id: 0 })).toThrow();
        });
    });

    describe('deleteEtiquetaSchema', () => {
        it('deve aceitar id válido', () => {
            expect(deleteEtiquetaSchema.parse({ id: 3 })).toEqual({ id: 3 });
        });

        it('deve rejeitar id não positivo', () => {
            expect(() => deleteEtiquetaSchema.parse({ id: -1 })).toThrow();
        });
    });
});
