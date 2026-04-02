import {
  gerarFolhaPagamento,
  cancelarFolhaPagamento,
} from '../../service';
import {
  verificarFolhaExistente,
  buscarSalariosVigentesNoMes,
  criarFolhaPagamento,
  criarItemFolha,
  atualizarValorTotalFolha,
  buscarFolhaPorId,
  atualizarStatusFolha,
} from '../../repository';
import { createServiceClient } from "@/lib/supabase/service-client";

// Mock mocks
jest.mock('../../repository');
jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: jest.fn(),
}));

describe('RH Service', () => {
  const mockUsuarioId = 123;
  const mockFolha = {
    id: 1,
    mesReferencia: 1,
    anoReferencia: 2024,
    status: 'rascunho',
    valorTotal: 0,
    itens: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceClient as jest.Mock).mockReturnValue({}); // Mock client object
  });

  describe('gerarFolhaPagamento', () => {
    const input = { mesReferencia: 1, anoReferencia: 2024 };

    it('deve gerar folha com sucesso', async () => {
      // Arrange
      (verificarFolhaExistente as jest.Mock).mockResolvedValue(false);
      (buscarSalariosVigentesNoMes as jest.Mock).mockResolvedValue([
        { usuarioId: 1, salarioBruto: 5000 },
        { usuarioId: 2, salarioBruto: 3000 },
      ]);
      (criarFolhaPagamento as jest.Mock).mockResolvedValue(mockFolha);
      (criarItemFolha as jest.Mock).mockResolvedValue({ id: 10 });
      (atualizarValorTotalFolha as jest.Mock).mockResolvedValue(undefined);
      (buscarFolhaPorId as jest.Mock).mockResolvedValue({
        ...mockFolha,
        valorTotal: 8000,
        itens: [{}, {}],
      });

      // Act
      const result = await gerarFolhaPagamento(input, mockUsuarioId);

      // Assert
      expect(result).toBeDefined();
      expect(result.valorTotal).toBe(8000);
      expect(criarFolhaPagamento).toHaveBeenCalled();
      expect(criarItemFolha).toHaveBeenCalledTimes(2);
    });

    it('deve falhar se folha ja existir', async () => {
      // Arrange
      (verificarFolhaExistente as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(gerarFolhaPagamento(input, mockUsuarioId))
        .rejects
        .toThrow(/Já existe uma folha de pagamento para/);
    });
  });

  describe('cancelarFolhaPagamento', () => {
    it('deve cancelar folha com sucesso (status rascunho)', async () => {
      // Arrange
      // podeCancelarFolha checks buscarFolhaPorId.
      // If status is rascunho, it returns true.
      (buscarFolhaPorId as jest.Mock)
        .mockResolvedValueOnce({
          ...mockFolha,
          status: 'rascunho',
        })
        .mockResolvedValueOnce({
          ...mockFolha,
          status: 'cancelada',
        });
      (atualizarStatusFolha as jest.Mock).mockResolvedValue({
        ...mockFolha,
        status: 'cancelada',
      });

      // Act
      const result = await cancelarFolhaPagamento(1, 'Motivo', mockUsuarioId);

      // Assert
      expect(result.status).toBe('cancelada');
      expect(atualizarStatusFolha).toHaveBeenCalled();
    });

    it('deve falhar se nao puder cancelar (status paga)', async () => {
      // Arrange
      (buscarFolhaPorId as jest.Mock).mockResolvedValue({
        ...mockFolha,
        status: 'paga',
      });

      // Act & Assert
      await expect(cancelarFolhaPagamento(1, 'Motivo', mockUsuarioId))
        .rejects
        .toThrow(/Não é possível cancelar uma folha já paga/);
    });
  });
});
