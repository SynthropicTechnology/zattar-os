import type {
  AcordoCondenacao,
  Parcela,
  TipoObrigacao,
  StatusParcela,
} from '../domain';

export function criarAcordoMock(overrides: Partial<AcordoCondenacao> = {}): AcordoCondenacao {
  return {
    id: 1,
    processoId: 100,
    tipo: 'acordo',
    direcao: 'recebimento',
    valorTotal: 10000,
    dataVencimentoPrimeiraParcela: '2024-01-15',
    status: 'pendente',
    numeroParcelas: 2,
    formaDistribuicao: 'dividido',
    percentualEscritorio: 30,
    percentualCliente: 70,
    honorariosSucumbenciaisTotal: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    createdBy: null,
    ...overrides,
  };
}

export function criarParcelaMock(overrides: Partial<Parcela> = {}): Parcela {
  return {
    id: 1,
    acordoCondenacaoId: 1,
    numeroParcela: 1,
    dataVencimento: '2024-01-15',
    valorBrutoCreditoPrincipal: 5000,
    honorariosContratuais: 0,
    honorariosSucumbenciais: 0,
    valorRepasseCliente: 3500,
    status: 'pendente',
    dataEfetivacao: null,
    formaPagamento: null,
    statusRepasse: 'nao_aplicavel',
    editadoManualmente: false,
    declaracaoPrestacaoContasUrl: null,
    dataDeclaracaoAnexada: null,
    comprovanteRepasseUrl: null,
    dataRepasse: null,
    usuarioRepasseId: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    dadosPagamento: null,
    ...overrides,
  };
}

export function criarAcordoComParcelasMock(
  numeroParcelas: number = 2,
  acordoOverrides: Partial<AcordoCondenacao> = {}
): { acordo: AcordoCondenacao; parcelas: Parcela[] } {
  const acordo = criarAcordoMock({
    numeroParcelas,
    ...acordoOverrides,
  });

  const valorParcela = acordo.valorTotal / numeroParcelas;
  const honorariosParcela = acordo.honorariosSucumbenciaisTotal / numeroParcelas;

  const parcelas = Array.from({ length: numeroParcelas }, (_, index) =>
    criarParcelaMock({
      acordoCondenacaoId: acordo.id,
      numeroParcela: index + 1,
      valorBrutoCreditoPrincipal: valorParcela,
      honorariosSucumbenciais: honorariosParcela,
      valorRepasseCliente: valorParcela * (acordo.percentualCliente / 100),
    })
  );

  return { acordo, parcelas };
}

export function criarParcelaRecebidaMock(overrides: Partial<Parcela> = {}): Parcela {
  return criarParcelaMock({
    status: 'recebida',
    dataEfetivacao: '2024-01-16',
    formaPagamento: 'transferencia_direta',
    statusRepasse: 'pendente_declaracao',
    ...overrides,
  });
}

export function criarParcelaCanceladaMock(overrides: Partial<Parcela> = {}): Parcela {
  return criarParcelaMock({
    status: 'cancelada',
    ...overrides,
  });
}

export const mockFormaPagamento = {
  transferencia_direta: 'transferencia_direta',
  deposito_judicial: 'deposito_judicial',
  deposito_recursal: 'deposito_recursal',
} as const;

export const mockStatusParcela: Record<string, StatusParcela> = {
  pendente: 'pendente',
  recebida: 'recebida',
  paga: 'paga',
  atrasada: 'atrasada',
  cancelada: 'cancelada',
};

export const mockTipoObrigacao: Record<string, TipoObrigacao> = {
  acordo: 'acordo',
  condenacao: 'condenacao',
  custas_processuais: 'custas_processuais',
};

// Interfaces para Repasses
export interface RepassePendente {
  id: number;
  parcelaId: number;
  acordoCondenacaoId: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  valorRepasseCliente: number;
  statusRepasse: 'pendente_declaracao' | 'pendente_transferencia';
  dataEfetivacao: string;
  arquivoDeclaracaoPrestacaoContas: string | null;
  dataDeclaracaoAnexada: string | null;
  processoId: number;
  tipo: string;
  acordoValorTotal: number;
  percentualCliente: number;
  acordoNumeroParcelas: number;
  clienteId?: number;
}

export interface RepasseEfetivado extends Omit<RepassePendente, 'statusRepasse'> {
  statusRepasse: 'repassado';
  dataRepasseEfetivado: Date | string;
  comprovanteRepasseUrl: string | null;
  observacoes?: string | null;
  valorRepasse?: number;
}

/**
 * Cria um mock de repasse pendente (aguardando declaração ou transferência)
 */
export function criarRepassePendenteMock(overrides: Partial<RepassePendente> = {}): RepassePendente {
  return {
    id: 1,
    parcelaId: 1,
    acordoCondenacaoId: 1,
    numeroParcela: 1,
    valorBrutoCreditoPrincipal: 5000,
    valorRepasseCliente: 3500,
    statusRepasse: 'pendente_declaracao',
    dataEfetivacao: '2024-01-16',
    arquivoDeclaracaoPrestacaoContas: null,
    dataDeclaracaoAnexada: null,
    processoId: 100,
    tipo: 'acordo',
    acordoValorTotal: 10000,
    percentualCliente: 70,
    acordoNumeroParcelas: 2,
    ...overrides,
  };
}

/**
 * Cria um mock de repasse efetivado (já repassado ao cliente)
 */
export function criarRepasseEfetivadoMock(overrides: Partial<RepasseEfetivado> = {}): RepasseEfetivado {
  return {
    id: 1,
    parcelaId: 1,
    acordoCondenacaoId: 1,
    numeroParcela: 1,
    valorBrutoCreditoPrincipal: 5000,
    valorRepasseCliente: 3500,
    statusRepasse: 'repassado',
    dataEfetivacao: '2024-01-16',
    dataRepasseEfetivado: '2024-01-22',
    comprovanteRepasseUrl: 'https://storage.example.com/comprovante-repasse.pdf',
    arquivoDeclaracaoPrestacaoContas: 'https://storage.example.com/declaracao.pdf',
    dataDeclaracaoAnexada: '2024-01-20',
    processoId: 100,
    tipo: 'acordo',
    acordoValorTotal: 10000,
    percentualCliente: 70,
    acordoNumeroParcelas: 2,
    observacoes: null,
    ...overrides,
  };
}
