import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionListarRepassesPendentes,
  actionAnexarDeclaracao,
  actionRegistrarRepasse,
} from '../../actions/repasses';
import * as service from '../../service';
import { revalidatePath } from 'next/cache';
import {
  criarRepassePendenteMock,
} from '../fixtures';

jest.mock('../../service');
jest.mock('next/cache');

describe('Repasses Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionListarRepassesPendentes', () => {
    it('deve listar repasses com filtros', async () => {
      // Arrange
      const repassesPendentes = [
        criarRepassePendenteMock({
          parcelaId: 1,
          valorRepasseCliente: 3500,
          statusRepasse: 'pendente_declaracao',
        }),
        criarRepassePendenteMock({
          parcelaId: 2,
          valorRepasseCliente: 7000,
          statusRepasse: 'pendente_declaracao',
        }),
      ];

      (service.listarRepassesPendentes as jest.Mock).mockResolvedValue(
        repassesPendentes
      );

      // Act
      const result = await actionListarRepassesPendentes({
        statusRepasse: 'pendente_declaracao',
      });

      // Assert
      expect(service.listarRepassesPendentes).toHaveBeenCalledWith({
        statusRepasse: 'pendente_declaracao',
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(repassesPendentes);
      expect(result.data).toHaveLength(2);
    });

    it('deve aplicar filtros de data', async () => {
      // Arrange
      const dataInicio = '2024-01-01';
      const dataFim = '2024-01-31';

      (service.listarRepassesPendentes as jest.Mock).mockResolvedValue([]);

      // Act
      await actionListarRepassesPendentes({
        dataInicio,
        dataFim,
      });

      // Assert
      expect(service.listarRepassesPendentes).toHaveBeenCalledWith({
        dataInicio,
        dataFim,
      });
    });

    it('deve filtrar por processo', async () => {
      // Arrange
      const processoId = 100;

      (service.listarRepassesPendentes as jest.Mock).mockResolvedValue([]);

      // Act
      await actionListarRepassesPendentes({
        processoId,
      });

      // Assert
      expect(service.listarRepassesPendentes).toHaveBeenCalledWith({
        processoId,
      });
    });

    it('deve retornar erro em caso de falha', async () => {
      // Arrange
      (service.listarRepassesPendentes as jest.Mock).mockRejectedValue(
        new Error('Erro ao listar repasses')
      );

      // Act
      const result = await actionListarRepassesPendentes({});

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro ao listar repasses');
    });
  });

  describe('actionAnexarDeclaracao', () => {
    it('deve anexar URL de declaração', async () => {
      // Arrange
      const parcelaId = 1;
      const url = 'https://storage.example.com/declaracao.pdf';

      // Note: the actual service returns void (no data returned from anexar)
      (service.anexarDeclaracaoPrestacaoContas as jest.Mock).mockResolvedValue(
        undefined
      );

      // Act
      const result = await actionAnexarDeclaracao(parcelaId, url);

      // Assert
      expect(service.anexarDeclaracaoPrestacaoContas).toHaveBeenCalledWith(
        parcelaId,
        url
      );
      expect(result.success).toBe(true);
    });

    it('deve revalidar cache de repasses', async () => {
      // Arrange
      const parcelaId = 1;
      const url = 'https://storage.example.com/declaracao.pdf';

      (service.anexarDeclaracaoPrestacaoContas as jest.Mock).mockResolvedValue(
        undefined
      );

      // Act
      await actionAnexarDeclaracao(parcelaId, url);

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/app/repasses');
    });

    it('deve retornar erro em caso de falha', async () => {
      // Arrange
      const parcelaId = 1;
      const url = 'https://storage.example.com/declaracao.pdf';

      (service.anexarDeclaracaoPrestacaoContas as jest.Mock).mockRejectedValue(
        new Error('Parcela não encontrada')
      );

      // Act
      const result = await actionAnexarDeclaracao(parcelaId, url);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Parcela não encontrada');
    });
  });

  describe('actionRegistrarRepasse', () => {
    it('deve registrar repasse com comprovante', async () => {
      // Arrange
      const parcelaId = 1;
      const dadosRepasse = {
        arquivoComprovantePath: 'uploads/comprovante-repasse.pdf',
        usuarioRepasseId: 100,
        dataRepasse: '2024-01-22',
      };

      (service.registrarRepasse as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await actionRegistrarRepasse(parcelaId, dadosRepasse);

      // Assert
      expect(service.registrarRepasse).toHaveBeenCalledWith(
        parcelaId,
        dadosRepasse
      );
      expect(result.success).toBe(true);
    });

    it('deve retornar erro quando declaração não está anexada', async () => {
      // Arrange
      const parcelaId = 1;
      const dadosRepasse = {
        arquivoComprovantePath: 'uploads/comprovante.pdf',
        usuarioRepasseId: 100,
      };

      (service.registrarRepasse as jest.Mock).mockRejectedValue(
        new Error('Declaração de prestação de contas obrigatória')
      );

      // Act
      const result = await actionRegistrarRepasse(parcelaId, dadosRepasse);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Declaração de prestação de contas obrigatória');
    });

    it('deve revalidar cache após registro', async () => {
      // Arrange
      const parcelaId = 1;
      const dadosRepasse = {
        arquivoComprovantePath: 'uploads/comprovante.pdf',
        usuarioRepasseId: 100,
      };

      (service.registrarRepasse as jest.Mock).mockResolvedValue(undefined);

      // Act
      await actionRegistrarRepasse(parcelaId, dadosRepasse);

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/app/repasses');
    });

    it('deve retornar erro em caso de falha', async () => {
      // Arrange
      const parcelaId = 1;
      const dadosRepasse = {
        arquivoComprovantePath: 'uploads/comprovante.pdf',
        usuarioRepasseId: 100,
      };

      (service.registrarRepasse as jest.Mock).mockRejectedValue(
        new Error('Parcela não encontrada')
      );

      // Act
      const result = await actionRegistrarRepasse(parcelaId, dadosRepasse);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Parcela não encontrada');
    });
  });
});
