/**
 * Tests for Perícias Server Actions
 *
 * Tests real exported actions with mocked service layer and cache revalidation
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { revalidatePath } from 'next/cache';
import { criarPericiaMock, criarListarPericiasResultMock, criarEspecialidadeMock } from '../fixtures';
import { ok, err, appError } from '@/types';

// Mock dependencies
jest.mock('next/cache');

// Mock service layer with proper named exports
jest.mock('../../service', () => ({
  listarPericias: jest.fn(),
  obterPericia: jest.fn(),
  atribuirResponsavel: jest.fn(),
  adicionarObservacao: jest.fn(),
  listarEspecialidadesPericia: jest.fn(),
}));

// Import REAL actions (after mocks)
import {
  actionListarPericias,
  actionObterPericia,
  actionAtribuirResponsavel,
  actionAdicionarObservacao,
  actionListarEspecialidadesPericia,
} from '../../actions/pericias-actions';

// Import mocked service to access mocks in tests
import * as mockService from '../../service';

describe('Perícias Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionListarPericias', () => {
    it('deve listar perícias com paginação', async () => {
      // Arrange
      const mockResult = criarListarPericiasResultMock(2);
      mockService.listarPericias.mockResolvedValue(ok(mockResult));

      // Act
      const result = await actionListarPericias({
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(mockService.listarPericias).toHaveBeenCalledWith({
        pagina: 1,
        limite: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
        expect(result.message).toBe('Perícias carregadas com sucesso');
      }
    });

    it('deve aplicar filtros de busca', async () => {
      // Arrange
      const mockResult = criarListarPericiasResultMock(1);
      mockService.listarPericias.mockResolvedValue(ok(mockResult));

      // Act
      const result = await actionListarPericias({
        trt: '02',
        grau: 'primeiro_grau',
        situacaoCodigo: 'L',
        responsavelId: 5,
      });

      // Assert
      expect(mockService.listarPericias).toHaveBeenCalledWith({
        trt: '02',
        grau: 'primeiro_grau',
        situacaoCodigo: 'L',
        responsavelId: 5,
      });
      expect(result.success).toBe(true);
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.listarPericias.mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro ao buscar perícias'))
      );

      // Act
      const result = await actionListarPericias({ pagina: 1, limite: 50 });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao buscar perícias');
        expect(result.message).toBe('Erro ao buscar perícias');
      }
    });

    it('deve capturar exceções e retornar erro genérico', async () => {
      // Arrange
      mockService.listarPericias.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await actionListarPericias({ pagina: 1, limite: 50 });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Network error');
        expect(result.message).toBe('Erro ao carregar perícias. Tente novamente.');
      }
    });
  });

  describe('actionObterPericia', () => {
    it('deve obter perícia por ID', async () => {
      // Arrange
      const pericia = criarPericiaMock({ id: 1 });
      mockService.obterPericia.mockResolvedValue(ok(pericia));

      // Act
      const result = await actionObterPericia(1);

      // Assert
      expect(mockService.obterPericia).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(pericia);
        expect(result.message).toBe('Perícia carregada');
      }
    });

    it('deve retornar erro quando perícia não existe', async () => {
      // Arrange
      mockService.obterPericia.mockResolvedValue(ok(null));

      // Act
      const result = await actionObterPericia(999);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Perícia não encontrada');
        expect(result.message).toBe('Perícia não encontrada');
      }
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.obterPericia.mockResolvedValue(
        err(appError('NOT_FOUND', 'Perícia não encontrada'))
      );

      // Act
      const result = await actionObterPericia(1);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Perícia não encontrada');
      }
    });

    it('deve capturar exceções', async () => {
      // Arrange
      mockService.obterPericia.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await actionObterPericia(1);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database error');
        expect(result.message).toBe('Erro ao carregar perícia. Tente novamente.');
      }
    });
  });

  describe('actionAtribuirResponsavel', () => {
    it('deve atribuir responsável e revalidar cache', async () => {
      // Arrange
      mockService.atribuirResponsavel.mockResolvedValue(ok(true));

      const formData = new FormData();
      formData.append('periciaId', '1');
      formData.append('responsavelId', '5');

      // Act
      const result = await actionAtribuirResponsavel(formData);

      // Assert
      expect(mockService.atribuirResponsavel).toHaveBeenCalledWith({
        periciaId: 1,
        responsavelId: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
        expect(result.message).toBe('Responsável atribuído');
      }

      // Verify cache revalidation
      expect(revalidatePath).toHaveBeenCalledWith('/app/pericias');
      expect(revalidatePath).toHaveBeenCalledWith('/app/pericias/semana');
      expect(revalidatePath).toHaveBeenCalledWith('/app/pericias/mes');
      expect(revalidatePath).toHaveBeenCalledWith('/app/pericias/ano');
      expect(revalidatePath).toHaveBeenCalledWith('/app/pericias/lista');
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.atribuirResponsavel.mockResolvedValue(
        err(appError('VALIDATION_ERROR', 'Responsável inválido'))
      );

      const formData = new FormData();
      formData.append('periciaId', '1');
      formData.append('responsavelId', '999');

      // Act
      const result = await actionAtribuirResponsavel(formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Responsável inválido');
      }

      // Cache should NOT be revalidated on error
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('deve capturar exceções', async () => {
      // Arrange
      mockService.atribuirResponsavel.mockRejectedValue(new Error('Network error'));

      const formData = new FormData();
      formData.append('periciaId', '1');
      formData.append('responsavelId', '5');

      // Act
      const result = await actionAtribuirResponsavel(formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Network error');
        expect(result.message).toBe('Erro ao atribuir responsável. Tente novamente.');
      }
    });
  });

  describe('actionAdicionarObservacao', () => {
    it('deve adicionar observação e revalidar cache', async () => {
      // Arrange
      mockService.adicionarObservacao.mockResolvedValue(ok(true));

      const formData = new FormData();
      formData.append('periciaId', '1');
      formData.append('observacoes', 'Nova observação importante');

      // Act
      const result = await actionAdicionarObservacao(formData);

      // Assert
      expect(mockService.adicionarObservacao).toHaveBeenCalledWith({
        periciaId: 1,
        observacoes: 'Nova observação importante',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
        expect(result.message).toBe('Observações atualizadas');
      }

      // Verify cache revalidation
      expect(revalidatePath).toHaveBeenCalledWith('/app/pericias');
      expect(revalidatePath).toHaveBeenCalledWith('/app/pericias/semana');
      expect(revalidatePath).toHaveBeenCalledWith('/app/pericias/mes');
      expect(revalidatePath).toHaveBeenCalledWith('/app/pericias/ano');
      expect(revalidatePath).toHaveBeenCalledWith('/app/pericias/lista');
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.adicionarObservacao.mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro ao salvar observações'))
      );

      const formData = new FormData();
      formData.append('periciaId', '1');
      formData.append('observacoes', 'Teste');

      // Act
      const result = await actionAdicionarObservacao(formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao salvar observações');
      }

      // Cache should NOT be revalidated on error
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('deve lidar com observações vazias', async () => {
      // Arrange
      mockService.adicionarObservacao.mockResolvedValue(ok(true));

      const formData = new FormData();
      formData.append('periciaId', '1');
      // observacoes não fornecido - deve usar string vazia

      // Act
      const result = await actionAdicionarObservacao(formData);

      // Assert
      expect(mockService.adicionarObservacao).toHaveBeenCalledWith({
        periciaId: 1,
        observacoes: '',
      });
      expect(result.success).toBe(true);
    });

    it('deve capturar exceções', async () => {
      // Arrange
      mockService.adicionarObservacao.mockRejectedValue(new Error('Database error'));

      const formData = new FormData();
      formData.append('periciaId', '1');
      formData.append('observacoes', 'Teste');

      // Act
      const result = await actionAdicionarObservacao(formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database error');
        expect(result.message).toBe('Erro ao atualizar observações. Tente novamente.');
      }
    });
  });

  describe('actionListarEspecialidadesPericia', () => {
    it('deve listar especialidades', async () => {
      // Arrange
      const especialidades = [
        criarEspecialidadeMock({ id: 1, descricao: 'Medicina do Trabalho' }),
        criarEspecialidadeMock({ id: 2, descricao: 'Engenharia de Segurança' }),
      ];

      mockService.listarEspecialidadesPericia.mockResolvedValue(ok(especialidades));

      // Act
      const result = await actionListarEspecialidadesPericia();

      // Assert
      expect(mockService.listarEspecialidadesPericia).toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.especialidades).toEqual(especialidades);
        expect(result.message).toBe('Especialidades carregadas');
      }
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      mockService.listarEspecialidadesPericia.mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro ao buscar especialidades'))
      );

      // Act
      const result = await actionListarEspecialidadesPericia();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Erro ao buscar especialidades');
      }
    });

    it('deve capturar exceções', async () => {
      // Arrange
      mockService.listarEspecialidadesPericia.mockRejectedValue(new Error('Connection failed'));

      // Act
      const result = await actionListarEspecialidadesPericia();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Connection failed');
        expect(result.message).toBe('Erro ao carregar especialidades. Tente novamente.');
      }
    });
  });
});
