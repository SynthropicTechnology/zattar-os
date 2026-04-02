import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth';
import * as service from '../../service';
import {
  actionCompartilharDocumento,
  actionListarCompartilhamentos,
  actionAtualizarPermissao,
  actionRemoverCompartilhamento,
  actionListarDocumentosCompartilhados,
} from '../../actions/compartilhamento-actions';
import { criarCompartilhamentoMock } from '../fixtures';

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

describe('Compartilhamento Actions - Unit Tests', () => {
  const mockUser = { id: 1, nome_completo: 'Usuário Teste' };
  const mockCompartilhamento = criarCompartilhamentoMock();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateRequest.mockResolvedValue(mockUser as any);
  });

  describe('actionCompartilharDocumento', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const formData = new FormData();
      formData.append('documento_id', '1');
      formData.append('usuario_id', '2');
      formData.append('permissao', 'visualizar');

      const result = await actionCompartilharDocumento(formData);

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.compartilharDocumento).not.toHaveBeenCalled();
    });

    it('deve compartilhar documento com permissão visualizar', async () => {
      mockService.compartilharDocumento.mockResolvedValue(
        mockCompartilhamento
      );

      const formData = new FormData();
      formData.append('documento_id', '1');
      formData.append('usuario_id', '2');
      formData.append('permissao', 'visualizar');
      formData.append('pode_deletar', 'false');

      const result = await actionCompartilharDocumento(formData);

      expect(result).toEqual({
        success: true,
        data: mockCompartilhamento,
      });
      expect(mockService.compartilharDocumento).toHaveBeenCalledWith(
        {
          documento_id: 1,
          usuario_id: 2,
          permissao: 'visualizar',
          pode_deletar: false,
        },
        mockUser.id
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos/1');
    });

    it('deve compartilhar documento com permissão editar', async () => {
      const compartilhamentoEditar = criarCompartilhamentoMock({
        permissao: 'editar',
      });
      mockService.compartilharDocumento.mockResolvedValue(
        compartilhamentoEditar
      );

      const formData = new FormData();
      formData.append('documento_id', '1');
      formData.append('usuario_id', '2');
      formData.append('permissao', 'editar');
      formData.append('pode_deletar', 'false');

      const result = await actionCompartilharDocumento(formData);

      expect(result).toEqual({
        success: true,
        data: compartilhamentoEditar,
      });
      expect(mockService.compartilharDocumento).toHaveBeenCalledWith(
        expect.objectContaining({
          permissao: 'editar',
        }),
        mockUser.id
      );
    });

    it('deve compartilhar documento com pode_deletar = true', async () => {
      const compartilhamentoDeletar = criarCompartilhamentoMock({
        pode_deletar: true,
      });
      mockService.compartilharDocumento.mockResolvedValue(
        compartilhamentoDeletar
      );

      const formData = new FormData();
      formData.append('documento_id', '1');
      formData.append('usuario_id', '2');
      formData.append('permissao', 'editar');
      formData.append('pode_deletar', 'true');

      const result = await actionCompartilharDocumento(formData);

      expect(result).toEqual({
        success: true,
        data: compartilhamentoDeletar,
      });
      expect(mockService.compartilharDocumento).toHaveBeenCalledWith(
        expect.objectContaining({
          pode_deletar: true,
        }),
        mockUser.id
      );
    });

    it('deve converter string "true" para boolean true', async () => {
      mockService.compartilharDocumento.mockResolvedValue(
        mockCompartilhamento
      );

      const formData = new FormData();
      formData.append('documento_id', '1');
      formData.append('usuario_id', '2');
      formData.append('permissao', 'visualizar');
      formData.append('pode_deletar', 'true');

      await actionCompartilharDocumento(formData);

      expect(mockService.compartilharDocumento).toHaveBeenCalledWith(
        expect.objectContaining({
          pode_deletar: true,
        }),
        mockUser.id
      );
    });

    it('deve converter qualquer string diferente de "true" para boolean false', async () => {
      mockService.compartilharDocumento.mockResolvedValue(
        mockCompartilhamento
      );

      const formData = new FormData();
      formData.append('documento_id', '1');
      formData.append('usuario_id', '2');
      formData.append('permissao', 'visualizar');
      formData.append('pode_deletar', 'false');

      await actionCompartilharDocumento(formData);

      expect(mockService.compartilharDocumento).toHaveBeenCalledWith(
        expect.objectContaining({
          pode_deletar: false,
        }),
        mockUser.id
      );
    });

    it('deve retornar erro quando service lança exceção', async () => {
      mockService.compartilharDocumento.mockRejectedValue(
        new Error('Usuário já tem acesso a este documento')
      );

      const formData = new FormData();
      formData.append('documento_id', '1');
      formData.append('usuario_id', '2');
      formData.append('permissao', 'visualizar');

      const result = await actionCompartilharDocumento(formData);

      expect(result).toEqual({
        success: false,
        error: 'Error: Usuário já tem acesso a este documento',
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('actionListarCompartilhamentos', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionListarCompartilhamentos(1);

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.listarCompartilhamentos).not.toHaveBeenCalled();
    });

    it('deve listar compartilhamentos com sucesso', async () => {
      const mockCompartilhamentos = [
        mockCompartilhamento,
        criarCompartilhamentoMock({ id: 2, usuario_id: 3 }),
      ];
      mockService.listarCompartilhamentos.mockResolvedValue(
        mockCompartilhamentos
      );

      const result = await actionListarCompartilhamentos(1);

      expect(result).toEqual({
        success: true,
        data: mockCompartilhamentos,
      });
      expect(mockService.listarCompartilhamentos).toHaveBeenCalledWith(
        1,
        mockUser.id
      );
    });

    it('deve retornar erro quando acesso negado (não é proprietário)', async () => {
      mockService.listarCompartilhamentos.mockRejectedValue(
        new Error('Acesso negado: apenas o proprietário pode ver compartilhamentos')
      );

      const result = await actionListarCompartilhamentos(1);

      expect(result).toEqual({
        success: false,
        error: 'Error: Acesso negado: apenas o proprietário pode ver compartilhamentos',
      });
    });
  });

  describe('actionAtualizarPermissao', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionAtualizarPermissao(1, 'editar');

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.atualizarPermissao).not.toHaveBeenCalled();
    });

    it('deve atualizar permissão de visualizar para editar', async () => {
      const compartilhamentoAtualizado = criarCompartilhamentoMock({
        permissao: 'editar',
      });
      mockService.atualizarPermissao.mockResolvedValue(
        compartilhamentoAtualizado
      );

      const result = await actionAtualizarPermissao(1, 'editar');

      expect(result).toEqual({
        success: true,
        data: compartilhamentoAtualizado,
      });
      expect(mockService.atualizarPermissao).toHaveBeenCalledWith(
        1,
        { permissao: 'editar', pode_deletar: undefined },
        mockUser.id
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos/1');
    });

    it('deve atualizar pode_deletar', async () => {
      const compartilhamentoAtualizado = criarCompartilhamentoMock({
        pode_deletar: true,
      });
      mockService.atualizarPermissao.mockResolvedValue(
        compartilhamentoAtualizado
      );

      const result = await actionAtualizarPermissao(1, undefined, true);

      expect(result).toEqual({
        success: true,
        data: compartilhamentoAtualizado,
      });
      expect(mockService.atualizarPermissao).toHaveBeenCalledWith(
        1,
        { permissao: undefined, pode_deletar: true },
        mockUser.id
      );
    });

    it('deve atualizar permissão e pode_deletar ao mesmo tempo', async () => {
      const compartilhamentoAtualizado = criarCompartilhamentoMock({
        permissao: 'editar',
        pode_deletar: true,
      });
      mockService.atualizarPermissao.mockResolvedValue(
        compartilhamentoAtualizado
      );

      const result = await actionAtualizarPermissao(1, 'editar', true);

      expect(result).toEqual({
        success: true,
        data: compartilhamentoAtualizado,
      });
      expect(mockService.atualizarPermissao).toHaveBeenCalledWith(
        1,
        { permissao: 'editar', pode_deletar: true },
        mockUser.id
      );
    });

    it('deve retornar erro quando service lança exceção', async () => {
      mockService.atualizarPermissao.mockRejectedValue(
        new Error('Compartilhamento não encontrado')
      );

      const result = await actionAtualizarPermissao(999, 'editar');

      expect(result).toEqual({
        success: false,
        error: 'Error: Compartilhamento não encontrado',
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('actionRemoverCompartilhamento', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionRemoverCompartilhamento(1);

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(mockService.removerCompartilhamento).not.toHaveBeenCalled();
    });

    it('deve remover compartilhamento com sucesso', async () => {
      mockService.removerCompartilhamento.mockResolvedValue(undefined);

      const result = await actionRemoverCompartilhamento(1);

      expect(result).toEqual({ success: true });
      expect(mockService.removerCompartilhamento).toHaveBeenCalledWith(
        1,
        mockUser.id
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/app/documentos');
    });

    it('deve retornar erro quando acesso negado', async () => {
      mockService.removerCompartilhamento.mockRejectedValue(
        new Error('Acesso negado: apenas o proprietário pode remover compartilhamento')
      );

      const result = await actionRemoverCompartilhamento(1);

      expect(result).toEqual({
        success: false,
        error: 'Error: Acesso negado: apenas o proprietário pode remover compartilhamento',
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('actionListarDocumentosCompartilhados', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockAuthenticateRequest.mockResolvedValue(null);

      const result = await actionListarDocumentosCompartilhados();

      expect(result).toEqual({
        success: false,
        error: 'Não autenticado',
      });
      expect(
        mockService.listarDocumentosCompartilhadosComUsuario
      ).not.toHaveBeenCalled();
    });

    it('deve listar documentos compartilhados com o usuário', async () => {
      const mockDocumentos = [
        { id: 1, titulo: 'Doc 1', permissao: 'visualizar' },
        { id: 2, titulo: 'Doc 2', permissao: 'editar' },
      ];
      mockService.listarDocumentosCompartilhadosComUsuario.mockResolvedValue(
        mockDocumentos as any
      );

      const result = await actionListarDocumentosCompartilhados();

      expect(result).toEqual({
        success: true,
        data: mockDocumentos,
      });
      expect(
        mockService.listarDocumentosCompartilhadosComUsuario
      ).toHaveBeenCalledWith(mockUser.id);
    });

    it('deve retornar erro quando service lança exceção', async () => {
      mockService.listarDocumentosCompartilhadosComUsuario.mockRejectedValue(
        new Error('Erro ao buscar documentos')
      );

      const result = await actionListarDocumentosCompartilhados();

      expect(result).toEqual({
        success: false,
        error: 'Error: Erro ao buscar documentos',
      });
    });
  });
});
