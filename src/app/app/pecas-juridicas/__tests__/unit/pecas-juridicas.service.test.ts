import {
  buscarPecaModelo,
  listarPecasModelos,
  criarPecaModelo,
  atualizarPecaModelo,
  deletarPecaModelo,
  listarDocumentosDoContrato,
  vincularDocumentoAoContrato,
  desvincularDocumentoDoContrato,
  desvincularItemDoContrato,
  previewGeracaoPeca,
} from '../../service';
import * as repository from '../../repository';
import { ok, err, appError } from '@/types';
import type { PecaModelo, PecaModeloListItem, ContratoDocumento } from '../../domain';

// Mock repository
jest.mock('../../repository');

// Mock placeholders
jest.mock('../../placeholders', () => ({
  resolvePlateContent: jest.fn().mockReturnValue({
    result: [{ type: 'paragraph', children: [{ text: 'Resolvido' }] }],
    resolutions: [],
    unresolvedCount: 0,
  }),
  generatePreview: jest.fn().mockReturnValue([]),
  extractPlaceholders: jest.fn().mockReturnValue([]),
}));

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn(),
}));

describe('Pecas Juridicas Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // FIXTURES
  // =========================================================================

  const mockPecaModelo: PecaModelo = {
    id: 1,
    titulo: 'Peticao Inicial Trabalhista',
    descricao: 'Modelo padrao de peticao inicial',
    tipoPeca: 'peticao_inicial',
    conteudo: [{ type: 'paragraph', children: [{ text: 'Conteudo' }] }],
    placeholdersDefinidos: ['{{nome_reclamante}}', '{{empresa}}'],
    visibilidade: 'publico',
    segmentoId: null,
    criadoPor: 1,
    ativo: true,
    usoCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockPecaModeloListItem: PecaModeloListItem = {
    id: 1,
    titulo: 'Peticao Inicial Trabalhista',
    descricao: 'Modelo padrao',
    tipoPeca: 'peticao_inicial',
    visibilidade: 'publico',
    segmentoId: null,
    criadoPor: 1,
    usoCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockContratoDocumento: ContratoDocumento = {
    id: 1,
    contratoId: 10,
    documentoId: 100,
    arquivoId: null,
    geradoDeModeloId: null,
    tipoPeca: 'peticao_inicial',
    observacoes: null,
    createdBy: 1,
    createdAt: '2024-01-01T00:00:00Z',
  };

  // =========================================================================
  // PECAS MODELOS
  // =========================================================================

  describe('buscarPecaModelo', () => {
    it('deve retornar modelo existente', async () => {
      (repository.findPecaModeloById as jest.Mock).mockResolvedValue(ok(mockPecaModelo));

      const result = await buscarPecaModelo(1);

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(mockPecaModelo);
    });

    it('deve retornar null quando nao encontrado', async () => {
      (repository.findPecaModeloById as jest.Mock).mockResolvedValue(ok(null));

      const result = await buscarPecaModelo(999);

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBeNull();
    });

    it('deve falhar com ID invalido (0)', async () => {
      const result = await buscarPecaModelo(0);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(repository.findPecaModeloById).not.toHaveBeenCalled();
    });

    it('deve falhar com ID negativo', async () => {
      const result = await buscarPecaModelo(-1);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('listarPecasModelos', () => {
    it('deve listar com paginacao', async () => {
      const paginatedResponse = {
        data: [mockPecaModeloListItem],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasMore: false },
      };
      (repository.findAllPecasModelos as jest.Mock).mockResolvedValue(ok(paginatedResponse));

      const result = await listarPecasModelos({ page: 1, pageSize: 20 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(1);
        expect(result.data.pagination.total).toBe(1);
      }
    });

    it('deve propagar erro do repository', async () => {
      (repository.findAllPecasModelos as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro no banco')),
      );

      const result = await listarPecasModelos({});

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('criarPecaModelo', () => {
    it('deve criar com dados validos', async () => {
      const input = {
        titulo: 'Novo Modelo',
        tipoPeca: 'contestacao' as const,
        conteudo: [{ type: 'paragraph', children: [{ text: 'Texto' }] }],
      };
      (repository.createPecaModelo as jest.Mock).mockResolvedValue(ok({ ...mockPecaModelo, ...input }));

      const result = await criarPecaModelo(input, 1);

      expect(result.success).toBe(true);
      expect(repository.createPecaModelo).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Novo Modelo' }),
        1,
      );
    });

    it('deve falhar sem titulo', async () => {
      const input = { titulo: '', tipoPeca: 'outro' as const };

      const result = await criarPecaModelo(input);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(repository.createPecaModelo).not.toHaveBeenCalled();
    });

    it('deve falhar com tipo de peca invalido', async () => {
      const input = { titulo: 'Valido', tipoPeca: 'invalido' as any };

      const result = await criarPecaModelo(input);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('atualizarPecaModelo', () => {
    it('deve atualizar com dados validos', async () => {
      const input = { titulo: 'Titulo Atualizado' };
      (repository.updatePecaModelo as jest.Mock).mockResolvedValue(
        ok({ ...mockPecaModelo, titulo: 'Titulo Atualizado' }),
      );

      const result = await atualizarPecaModelo(1, input);

      expect(result.success).toBe(true);
      expect(repository.updatePecaModelo).toHaveBeenCalledWith(1, input);
    });

    it('deve extrair placeholders quando conteudo e atualizado', async () => {
      const input = {
        conteudo: [{ type: 'paragraph', children: [{ text: '{{nome}}' }] }],
      };
      (repository.updatePecaModelo as jest.Mock).mockResolvedValue(ok(mockPecaModelo));

      await atualizarPecaModelo(1, input);

      expect(repository.updatePecaModelo).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ placeholdersDefinidos: expect.any(Array) }),
      );
    });

    it('deve falhar com ID invalido', async () => {
      const result = await atualizarPecaModelo(0, { titulo: 'X' });

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve falhar com dados invalidos', async () => {
      const result = await atualizarPecaModelo(1, {
        titulo: '', // titulo vazio
      });

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('deletarPecaModelo', () => {
    it('deve deletar (soft delete) com sucesso', async () => {
      (repository.deletePecaModelo as jest.Mock).mockResolvedValue(ok(undefined));

      const result = await deletarPecaModelo(1);

      expect(result.success).toBe(true);
      expect(repository.deletePecaModelo).toHaveBeenCalledWith(1);
    });

    it('deve falhar com ID invalido', async () => {
      const result = await deletarPecaModelo(0);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve propagar erro do repository', async () => {
      (repository.deletePecaModelo as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro ao deletar')),
      );

      const result = await deletarPecaModelo(1);

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // PREVIEW GERACAO
  // =========================================================================

  describe('previewGeracaoPeca', () => {
    it('deve gerar preview quando modelo existe', async () => {
      (repository.findPecaModeloById as jest.Mock).mockResolvedValue(ok(mockPecaModelo));

      const result = await previewGeracaoPeca(1, {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('placeholders');
        expect(result.data).toHaveProperty('resolvidosCount');
        expect(result.data).toHaveProperty('naoResolvidosCount');
      }
    });

    it('deve falhar quando modelo nao existe', async () => {
      (repository.findPecaModeloById as jest.Mock).mockResolvedValue(ok(null));

      const result = await previewGeracaoPeca(999, {});

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('deve propagar erro do repository', async () => {
      (repository.findPecaModeloById as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro')),
      );

      const result = await previewGeracaoPeca(1, {});

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // CONTRATO DOCUMENTOS
  // =========================================================================

  describe('listarDocumentosDoContrato', () => {
    it('deve listar documentos de um contrato', async () => {
      const paginatedResponse = {
        data: [mockContratoDocumento],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasMore: false },
      };
      (repository.findContratoDocumentosByContrato as jest.Mock).mockResolvedValue(
        ok(paginatedResponse),
      );

      const result = await listarDocumentosDoContrato({ contratoId: 10 });

      expect(result.success).toBe(true);
    });

    it('deve falhar com contratoId invalido', async () => {
      const result = await listarDocumentosDoContrato({ contratoId: 0 });

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve falhar com contratoId negativo', async () => {
      const result = await listarDocumentosDoContrato({ contratoId: -5 });

      expect(result.success).toBe(false);
    });
  });

  describe('vincularDocumentoAoContrato', () => {
    it('deve vincular documento com dados validos', async () => {
      const input = { contratoId: 10, documentoId: 100 };
      (repository.createContratoDocumento as jest.Mock).mockResolvedValue(
        ok(mockContratoDocumento),
      );

      const result = await vincularDocumentoAoContrato(input, 1);

      expect(result.success).toBe(true);
    });

    it('deve falhar sem documentoId nem arquivoId', async () => {
      const input = { contratoId: 10 };

      const result = await vincularDocumentoAoContrato(input as any);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('desvincularDocumentoDoContrato', () => {
    it('deve desvincular com sucesso', async () => {
      (repository.deleteContratoDocumentoByIds as jest.Mock).mockResolvedValue(ok(undefined));

      const result = await desvincularDocumentoDoContrato(10, 100);

      expect(result.success).toBe(true);
      expect(repository.deleteContratoDocumentoByIds).toHaveBeenCalledWith(10, 100);
    });

    it('deve falhar com contratoId invalido', async () => {
      const result = await desvincularDocumentoDoContrato(0, 100);

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve falhar com documentoId invalido', async () => {
      const result = await desvincularDocumentoDoContrato(10, 0);

      expect(result.success).toBe(false);
    });
  });

  describe('desvincularItemDoContrato', () => {
    it('deve desvincular por ID do vinculo', async () => {
      (repository.deleteContratoDocumento as jest.Mock).mockResolvedValue(ok(undefined));

      const result = await desvincularItemDoContrato(1);

      expect(result.success).toBe(true);
      expect(repository.deleteContratoDocumento).toHaveBeenCalledWith(1);
    });

    it('deve falhar com ID invalido', async () => {
      const result = await desvincularItemDoContrato(0);

      expect(result.success).toBe(false);
    });
  });
});
