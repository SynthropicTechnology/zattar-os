/**
 * Testes de Integração para Auth Require Permission
 *
 * Valida helpers de autenticação/autorização para rotas API incluindo:
 * - Verificação de autenticação + autorização
 * - Verificação apenas de autenticação
 * - Retorno de erros 401/403 apropriados
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAuthentication } from '@/lib/auth/require-permission';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { checkPermission } from '@/lib/auth/authorization';
import type { Recurso, Operacao } from '@/app/(authenticated)/usuarios';

// Mocks
jest.mock('@/lib/auth/api-auth');
jest.mock('@/lib/auth/authorization');

describe('Auth - Require Permission', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new NextRequest('http://localhost:3000/api/test');
  });

  describe('requirePermission', () => {
    describe('Autenticação e Autorização Bem-Sucedida', () => {
      it('deve retornar AuthorizedRequest quando autenticado e autorizado', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          userId: 'auth-uuid-123',
          source: 'session',
        });
        (checkPermission as jest.Mock).mockResolvedValue(true);

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        expect(result).not.toBeInstanceOf(NextResponse);
        expect(result).toEqual({
          usuarioId: 1,
          userId: 'auth-uuid-123',
          source: 'session',
        });
      });

      it('deve verificar permissão com usuarioId correto', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 42,
          source: 'bearer',
        });
        (checkPermission as jest.Mock).mockResolvedValue(true);

        // Act
        await requirePermission(mockRequest, 'contratos' as Recurso, 'editar' as Operacao);

        // Assert
        expect(checkPermission).toHaveBeenCalledWith(42, 'contratos', 'editar');
      });

      it('deve passar recurso e operação corretamente', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          source: 'session',
        });
        (checkPermission as jest.Mock).mockResolvedValue(true);

        // Act
        await requirePermission(mockRequest, 'audiencias' as Recurso, 'deletar' as Operacao);

        // Assert
        expect(checkPermission).toHaveBeenCalledWith(1, 'audiencias', 'deletar');
      });

      it('deve usar source "session" como padrão quando não fornecido', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          // source não fornecido
        });
        (checkPermission as jest.Mock).mockResolvedValue(true);

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        if (!(result instanceof NextResponse)) {
          expect(result.source).toBe('session');
        }
      });

      it('deve incluir userId quando fornecido', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          userId: 'uuid-123',
          source: 'bearer',
        });
        (checkPermission as jest.Mock).mockResolvedValue(true);

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        if (!(result instanceof NextResponse)) {
          expect(result.userId).toBe('uuid-123');
        }
      });
    });

    describe('Falhas de Autenticação', () => {
      it('deve retornar 401 quando usuário não autenticado', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: false,
          usuarioId: null,
        });

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        expect(result).toBeInstanceOf(NextResponse);
        if (result instanceof NextResponse) {
          expect(result.status).toBe(401);
          const body = await result.json();
          expect(body.error).toContain('Não autenticado');
        }
        expect(checkPermission).not.toHaveBeenCalled();
      });

      it('deve retornar 401 quando usuarioId é null', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: null,
        });

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        expect(result).toBeInstanceOf(NextResponse);
        if (result instanceof NextResponse) {
          expect(result.status).toBe(401);
        }
      });

      it('deve retornar 401 quando usuarioId é undefined', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: undefined,
        });

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        expect(result).toBeInstanceOf(NextResponse);
        if (result instanceof NextResponse) {
          expect(result.status).toBe(401);
        }
      });

      it('deve incluir mensagem de erro apropriada no 401', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: false,
          usuarioId: null,
        });

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        if (result instanceof NextResponse) {
          const body = await result.json();
          expect(body.error).toBe('Não autenticado. Faça login para acessar este recurso.');
        }
      });
    });

    describe('Falhas de Autorização', () => {
      it('deve retornar 403 quando usuário não tem permissão', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          source: 'session',
        });
        (checkPermission as jest.Mock).mockResolvedValue(false);

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'deletar' as Operacao);

        // Assert
        expect(result).toBeInstanceOf(NextResponse);
        if (result instanceof NextResponse) {
          expect(result.status).toBe(403);
          const body = await result.json();
          expect(body.error).toContain('Você não tem permissão');
        }
      });

      it('deve incluir detalhes da permissão no erro 403', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          source: 'session',
        });
        (checkPermission as jest.Mock).mockResolvedValue(false);

        // Act
        const result = await requirePermission(mockRequest, 'contratos' as Recurso, 'editar' as Operacao);

        // Assert
        if (result instanceof NextResponse) {
          const body = await result.json();
          expect(body.recurso).toBe('contratos');
          expect(body.operacao).toBe('editar');
          expect(body.required_permission).toBe('contratos.editar');
        }
      });

      it('deve incluir mensagem descritiva no erro 403', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          source: 'session',
        });
        (checkPermission as jest.Mock).mockResolvedValue(false);

        // Act
        const result = await requirePermission(mockRequest, 'audiencias' as Recurso, 'criar' as Operacao);

        // Assert
        if (result instanceof NextResponse) {
          const body = await result.json();
          expect(body.error).toBe('Você não tem permissão para criar audiencias.');
        }
      });
    });

    describe('Fluxo Completo', () => {
      it('deve validar autenticação antes de verificar autorização', async () => {
        // Arrange
        const authMock = jest.fn().mockResolvedValue({
          authenticated: false,
          usuarioId: null,
        });
        (authenticateRequest as jest.Mock).mockImplementation(authMock);
        const permMock = jest.fn();
        (checkPermission as jest.Mock).mockImplementation(permMock);

        // Act
        await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        expect(authMock).toHaveBeenCalledTimes(1);
        expect(permMock).not.toHaveBeenCalled(); // Não deve verificar permissão se não autenticado
      });

      it('deve verificar autorização apenas se autenticado', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          source: 'session',
        });
        const permMock = jest.fn().mockResolvedValue(true);
        (checkPermission as jest.Mock).mockImplementation(permMock);

        // Act
        await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        expect(permMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('Diferentes Fontes de Autenticação', () => {
      it('deve aceitar autenticação via session', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          source: 'session',
        });
        (checkPermission as jest.Mock).mockResolvedValue(true);

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        if (!(result instanceof NextResponse)) {
          expect(result.source).toBe('session');
        }
      });

      it('deve aceitar autenticação via bearer token', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          source: 'bearer',
        });
        (checkPermission as jest.Mock).mockResolvedValue(true);

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        if (!(result instanceof NextResponse)) {
          expect(result.source).toBe('bearer');
        }
      });

      it('deve aceitar autenticação via service', async () => {
        // Arrange
        (authenticateRequest as jest.Mock).mockResolvedValue({
          authenticated: true,
          usuarioId: 1,
          source: 'service',
        });
        (checkPermission as jest.Mock).mockResolvedValue(true);

        // Act
        const result = await requirePermission(mockRequest, 'processos' as Recurso, 'criar' as Operacao);

        // Assert
        if (!(result instanceof NextResponse)) {
          expect(result.source).toBe('service');
        }
      });
    });
  });

  describe('requireAuthentication', () => {
    it('deve retornar AuthorizedRequest quando autenticado', async () => {
      // Arrange
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: true,
        usuarioId: 1,
        userId: 'auth-uuid-123',
        source: 'session',
      });

      // Act
      const result = await requireAuthentication(mockRequest);

      // Assert
      expect(result).not.toBeInstanceOf(NextResponse);
      expect(result).toEqual({
        usuarioId: 1,
        userId: 'auth-uuid-123',
        source: 'session',
      });
    });

    it('deve retornar 401 quando não autenticado', async () => {
      // Arrange
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: false,
        usuarioId: null,
      });

      // Act
      const result = await requireAuthentication(mockRequest);

      // Assert
      expect(result).toBeInstanceOf(NextResponse);
      if (result instanceof NextResponse) {
        expect(result.status).toBe(401);
      }
    });

    it('não deve verificar permissões', async () => {
      // Arrange
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: true,
        usuarioId: 1,
        source: 'session',
      });
      const permMock = jest.fn();
      (checkPermission as jest.Mock).mockImplementation(permMock);

      // Act
      await requireAuthentication(mockRequest);

      // Assert
      expect(permMock).not.toHaveBeenCalled();
    });

    it('deve usar source "session" como padrão', async () => {
      // Arrange
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: true,
        usuarioId: 1,
      });

      // Act
      const result = await requireAuthentication(mockRequest);

      // Assert
      if (!(result instanceof NextResponse)) {
        expect(result.source).toBe('session');
      }
    });
  });

  describe('Casos de Uso Real', () => {
    it('deve simular POST /api/processos (criar processo)', async () => {
      // Arrange - Usuário autenticado com permissão
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: true,
        usuarioId: 1,
        userId: 'user-uuid',
        source: 'session',
      });
      (checkPermission as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/processos', {
        method: 'POST',
      });

      // Act
      const authOrError = await requirePermission(request, 'processos' as Recurso, 'criar' as Operacao);

      // Assert
      expect(authOrError).not.toBeInstanceOf(NextResponse);
      if (!(authOrError instanceof NextResponse)) {
        expect(authOrError.usuarioId).toBe(1);
        // Prosseguir com a lógica de criação...
      }
    });

    it('deve simular DELETE /api/processos/:id (sem permissão)', async () => {
      // Arrange - Usuário autenticado mas sem permissão de deletar
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: true,
        usuarioId: 2,
        source: 'session',
      });
      (checkPermission as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/processos/123', {
        method: 'DELETE',
      });

      // Act
      const authOrError = await requirePermission(request, 'processos' as Recurso, 'deletar' as Operacao);

      // Assert
      expect(authOrError).toBeInstanceOf(NextResponse);
      if (authOrError instanceof NextResponse) {
        expect(authOrError.status).toBe(403);
        const body = await authOrError.json();
        expect(body.error).toContain('deletar processos');
      }
    });

    it('deve simular GET /api/processos (apenas autenticação)', async () => {
      // Arrange - Apenas verifica autenticação, não permissões específicas
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: true,
        usuarioId: 1,
        source: 'bearer',
      });

      const request = new NextRequest('http://localhost:3000/api/processos', {
        method: 'GET',
      });

      // Act
      const authOrError = await requireAuthentication(request);

      // Assert
      expect(authOrError).not.toBeInstanceOf(NextResponse);
      if (!(authOrError instanceof NextResponse)) {
        expect(authOrError.usuarioId).toBe(1);
        // Prosseguir com a lógica de listagem...
      }
    });

    it('deve simular API pública (token inválido)', async () => {
      // Arrange - Token inválido ou expirado
      (authenticateRequest as jest.Mock).mockResolvedValue({
        authenticated: false,
        usuarioId: null,
      });

      const request = new NextRequest('http://localhost:3000/api/processos', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      // Act
      const authOrError = await requireAuthentication(request);

      // Assert
      expect(authOrError).toBeInstanceOf(NextResponse);
      if (authOrError instanceof NextResponse) {
        expect(authOrError.status).toBe(401);
      }
    });
  });
});
