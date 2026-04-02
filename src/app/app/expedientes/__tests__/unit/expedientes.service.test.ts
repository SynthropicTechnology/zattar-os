
import {
  criarExpediente,
  realizarBaixa,
  reverterBaixa,
} from '../../service';
import {
  saveExpediente,
  findExpedienteById,
  baixarExpediente,
  reverterBaixaExpediente,
} from '../../repository';
import { ok } from '@/types';
import { CodigoTribunal, GrauTribunal, OrigemExpediente } from '../../domain';
import { createDbClient } from '@/lib/supabase';

// Mock repository
jest.mock('../../repository');

// Mock supabase client
jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn(),
}));

describe('Expedientes Service', () => {
  const mockRpc = jest.fn();
  const mockDb = {
    rpc: mockRpc,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createDbClient as jest.Mock).mockReturnValue(mockDb);
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  describe('criarExpediente', () => {
    const validExpediente = {
      numeroProcesso: '1234567-89.2023.5.01.0001',
      trt: 'TRT1' as CodigoTribunal,
      grau: GrauTribunal.PRIMEIRO_GRAU,
      dataPrazoLegalParte: '2023-12-31T23:59:59Z',
      origem: OrigemExpediente.MANUAL,
    };

    it('deve criar expediente com sucesso', async () => {
      // Arrange
      (saveExpediente as jest.Mock).mockResolvedValue(ok({ id: 1, ...validExpediente }));

      // Act
      const result = await criarExpediente(validExpediente);

      // Assert
      expect(result.success).toBe(true);
      expect(saveExpediente).toHaveBeenCalled();
    });

    it('deve falhar se validacao Zod falhar', async () => {
      // Arrange
      const invalid = { ...validExpediente, numeroProcesso: '' };

      // Act
      const result = await criarExpediente(invalid);

      // Assert
      expect(result.success).toBe(false);
      expect(saveExpediente).not.toHaveBeenCalled();
    });
  });

  describe('realizarBaixa', () => {
    const existingExpediente = { id: 1, baixadoEm: null };

    it('deve realizar baixa com sucesso', async () => {
      // Arrange
      const baixaInput = { expedienteId: 1, justificativaBaixa: 'Resolvido' };
      (findExpedienteById as jest.Mock).mockResolvedValue(ok(existingExpediente));
      (baixarExpediente as jest.Mock).mockResolvedValue(ok({ ...existingExpediente, baixadoEm: '2023-01-01' }));

      // Act
      // userId is required by service
      const result = await realizarBaixa(1, baixaInput, 123);

      // Assert
      expect(result.success).toBe(true);
      expect(baixarExpediente).toHaveBeenCalled();
    });

    it('deve falhar se expediente nao existir', async () => {
      (findExpedienteById as jest.Mock).mockResolvedValue(ok(null));
      const result = await realizarBaixa(99, { expedienteId: 99, justificativaBaixa: 'X' }, 123);
      expect(result.success).toBe(false);
      if(!result.success) expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('reverterBaixa', () => {
    it('deve reverter baixa com sucesso', async () => {
       const existing = { id: 1, baixadoEm: '2023-01-01' };
       (findExpedienteById as jest.Mock).mockResolvedValue(ok(existing));
       (reverterBaixaExpediente as jest.Mock).mockResolvedValue(ok({ ...existing, baixadoEm: null }));

       const result = await reverterBaixa(1, 123);
       
       expect(result.success).toBe(true);
       expect(reverterBaixaExpediente).toHaveBeenCalledWith(1);
    });
  });
});
