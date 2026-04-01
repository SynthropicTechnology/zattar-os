
import {
  actionListarTags,
  actionBuscarTag,
  actionCriarTag,
  actionAtualizarTag,
  actionExcluirTag,
  actionListarTagsDoProcesso,
  actionVincularTag,
  actionDesvincularTag,
  actionAtualizarTagsDoProcesso,
} from '../../actions';
import * as repository from '../../repository';
import type { Tag } from '../../domain';

// Mock repository
jest.mock('../../repository');

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockTag: Tag = {
  id: 1,
  nome: 'Urgente',
  slug: 'urgente',
  cor: '#EF4444',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('Tags Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // actionListarTags
  // ==========================================================================

  describe('actionListarTags', () => {
    it('deve listar tags com sucesso', async () => {
      (repository.findAllTags as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockTag],
      });

      const result = await actionListarTags();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it('deve retornar erro quando repositorio falha', async () => {
      (repository.findAllTags as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Erro de banco' },
      });

      const result = await actionListarTags();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro de banco');
      }
    });

    it('deve capturar excecoes inesperadas', async () => {
      (repository.findAllTags as jest.Mock).mockRejectedValue(new Error('Timeout'));

      const result = await actionListarTags();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Timeout');
      }
    });
  });

  // ==========================================================================
  // actionBuscarTag
  // ==========================================================================

  describe('actionBuscarTag', () => {
    it('deve buscar tag por id com sucesso', async () => {
      (repository.findTagById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTag,
      });

      const result = await actionBuscarTag(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockTag);
      }
    });

    it('deve retornar erro para id invalido (0)', async () => {
      const result = await actionBuscarTag(0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('ID inválido');
      }
    });

    it('deve retornar erro quando tag nao encontrada', async () => {
      (repository.findTagById as jest.Mock).mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await actionBuscarTag(999);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Tag não encontrada');
      }
    });
  });

  // ==========================================================================
  // actionCriarTag
  // ==========================================================================

  describe('actionCriarTag', () => {
    it('deve criar tag com sucesso', async () => {
      (repository.createTag as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTag,
      });

      const result = await actionCriarTag({ nome: 'Urgente', cor: '#EF4444' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Tag criada com sucesso');
      }
    });

    it('deve falhar com validacao para nome vazio', async () => {
      const result = await actionCriarTag({ nome: '' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro de validação');
        expect(result.errors).toBeDefined();
      }
    });

    it('deve falhar com cor invalida', async () => {
      const result = await actionCriarTag({ nome: 'Test', cor: 'invalid' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro de validação');
      }
    });

    it('deve propagar erro de duplicidade do repositorio', async () => {
      (repository.createTag as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Já existe uma tag com este nome', code: 'DUPLICATE' },
      });

      const result = await actionCriarTag({ nome: 'Existente' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Já existe');
      }
    });
  });

  // ==========================================================================
  // actionAtualizarTag
  // ==========================================================================

  describe('actionAtualizarTag', () => {
    it('deve atualizar tag com sucesso', async () => {
      const updated = { ...mockTag, nome: 'Novo nome' };
      (repository.updateTag as jest.Mock).mockResolvedValue({
        success: true,
        data: updated,
      });

      const result = await actionAtualizarTag(1, { nome: 'Novo nome' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Tag atualizada com sucesso');
      }
    });

    it('deve falhar para id invalido', async () => {
      const result = await actionAtualizarTag(0, { nome: 'X' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('ID inválido');
      }
    });

    it('deve falhar com cor invalida na atualizacao', async () => {
      const result = await actionAtualizarTag(1, { cor: 'nao-hex' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro de validação');
      }
    });
  });

  // ==========================================================================
  // actionExcluirTag
  // ==========================================================================

  describe('actionExcluirTag', () => {
    it('deve excluir tag com sucesso', async () => {
      (repository.deleteTag as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await actionExcluirTag(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Tag excluída com sucesso');
      }
    });

    it('deve falhar para id invalido', async () => {
      const result = await actionExcluirTag(0);

      expect(result.success).toBe(false);
    });

    it('deve propagar erro do repositorio', async () => {
      (repository.deleteTag as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Erro ao excluir' },
      });

      const result = await actionExcluirTag(1);

      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // actionListarTagsDoProcesso
  // ==========================================================================

  describe('actionListarTagsDoProcesso', () => {
    it('deve listar tags de um processo com sucesso', async () => {
      (repository.findTagsByProcessoId as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockTag],
      });

      const result = await actionListarTagsDoProcesso(10);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it('deve falhar para processoId invalido', async () => {
      const result = await actionListarTagsDoProcesso(0);

      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // actionVincularTag
  // ==========================================================================

  describe('actionVincularTag', () => {
    it('deve vincular tag ao processo com sucesso', async () => {
      (repository.vincularTagAoProcesso as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 1, processoId: 10, tagId: 1, createdAt: '2024-01-01' },
      });

      const result = await actionVincularTag(10, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Tag vinculada com sucesso');
      }
    });

    it('deve falhar para processoId invalido', async () => {
      const result = await actionVincularTag(0, 1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('ID do processo inválido');
      }
    });

    it('deve falhar para tagId invalido', async () => {
      const result = await actionVincularTag(10, 0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('ID da tag inválido');
      }
    });
  });

  // ==========================================================================
  // actionDesvincularTag
  // ==========================================================================

  describe('actionDesvincularTag', () => {
    it('deve desvincular tag do processo com sucesso', async () => {
      (repository.desvincularTagDoProcesso as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await actionDesvincularTag(10, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Tag desvinculada com sucesso');
      }
    });

    it('deve falhar para processoId invalido', async () => {
      const result = await actionDesvincularTag(0, 1);

      expect(result.success).toBe(false);
    });

    it('deve falhar para tagId invalido', async () => {
      const result = await actionDesvincularTag(10, 0);

      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // actionAtualizarTagsDoProcesso
  // ==========================================================================

  describe('actionAtualizarTagsDoProcesso', () => {
    it('deve atualizar todas as tags de um processo com sucesso', async () => {
      (repository.atualizarTagsDoProcesso as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockTag],
      });

      const result = await actionAtualizarTagsDoProcesso(10, [1, 2]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Tags atualizadas com sucesso');
      }
    });

    it('deve falhar para processoId invalido', async () => {
      const result = await actionAtualizarTagsDoProcesso(0, [1]);

      expect(result.success).toBe(false);
    });

    it('deve permitir lista vazia de tagIds (remove todas)', async () => {
      (repository.atualizarTagsDoProcesso as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await actionAtualizarTagsDoProcesso(10, []);

      expect(result.success).toBe(true);
    });
  });
});
