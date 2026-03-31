/**
 * Tests for Assistentes Server Actions
 *
 * Tests real exported actions with mocked service layer and auth
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { revalidatePath } from 'next/cache';
import { criarAssistenteMock } from '../fixtures';

// Import REAL actions
import {
  actionListarAssistentes,
  actionBuscarAssistente,
  actionCriarAssistente,
  actionAtualizarAssistente,
  actionDeletarAssistente,
} from '../../actions/assistentes-actions';

// Mock dependencies
jest.mock('next/cache');

// Mock service layer — use getter to avoid hoisting issue
jest.mock('../../service', () => ({
  get listarAssistentes() { return mockService.listarAssistentes; },
  get buscarAssistentePorId() { return mockService.buscarAssistentePorId; },
  get criarAssistente() { return mockService.criarAssistente; },
  get atualizarAssistente() { return mockService.atualizarAssistente; },
  get deletarAssistente() { return mockService.deletarAssistente; },
}));

const mockService = {
  listarAssistentes: jest.fn(),
  buscarAssistentePorId: jest.fn(),
  criarAssistente: jest.fn(),
  atualizarAssistente: jest.fn(),
  deletarAssistente: jest.fn(),
};

// Mock auth utility — use getter to avoid hoisting issue
jest.mock('../../actions/utils', () => ({
  get requireAuth() {
    return mockRequireAuth;
  },
}));
const mockRequireAuth = jest.fn();

describe('Assistentes Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock auth to succeed by default
    mockRequireAuth.mockResolvedValue({ userId: 1 });
  });

  describe('actionListarAssistentes', () => {
    it('deve listar assistentes com autenticação', async () => {
      // Arrange
      const assistentes = [
        criarAssistenteMock({ id: 1 }),
        criarAssistenteMock({ id: 2 }),
      ];
      mockService.listarAssistentes.mockResolvedValue(assistentes);

      // Act
      const result = await actionListarAssistentes({});

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledWith(['assistentes:listar']);
      expect(mockService.listarAssistentes).toHaveBeenCalledWith({ ativo: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(assistentes);
      }
    });

    it('deve sempre passar ativo: true para listar apenas não deletados', async () => {
      // Arrange
      mockService.listarAssistentes.mockResolvedValue([]);

      // Act
      await actionListarAssistentes({ busca: 'teste' });

      // Assert
      expect(mockService.listarAssistentes).toHaveBeenCalledWith({
        busca: 'teste',
        ativo: true,
      });
    });

    it('deve retornar erro quando não autenticado', async () => {
      // Arrange
      mockRequireAuth.mockRejectedValue(new Error('Não autorizado'));

      // Act
      const result = await actionListarAssistentes({});

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Não autorizado');
      }
      expect(mockService.listarAssistentes).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.listarAssistentes.mockRejectedValue(
        new Error('Erro ao buscar assistentes')
      );

      // Act
      const result = await actionListarAssistentes({});

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao buscar assistentes');
      }
    });
  });

  describe('actionBuscarAssistente', () => {
    it('deve buscar assistente por ID', async () => {
      // Arrange
      const assistente = criarAssistenteMock({ id: 1 });
      mockService.buscarAssistentePorId.mockResolvedValue(assistente);

      // Act
      const result = await actionBuscarAssistente(1);

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledWith(['assistentes:listar']);
      expect(mockService.buscarAssistentePorId).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(assistente);
      }
    });

    it('deve retornar erro quando assistente não encontrado', async () => {
      // Arrange
      mockService.buscarAssistentePorId.mockResolvedValue(null);

      // Act
      const result = await actionBuscarAssistente(999);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Assistente não encontrado');
      }
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.buscarAssistentePorId.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await actionBuscarAssistente(1);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database error');
      }
    });
  });

  describe('actionCriarAssistente', () => {
    it('deve criar assistente e revalidar cache', async () => {
      // Arrange
      const assistente = criarAssistenteMock();
      mockService.criarAssistente.mockResolvedValue(assistente);

      const formData = new FormData();
      formData.append('nome', 'Novo Assistente');
      formData.append('descricao', 'Descrição teste');
      formData.append('iframe_code', '<iframe src="test"></iframe>');

      // Act
      const result = await actionCriarAssistente(formData);

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledWith(['assistentes:criar']);
      expect(mockService.criarAssistente).toHaveBeenCalledWith(
        {
          nome: 'Novo Assistente',
          descricao: 'Descrição teste',
          iframe_code: '<iframe src="test"></iframe>',
        },
        1 // userId from mock
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(assistente);
      }

      // Verify cache revalidation
      expect(revalidatePath).toHaveBeenCalledWith('/app/assistentes');
    });

    it('deve retornar erro quando não autenticado', async () => {
      // Arrange
      mockRequireAuth.mockRejectedValue(new Error('Não autorizado'));

      const formData = new FormData();
      formData.append('nome', 'Teste');
      formData.append('iframe_code', '<iframe></iframe>');

      // Act
      const result = await actionCriarAssistente(formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Não autorizado');
      }
      expect(mockService.criarAssistente).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando validação Zod falha - nome obrigatório', async () => {
      // Arrange
      mockService.criarAssistente.mockRejectedValue(
        new Error('Dados inválidos: nome é obrigatório')
      );

      const formData = new FormData();
      // Missing nome
      formData.append('iframe_code', '<iframe></iframe>');

      // Act
      const result = await actionCriarAssistente(formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Dados inválidos');
      }
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando validação Zod falha - iframe_code obrigatório', async () => {
      // Arrange
      mockService.criarAssistente.mockRejectedValue(
        new Error('Dados inválidos: iframe_code é obrigatório')
      );

      const formData = new FormData();
      formData.append('nome', 'Teste');
      // Missing iframe_code

      // Act
      const result = await actionCriarAssistente(formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Dados inválidos');
      }
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.criarAssistente.mockRejectedValue(
        new Error('Erro ao criar assistente')
      );

      const formData = new FormData();
      formData.append('nome', 'Teste');
      formData.append('iframe_code', '<iframe></iframe>');

      // Act
      const result = await actionCriarAssistente(formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao criar assistente');
      }
      // Cache should NOT be revalidated on error
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('actionAtualizarAssistente', () => {
    it('deve atualizar assistente e revalidar cache', async () => {
      // Arrange
      const assistente = criarAssistenteMock({ id: 1, nome: 'Atualizado' });
      mockService.atualizarAssistente.mockResolvedValue(assistente);

      const formData = new FormData();
      formData.append('nome', 'Atualizado');
      formData.append('descricao', 'Nova descrição');

      // Act
      const result = await actionAtualizarAssistente(1, formData);

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledWith(['assistentes:editar']);
      expect(mockService.atualizarAssistente).toHaveBeenCalledWith(1, {
        nome: 'Atualizado',
        descricao: 'Nova descrição',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(assistente);
      }

      // Verify cache revalidation
      expect(revalidatePath).toHaveBeenCalledWith('/app/assistentes');
    });

    it('deve permitir atualização parcial', async () => {
      // Arrange
      const assistente = criarAssistenteMock({ id: 1, ativo: false });
      mockService.atualizarAssistente.mockResolvedValue(assistente);

      const formData = new FormData();
      formData.append('ativo', 'false');

      // Act
      const result = await actionAtualizarAssistente(1, formData);

      // Assert
      expect(mockService.atualizarAssistente).toHaveBeenCalledWith(1, {
        ativo: false,
      });
      expect(result.success).toBe(true);
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.atualizarAssistente.mockRejectedValue(
        new Error('Erro ao atualizar assistente')
      );

      const formData = new FormData();
      formData.append('nome', 'Teste');

      // Act
      const result = await actionAtualizarAssistente(1, formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao atualizar assistente');
      }
      // Cache should NOT be revalidated on error
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('actionDeletarAssistente', () => {
    it('deve deletar assistente e revalidar cache', async () => {
      // Arrange
      mockService.deletarAssistente.mockResolvedValue(true);

      // Act
      const result = await actionDeletarAssistente(1);

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledWith(['assistentes:deletar']);
      expect(mockService.deletarAssistente).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }

      // Verify cache revalidation
      expect(revalidatePath).toHaveBeenCalledWith('/app/assistentes');
    });

    it('deve retornar erro quando não autenticado', async () => {
      // Arrange
      mockRequireAuth.mockRejectedValue(new Error('Não autorizado'));

      // Act
      const result = await actionDeletarAssistente(1);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Não autorizado');
      }
      expect(mockService.deletarAssistente).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.deletarAssistente.mockRejectedValue(
        new Error('Erro ao deletar assistente')
      );

      // Act
      const result = await actionDeletarAssistente(1);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao deletar assistente');
      }
      // Cache should NOT be revalidated on error
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});
