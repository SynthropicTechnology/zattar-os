import { describe, it, expect } from '@jest/globals';
import {
  calcularSplitPagamento,
  podeSerSincronizada,
  determinarStatusAcordo,
  validarIntegridadeParcela,
} from '../../domain';
import {
  criarParcelaMock,
  criarParcelaRecebidaMock,
  criarParcelaCanceladaMock,
} from '../fixtures';

describe('Obrigações Domain', () => {
  describe('calcularSplitPagamento', () => {
    // The function signature is: calcularSplitPagamento(valorPrincipal, honorariosSucumbenciais, percentualHonorariosContratuais)
    it('deve calcular split com percentual padrão (30%)', () => {
      // Arrange
      const valorPrincipal = 10000;
      const honorariosSucumbenciais = 0;
      const percentualHonorariosContratuais = 30;

      // Act
      const result = calcularSplitPagamento(valorPrincipal, honorariosSucumbenciais, percentualHonorariosContratuais);

      // Assert - valorEscritorio = honorariosContratuais + honorariosSucumbenciais = 3000 + 0 = 3000
      expect(result.valorEscritorio).toBe(3000);
      expect(result.valorRepasseCliente).toBe(7000);
      expect(result.valorPrincipal).toBe(valorPrincipal);
    });

    it('deve calcular split com percentual customizado', () => {
      // Arrange
      const valorPrincipal = 5000;
      const honorariosSucumbenciais = 0;
      const percentualHonorariosContratuais = 40;

      // Act
      const result = calcularSplitPagamento(valorPrincipal, honorariosSucumbenciais, percentualHonorariosContratuais);

      // Assert - valorEscritorio = honorariosContratuais + honorariosSucumbenciais = 2000 + 0 = 2000
      expect(result.valorEscritorio).toBe(2000);
      expect(result.valorRepasseCliente).toBe(3000);
      expect(result.valorPrincipal).toBe(valorPrincipal);
    });

    it('deve incluir honorários sucumbenciais no escritório', () => {
      // Arrange
      const valorPrincipal = 10000;
      const honorariosSucumbenciais = 2000;
      const percentualHonorariosContratuais = 30;

      // Act
      const result = calcularSplitPagamento(
        valorPrincipal,
        honorariosSucumbenciais,
        percentualHonorariosContratuais
      );

      // Assert - valorEscritorio = honorariosContratuais + honorariosSucumbenciais = 3000 + 2000 = 5000
      expect(result.valorEscritorio).toBe(5000);
      expect(result.valorRepasseCliente).toBe(7000);
      expect(result.honorariosSucumbenciais).toBe(2000);
    });

    it('deve calcular repasse cliente corretamente', () => {
      // Arrange
      const valorPrincipal = 15000;
      const honorariosSucumbenciais = 0;
      const percentualHonorariosContratuais = 25;

      // Act
      const result = calcularSplitPagamento(valorPrincipal, honorariosSucumbenciais, percentualHonorariosContratuais);

      // Assert
      expect(result.valorEscritorio).toBe(3750);
      expect(result.valorRepasseCliente).toBe(11250);
      expect(result.percentualCliente).toBe(75);
    });
  });

  describe('podeSerSincronizada', () => {
    // Implementation includes: ['pendente', 'recebida', 'paga', 'atrasada']
    it('deve retornar true para parcela recebida', () => {
      // Arrange
      const parcela = criarParcelaRecebidaMock();

      // Act
      const result = podeSerSincronizada(parcela);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false para parcela cancelada', () => {
      // Arrange
      const parcela = criarParcelaCanceladaMock();

      // Act
      const result = podeSerSincronizada(parcela);

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar true para parcela pendente', () => {
      // Arrange - pendente can be synchronized (creates future lancamento)
      const parcela = criarParcelaMock({
        status: 'pendente',
      });

      // Act
      const result = podeSerSincronizada(parcela);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar true para parcela atrasada', () => {
      // Arrange - atrasada can be synchronized
      const parcela = criarParcelaMock({
        status: 'atrasada',
      });

      // Act
      const result = podeSerSincronizada(parcela);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('determinarStatusAcordo', () => {
    it('deve retornar pago_total quando todas pagas', () => {
      // Arrange
      const parcelas = [
        criarParcelaRecebidaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaRecebidaMock({ id: 2, numeroParcela: 2 }),
        criarParcelaRecebidaMock({ id: 3, numeroParcela: 3 }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('pago_total');
    });

    it('deve retornar pago_parcial quando algumas pagas', () => {
      // Arrange
      const parcelas = [
        criarParcelaRecebidaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaMock({ id: 2, numeroParcela: 2, status: 'pendente' }),
        criarParcelaMock({ id: 3, numeroParcela: 3, status: 'pendente' }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('pago_parcial');
    });

    it('deve retornar atrasado quando alguma vencida', () => {
      // Arrange - status type is 'atrasada' not 'atrasado'
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const ontemStr = ontem.toISOString().split('T')[0];

      const parcelas = [
        criarParcelaMock({
          id: 1,
          numeroParcela: 1,
          status: 'atrasada',
          dataVencimento: ontemStr,
        }),
        criarParcelaMock({ id: 2, numeroParcela: 2, status: 'pendente' }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('atrasado');
    });

    it('deve retornar pendente quando nenhuma paga', () => {
      // Arrange
      const parcelas = [
        criarParcelaMock({ id: 1, numeroParcela: 1, status: 'pendente' }),
        criarParcelaMock({ id: 2, numeroParcela: 2, status: 'pendente' }),
        criarParcelaMock({ id: 3, numeroParcela: 3, status: 'pendente' }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('pendente');
    });

    it('deve retornar pendente quando todas canceladas', () => {
      // Arrange - implementation returns 'pendente' when all cancelled
      const parcelas = [
        criarParcelaCanceladaMock({ id: 1, numeroParcela: 1 }),
        criarParcelaCanceladaMock({ id: 2, numeroParcela: 2 }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('pendente');
    });

    it('deve priorizar atrasado sobre pendente', () => {
      // Arrange - status type is 'atrasada' not 'atrasado'
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const ontemStr = ontem.toISOString().split('T')[0];

      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const amanhaStr = amanha.toISOString().split('T')[0];

      const parcelas = [
        criarParcelaMock({
          id: 1,
          status: 'atrasada',
          dataVencimento: ontemStr,
        }),
        criarParcelaMock({
          id: 2,
          status: 'pendente',
          dataVencimento: amanhaStr,
        }),
      ];

      // Act
      const result = determinarStatusAcordo(parcelas);

      // Assert
      expect(result).toBe('atrasado');
    });
  });

  describe('validarIntegridadeParcela', () => {
    // Function signature: validarIntegridadeParcela(parcela, direcao) -> { valido, erros }
    it('deve validar parcela recebida com forma de pagamento', () => {
      // Arrange
      const parcela = criarParcelaRecebidaMock({
        formaPagamento: 'transferencia_direta',
      });

      // Act
      const result = validarIntegridadeParcela(parcela, 'recebimento');

      // Assert
      expect(result.valido).toBe(true);
      expect(result.erros).toEqual([]);
    });

    it('deve retornar erro se parcela recebida sem forma de pagamento', () => {
      // Arrange
      const parcela = criarParcelaRecebidaMock({
        formaPagamento: null,
      });

      // Act
      const result = validarIntegridadeParcela(parcela, 'recebimento');

      // Assert
      expect(result.valido).toBe(false);
      expect(result.erros.length).toBeGreaterThan(0);
      expect(result.erros[0]).toContain('forma de pagamento');
    });

    it('deve validar status de repasse para recebimento com valor de repasse', () => {
      // Arrange - parcela recebida com valor de repasse e status de repasse válido
      const parcela = criarParcelaRecebidaMock({
        dataEfetivacao: '2024-01-16',
        valorRepasseCliente: 3500,
        statusRepasse: 'pendente_declaracao',
      });

      // Act
      const result = validarIntegridadeParcela(parcela, 'recebimento');

      // Assert
      expect(result.valido).toBe(true);
    });

    it('deve validar parcela de pagamento sem verificar repasse', () => {
      // Arrange - para pagamentos, não há verificação de repasse
      const parcela = criarParcelaRecebidaMock({
        formaPagamento: 'transferencia_direta',
        valorRepasseCliente: 0,
        statusRepasse: 'nao_aplicavel',
      });

      // Act
      const result = validarIntegridadeParcela(parcela, 'pagamento');

      // Assert
      expect(result.valido).toBe(true);
    });

    it('deve retornar erro se parcela recebida com repasse tem status inválido', () => {
      // Arrange - parcela recebida com valor de repasse mas status inválido
      const parcela = criarParcelaRecebidaMock({
        formaPagamento: 'transferencia_direta',
        valorRepasseCliente: 3500,
        statusRepasse: 'nao_aplicavel', // status inválido para parcela com repasse
      });

      // Act
      const result = validarIntegridadeParcela(parcela, 'recebimento');

      // Assert
      expect(result.valido).toBe(false);
      expect(result.erros.length).toBeGreaterThan(0);
      expect(result.erros[0]).toContain('status de repasse');
    });

    it('deve retornar múltiplos erros quando aplicável', () => {
      // Arrange - parcela com múltiplos problemas
      const parcela = criarParcelaRecebidaMock({
        formaPagamento: null,
        valorRepasseCliente: 3500,
        statusRepasse: 'nao_aplicavel',
      });

      // Act
      const result = validarIntegridadeParcela(parcela, 'recebimento');

      // Assert
      expect(result.valido).toBe(false);
      expect(result.erros.length).toBeGreaterThan(1);
    });
  });
});
