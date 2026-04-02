import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth/session';
import * as service from '../../service';
import {
  actionUploadArquivoGenerico,
  actionListarItensUnificados,
  actionMoverArquivo,
  actionDeletarArquivo,
  actionBuscarCaminhoPasta,
} from '../../actions/arquivos-actions';
import { criarArquivoMock } from '../fixtures';

// Mocks
jest.mock('@/lib/auth/session');
jest.mock('../../service');
jest.mock('next/cache');

const mockAuthenticateRequest = authenticateRequest as jest.MockedFunction<
  typeof authenticateRequest
>;
const mockService = service as jest.Mocked<typeof service>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe('Arquivos Actions - Unit Tests', () => {
  const mockUser = { id: 1, nome_completo: 'Usuário Teste' };
  const mockArquivo = criarArquivoMock();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateRequest.mockResolvedValue(mockUser as any);
  });

  describe('actionUploadArquivoGenerico', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const formData = new FormData();
      formData.append('file', new File(['content'], 'test.pdf'));

      const result = await actionUploadArquivoGenerico(formData);

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.uploadArquivoGenerico).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando nenhum arquivo enviado', async () => {
      const formData = new FormData();

      const result = await actionUploadArquivoGenerico(formData);

      expect(result).toEqual({
        success: false,
        error: 'Nenhum arquivo enviado.',
      });
      expect(mockService.uploadArquivoGenerico).not.toHaveBeenCalled();
    });

    it('deve fazer upload com sucesso sem pasta_id', async () => {
      mockService.uploadArquivoGenerico.mockResolvedValue(mockArquivo);

      const formData = new FormData();
      const file = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });
      formData.append('file', file);

      const result = await actionUploadArquivoGenerico(formData);

      expect(result).toEqual({
        success: true,
        data: mockArquivo,
      });
      expect(mockService.uploadArquivoGenerico).toHaveBeenCalledWith(
        file,
        null,
        mockUser.id
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos');
    });

    it('deve fazer upload com sucesso com pasta_id', async () => {
      mockService.uploadArquivoGenerico.mockResolvedValue(mockArquivo);

      const formData = new FormData();
      const file = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });
      formData.append('file', file);
      formData.append('pasta_id', '5');

      const result = await actionUploadArquivoGenerico(formData);

      expect(result).toEqual({
        success: true,
        data: mockArquivo,
      });
      expect(mockService.uploadArquivoGenerico).toHaveBeenCalledWith(
        file,
        5,
        mockUser.id
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos');
    });

    it('deve retornar erro quando service lança exceção', async () => {
      mockService.uploadArquivoGenerico.mockRejectedValue(
        new Error('Tipo de arquivo não permitido')
      );

      const formData = new FormData();
      formData.append('file', new File(['content'], 'test.exe'));

      const result = await actionUploadArquivoGenerico(formData);

      expect(result).toEqual({
        success: false,
        error: 'Tipo de arquivo não permitido',
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('deve converter pasta_id string para number', async () => {
      mockService.uploadArquivoGenerico.mockResolvedValue(mockArquivo);

      const formData = new FormData();
      const file = new File(['content'], 'test.pdf');
      formData.append('file', file);
      formData.append('pasta_id', '42');

      await actionUploadArquivoGenerico(formData);

      expect(mockService.uploadArquivoGenerico).toHaveBeenCalledWith(
        file,
        42,
        mockUser.id
      );
    });
  });

  describe('actionListarItensUnificados', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionListarItensUnificados({});

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.listarItensUnificados).not.toHaveBeenCalled();
    });

    it('deve listar itens com sucesso', async () => {
      const mockItens = [{ tipo: 'arquivo', dados: mockArquivo }];
      mockService.listarItensUnificados.mockResolvedValue({
        itens: mockItens as any,
        total: 1,
      });

      const params = { pasta_id: 5, busca: 'teste', limit: 10 };
      const result = await actionListarItensUnificados(params);

      expect(result).toEqual({
        success: true,
        data: mockItens,
        total: 1,
      });
      expect(mockService.listarItensUnificados).toHaveBeenCalledWith(
        params,
        mockUser.id
      );
    });

    it('deve listar itens com filtro de tipo_media', async () => {
      const mockItens = [{ tipo: 'arquivo', dados: mockArquivo }];
      mockService.listarItensUnificados.mockResolvedValue({
        itens: mockItens as any,
        total: 1,
      });

      const params = { tipo_media: 'pdf' as const };
      await actionListarItensUnificados(params);

      expect(mockService.listarItensUnificados).toHaveBeenCalledWith(
        params,
        mockUser.id
      );
    });

    it('deve listar itens com paginação', async () => {
      mockService.listarItensUnificados.mockResolvedValue({
        itens: [],
        total: 0,
      });

      const params = { limit: 20, offset: 40 };
      await actionListarItensUnificados(params);

      expect(mockService.listarItensUnificados).toHaveBeenCalledWith(
        params,
        mockUser.id
      );
    });

    it('deve retornar erro quando service lança exceção', async () => {
      mockService.listarItensUnificados.mockRejectedValue(
        new Error('Erro ao listar itens')
      );

      const result = await actionListarItensUnificados({});

      expect(result).toEqual({
        success: false,
        error: 'Erro ao listar itens',
      });
    });
  });

  describe('actionMoverArquivo', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionMoverArquivo(1, 5);

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.moverArquivo).not.toHaveBeenCalled();
    });

    it('deve mover arquivo para pasta com sucesso', async () => {
      mockService.moverArquivo.mockResolvedValue(mockArquivo);

      const result = await actionMoverArquivo(1, 5);

      expect(result).toEqual({
        success: true,
        data: mockArquivo,
      });
      expect(mockService.moverArquivo).toHaveBeenCalledWith(1, 5, mockUser.id);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos');
    });

    it('deve mover arquivo para raiz (pasta_id = null)', async () => {
      mockService.moverArquivo.mockResolvedValue(mockArquivo);

      const result = await actionMoverArquivo(1, null);

      expect(result).toEqual({
        success: true,
        data: mockArquivo,
      });
      expect(mockService.moverArquivo).toHaveBeenCalledWith(
        1,
        null,
        mockUser.id
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos');
    });

    it('deve retornar erro quando acesso negado', async () => {
      mockService.moverArquivo.mockRejectedValue(
        new Error('Acesso negado: apenas o proprietário pode mover')
      );

      const result = await actionMoverArquivo(1, 5);

      expect(result).toEqual({
        success: false,
        error: 'Acesso negado: apenas o proprietário pode mover',
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('actionDeletarArquivo', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionDeletarArquivo(1);

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.deletarArquivo).not.toHaveBeenCalled();
    });

    it('deve deletar arquivo com sucesso (soft delete)', async () => {
      mockService.deletarArquivo.mockResolvedValue(undefined);

      const result = await actionDeletarArquivo(1);

      expect(result).toEqual({ success: true });
      expect(mockService.deletarArquivo).toHaveBeenCalledWith(1, mockUser.id);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos/lixeira');
    });

    it('deve retornar erro quando acesso negado', async () => {
      mockService.deletarArquivo.mockRejectedValue(
        new Error('Acesso negado: apenas o proprietário pode deletar')
      );

      const result = await actionDeletarArquivo(1);

      expect(result).toEqual({
        success: false,
        error: 'Acesso negado: apenas o proprietário pode deletar',
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('actionBuscarCaminhoPasta', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionBuscarCaminhoPasta(1);

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.buscarCaminhoPasta).not.toHaveBeenCalled();
    });

    it('deve buscar breadcrumbs com sucesso', async () => {
      const mockCaminho = [
        { id: 1, nome: 'Raiz' },
        { id: 2, nome: 'Subpasta' },
      ];
      mockService.buscarCaminhoPasta.mockResolvedValue(mockCaminho);

      const result = await actionBuscarCaminhoPasta(2);

      expect(result).toEqual({
        success: true,
        data: mockCaminho,
      });
      expect(mockService.buscarCaminhoPasta).toHaveBeenCalledWith(
        2,
        mockUser.id
      );
    });

    it('deve retornar erro quando acesso negado', async () => {
      mockService.buscarCaminhoPasta.mockRejectedValue(
        new Error('Acesso negado')
      );

      const result = await actionBuscarCaminhoPasta(1);

      expect(result).toEqual({
        success: false,
        error: 'Acesso negado',
      });
    });
  });
});
