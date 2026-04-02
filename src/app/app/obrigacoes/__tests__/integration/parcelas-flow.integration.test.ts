import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import { criarAcordoMock, criarParcelaMock } from '../fixtures';

jest.mock('../../repository');

describe('Parcelas Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve marcar parcela como recebida', async () => {
    const parcelaId = 1;
    const dadosRecebimento = {
      dataRecebimento: '2024-01-16',
      valorRecebido: 5000,
    };

    const parcelaRecebida = criarParcelaMock({
      id: parcelaId,
      status: 'recebida',
      dataEfetivacao: '2024-01-16',
      valorBrutoCreditoPrincipal: 5000,
    });

    (repository.marcarParcelaComoRecebida as jest.Mock).mockResolvedValue(
      parcelaRecebida
    );

    const result = await service.marcarParcelaRecebida(parcelaId, dadosRecebimento);

    expect(result.status).toBe('recebida');
    expect(repository.marcarParcelaComoRecebida).toHaveBeenCalledWith(
      parcelaId,
      {
        dataEfetivacao: '2024-01-16',
        valor: 5000,
      }
    );
  });

  it('deve recalcular distribuição de acordo', async () => {
    const acordoId = 1;

    const acordo = criarAcordoMock({
      id: acordoId,
      valorTotal: 12000,
      numeroParcelas: 3,
      percentualEscritorio: 30,
      direcao: 'recebimento',
      formaDistribuicao: 'proporcional_credito_principal',
      honorariosSucumbenciaisTotal: 0,
      dataVencimentoPrimeiraParcela: '2024-01-15',
    });

    const parcelasOriginais = [
      criarParcelaMock({
        id: 1,
        acordoCondenacaoId: acordoId,
        numeroParcela: 1,
        status: 'pendente',
        valorBrutoCreditoPrincipal: 4000,
      }),
      criarParcelaMock({
        id: 2,
        acordoCondenacaoId: acordoId,
        numeroParcela: 2,
        status: 'pendente',
        valorBrutoCreditoPrincipal: 4000,
      }),
      criarParcelaMock({
        id: 3,
        acordoCondenacaoId: acordoId,
        numeroParcela: 3,
        status: 'pendente',
        valorBrutoCreditoPrincipal: 4000,
      }),
    ];

    const parcelasRecalculadas = parcelasOriginais.map((parcela) =>
      criarParcelaMock({
        ...parcela,
        valorBrutoCreditoPrincipal: 4000,
      })
    );

    (repository.buscarAcordoPorId as jest.Mock).mockResolvedValue(acordo);
    (repository.buscarParcelasPorAcordo as jest.Mock).mockResolvedValue(
      parcelasOriginais
    );
    (repository.deletarParcelasDoAcordo as jest.Mock).mockResolvedValue(undefined);
    (repository.criarParcelas as jest.Mock).mockResolvedValue(
      parcelasRecalculadas
    );

    const result = await service.recalcularDistribuicao(acordoId);

    expect(result).toHaveLength(3);
    expect(repository.deletarParcelasDoAcordo).toHaveBeenCalledWith(acordoId);
    expect(repository.criarParcelas).toHaveBeenCalled();
  });

  it('deve impedir recálculo com parcelas pagas', async () => {
    const acordoId = 1;

    const acordo = criarAcordoMock({
      id: acordoId,
      valorTotal: 10000,
      numeroParcelas: 2,
      percentualEscritorio: 30,
      direcao: 'recebimento',
      formaDistribuicao: 'proporcional_credito_principal',
      honorariosSucumbenciaisTotal: 0,
      dataVencimentoPrimeiraParcela: '2024-01-15',
    });

    const parcelas = [
      criarParcelaMock({
        id: 1,
        acordoCondenacaoId: acordoId,
        numeroParcela: 1,
        status: 'paga',
      }),
      criarParcelaMock({
        id: 2,
        acordoCondenacaoId: acordoId,
        numeroParcela: 2,
        status: 'pendente',
      }),
    ];

    (repository.buscarAcordoPorId as jest.Mock).mockResolvedValue(acordo);
    (repository.buscarParcelasPorAcordo as jest.Mock).mockResolvedValue(parcelas);

    await expect(service.recalcularDistribuicao(acordoId)).rejects.toThrow(
      'Não é possível recalcular distribuição com parcelas já pagas.'
    );

    expect(repository.deletarParcelasDoAcordo).not.toHaveBeenCalled();
  });
});
