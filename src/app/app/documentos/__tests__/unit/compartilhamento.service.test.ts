import { compartilharDocumento } from '../../service';
import * as documentosRepo from '../../repositories/documentos-repository';
import * as compartilhamentoRepo from '../../repositories/compartilhamento-repository';
import { usuarioRepository } from '@/app/app/usuarios/repository';

// Mock dependencies
jest.mock('../../repositories/documentos-repository');
jest.mock('../../repositories/compartilhamento-repository');
jest.mock('@/app/app/usuarios/repository', () => ({
  usuarioRepository: {
    findById: jest.fn(),
  },
}));

describe('Documentos Service - Compartilhamento', () => {
  const mockUsuarioId = 123;
  const mockOutroUsuarioId = 456;
  const mockDocumentoId = 1;

  const mockDocumento = {
    id: mockDocumentoId,
    titulo: 'Novo Documento',
    conteudo: [],
    pasta_id: null,
    criado_por: mockUsuarioId,
    versao: 1,
    descricao: null,
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    editado_em: null,
    deleted_at: null,
    criador: { id: mockUsuarioId }
  };

  const mockUsuario = {
    id: mockOutroUsuarioId,
    nomeCompleto: 'Outro Usuário',
    emailCorporativo: 'outro@teste.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve compartilhar documento com sucesso quando usuário existe', async () => {
    // Arrange
    (documentosRepo.buscarDocumentoPorId as jest.Mock).mockResolvedValue(mockDocumento);
    (usuarioRepository.findById as jest.Mock).mockResolvedValue(mockUsuario);
    (compartilhamentoRepo.compartilharDocumento as jest.Mock).mockResolvedValue({
      documento_id: mockDocumentoId,
      usuario_id: mockOutroUsuarioId,
      permissao: 'visualizar'
    });

    const params = {
      documento_id: mockDocumentoId,
      usuario_id: mockOutroUsuarioId,
      permissao: 'visualizar'
    };

    // Act
    const result = await compartilharDocumento(params, mockUsuarioId);

    // Assert
    expect(result).toBeDefined();
    expect(usuarioRepository.findById).toHaveBeenCalledWith(mockOutroUsuarioId);
    expect(compartilhamentoRepo.compartilharDocumento).toHaveBeenCalled();
  });

  it('deve lançar erro ao tentar compartilhar consigo mesmo', async () => {
    // Arrange
    (documentosRepo.buscarDocumentoPorId as jest.Mock).mockResolvedValue(mockDocumento);

    const params = {
      documento_id: mockDocumentoId,
      usuario_id: mockUsuarioId, // Mesmo ID
      permissao: 'visualizar'
    };

    // Act & Assert
    await expect(compartilharDocumento(params, mockUsuarioId))
      .rejects
      .toThrow("Não é possível compartilhar um documento consigo mesmo.");

    expect(usuarioRepository.findById).not.toHaveBeenCalled();
  });

  it('deve lançar erro quando usuário não existe', async () => {
    // Arrange
    (documentosRepo.buscarDocumentoPorId as jest.Mock).mockResolvedValue(mockDocumento);
    (usuarioRepository.findById as jest.Mock).mockResolvedValue(null); // Usuário não encontrado

    const params = {
      documento_id: mockDocumentoId,
      usuario_id: 999,
      permissao: 'visualizar'
    };

    // Act & Assert
    await expect(compartilharDocumento(params, mockUsuarioId))
      .rejects
      .toThrow("Usuário não encontrado.");

    expect(usuarioRepository.findById).toHaveBeenCalledWith(999);
    expect(compartilhamentoRepo.compartilharDocumento).not.toHaveBeenCalled();
  });

  it('deve lançar erro quando documento não encontrado', async () => {
    // Arrange
    (documentosRepo.buscarDocumentoPorId as jest.Mock).mockResolvedValue(null);

    const params = {
      documento_id: 999,
      usuario_id: mockOutroUsuarioId,
      permissao: 'visualizar'
    };

    // Act & Assert
    await expect(compartilharDocumento(params, mockUsuarioId))
      .rejects
      .toThrow("Acesso negado: apenas o proprietário pode compartilhar.");
  });

  it('deve lançar erro quando usuário não é proprietário', async () => {
    // Arrange
    const docDeOutro = { ...mockDocumento, criado_por: 999 };
    (documentosRepo.buscarDocumentoPorId as jest.Mock).mockResolvedValue(docDeOutro);

    const params = {
      documento_id: mockDocumentoId,
      usuario_id: mockOutroUsuarioId,
      permissao: 'visualizar'
    };

    // Act & Assert
    await expect(compartilharDocumento(params, mockUsuarioId))
      .rejects
      .toThrow("Acesso negado: apenas o proprietário pode compartilhar.");
  });
});
