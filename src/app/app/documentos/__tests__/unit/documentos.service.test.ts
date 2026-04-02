import {
  listarDocumentos,
  criarDocumento
} from '../../service';
import {
  listarDocumentos as listarDocumentosRepo,
  criarDocumento as criarDocumentoRepo,
  buscarDocumentoComUsuario as buscarDocumentoComUsuarioRepo,
} from '../../repositories/documentos-repository';
import { createServiceClient } from "@/lib/supabase/service-client";

// Mock dependencies
jest.mock('../../repositories/documentos-repository');
jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: jest.fn(),
}));

describe('Documentos Service', () => {
  const mockUsuarioId = 123;
  const mockDate = new Date().toISOString();

  const mockDocumento = {
    id: 1,
    titulo: 'Novo Documento',
    conteudo: [],
    pasta_id: null,
    criado_por: mockUsuarioId,
    editado_por: null,
    versao: 1,
    descricao: null,
    tags: [],
    created_at: mockDate,
    updated_at: mockDate,
    editado_em: null,
    deleted_at: null,
    criador: {
      id: mockUsuarioId,
      nomeCompleto: 'Usuário Teste',
      nomeExibicao: 'Teste',
      emailCorporativo: 'teste@exemplo.com'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceClient as jest.Mock).mockReturnValue({});
  });

  describe('criarDocumento', () => {
    it('deve criar documento com sucesso', async () => {
      // Arrange
      (criarDocumentoRepo as jest.Mock).mockResolvedValue(mockDocumento);
      (buscarDocumentoComUsuarioRepo as jest.Mock).mockResolvedValue(mockDocumento);

      const params = {
        titulo: 'Novo Documento',
        conteudo: []
      };

      // Act
      const result = await criarDocumento(params, mockUsuarioId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.titulo).toBe('Novo Documento');
      expect(criarDocumentoRepo).toHaveBeenCalledWith(
        expect.objectContaining(params),
        mockUsuarioId
      );
    });
  });

  describe('listarDocumentos', () => {
    it('deve listar documentos com sucesso', async () => {
      // Arrange
      const mockResponse = {
        documentos: [mockDocumento],
        total: 1
      };
      (listarDocumentosRepo as jest.Mock).mockResolvedValue(mockResponse);

      const params = { limit: 10, offset: 0 };

      // Act
      const result = await listarDocumentos(params);

      // Assert
      expect(result.documentos).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(listarDocumentosRepo).toHaveBeenCalledWith(params);
    });
  });
});
