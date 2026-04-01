import {
  buscarPorId,
  buscarAssistenteParaTipo,
  listar,
  criar,
  atualizar,
  deletar,
  ativar,
} from '../../service';
import * as repository from '../../repository';
import type { AssistenteTipo, AssistenteTipoComRelacoes } from '../../domain';

// Mock repository
jest.mock('../../repository');

const mockRepo = repository as jest.Mocked<typeof repository>;

// ============================================================================
// FIXTURES
// ============================================================================

const baseRelacao: AssistenteTipo = {
  id: 1,
  assistente_id: 10,
  tipo_expediente_id: 20,
  ativo: true,
  criado_por: 100,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const relacaoComRelacoes: AssistenteTipoComRelacoes = {
  ...baseRelacao,
  assistente_nome: 'Assistente Teste',
  assistente_dify_app_id: 'dify-app-123',
  tipo_expediente_nome: 'Contestacao',
  criador_nome: 'Joao Silva',
};

// ============================================================================
// TESTS
// ============================================================================

describe('AssistentesTipos Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  describe('buscarPorId', () => {
    it('deve retornar relacao existente', async () => {
      mockRepo.buscarPorId.mockResolvedValue(baseRelacao);

      const result = await buscarPorId(1);

      expect(result).toEqual(baseRelacao);
      expect(mockRepo.buscarPorId).toHaveBeenCalledWith(1);
    });

    it('deve retornar null quando nao encontrada', async () => {
      mockRepo.buscarPorId.mockResolvedValue(null);

      const result = await buscarPorId(999);

      expect(result).toBeNull();
    });
  });

  describe('buscarAssistenteParaTipo', () => {
    it('deve retornar assistente configurado para o tipo', async () => {
      mockRepo.buscarPorTipoExpediente.mockResolvedValue(relacaoComRelacoes);

      const result = await buscarAssistenteParaTipo(20);

      expect(result).toEqual(relacaoComRelacoes);
      expect(mockRepo.buscarPorTipoExpediente).toHaveBeenCalledWith(20);
    });

    it('deve retornar null quando nenhum assistente configurado', async () => {
      mockRepo.buscarPorTipoExpediente.mockResolvedValue(null);

      const result = await buscarAssistenteParaTipo(999);

      expect(result).toBeNull();
    });
  });

  describe('listar', () => {
    it('deve listar relacoes com parametros validos', async () => {
      const mockResult = { data: [relacaoComRelacoes], total: 1 };
      mockRepo.listar.mockResolvedValue(mockResult);

      const result = await listar({ limite: 10, offset: 0 });

      expect(result).toEqual(mockResult);
      expect(mockRepo.listar).toHaveBeenCalledWith(
        expect.objectContaining({ limite: 10, offset: 0 })
      );
    });

    it('deve usar defaults para parametros opcionais', async () => {
      const mockResult = { data: [], total: 0 };
      mockRepo.listar.mockResolvedValue(mockResult);

      const result = await listar({});

      expect(result).toEqual(mockResult);
      expect(mockRepo.listar).toHaveBeenCalledWith(
        expect.objectContaining({ limite: 50, offset: 0 })
      );
    });

    it('deve rejeitar limite invalido', async () => {
      await expect(listar({ limite: 0 })).rejects.toThrow();
      expect(mockRepo.listar).not.toHaveBeenCalled();
    });

    it('deve rejeitar offset negativo', async () => {
      await expect(listar({ offset: -1 })).rejects.toThrow();
      expect(mockRepo.listar).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  describe('criar', () => {
    const validInput = {
      assistente_id: 10,
      tipo_expediente_id: 20,
      ativo: true,
    };

    it('deve criar relacao com sucesso', async () => {
      mockRepo.buscarPorTipoExpediente.mockResolvedValue(null);
      mockRepo.criar.mockResolvedValue(baseRelacao);

      const result = await criar(validInput, 100);

      expect(result).toEqual(baseRelacao);
      expect(mockRepo.criar).toHaveBeenCalledWith(
        expect.objectContaining(validInput),
        100
      );
    });

    it('deve rejeitar quando ja existe assistente ativo para o tipo', async () => {
      mockRepo.buscarPorTipoExpediente.mockResolvedValue(relacaoComRelacoes);

      await expect(criar(validInput, 100)).rejects.toThrow(
        /Já existe um assistente ativo/
      );
      expect(mockRepo.criar).not.toHaveBeenCalled();
    });

    it('deve permitir criar inativo mesmo com outro ativo existente', async () => {
      mockRepo.buscarPorTipoExpediente.mockResolvedValue(relacaoComRelacoes);
      const inativoInput = { ...validInput, ativo: false };
      const relacaoInativa = { ...baseRelacao, ativo: false };
      mockRepo.criar.mockResolvedValue(relacaoInativa);

      const result = await criar(inativoInput, 100);

      expect(result.ativo).toBe(false);
      expect(mockRepo.criar).toHaveBeenCalled();
    });

    it('deve rejeitar input com assistente_id invalido', async () => {
      await expect(
        criar({ assistente_id: -1, tipo_expediente_id: 20 }, 100)
      ).rejects.toThrow();
      expect(mockRepo.criar).not.toHaveBeenCalled();
    });

    it('deve rejeitar input com tipo_expediente_id faltando', async () => {
      await expect(
        criar({ assistente_id: 10 } as Record<string, unknown>, 100)
      ).rejects.toThrow();
      expect(mockRepo.criar).not.toHaveBeenCalled();
    });
  });

  describe('atualizar', () => {
    it('deve atualizar relacao existente', async () => {
      const updated = { ...baseRelacao, ativo: false };
      mockRepo.buscarPorId.mockResolvedValue(baseRelacao);
      mockRepo.atualizar.mockResolvedValue(updated);

      const result = await atualizar(1, { ativo: false });

      expect(result).toEqual(updated);
      expect(mockRepo.atualizar).toHaveBeenCalledWith(1, { ativo: false });
    });

    it('deve ativar relacao e desativar outras do mesmo tipo', async () => {
      mockRepo.buscarPorId.mockResolvedValue({ ...baseRelacao, ativo: false });
      mockRepo.ativarRelacao.mockResolvedValue(undefined);
      // After ativarRelacao, it fetches again
      mockRepo.buscarPorId
        .mockResolvedValueOnce({ ...baseRelacao, ativo: false }) // first call (existente check)
        .mockResolvedValueOnce({ ...baseRelacao, ativo: true }); // second call (return)

      const result = await atualizar(1, { ativo: true });

      expect(mockRepo.ativarRelacao).toHaveBeenCalledWith(1, 20);
      expect(result).toBeTruthy();
    });

    it('deve rejeitar quando relacao nao existe', async () => {
      mockRepo.buscarPorId.mockResolvedValue(null);

      await expect(atualizar(999, { ativo: false })).rejects.toThrow(
        'Relação não encontrada'
      );
    });

    it('deve rejeitar input invalido', async () => {
      await expect(
        atualizar(1, { assistente_id: -1 } as Record<string, unknown>)
      ).rejects.toThrow();
    });
  });

  describe('deletar', () => {
    it('deve deletar relacao existente', async () => {
      mockRepo.buscarPorId.mockResolvedValue(baseRelacao);
      mockRepo.deletar.mockResolvedValue(undefined);

      await deletar(1);

      expect(mockRepo.deletar).toHaveBeenCalledWith(1);
    });

    it('deve rejeitar quando relacao nao existe', async () => {
      mockRepo.buscarPorId.mockResolvedValue(null);

      await expect(deletar(999)).rejects.toThrow('Relação não encontrada');
      expect(mockRepo.deletar).not.toHaveBeenCalled();
    });
  });

  describe('ativar', () => {
    it('deve ativar relacao existente', async () => {
      mockRepo.buscarPorId.mockResolvedValue(baseRelacao);
      mockRepo.ativarRelacao.mockResolvedValue(undefined);

      await ativar(1);

      expect(mockRepo.ativarRelacao).toHaveBeenCalledWith(1, 20);
    });

    it('deve rejeitar quando relacao nao existe', async () => {
      mockRepo.buscarPorId.mockResolvedValue(null);

      await expect(ativar(999)).rejects.toThrow('Relação não encontrada');
      expect(mockRepo.ativarRelacao).not.toHaveBeenCalled();
    });
  });
});
