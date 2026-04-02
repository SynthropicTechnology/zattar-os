import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import { criarPericiaMock, criarListarPericiasResultMock, criarEspecialidadeMock } from '../fixtures';
import { ok, err, appError } from '@/types';

jest.mock('../../repository');

describe('Perícias Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarPericias', () => {
    it('deve listar perícias com paginação padrão', async () => {
      // Arrange
      const mockResult = criarListarPericiasResultMock(2);
      (repository.findAllPericias as jest.Mock).mockResolvedValue(ok(mockResult));

      // Act
      const result = await service.listarPericias({});

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(2);
        expect(result.data.pagination.page).toBe(1);
        expect(result.data.pagination.limit).toBe(50);
      }
      expect(repository.findAllPericias).toHaveBeenCalledWith(
        expect.objectContaining({
          pagina: 1,
          limite: 50,
          ordenarPor: 'prazo_entrega',
          ordem: 'asc',
        })
      );
    });

    it('deve aplicar filtros de trt, grau e situação', async () => {
      // Arrange
      const mockResult = criarListarPericiasResultMock(1);
      (repository.findAllPericias as jest.Mock).mockResolvedValue(ok(mockResult));

      // Act
      await service.listarPericias({
        trt: '02',
        grau: 'primeiro_grau',
        situacaoCodigo: 'L',
        pagina: 1,
        limite: 25,
      });

      // Assert
      expect(repository.findAllPericias).toHaveBeenCalledWith(
        expect.objectContaining({
          trt: '02',
          grau: 'primeiro_grau',
          situacaoCodigo: 'L',
          pagina: 1,
          limite: 25,
        })
      );
    });

    it('deve filtrar por responsável', async () => {
      // Arrange
      const mockResult = criarListarPericiasResultMock(1);
      (repository.findAllPericias as jest.Mock).mockResolvedValue(ok(mockResult));

      // Act
      await service.listarPericias({
        responsavelId: 5,
      });

      // Assert
      expect(repository.findAllPericias).toHaveBeenCalledWith(
        expect.objectContaining({
          responsavelId: 5,
        })
      );
    });

    it('deve filtrar por sem responsável', async () => {
      // Arrange
      const mockResult = criarListarPericiasResultMock(1);
      (repository.findAllPericias as jest.Mock).mockResolvedValue(ok(mockResult));

      // Act
      await service.listarPericias({
        semResponsavel: true,
      });

      // Assert
      expect(repository.findAllPericias).toHaveBeenCalledWith(
        expect.objectContaining({
          semResponsavel: true,
        })
      );
    });

    it('deve sanitizar parâmetros de paginação inválidos', async () => {
      // Arrange
      const mockResult = criarListarPericiasResultMock(1);
      (repository.findAllPericias as jest.Mock).mockResolvedValue(ok(mockResult));

      // Act
      await service.listarPericias({
        pagina: -1,
        limite: 0,
      });

      // Assert
      expect(repository.findAllPericias).toHaveBeenCalledWith(
        expect.objectContaining({
          pagina: 1, // Sanitizado para 1
          limite: 50, // Sanitizado para 50
        })
      );
    });

    it('deve limitar o tamanho máximo da página', async () => {
      // Arrange
      const mockResult = criarListarPericiasResultMock(1);
      (repository.findAllPericias as jest.Mock).mockResolvedValue(ok(mockResult));

      // Act
      await service.listarPericias({
        limite: 2000, // Acima do máximo
      });

      // Assert
      expect(repository.findAllPericias).toHaveBeenCalledWith(
        expect.objectContaining({
          limite: 50, // Sanitizado para padrão
        })
      );
    });
  });

  describe('obterPericia', () => {
    it('deve obter perícia por ID', async () => {
      // Arrange
      const pericia = criarPericiaMock({ id: 1 });
      (repository.findPericiaById as jest.Mock).mockResolvedValue(ok(pericia));

      // Act
      const result = await service.obterPericia(1);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe(1);
      }
      expect(repository.findPericiaById).toHaveBeenCalledWith(1);
    });

    it('deve retornar erro para ID inválido', async () => {
      // Act
      const result = await service.obterPericia(0);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('ID da perícia inválido');
      }
    });

    it('deve retornar erro para ID negativo', async () => {
      // Act
      const result = await service.obterPericia(-1);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('deve retornar null quando perícia não encontrada', async () => {
      // Arrange
      (repository.findPericiaById as jest.Mock).mockResolvedValue(ok(null));

      // Act
      const result = await service.obterPericia(999);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('atribuirResponsavel', () => {
    it('deve atribuir responsável com sucesso', async () => {
      // Arrange
      (repository.atribuirResponsavelPericia as jest.Mock).mockResolvedValue(ok(true));

      // Act
      const result = await service.atribuirResponsavel({
        periciaId: 1,
        responsavelId: 5,
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
      expect(repository.atribuirResponsavelPericia).toHaveBeenCalledWith(1, 5);
    });

    it('deve validar schema Zod (periciaId inválido)', async () => {
      // Act
      const result = await service.atribuirResponsavel({
        periciaId: 0,
        responsavelId: 5,
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('deve validar schema Zod (responsavelId inválido)', async () => {
      // Act
      const result = await service.atribuirResponsavel({
        periciaId: 1,
        responsavelId: 0,
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('deve validar schema Zod (dados faltando)', async () => {
      // Act
      const result = await service.atribuirResponsavel({});

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('adicionarObservacao', () => {
    it('deve adicionar observação com sucesso', async () => {
      // Arrange
      (repository.adicionarObservacaoPericia as jest.Mock).mockResolvedValue(ok(true));

      // Act
      const result = await service.adicionarObservacao({
        periciaId: 1,
        observacoes: 'Nova observação importante',
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
      expect(repository.adicionarObservacaoPericia).toHaveBeenCalledWith(
        1,
        'Nova observação importante'
      );
    });

    it('deve validar schema Zod (periciaId inválido)', async () => {
      // Act
      const result = await service.adicionarObservacao({
        periciaId: 0,
        observacoes: 'Observação',
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('deve validar schema Zod (observacoes vazia)', async () => {
      // Act
      const result = await service.adicionarObservacao({
        periciaId: 1,
        observacoes: '',
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('listarEspecialidadesPericia', () => {
    it('deve listar especialidades com sucesso', async () => {
      // Arrange
      const especialidades = [
        criarEspecialidadeMock({ id: 1, descricao: 'Medicina do Trabalho' }),
        criarEspecialidadeMock({ id: 2, descricao: 'Engenharia de Segurança' }),
      ];

      (repository.listEspecialidadesPericia as jest.Mock).mockResolvedValue(
        ok(especialidades)
      );

      // Act
      const result = await service.listarEspecialidadesPericia();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].descricao).toBe('Medicina do Trabalho');
      }
      expect(repository.listEspecialidadesPericia).toHaveBeenCalled();
    });

    it('deve retornar array vazio quando não há especialidades', async () => {
      // Arrange
      (repository.listEspecialidadesPericia as jest.Mock).mockResolvedValue(ok([]));

      // Act
      const result = await service.listarEspecialidadesPericia();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('deve retornar erro ao falhar listagem', async () => {
      // Arrange
      (repository.listEspecialidadesPericia as jest.Mock).mockResolvedValue(
        err(appError('DATABASE_ERROR', 'Erro ao listar especialidades'))
      );

      // Act
      const result = await service.listarEspecialidadesPericia();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });
});
