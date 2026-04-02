import { describe, it, expect } from '@jest/globals';
import {
  calcularDataVencimento,
  calcularValorParcela,
  formatarTipo,
  normalizarCPF,
  validarPercentualEscritorio,
} from '../../utils';

describe('Obrigações Utils', () => {
  describe('calcularDataVencimento', () => {
    it('deve calcular data da primeira parcela', () => {
      // Arrange
      const dataPrimeiraParcela = '2024-01-15';
      const numeroParcela = 1;
      const intervalo = 30;

      // Act
      const result = calcularDataVencimento(
        dataPrimeiraParcela,
        numeroParcela,
        intervalo
      );

      // Assert - function returns string in YYYY-MM-DD format
      expect(result).toBe('2024-01-15');
    });

    it('deve calcular data da segunda parcela (+30 dias)', () => {
      // Arrange
      const dataPrimeiraParcela = '2024-01-15';
      const numeroParcela = 2;
      const intervalo = 30;

      // Act
      const result = calcularDataVencimento(
        dataPrimeiraParcela,
        numeroParcela,
        intervalo
      );

      // Assert - 15 Jan + 30 days = 14 Feb
      expect(result).toBe('2024-02-14');
    });

    it('deve calcular data com intervalo customizado', () => {
      // Arrange
      const dataPrimeiraParcela = '2024-01-15';
      const numeroParcela = 3;
      const intervalo = 15; // 15 dias

      // Act
      const result = calcularDataVencimento(
        dataPrimeiraParcela,
        numeroParcela,
        intervalo
      );

      // Assert
      // 3ª parcela = data inicial + (3-1) * 15 dias = +30 dias
      expect(result).toBe('2024-02-14');
    });

    it('deve lidar com mudança de mês', () => {
      // Arrange
      const dataPrimeiraParcela = '2024-01-31';
      const numeroParcela = 2;
      const intervalo = 30;

      // Act
      const result = calcularDataVencimento(
        dataPrimeiraParcela,
        numeroParcela,
        intervalo
      );

      // Assert
      // 31 de janeiro + 30 dias = 1º de março (fevereiro tem 29 dias em 2024)
      expect(result).toBe('2024-03-01');
    });

    it('deve calcular corretamente para parcelas subsequentes', () => {
      // Arrange
      const dataPrimeiraParcela = '2024-01-15';
      const intervalo = 30;

      // Act & Assert
      const parcela4 = calcularDataVencimento(dataPrimeiraParcela, 4, intervalo);
      const parcela5 = calcularDataVencimento(dataPrimeiraParcela, 5, intervalo);

      // 4ª parcela = +90 dias = 14 April
      expect(parcela4).toBe('2024-04-14');

      // 5ª parcela = +120 dias = 14 May
      expect(parcela5).toBe('2024-05-14');
    });
  });

  describe('calcularValorParcela', () => {
    it('deve dividir valor igualmente', () => {
      // Arrange
      const valorTotal = 10000;
      const numeroParcelas = 2;

      // Act
      const result = calcularValorParcela(valorTotal, numeroParcelas);

      // Assert
      expect(result).toBe(5000);
    });

    it('deve ajustar última parcela para absorver arredondamento', () => {
      // Arrange
      const valorTotal = 10000;
      const numeroParcelas = 3;

      // Act
      const valorParcela = calcularValorParcela(valorTotal, numeroParcelas);

      // Assert
      // 10000 / 3 = 3333.33...
      // Duas primeiras parcelas: 3333.33
      // Última parcela deve absorver diferença
      expect(valorParcela).toBe(3333.33);

      const valorDuasParcelas = valorParcela * 2;
      const valorUltimaParcela = valorTotal - valorDuasParcelas;

      expect(valorDuasParcelas + valorUltimaParcela).toBe(valorTotal);
    });

    it('deve calcular corretamente para valores pequenos', () => {
      // Arrange
      const valorTotal = 100;
      const numeroParcelas = 3;

      // Act
      const result = calcularValorParcela(valorTotal, numeroParcelas);

      // Assert
      expect(result).toBe(33.33);
    });

    it('deve calcular corretamente para valores grandes', () => {
      // Arrange
      const valorTotal = 1000000;
      const numeroParcelas = 12;

      // Act
      const result = calcularValorParcela(valorTotal, numeroParcelas);

      // Assert
      expect(result).toBe(83333.33);
    });
  });

  describe('formatarTipo', () => {
    it('deve formatar tipo acordo', () => {
      // Arrange
      const tipo = 'acordo';

      // Act
      const result = formatarTipo(tipo);

      // Assert
      expect(result).toBe('Acordo');
    });

    it('deve formatar tipo condenação', () => {
      // Arrange
      const tipo = 'condenacao';

      // Act
      const result = formatarTipo(tipo);

      // Assert
      expect(result).toBe('Condenação');
    });
  });

  describe('normalizarCPF', () => {
    it('deve remover pontos e hífens', () => {
      // Arrange
      const cpf = '123.456.789-00';

      // Act
      const result = normalizarCPF(cpf);

      // Assert
      expect(result).toBe('12345678900');
    });

    it('deve retornar apenas números', () => {
      // Arrange
      const cpf = '123.456.789-00';

      // Act
      const result = normalizarCPF(cpf);

      // Assert
      expect(result).toMatch(/^\d+$/);
      expect(result.length).toBe(11);
    });

    it('deve lidar com CPF sem formatação', () => {
      // Arrange
      const cpf = '12345678900';

      // Act
      const result = normalizarCPF(cpf);

      // Assert
      expect(result).toBe('12345678900');
    });
  });

  describe('validarPercentualEscritorio', () => {
    it('deve validar percentual dentro do range (0-100)', () => {
      // Arrange
      const percentual = 30;

      // Act
      const result = validarPercentualEscritorio(percentual);

      // Assert
      expect(result).toBe(true);
    });

    it('deve rejeitar percentual negativo', () => {
      // Arrange
      const percentual = -10;

      // Act
      const result = validarPercentualEscritorio(percentual);

      // Assert
      expect(result).toBe(false);
    });

    it('deve rejeitar percentual maior que 100', () => {
      // Arrange
      const percentual = 150;

      // Act
      const result = validarPercentualEscritorio(percentual);

      // Assert
      expect(result).toBe(false);
    });

    it('deve aceitar percentual 0', () => {
      // Arrange
      const percentual = 0;

      // Act
      const result = validarPercentualEscritorio(percentual);

      // Assert
      expect(result).toBe(true);
    });

    it('deve aceitar percentual 100', () => {
      // Arrange
      const percentual = 100;

      // Act
      const result = validarPercentualEscritorio(percentual);

      // Assert
      expect(result).toBe(true);
    });
  });
});
