import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import * as service from '../../service';
import {
  actionListarPastas,
  actionCriarPasta,
  actionMoverDocumento,
  actionDeletarPasta,
} from '../../actions/pastas-actions';
import { criarPastaMock } from '../fixtures';

// Mocks
jest.mock('@/lib/auth');
jest.mock('../../service');
jest.mock('next/cache');

const mockAuthenticateRequest = authenticateRequest as jest.MockedFunction<
  typeof authenticateRequest
>;
const mockService = service as jest.Mocked<typeof service>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe('Pastas Actions - Unit Tests', () => {
  const mockUser = { id: 1, nome_completo: 'Usuário Teste' };
  const mockPasta = criarPastaMock();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateRequest.mockResolvedValue(mockUser as any);
  });

  describe('actionListarPastas', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionListarPastas();

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.listarPastas).not.toHaveBeenCalled();
    });

    it('deve listar pastas com sucesso', async () => {
      const mockPastas = [mockPasta, criarPastaMock({ id: 2, nome: 'Pasta 2' })];
      mockService.listarPastas.mockResolvedValue(mockPastas);

      const result = await actionListarPastas();

      expect(result).toEqual({
        success: true,
        data: mockPastas,
      });
      expect(mockService.listarPastas).toHaveBeenCalledWith(mockUser.id);
    });

    it('deve retornar erro quando service lança exceção', async () => {
      mockService.listarPastas.mockRejectedValue(new Error('Erro ao listar'));

      const result = await actionListarPastas();

      expect(result).toEqual({
        success: false,
        error: 'Error: Erro ao listar',
      });
    });
  });

  describe('actionCriarPasta', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const formData = new FormData();
      formData.append('nome', 'Nova Pasta');

      const result = await actionCriarPasta(formData);

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.criarPasta).not.toHaveBeenCalled();
    });

    it('deve criar pasta com sucesso (tipo comum)', async () => {
      mockService.criarPasta.mockResolvedValue(mockPasta);

      const formData = new FormData();
      formData.append('nome', 'Nova Pasta');
      formData.append('tipo', 'comum');

      const result = await actionCriarPasta(formData);

      expect(result).toEqual({
        success: true,
        data: mockPasta,
      });
      expect(mockService.criarPasta).toHaveBeenCalledWith(
        {
          nome: 'Nova Pasta',
          pasta_pai_id: null,
          tipo: 'comum',
          descricao: null,
          cor: null,
          icone: null,
        },
        mockUser.id
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos');
    });

    it('deve criar pasta privada com sucesso', async () => {
      const mockPastaPrivada = criarPastaMock({ tipo: 'privada' });
      mockService.criarPasta.mockResolvedValue(mockPastaPrivada);

      const formData = new FormData();
      formData.append('nome', 'Pasta Privada');
      formData.append('tipo', 'privada');

      const result = await actionCriarPasta(formData);

      expect(result).toEqual({
        success: true,
        data: mockPastaPrivada,
      });
      expect(mockService.criarPasta).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Pasta Privada',
          tipo: 'privada',
        }),
        mockUser.id
      );
    });

    it('deve criar subpasta com pasta_pai_id', async () => {
      mockService.criarPasta.mockResolvedValue(mockPasta);

      const formData = new FormData();
      formData.append('nome', 'Subpasta');
      formData.append('tipo', 'comum');
      formData.append('pasta_pai_id', '5');

      const result = await actionCriarPasta(formData);

      expect(result).toEqual({
        success: true,
        data: mockPasta,
      });
      expect(mockService.criarPasta).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Subpasta',
          pasta_pai_id: 5,
        }),
        mockUser.id
      );
    });

    it('deve criar pasta com campos opcionais', async () => {
      mockService.criarPasta.mockResolvedValue(mockPasta);

      const formData = new FormData();
      formData.append('nome', 'Pasta Completa');
      formData.append('tipo', 'comum');
      formData.append('descricao', 'Descrição da pasta');
      formData.append('cor', '#FF0000');
      formData.append('icone', 'folder');

      const result = await actionCriarPasta(formData);

      expect(result).toEqual({
        success: true,
        data: mockPasta,
      });
      expect(mockService.criarPasta).toHaveBeenCalledWith(
        {
          nome: 'Pasta Completa',
          pasta_pai_id: null,
          tipo: 'comum',
          descricao: 'Descrição da pasta',
          cor: '#FF0000',
          icone: 'folder',
        },
        mockUser.id
      );
    });

    it('deve criar pasta na raiz (pasta_pai_id = null)', async () => {
      mockService.criarPasta.mockResolvedValue(mockPasta);

      const formData = new FormData();
      formData.append('nome', 'Pasta Raiz');
      formData.append('tipo', 'comum');

      const _result = await actionCriarPasta(formData);

      expect(mockService.criarPasta).toHaveBeenCalledWith(
        expect.objectContaining({
          pasta_pai_id: null,
        }),
        mockUser.id
      );
    });

    it('deve retornar erro quando service lança exceção', async () => {
      mockService.criarPasta.mockRejectedValue(
        new Error('Nome de pasta inválido')
      );

      const formData = new FormData();
      formData.append('nome', '');
      formData.append('tipo', 'comum');

      const result = await actionCriarPasta(formData);

      expect(result).toEqual({
        success: false,
        error: 'Error: Nome de pasta inválido',
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('actionMoverDocumento', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionMoverDocumento(1, 5);

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.moverDocumento).not.toHaveBeenCalled();
    });

    it('deve mover documento para pasta com sucesso', async () => {
      const mockDocumento = { id: 1, titulo: 'Documento Teste' };
      mockService.moverDocumento.mockResolvedValue(mockDocumento as any);

      const result = await actionMoverDocumento(1, 5);

      expect(result).toEqual({
        success: true,
        data: mockDocumento,
      });
      expect(mockService.moverDocumento).toHaveBeenCalledWith(
        1,
        5,
        mockUser.id
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos');
    });

    it('deve mover documento para raiz (pasta_id = null)', async () => {
      const mockDocumento = { id: 1, titulo: 'Documento Teste' };
      mockService.moverDocumento.mockResolvedValue(mockDocumento as any);

      const result = await actionMoverDocumento(1, null);

      expect(result).toEqual({
        success: true,
        data: mockDocumento,
      });
      expect(mockService.moverDocumento).toHaveBeenCalledWith(
        1,
        null,
        mockUser.id
      );
    });

    it('deve retornar erro quando acesso negado', async () => {
      mockService.moverDocumento.mockRejectedValue(
        new Error('Acesso negado')
      );

      const result = await actionMoverDocumento(1, 5);

      expect(result).toEqual({
        success: false,
        error: 'Error: Acesso negado',
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('actionDeletarPasta', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionDeletarPasta(1);

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.deletarPasta).not.toHaveBeenCalled();
    });

    it('deve deletar pasta com sucesso (soft delete)', async () => {
      mockService.deletarPasta.mockResolvedValue(undefined);

      const result = await actionDeletarPasta(1);

      expect(result).toEqual({ success: true });
      expect(mockService.deletarPasta).toHaveBeenCalledWith(1, mockUser.id);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos');
    });

    it('deve retornar erro quando acesso negado', async () => {
      mockService.deletarPasta.mockRejectedValue(
        new Error('Acesso negado: apenas o proprietário pode deletar')
      );

      const result = await actionDeletarPasta(1);

      expect(result).toEqual({
        success: false,
        error: 'Error: Acesso negado: apenas o proprietário pode deletar',
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando pasta não está vazia', async () => {
      mockService.deletarPasta.mockRejectedValue(
        new Error('Pasta não pode ser deletada: contém itens')
      );

      const result = await actionDeletarPasta(1);

      expect(result).toEqual({
        success: false,
        error: 'Error: Pasta não pode ser deletada: contém itens',
      });
    });
  });
});
