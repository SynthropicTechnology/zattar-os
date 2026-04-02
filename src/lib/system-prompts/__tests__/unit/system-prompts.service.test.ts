import {
  listar,
  listarPorCategoria,
  buscarPorSlug,
  buscarPorId,
  criar,
  atualizar,
  deletar,
  toggleAtivo,
} from '../../service';
import * as repo from '../../repository';
import type { SystemPrompt } from '../../domain';

// Mock repository
jest.mock('../../repository');

const mockRepo = repo as jest.Mocked<typeof repo>;

// ============================================================================
// FIXTURES
// ============================================================================

const basePrompt: SystemPrompt = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  slug: 'test_prompt',
  nome: 'Prompt de Teste',
  descricao: 'Um prompt para testes',
  categoria: 'custom',
  conteudo: 'Voce e um assistente juridico especializado em direito trabalhista.',
  ativo: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const builtInPrompt: SystemPrompt = {
  ...basePrompt,
  id: '660e8400-e29b-41d4-a716-446655440001',
  slug: 'plate_juridico_context',
  nome: 'Plate Juridico Context',
  categoria: 'plate_ai',
};

// ============================================================================
// TESTS
// ============================================================================

describe('SystemPrompts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // QUERIES
  // --------------------------------------------------------------------------

  describe('listar', () => {
    it('deve listar todos os prompts', async () => {
      mockRepo.findAll.mockResolvedValue([basePrompt]);

      const result = await listar();

      expect(result).toEqual([basePrompt]);
      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve retornar lista vazia quando nao ha prompts', async () => {
      mockRepo.findAll.mockResolvedValue([]);

      const result = await listar();

      expect(result).toEqual([]);
    });
  });

  describe('listarPorCategoria', () => {
    it('deve listar prompts por categoria', async () => {
      mockRepo.findByCategoria.mockResolvedValue([basePrompt]);

      const result = await listarPorCategoria('custom');

      expect(result).toEqual([basePrompt]);
      expect(mockRepo.findByCategoria).toHaveBeenCalledWith('custom');
    });

    it('deve retornar lista vazia para categoria sem prompts', async () => {
      mockRepo.findByCategoria.mockResolvedValue([]);

      const result = await listarPorCategoria('copilotkit');

      expect(result).toEqual([]);
    });
  });

  describe('buscarPorSlug', () => {
    it('deve encontrar prompt pelo slug', async () => {
      mockRepo.findBySlug.mockResolvedValue(basePrompt);

      const result = await buscarPorSlug('test_prompt');

      expect(result).toEqual(basePrompt);
      expect(mockRepo.findBySlug).toHaveBeenCalledWith('test_prompt');
    });

    it('deve retornar null quando slug nao existe', async () => {
      mockRepo.findBySlug.mockResolvedValue(null);

      const result = await buscarPorSlug('inexistente');

      expect(result).toBeNull();
    });
  });

  describe('buscarPorId', () => {
    it('deve encontrar prompt pelo ID', async () => {
      mockRepo.findById.mockResolvedValue(basePrompt);

      const result = await buscarPorId(basePrompt.id);

      expect(result).toEqual(basePrompt);
      expect(mockRepo.findById).toHaveBeenCalledWith(basePrompt.id);
    });

    it('deve retornar null quando ID nao existe', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await buscarPorId('nonexistent-uuid');

      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // MUTATIONS
  // --------------------------------------------------------------------------

  describe('criar', () => {
    const validInput = {
      slug: 'novo_prompt',
      nome: 'Novo Prompt',
      categoria: 'custom' as const,
      conteudo: 'Conteudo do novo prompt com pelo menos 10 caracteres',
      ativo: true,
    };

    it('deve criar prompt com dados validos', async () => {
      const created = { ...basePrompt, ...validInput };
      mockRepo.create.mockResolvedValue(created);

      const result = await criar(validInput);

      expect(result).toEqual(created);
      expect(mockRepo.create).toHaveBeenCalledWith(validInput);
    });

    it('deve rejeitar slug muito curto', async () => {
      await expect(criar({ ...validInput, slug: 'ab' })).rejects.toThrow(
        'Slug deve ter no mínimo 3 caracteres'
      );
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar slug com caracteres invalidos', async () => {
      await expect(
        criar({ ...validInput, slug: 'Invalid-Slug!' })
      ).rejects.toThrow(
        /Slug deve conter apenas letras minúsculas/
      );
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar nome muito curto', async () => {
      await expect(criar({ ...validInput, nome: 'Ab' })).rejects.toThrow(
        'Nome deve ter no mínimo 3 caracteres'
      );
    });

    it('deve rejeitar conteudo muito curto', async () => {
      await expect(
        criar({ ...validInput, conteudo: 'Curto' })
      ).rejects.toThrow(
        'Conteúdo do prompt deve ter no mínimo 10 caracteres'
      );
    });

    it('deve rejeitar categoria invalida', async () => {
      await expect(
        criar({ ...validInput, categoria: 'invalida' })
      ).rejects.toThrow();
    });

    it('deve aceitar descricao opcional', async () => {
      const inputComDescricao = {
        ...validInput,
        descricao: 'Uma descricao detalhada',
      };
      const created = { ...basePrompt, ...inputComDescricao };
      mockRepo.create.mockResolvedValue(created);

      const result = await criar(inputComDescricao);

      expect(result.descricao).toBe('Uma descricao detalhada');
    });
  });

  describe('atualizar', () => {
    it('deve atualizar prompt com dados validos', async () => {
      const updated = { ...basePrompt, nome: 'Nome Atualizado' };
      mockRepo.update.mockResolvedValue(updated);

      const result = await atualizar({
        id: basePrompt.id,
        nome: 'Nome Atualizado',
      });

      expect(result.nome).toBe('Nome Atualizado');
      expect(mockRepo.update).toHaveBeenCalledWith(basePrompt.id, {
        nome: 'Nome Atualizado',
      });
    });

    it('deve rejeitar ID invalido (nao UUID)', async () => {
      await expect(
        atualizar({ id: 'not-a-uuid', nome: 'Teste' })
      ).rejects.toThrow();
    });

    it('deve rejeitar parametros sem ID', async () => {
      await expect(atualizar({ nome: 'Teste' } as Record<string, unknown>)).rejects.toThrow();
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      const updated = { ...basePrompt, ativo: false };
      mockRepo.update.mockResolvedValue(updated);

      await atualizar({ id: basePrompt.id, ativo: false });

      expect(mockRepo.update).toHaveBeenCalledWith(basePrompt.id, {
        ativo: false,
      });
    });
  });

  describe('deletar', () => {
    it('deve deletar prompt custom', async () => {
      mockRepo.findById.mockResolvedValue(basePrompt);
      mockRepo.remove.mockResolvedValue(undefined);

      await deletar(basePrompt.id);

      expect(mockRepo.remove).toHaveBeenCalledWith(basePrompt.id);
    });

    it('deve rejeitar exclusao de prompt nao encontrado', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(deletar('nonexistent-uuid')).rejects.toThrow(
        'Prompt não encontrado'
      );
      expect(mockRepo.remove).not.toHaveBeenCalled();
    });

    it('deve rejeitar exclusao de prompt built-in', async () => {
      mockRepo.findById.mockResolvedValue(builtInPrompt);

      await expect(deletar(builtInPrompt.id)).rejects.toThrow(
        /Não é possível deletar prompts built-in/
      );
      expect(mockRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('toggleAtivo', () => {
    it('deve desativar prompt ativo', async () => {
      const desativado = { ...basePrompt, ativo: false };
      mockRepo.toggleAtivo.mockResolvedValue(desativado);

      const result = await toggleAtivo(basePrompt.id, false);

      expect(result.ativo).toBe(false);
      expect(mockRepo.toggleAtivo).toHaveBeenCalledWith(basePrompt.id, false);
    });

    it('deve ativar prompt inativo', async () => {
      const ativado = { ...basePrompt, ativo: true };
      mockRepo.toggleAtivo.mockResolvedValue(ativado);

      const result = await toggleAtivo(basePrompt.id, true);

      expect(result.ativo).toBe(true);
      expect(mockRepo.toggleAtivo).toHaveBeenCalledWith(basePrompt.id, true);
    });
  });
});
