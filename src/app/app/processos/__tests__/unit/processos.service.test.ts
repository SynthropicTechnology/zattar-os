// using globals

import {
  criarProcesso,
  buscarProcesso,
  listarProcessos,
  atualizarProcesso,
} from '../../service';
import {
  saveProcesso,
  findProcessoById,
  findAllProcessos,
  updateProcesso as updateProcessoRepo,
  advogadoExists,
} from '../../repository';
import { ok } from '@/types';
import { validarNumeroCNJ } from '../../domain';
import type { CriarProcessoInput } from '../../domain';

// Mock dependencies
jest.mock('../../repository');

// Mock domain partially
jest.mock('../../domain', () => {
  const original = jest.requireActual('../../domain') as Record<string, unknown>;
  return {
    ...original, // Spread existing exports (schemas, types)
    validarNumeroCNJ: jest.fn(), // Mock this specific function
  };
});

describe('Processos Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: CNJ is valid
    (validarNumeroCNJ as unknown as jest.Mock).mockReturnValue(true);
  });

  describe('criarProcesso', () => {
    const validInput = {
      idPje: 123,
      advogadoId: 1,
      origem: 'acervo_geral',
      trt: '02',
      grau: 'primeiro_grau',
      numeroProcesso: '0000000-00.2023.5.02.0001',
      classeJudicial: 'ATOrd',
      codigoStatusProcesso: 'A',
      descricaoStatusProcesso: 'Ativo',
      juizoDigital: true,
      segredoJustica: false,
      numero: 123456,
      descricaoOrgaoJulgador: 'Vara do Trabalho',
      nomeParteAutora: 'Autor Teste',
      nomeParteRe: 'Re Teste',
      dataAutuacao: new Date().toISOString(),
      prioridadeProcessual: 0,
      qtdeParteAutora: 1,
      qtdeParteRe: 1,
    };

    it('deve criar processo com sucesso', async () => {
      // Arrange
      (advogadoExists as jest.Mock).mockResolvedValue(ok(true));
      (saveProcesso as jest.Mock).mockResolvedValue(ok({ id: 1, ...validInput }));

      // Act
      const result = await criarProcesso(validInput as CriarProcessoInput);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
      expect(saveProcesso).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro se validação Zod falhar', async () => {
      // Arrange
      const invalidInput = { ...validInput, numeroProcesso: '' }; // Required field empty

      // Act
      const result = await criarProcesso(invalidInput as CriarProcessoInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
      expect(saveProcesso).not.toHaveBeenCalled();
    });

    it('deve retornar erro se numero CNJ for inválido', async () => {
      // Arrange
      (validarNumeroCNJ as unknown as jest.Mock).mockReturnValue(false);

      // Act
      const result = await criarProcesso(validInput as CriarProcessoInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('padrao CNJ');
      }
    });

    it('deve retornar erro se advogado não existir', async () => {
      // Arrange
      (advogadoExists as jest.Mock).mockResolvedValue(ok(false));

      // Act
      const result = await criarProcesso(validInput as CriarProcessoInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('buscarProcesso', () => {
    it('deve retornar processo se encontrado', async () => {
      // Arrange
      const mockProcesso = { id: 1, numeroProcesso: '123' };
      (findProcessoById as jest.Mock).mockResolvedValue(ok(mockProcesso));

      // Act
      const result = await buscarProcesso(1);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProcesso);
    });
  });

  describe('listarProcessos', () => {
    it('deve listar processos com sucesso', async () => {
      // Arrange
      const mockResponse = { data: [], total: 0 };
      (findAllProcessos as jest.Mock).mockResolvedValue(ok(mockResponse));

      // Act
      const result = await listarProcessos({});

      // Assert
      expect(result.success).toBe(true);
      expect(findAllProcessos).toHaveBeenCalled();
    });
  });

  describe('atualizarProcesso', () => {
    const existingProcesso = {
      id: 1,
      numeroProcesso: '0000000-00.2023.5.02.0001',
      advogadoId: 1,
      responsavelId: null,
    };

    it('deve atualizar processo com sucesso', async () => {
      // Arrange
      const updateData = { codigoStatusProcesso: 'B' };
      (findProcessoById as jest.Mock).mockResolvedValue(ok(existingProcesso));
      (updateProcessoRepo as jest.Mock).mockResolvedValue(ok({ ...existingProcesso, ...updateData }));

      // Act
      const result = await atualizarProcesso(1, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(updateProcessoRepo).toHaveBeenCalledTimes(1);
    });
  });
});
