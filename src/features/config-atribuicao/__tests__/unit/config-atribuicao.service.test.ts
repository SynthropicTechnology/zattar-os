
import {
  listarRegioes,
  obterRegiao,
  criarRegiao,
  atualizarRegiao,
  excluirRegiao,
  alternarStatusRegiao,
  verificarConflitos,
} from '../../service';
import * as repository from '../../repository';
import { ok, err, appError } from '@/types';
import type { RegiaoAtribuicao, CriarRegiaoInput } from '../../domain';

// Mock repository
jest.mock('../../repository');

// Mock supabase client
jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn(),
}));

const mockRegiao: RegiaoAtribuicao = {
  id: 1,
  nome: 'Regiao Sudeste',
  descricao: 'TRTs do Sudeste',
  trts: ['TRT1', 'TRT2', 'TRT3'],
  responsaveisIds: [10, 20],
  metodoBalanceamento: 'contagem_processos',
  ativo: true,
  prioridade: 10,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const validCriarInput: CriarRegiaoInput = {
  nome: 'Regiao Nordeste',
  descricao: 'TRTs do Nordeste',
  trts: ['TRT5', 'TRT6', 'TRT7'],
  responsaveisIds: [30],
  metodoBalanceamento: 'round_robin',
  ativo: true,
  prioridade: 5,
};

describe('ConfigAtribuicao Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // listarRegioes
  // ==========================================================================

  describe('listarRegioes', () => {
    it('deve listar regioes com sucesso', async () => {
      (repository.findAllRegioes as jest.Mock).mockResolvedValue(ok([mockRegiao]));

      const result = await listarRegioes();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].nome).toBe('Regiao Sudeste');
      }
    });

    it('deve propagar erro do repositorio', async () => {
      (repository.findAllRegioes as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Falha na query'))
      );

      const result = await listarRegioes();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  // ==========================================================================
  // obterRegiao
  // ==========================================================================

  describe('obterRegiao', () => {
    it('deve obter regiao por id com sucesso', async () => {
      (repository.findRegiaoById as jest.Mock).mockResolvedValue(ok(mockRegiao));

      const result = await obterRegiao(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.nome).toBe('Regiao Sudeste');
      }
    });

    it('deve retornar VALIDATION_ERROR para id invalido (0)', async () => {
      const result = await obterRegiao(0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
      expect(repository.findRegiaoById).not.toHaveBeenCalled();
    });

    it('deve retornar VALIDATION_ERROR para id negativo', async () => {
      const result = await obterRegiao(-1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  // ==========================================================================
  // criarRegiao
  // ==========================================================================

  describe('criarRegiao', () => {
    it('deve criar regiao com input valido', async () => {
      const created = { ...mockRegiao, ...validCriarInput, id: 2 };
      (repository.createRegiao as jest.Mock).mockResolvedValue(ok(created));

      const result = await criarRegiao(validCriarInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nome).toBe('Regiao Nordeste');
      }
      expect(repository.createRegiao).toHaveBeenCalled();
    });

    it('deve falhar com Zod validation para nome vazio', async () => {
      const invalidInput = { ...validCriarInput, nome: '' };

      const result = await criarRegiao(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
      expect(repository.createRegiao).not.toHaveBeenCalled();
    });

    it('deve falhar com Zod validation para trts vazio', async () => {
      const invalidInput = { ...validCriarInput, trts: [] };

      const result = await criarRegiao(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('deve falhar com Zod validation para responsaveisIds vazio', async () => {
      const invalidInput = { ...validCriarInput, responsaveisIds: [] };

      const result = await criarRegiao(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('deve falhar para TRTs invalidos', async () => {
      const invalidInput = { ...validCriarInput, trts: ['TRT99'] };

      const result = await criarRegiao(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('TRT99');
      }
    });
  });

  // ==========================================================================
  // atualizarRegiao
  // ==========================================================================

  describe('atualizarRegiao', () => {
    it('deve atualizar regiao com sucesso', async () => {
      const updated = { ...mockRegiao, nome: 'Novo nome' };
      (repository.findRegiaoById as jest.Mock).mockResolvedValue(ok(mockRegiao));
      (repository.updateRegiao as jest.Mock).mockResolvedValue(ok(updated));

      const result = await atualizarRegiao(1, { nome: 'Novo nome' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nome).toBe('Novo nome');
      }
    });

    it('deve falhar para id invalido', async () => {
      const result = await atualizarRegiao(0, { nome: 'X' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('deve falhar quando regiao nao existe', async () => {
      (repository.findRegiaoById as jest.Mock).mockResolvedValue(ok(null));

      const result = await atualizarRegiao(999, { nome: 'X' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('deve falhar para TRTs invalidos na atualizacao', async () => {
      (repository.findRegiaoById as jest.Mock).mockResolvedValue(ok(mockRegiao));

      const result = await atualizarRegiao(1, { trts: ['INVALID'] });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  // ==========================================================================
  // excluirRegiao
  // ==========================================================================

  describe('excluirRegiao', () => {
    it('deve excluir regiao com sucesso', async () => {
      (repository.findRegiaoById as jest.Mock).mockResolvedValue(ok(mockRegiao));
      (repository.deleteRegiao as jest.Mock).mockResolvedValue(ok(true));

      const result = await excluirRegiao(1);

      expect(result.success).toBe(true);
      expect(repository.deleteRegiao).toHaveBeenCalledWith(1);
    });

    it('deve falhar para id invalido', async () => {
      const result = await excluirRegiao(0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('deve falhar quando regiao nao existe', async () => {
      (repository.findRegiaoById as jest.Mock).mockResolvedValue(ok(null));

      const result = await excluirRegiao(999);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // alternarStatusRegiao
  // ==========================================================================

  describe('alternarStatusRegiao', () => {
    it('deve ativar regiao com sucesso', async () => {
      const activated = { ...mockRegiao, ativo: true };
      (repository.toggleRegiaoAtivo as jest.Mock).mockResolvedValue(ok(activated));

      const result = await alternarStatusRegiao(1, true);

      expect(result.success).toBe(true);
      expect(repository.toggleRegiaoAtivo).toHaveBeenCalledWith(1, true);
    });

    it('deve desativar regiao com sucesso', async () => {
      const deactivated = { ...mockRegiao, ativo: false };
      (repository.toggleRegiaoAtivo as jest.Mock).mockResolvedValue(ok(deactivated));

      const result = await alternarStatusRegiao(1, false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ativo).toBe(false);
      }
    });

    it('deve falhar para id invalido', async () => {
      const result = await alternarStatusRegiao(0, true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  // ==========================================================================
  // verificarConflitos
  // ==========================================================================

  describe('verificarConflitos', () => {
    it('deve retornar lista vazia quando nao ha conflitos', async () => {
      const regiaoA = { ...mockRegiao, id: 1, nome: 'A', trts: ['TRT1'] };
      const regiaoB = { ...mockRegiao, id: 2, nome: 'B', trts: ['TRT2'] };
      (repository.findAllRegioes as jest.Mock).mockResolvedValue(ok([regiaoA, regiaoB]));

      const result = await verificarConflitos();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('deve detectar conflitos quando TRT esta em multiplas regioes ativas', async () => {
      const regiaoA = { ...mockRegiao, id: 1, nome: 'A', trts: ['TRT1', 'TRT2'], ativo: true };
      const regiaoB = { ...mockRegiao, id: 2, nome: 'B', trts: ['TRT2', 'TRT3'], ativo: true };
      (repository.findAllRegioes as jest.Mock).mockResolvedValue(ok([regiaoA, regiaoB]));

      const result = await verificarConflitos();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].trt).toBe('TRT2');
        expect(result.data[0].regioes).toEqual(['A', 'B']);
      }
    });

    it('deve ignorar regioes inativas na verificacao de conflitos', async () => {
      const regiaoA = { ...mockRegiao, id: 1, nome: 'A', trts: ['TRT1'], ativo: true };
      const regiaoB = { ...mockRegiao, id: 2, nome: 'B', trts: ['TRT1'], ativo: false };
      (repository.findAllRegioes as jest.Mock).mockResolvedValue(ok([regiaoA, regiaoB]));

      const result = await verificarConflitos();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('deve propagar erro do repositorio', async () => {
      (repository.findAllRegioes as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Falha'))
      );

      const result = await verificarConflitos();

      expect(result.success).toBe(false);
    });
  });
});
