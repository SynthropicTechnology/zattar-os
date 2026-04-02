import {
  listar,
  listarPorTipo,
  buscarPorId,
  buscarConfig2FAuth,
  buscarConfigDyte,
  buscarConfigEditorIA,
  criar,
  atualizar,
  deletar,
  toggleAtivo,
  atualizarConfig2FAuth,
  atualizarConfigChatwoot,
  atualizarConfigDyte,
  atualizarConfigEditorIA,
} from '../../service';
import * as repo from '../../repository';
import type { Integracao } from '../../domain';

// Mock repository
jest.mock('../../repository');

// Mock supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Integracoes Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // FIXTURES
  // =========================================================================

  const mockIntegracao: Integracao = {
    id: 'uuid-1',
    tipo: 'twofauth',
    nome: '2FAuth Principal',
    descricao: 'Autenticacao 2FA',
    ativo: true,
    configuracao: {
      api_url: 'https://2fauth.example.com',
      api_token: 'token-muito-longo-aqui',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockDyteIntegracao: Integracao = {
    ...mockIntegracao,
    id: 'uuid-dyte',
    tipo: 'dyte',
    nome: 'Dyte Principal',
    configuracao: {
      org_id: 'org-12345',
      api_key: 'api-key-muito-longo',
      enable_recording: false,
      enable_transcription: false,
      transcription_language: 'pt-BR',
    },
  };

  const mockEditorIAIntegracao: Integracao = {
    ...mockIntegracao,
    id: 'uuid-editor',
    tipo: 'editor_ia',
    nome: 'Editor de Texto IA Principal',
    configuracao: {
      provider: 'openai',
      api_key: 'sk-key-muito-longo-aqui',
      default_model: 'gpt-4',
    },
  };

  // =========================================================================
  // QUERIES
  // =========================================================================

  describe('listar', () => {
    it('deve retornar todas as integracoes', async () => {
      (repo.findAll as jest.Mock).mockResolvedValue([mockIntegracao]);

      const result = await listar();

      expect(result).toEqual([mockIntegracao]);
      expect(repo.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve retornar array vazio quando nao ha integracoes', async () => {
      (repo.findAll as jest.Mock).mockResolvedValue([]);

      const result = await listar();

      expect(result).toEqual([]);
    });
  });

  describe('listarPorTipo', () => {
    it('deve filtrar por tipo', async () => {
      (repo.findByTipo as jest.Mock).mockResolvedValue([mockIntegracao]);

      const result = await listarPorTipo('twofauth');

      expect(result).toEqual([mockIntegracao]);
      expect(repo.findByTipo).toHaveBeenCalledWith('twofauth');
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar integracao existente', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(mockIntegracao);

      const result = await buscarPorId('uuid-1');

      expect(result).toEqual(mockIntegracao);
      expect(repo.findById).toHaveBeenCalledWith('uuid-1');
    });

    it('deve retornar null quando nao encontrada', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(null);

      const result = await buscarPorId('inexistente');

      expect(result).toBeNull();
    });
  });

  describe('buscarConfig2FAuth', () => {
    it('deve retornar config valida quando integracao ativa existe', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(mockIntegracao);

      const result = await buscarConfig2FAuth();

      expect(result).toEqual({
        api_url: 'https://2fauth.example.com',
        api_token: 'token-muito-longo-aqui',
      });
    });

    it('deve retornar null quando integracao nao existe', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(null);

      const result = await buscarConfig2FAuth();

      expect(result).toBeNull();
    });

    it('deve retornar null quando integracao esta inativa', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue({
        ...mockIntegracao,
        ativo: false,
      });

      const result = await buscarConfig2FAuth();

      expect(result).toBeNull();
    });

    it('deve retornar null quando config e invalida', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue({
        ...mockIntegracao,
        configuracao: { api_url: 'nao-e-url' },
      });

      const result = await buscarConfig2FAuth();

      expect(result).toBeNull();
    });
  });

  describe('buscarConfigDyte', () => {
    it('deve retornar config valida', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(mockDyteIntegracao);

      const result = await buscarConfigDyte();

      expect(result).toBeTruthy();
      expect(result?.org_id).toBe('org-12345');
    });

    it('deve retornar null quando inativa', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue({
        ...mockDyteIntegracao,
        ativo: false,
      });

      const result = await buscarConfigDyte();

      expect(result).toBeNull();
    });
  });

  describe('buscarConfigEditorIA', () => {
    it('deve retornar config valida', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(mockEditorIAIntegracao);

      const result = await buscarConfigEditorIA();

      expect(result).toBeTruthy();
      expect(result?.provider).toBe('openai');
      expect(result?.default_model).toBe('gpt-4');
    });

    it('deve retornar null para config invalida', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue({
        ...mockEditorIAIntegracao,
        configuracao: { provider: 'invalido' },
      });

      const result = await buscarConfigEditorIA();

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // MUTATIONS
  // =========================================================================

  describe('criar', () => {
    it('deve criar integracao com dados validos', async () => {
      const input = {
        tipo: 'webhook',
        nome: 'Meu Webhook',
        ativo: true,
        configuracao: {},
      };
      (repo.create as jest.Mock).mockResolvedValue({ id: 'new-id', ...input });

      const result = await criar(input);

      expect(result.id).toBe('new-id');
      expect(repo.create).toHaveBeenCalled();
    });

    it('deve falhar com nome muito curto', async () => {
      const input = {
        tipo: 'webhook',
        nome: 'ab',
        configuracao: {},
      };

      await expect(criar(input)).rejects.toThrow();
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('deve falhar com tipo invalido', async () => {
      const input = {
        tipo: 'invalido',
        nome: 'Teste Valido',
        configuracao: {},
      };

      await expect(criar(input)).rejects.toThrow();
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('deve validar config 2fauth ao criar', async () => {
      const input = {
        tipo: 'twofauth',
        nome: '2FAuth Config',
        configuracao: { api_url: 'nao-url', api_token: 'curto' },
      };

      await expect(criar(input)).rejects.toThrow('Configuração 2FAuth inválida');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('deve validar config chatwoot ao criar', async () => {
      const input = {
        tipo: 'chatwoot',
        nome: 'Chatwoot Config',
        configuracao: { api_url: 'nao-url' },
      };

      await expect(criar(input)).rejects.toThrow('Configuração Chatwoot inválida');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('deve validar config dyte ao criar', async () => {
      const input = {
        tipo: 'dyte',
        nome: 'Dyte Config',
        configuracao: { org_id: 'ab' },
      };

      await expect(criar(input)).rejects.toThrow('Configuração Dyte inválida');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('deve validar config editor_ia ao criar', async () => {
      const input = {
        tipo: 'editor_ia',
        nome: 'Editor IA Config',
        configuracao: { provider: 'invalido' },
      };

      await expect(criar(input)).rejects.toThrow('Configuração Editor IA inválida');
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('atualizar', () => {
    it('deve atualizar com dados validos', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const input = { id: validUuid, nome: 'Nome Atualizado' };
      (repo.update as jest.Mock).mockResolvedValue({ ...mockIntegracao, nome: 'Nome Atualizado' });

      const result = await atualizar(input);

      expect(result.nome).toBe('Nome Atualizado');
      expect(repo.update).toHaveBeenCalledWith(validUuid, { nome: 'Nome Atualizado' });
    });

    it('deve falhar sem ID', async () => {
      await expect(atualizar({ nome: 'Sem ID' })).rejects.toThrow();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('deve validar config especifica na atualizacao', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const input = {
        id: validUuid,
        tipo: 'twofauth',
        configuracao: { api_url: 'invalido' },
      };

      await expect(atualizar(input)).rejects.toThrow('Configuração 2FAuth inválida');
    });
  });

  describe('deletar', () => {
    it('deve deletar integracao', async () => {
      (repo.remove as jest.Mock).mockResolvedValue(undefined);

      await deletar('uuid-1');

      expect(repo.remove).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('toggleAtivo', () => {
    it('deve alternar estado ativo', async () => {
      (repo.toggleAtivo as jest.Mock).mockResolvedValue({ ...mockIntegracao, ativo: false });

      const result = await toggleAtivo('uuid-1', false);

      expect(result.ativo).toBe(false);
      expect(repo.toggleAtivo).toHaveBeenCalledWith('uuid-1', false);
    });
  });

  // =========================================================================
  // CONFIG UPSERTS
  // =========================================================================

  describe('atualizarConfig2FAuth', () => {
    const validConfig = {
      api_url: 'https://2fauth.example.com',
      api_token: 'token-muito-longo-aqui',
    };

    it('deve criar nova integracao quando nao existe', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(null);
      (repo.create as jest.Mock).mockResolvedValue(mockIntegracao);

      const result = await atualizarConfig2FAuth(validConfig);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'twofauth',
          nome: '2FAuth Principal',
        }),
      );
      expect(result).toEqual(mockIntegracao);
    });

    it('deve atualizar integracao existente', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(mockIntegracao);
      (repo.update as jest.Mock).mockResolvedValue(mockIntegracao);

      await atualizarConfig2FAuth(validConfig);

      expect(repo.update).toHaveBeenCalledWith('uuid-1', expect.objectContaining({
        configuracao: validConfig,
        ativo: true,
      }));
    });

    it('deve falhar com config invalida', async () => {
      await expect(
        atualizarConfig2FAuth({ api_url: 'invalido', api_token: 'curto' }),
      ).rejects.toThrow();
    });
  });

  describe('atualizarConfigChatwoot', () => {
    const validConfig = {
      api_url: 'https://chatwoot.example.com',
      api_key: 'key-muito-longa-aqui',
      account_id: 1,
    };

    it('deve criar quando nao existe', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(null);
      (repo.create as jest.Mock).mockResolvedValue(mockIntegracao);

      await atualizarConfigChatwoot(validConfig);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'chatwoot' }),
      );
    });

    it('deve atualizar quando existe', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(mockIntegracao);
      (repo.update as jest.Mock).mockResolvedValue(mockIntegracao);

      await atualizarConfigChatwoot(validConfig);

      expect(repo.update).toHaveBeenCalled();
    });
  });

  describe('atualizarConfigDyte', () => {
    const validConfig = {
      org_id: 'org-12345',
      api_key: 'api-key-muito-longo',
    };

    it('deve criar quando nao existe', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(null);
      (repo.create as jest.Mock).mockResolvedValue(mockDyteIntegracao);

      await atualizarConfigDyte(validConfig);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'dyte' }),
      );
    });

    it('deve falhar com org_id curto', async () => {
      await expect(
        atualizarConfigDyte({ org_id: 'ab', api_key: 'api-key-muito-longo' }),
      ).rejects.toThrow();
    });
  });

  describe('atualizarConfigEditorIA', () => {
    const validConfig = {
      provider: 'openai' as const,
      api_key: 'sk-key-muito-longo-aqui',
      default_model: 'gpt-4',
    };

    it('deve criar quando nao existe', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(null);
      (repo.create as jest.Mock).mockResolvedValue(mockEditorIAIntegracao);

      await atualizarConfigEditorIA(validConfig);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'editor_ia' }),
      );
    });

    it('deve atualizar quando existe', async () => {
      (repo.findByTipoAndNome as jest.Mock).mockResolvedValue(mockEditorIAIntegracao);
      (repo.update as jest.Mock).mockResolvedValue(mockEditorIAIntegracao);

      await atualizarConfigEditorIA(validConfig);

      expect(repo.update).toHaveBeenCalled();
    });

    it('deve falhar com provider invalido', async () => {
      await expect(
        atualizarConfigEditorIA({
          provider: 'invalido' as any,
          api_key: 'sk-key-muito-longo-aqui',
          default_model: 'gpt-4',
        }),
      ).rejects.toThrow();
    });
  });
});
