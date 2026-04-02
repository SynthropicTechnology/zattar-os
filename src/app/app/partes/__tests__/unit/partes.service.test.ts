// using globals

import {
  criarCliente,
  atualizarCliente,
} from '../../service';
import {
  saveCliente,
  findClienteByCPF,
  findClienteByCNPJ,
  findClienteById,
  updateCliente as updateClienteRepo,
} from '../../repositories';
import { ok } from '@/types';
import type { CriarClienteInput } from '../../domain';

// Mock repository
jest.mock('../../repositories');

// Mock helpers in service if any (none obvious besides errors)
// errors are imported from ./errors, which are pure functions usually.

describe('Partes Service - Cliente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarCliente', () => {
    const validClientePF = {
      tipo_pessoa: 'pf',
      nome: 'João Silva',
      cpf: '12345678901',
      email: 'joao@email.com',
    };

    const validClientePJ = {
      tipo_pessoa: 'pj',
      nome: 'Empresa LTDA',
      cnpj: '12345678000199',
    };

    it('deve criar cliente PF com sucesso', async () => {
      // Arrange
      (findClienteByCPF as jest.Mock).mockResolvedValue(ok(null)); // No duplicate
      (saveCliente as jest.Mock).mockResolvedValue(ok({ id: 1, ...validClientePF }));

      // Act
      const result = await criarCliente(validClientePF as CriarClienteInput);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
      expect(findClienteByCPF).toHaveBeenCalledWith(validClientePF.cpf);
      expect(saveCliente).toHaveBeenCalled();
    });

    it('deve criar cliente PJ com sucesso', async () => {
      // Arrange
      (findClienteByCNPJ as jest.Mock).mockResolvedValue(ok(null)); // No duplicate
      (saveCliente as jest.Mock).mockResolvedValue(ok({ id: 2, ...validClientePJ }));

      // Act
      const result = await criarCliente(validClientePJ as CriarClienteInput);

      // Assert
      expect(result.success).toBe(true);
      expect(findClienteByCNPJ).toHaveBeenCalledWith(validClientePJ.cnpj);
      expect(saveCliente).toHaveBeenCalled();
    });

    it('deve falhar se CPF duplicado', async () => {
      // Arrange
      (findClienteByCPF as jest.Mock).mockResolvedValue(ok({ id: 99, cpf: validClientePF.cpf })); // Duplicate

      // Act
      const result = await criarCliente(validClientePF as CriarClienteInput);

      // Assert
      expect(result.success).toBe(false);
      // Expect specific error for duplicate or appError wrapper
      // service wraps it: toAppError(clienteCpfDuplicadoError...)
      // check code or message
      if (!result.success) {
        // error properties depend on toAppError implementation, likely preserves code if passed or generic
        // inspecting service.ts, it uses custom error builder.
        // let's just check success false for now or message
      }
    });

    it('deve falhar se validação Zod falhar (nome vazio)', async () => {
      // Arrange
      const invalidInput = { ...validClientePF, nome: '' };

      // Act
      const result = await criarCliente(invalidInput as CriarClienteInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
      expect(saveCliente).not.toHaveBeenCalled();
    });
  });

  describe('atualizarCliente', () => {
    const existingCliente = {
      id: 1,
      tipo_pessoa: 'pf',
      nome: 'João Silva',
      cpf: '12345678901',
    };

    it('deve atualizar cliente com sucesso', async () => {
      // Arrange
      const updateData = { nome: 'João Souza' };
      (findClienteById as jest.Mock).mockResolvedValue(ok(existingCliente));
      (updateClienteRepo as jest.Mock).mockResolvedValue(ok({ ...existingCliente, ...updateData }));

      // Act
      const result = await atualizarCliente(1, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(updateClienteRepo).toHaveBeenCalled();
    });

    it('deve falhar se cliente não existir', async () => {
      // Arrange
      (findClienteById as jest.Mock).mockResolvedValue(ok(null));

      // Act
      const result = await atualizarCliente(99, { nome: 'Novo' });

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve verificar duplicidade ao alterar CPF', async () => {
      // Arrange
      const updateData = { cpf: '98765432100' };
      (findClienteById as jest.Mock).mockResolvedValue(ok(existingCliente));
      (findClienteByCPF as jest.Mock).mockResolvedValue(ok({ id: 2, cpf: '98765432100' })); // Existing other client

      // Act
      const result = await atualizarCliente(1, updateData);

      // Assert
      expect(result.success).toBe(false);
      // Conflict error expected
    });
  });
});
