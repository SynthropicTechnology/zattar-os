import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionMarcarParcelaRecebida,
  actionRecalcularDistribuicao,
} from '../../actions/parcelas';
import * as service from '../../service';
import { revalidatePath } from 'next/cache';
import { criarParcelaMock, criarParcelaRecebidaMock } from '../fixtures';

jest.mock('../../service');
jest.mock('next/cache');

describe('Parcelas Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionMarcarParcelaRecebida', () => {
    it('deve marcar parcela como recebida', async () => {
      // Arrange
      const parcelaRecebida = criarParcelaRecebidaMock({
        id: 1,
        acordoCondenacaoId: 10,
      });

      (service.marcarParcelaRecebida as jest.Mock).mockResolvedValue(
        parcelaRecebida
      );

      // Act - action takes (parcelaId, dados) as separate args
      const result = await actionMarcarParcelaRecebida(1, {
        dataRecebimento: '2024-01-16',
        valorRecebido: 5000,
      });

      // Assert
      expect(service.marcarParcelaRecebida).toHaveBeenCalledWith(1, {
        dataRecebimento: '2024-01-16',
        valorRecebido: 5000,
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(parcelaRecebida);
    });

    it('deve revalidar cache', async () => {
      // Arrange
      const parcelaRecebida = criarParcelaRecebidaMock({
        id: 1,
        acordoCondenacaoId: 10,
      });

      (service.marcarParcelaRecebida as jest.Mock).mockResolvedValue(
        parcelaRecebida
      );

      // Act
      await actionMarcarParcelaRecebida(1, {
        dataRecebimento: '2024-01-16',
        valorRecebido: 5000,
      });

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/app/acordos-condenacoes');
    });

    it('deve aceitar valor diferente do previsto', async () => {
      // Arrange
      const parcelaRecebida = criarParcelaRecebidaMock({
        id: 1,
        valorBrutoCreditoPrincipal: 4500,
      });

      (service.marcarParcelaRecebida as jest.Mock).mockResolvedValue(
        parcelaRecebida
      );

      // Act
      const result = await actionMarcarParcelaRecebida(1, {
        dataRecebimento: '2024-01-16',
        valorRecebido: 4500,
      });

      // Assert
      expect(service.marcarParcelaRecebida).toHaveBeenCalledWith(1, {
        dataRecebimento: '2024-01-16',
        valorRecebido: 4500,
      });
      expect(result.success).toBe(true);
      expect(result.data.valorBrutoCreditoPrincipal).toBe(4500);
    });

    it('deve retornar erro quando service falha', async () => {
      // Arrange
      (service.marcarParcelaRecebida as jest.Mock).mockRejectedValue(
        new Error('Parcela não encontrada')
      );

      // Act
      const result = await actionMarcarParcelaRecebida(1, {
        dataRecebimento: '2024-01-16',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionRecalcularDistribuicao', () => {
    it('deve recalcular distribuição de acordo', async () => {
      // Arrange
      const acordoId = 10;
      const parcelasRecalculadas = [
        criarParcelaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaMock({ id: 2, numeroParcela: 2 }),
      ];

      (service.recalcularDistribuicao as jest.Mock).mockResolvedValue(
        parcelasRecalculadas
      );

      // Act - action takes acordoId as single arg (not object)
      const result = await actionRecalcularDistribuicao(acordoId);

      // Assert
      expect(service.recalcularDistribuicao).toHaveBeenCalledWith(acordoId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(parcelasRecalculadas);
      expect(result.data).toHaveLength(2);
    });

    it('deve revalidar path específico do acordo', async () => {
      // Arrange
      const acordoId = 10;

      (service.recalcularDistribuicao as jest.Mock).mockResolvedValue([]);

      // Act
      await actionRecalcularDistribuicao(acordoId);

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith(`/app/acordos-condenacoes/${acordoId}`);
    });

    it('deve retornar erro se acordo tem parcelas pagas', async () => {
      // Arrange
      const acordoId = 10;

      (service.recalcularDistribuicao as jest.Mock).mockRejectedValue(
        new Error('Não é possível recalcular distribuição com parcelas já pagas.')
      );

      // Act
      const result = await actionRecalcularDistribuicao(acordoId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
