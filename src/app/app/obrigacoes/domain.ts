import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type ViewType = 'semana' | 'mes' | 'ano' | 'lista';

export type TipoObrigacao = 'acordo' | 'condenacao' | 'custas_processuais';
export type DirecaoPagamento = 'recebimento' | 'pagamento';
export type FormaDistribuicao = 'integral' | 'dividido';
export type StatusAcordo = 'pendente' | 'pago_parcial' | 'pago_total' | 'atrasado';
export type StatusParcela = 'pendente' | 'recebida' | 'paga' | 'atrasada' | 'cancelada';
export type StatusRepasse =
  | 'nao_aplicavel'
  | 'pendente_declaracao'
  | 'pendente_transferencia'
  | 'repassado';
export type FormaPagamento = 'transferencia_direta' | 'deposito_judicial' | 'deposito_recursal';

export interface ObrigacoesFilters {
  tipo?: TipoObrigacao;
  direcao?: DirecaoPagamento;
  status?: StatusAcordo;
  dataInicio?: string;
  dataFim?: string;
  processoId?: number;
  incluirSemData?: boolean;
}

export interface ProcessoInfo {
  id: number;
  trt: string;
  grau: string;
  numero_processo: string;
  classe_judicial: string;
  descricao_orgao_julgador: string;
  nome_parte_autora: string;
  nome_parte_re: string;
}

export interface AcordoCondenacao {
  id: number;
  processoId: number;
  tipo: TipoObrigacao;
  direcao: DirecaoPagamento;
  valorTotal: number;
  dataVencimentoPrimeiraParcela: string;
  status: StatusAcordo;
  numeroParcelas: number;
  formaDistribuicao: FormaDistribuicao | null;
  percentualEscritorio: number;
  percentualCliente: number;
  honorariosSucumbenciaisTotal: number;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface Parcela {
  id: number;
  acordoCondenacaoId: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  honorariosContratuais: number;
  honorariosSucumbenciais: number;
  valorRepasseCliente: number | null;
  dataVencimento: string;
  dataEfetivacao: string | null;
  status: StatusParcela;
  formaPagamento: FormaPagamento | null;
  statusRepasse: StatusRepasse;
  editadoManualmente: boolean;
  declaracaoPrestacaoContasUrl: string | null;
  dataDeclaracaoAnexada: string | null;
  comprovanteRepasseUrl: string | null;
  dataRepasse: string | null;
  usuarioRepasseId: number | null;
  arquivoQuitacaoReclamante: string | null;
  dataQuitacaoAnexada: string | null;
  createdAt: string;
  updatedAt: string;
  // Campos de integração
  dadosPagamento: Record<string, unknown> | null;
}

export interface AcordoComParcelas extends AcordoCondenacao {
  parcelas?: Parcela[];
  totalParcelas: number;
  parcelasPagas: number;
  parcelasPendentes: number;
  processo?: ProcessoInfo | null;
  proximoVencimento?: string | null;
}

export interface ParcelaComLancamento extends Parcela {
  lancamentoId?: number | null;
  // Outros campos se necessário
}

export interface RepassePendente {
  parcelaId: number;
  acordoCondenacaoId: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  valorRepasseCliente: number;
  statusRepasse: StatusRepasse;
  dataEfetivacao: string;
  arquivoDeclaracaoPrestacaoContas: string | null;
  dataDeclaracaoAnexada: string | null;
  processoId: number;
  tipo: string;
  acordoValorTotal: number;
  percentualCliente: number;
  acordoNumeroParcelas: number;
}

// ============================================================================
// UI Types / View Models
// ============================================================================

export type StatusObrigacao = 'pendente' | 'vencida' | 'efetivada' | 'cancelada' | 'estornada';
export type StatusSincronizacao = 'sincronizado' | 'pendente' | 'inconsistente' | 'nao_aplicavel';

export interface ObrigacaoComDetalhes {
    id: number;
    tipo: TipoObrigacao;
    descricao: string;
    valor: number;
    dataVencimento: string;
    status: StatusObrigacao;
    statusSincronizacao: StatusSincronizacao;
    diasAteVencimento: number | null;
    tipoEntidade: 'parcela' | 'obrigacao';
    dataLancamento?: string | null;
    dataEfetivacao?: string | null;
    clienteId?: number | null;
    processoId?: number | null;
    acordoId?: number | null;
    lancamentoId?: number | null;
}

export interface ResumoObrigacoes {
    vencidas: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
    vencendoHoje: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
    vencendoEm7Dias: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
    inconsistentes: { quantidade: number; items: ObrigacaoComDetalhes[] };
    pendentes: { quantidade: number; valor: number };
    efetivadas: { quantidade: number; valor: number };
    porTipo: Array<{
        tipo: TipoObrigacao | 'conta_receber' | 'conta_pagar' | string;
        quantidade: number;
        valorTotal: number;
        valorTotalPendente: number;
    }>;
}

export interface AlertasObrigacoesType {
  vencidas: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  vencendoHoje: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  vencendoEm7Dias: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  inconsistentes: { quantidade: number; items: ObrigacaoComDetalhes[] };
}

// Params Types
export interface CriarAcordoComParcelasParams {
  processoId: number;
  tipo: TipoObrigacao;
  direcao: DirecaoPagamento;
  valorTotal: number;
  dataVencimentoPrimeiraParcela: string;
  numeroParcelas: number;
  formaDistribuicao?: FormaDistribuicao | null;
  percentualEscritorio?: number;
  honorariosSucumbenciaisTotal?: number;
  formaPagamentoPadrao: FormaPagamento;
  intervaloEntreParcelas?: number;
  observacoes?: string | null;
  createdBy?: string;
}

export interface AtualizarAcordoParams {
  valorTotal?: number;
  dataVencimentoPrimeiraParcela?: string;
  percentualEscritorio?: number;
  honorariosSucumbenciaisTotal?: number;
  formaDistribuicao?: FormaDistribuicao | null;
  status?: StatusAcordo;
  observacoes?: string | null;
}

export interface ListarAcordosParams {
  pagina?: number;
  limite?: number;
  processoId?: number;
  tipo?: TipoObrigacao;
  direcao?: DirecaoPagamento;
  status?: StatusAcordo;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

export interface AcordosCondenacoesPaginado {
  acordos: AcordoComParcelas[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface MarcarParcelaRecebidaParams {
  dataRecebimento: string;
  valorRecebido?: number; // Se diferente do previsto
}

export interface AtualizarParcelaParams {
  valorBrutoCreditoPrincipal?: number;
  honorariosSucumbenciais?: number;
  dataVencimento?: string;
  formaPagamento?: FormaPagamento;
  status?: StatusParcela;
  editadoManualmente?: boolean;
}

export interface FiltrosRepasses {
  statusRepasse?: StatusRepasse;
  processoId?: number;
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
}

export interface RegistrarRepasseParams {
  arquivoComprovantePath: string;
  usuarioRepasseId: number;
  dataRepasse?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const TIPO_LABELS = {
  acordo: 'Acordo',
  condenacao: 'Condenação',
  custas_processuais: 'Custas Processuais',
} as const;

export const DIRECAO_LABELS = {
  recebimento: 'Recebimento',
  pagamento: 'Pagamento',
} as const;

export const STATUS_LABELS = {
  pendente: 'Pendente',
  pago_parcial: 'Pago Parcial',
  pago_total: 'Pago Total',
  atrasado: 'Atrasado',
} as const;

export const FORMA_PAGAMENTO_LABELS = {
  transferencia_direta: 'Transferência Direta',
  deposito_judicial: 'Depósito Judicial',
  deposito_recursal: 'Depósito Recursal',
} as const;

export const PERCENTUAL_ESCRITORIO_PADRAO = 30;
export const INTERVALO_PARCELAS_PADRAO = 30;

// ============================================================================
// Schemas Zod
// ============================================================================

export const acordoCondenacaoSchema = z.object({
  id: z.number(),
  processoId: z.number(),
  tipo: z.enum(['acordo', 'condenacao', 'custas_processuais']),
  direcao: z.enum(['recebimento', 'pagamento']),
  valorTotal: z.number().positive(),
  dataVencimentoPrimeiraParcela: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  status: z.enum(['pendente', 'pago_parcial', 'pago_total', 'atrasado']),
  numeroParcelas: z.number().int().positive(),
  formaDistribuicao: z.enum(['integral', 'dividido']).nullable(),
  percentualEscritorio: z.number().min(0).max(100),
  percentualCliente: z.number().min(0).max(100),
  honorariosSucumbenciaisTotal: z.number().min(0),
});

export const parcelaSchema = z.object({
  id: z.number(),
  acordoCondenacaoId: z.number(),
  numeroParcela: z.number(),
  valorBrutoCreditoPrincipal: z.number(),
  honorariosContratuais: z.number(),
  honorariosSucumbenciais: z.number(),
  valorRepasseCliente: z.number().nullable(),
  dataVencimento: z.string(),
  status: z.enum(['pendente', 'recebida', 'paga', 'atrasada', 'cancelada']),
  formaPagamento: z.enum(['transferencia_direta', 'deposito_judicial', 'deposito_recursal']).nullable(),
  statusRepasse: z.enum(['nao_aplicavel', 'pendente_declaracao', 'pendente_transferencia', 'repassado']),
});

export const criarAcordoComParcelasSchema = z.object({
  processoId: z.number({ required_error: 'Processo é obrigatório' }),
  tipo: z.enum(['acordo', 'condenacao', 'custas_processuais']),
  direcao: z.enum(['recebimento', 'pagamento']),
  valorTotal: z.number().positive('Valor deve ser positivo'),
  dataVencimentoPrimeiraParcela: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  numeroParcelas: z.number().int().positive('Número de parcelas deve ser positivo'),
  formaDistribuicao: z.enum(['integral', 'dividido']).nullable().optional(),
  percentualEscritorio: z.number().min(0).max(100).optional(),
  honorariosSucumbenciaisTotal: z.number().min(0).optional(),
  formaPagamentoPadrao: z.enum(['transferencia_direta', 'deposito_judicial', 'deposito_recursal']),
  intervaloEntreParcelas: z.number().int().positive().optional().default(30),
  observacoes: z.string().nullable().optional(),
}).refine((data) => {
  // Validação condicional de formaDistribuicao
  if (data.direcao === 'recebimento' && data.tipo !== 'custas_processuais') {
    return !!data.formaDistribuicao;
  }
  return true;
}, {
  message: 'Forma de distribuição é obrigatória para recebimentos',
  path: ['formaDistribuicao'],
}).refine((data) => {
  // Custas processuais
  if (data.tipo === 'custas_processuais') {
    return data.direcao === 'pagamento' && data.numeroParcelas === 1;
  }
  return true;
}, {
  message: 'Custas processuais devem ser pagamento e parcela única',
  path: ['tipo'],
});

export const atualizarAcordoSchema = z.object({
  valorTotal: z.number().positive().optional(),
  dataVencimentoPrimeiraParcela: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  percentualEscritorio: z.number().min(0).max(100).optional(),
  honorariosSucumbenciaisTotal: z.number().min(0).optional(),
  formaDistribuicao: z.enum(['integral', 'dividido']).nullable().optional(),
  status: z.enum(['pendente', 'pago_parcial', 'pago_total', 'atrasado']).optional(),
  observacoes: z.string().nullable().optional(),
});

export const marcarParcelaRecebidaSchema = z.object({
  dataRecebimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valorRecebido: z.number().positive().optional(),
});

// ============================================================================
// Regras de Negocio - Calculos
// ============================================================================

/**
 * Estrutura de Split de Pagamento
 * Define como o valor de uma parcela recebida e distribuido
 */
export interface SplitPagamento {
  valorTotal: number;
  valorPrincipal: number;
  honorariosContratuais: number;
  honorariosSucumbenciais: number;
  valorRepasseCliente: number;
  valorEscritorio: number;
  percentualEscritorio: number;
  percentualCliente: number;
}

/**
 * Calcula o split de pagamento para uma parcela
 *
 * Regras:
 * - Sucumbencia: 100% escritorio
 * - Contratuais: % sobre o exito (principal + juros)
 * - Restante: Cliente
 */
export function calcularSplitPagamento(
  valorPrincipal: number,
  honorariosSucumbenciais: number,
  percentualHonorariosContratuais: number = PERCENTUAL_ESCRITORIO_PADRAO
): SplitPagamento {
  const valorHonorariosContratuais = valorPrincipal * (percentualHonorariosContratuais / 100);
  const valorRepasseCliente = valorPrincipal - valorHonorariosContratuais;
  const valorEscritorio = valorHonorariosContratuais + honorariosSucumbenciais;
  const valorTotal = valorPrincipal + honorariosSucumbenciais;

  return {
    valorTotal,
    valorPrincipal,
    honorariosContratuais: valorHonorariosContratuais,
    honorariosSucumbenciais,
    valorRepasseCliente,
    valorEscritorio,
    percentualEscritorio: percentualHonorariosContratuais,
    percentualCliente: 100 - percentualHonorariosContratuais
  };
}

/**
 * Verifica se uma parcela pode ser sincronizada para o financeiro
 */
export function podeSerSincronizada(parcela: Parcela): boolean {
  return ['pendente', 'recebida', 'paga', 'atrasada'].includes(parcela.status);
}

/**
 * Verifica se uma parcela precisa de sincronizacao
 */
export function precisaSincronizacao(parcela: ParcelaComLancamento): boolean {
  if (['recebida', 'paga'].includes(parcela.status) && !parcela.lancamentoId) {
    return true;
  }
  return false;
}

/**
 * Determina o status de sincronizacao de uma parcela
 */
export function determinarStatusSincronizacao(parcela: ParcelaComLancamento): StatusSincronizacao {
  if (parcela.lancamentoId) {
    return 'sincronizado';
  }
  if (['recebida', 'paga'].includes(parcela.status)) {
    return 'inconsistente';
  }
  if (parcela.status === 'pendente') {
    return 'pendente';
  }
  return 'nao_aplicavel';
}

/**
 * Verifica se um repasse pode ser iniciado
 */
export function podeIniciarRepasse(parcela: Parcela): { pode: boolean; motivo?: string } {
  if (parcela.status !== 'recebida') {
    return { pode: false, motivo: 'Parcela ainda nao foi recebida' };
  }
  if ((parcela.valorRepasseCliente ?? 0) <= 0) {
    return { pode: false, motivo: 'Nao ha valor a repassar ao cliente' };
  }
  if (parcela.statusRepasse === 'repassado') {
    return { pode: false, motivo: 'Repasse ja foi realizado' };
  }
  return { pode: true };
}

/**
 * Verifica se um repasse pode ser finalizado
 */
export function podeFinalizarRepasse(parcela: Parcela): { pode: boolean; motivo?: string } {
  if (parcela.statusRepasse !== 'pendente_transferencia') {
    return { pode: false, motivo: 'Parcela nao esta aguardando transferencia' };
  }
  if (!parcela.declaracaoPrestacaoContasUrl) {
    return { pode: false, motivo: 'Declaracao de prestacao de contas nao anexada' };
  }
  return { pode: true };
}

/**
 * Calcula o saldo devedor de um acordo
 */
export function calcularSaldoDevedor(acordo: AcordoComParcelas): number {
  const totalPago = (acordo.parcelas || [])
    .filter(p => ['recebida', 'paga'].includes(p.status))
    .reduce((acc, p) => acc + p.valorBrutoCreditoPrincipal, 0);

  return acordo.valorTotal - totalPago;
}

/**
 * Calcula o total de repasses pendentes de um acordo
 */
export function calcularRepassesPendentes(acordo: AcordoComParcelas): number {
  return (acordo.parcelas || [])
    .filter(p => p.statusRepasse === 'pendente_transferencia')
    .reduce((acc, p) => acc + (p.valorRepasseCliente ?? 0), 0);
}

/**
 * Determina o status de um acordo baseado nas parcelas
 */
export function determinarStatusAcordo(parcelas: Parcela[]): StatusAcordo {
  if (parcelas.length === 0) return 'pendente';

  const todasCanceladas = parcelas.every(p => p.status === 'cancelada');
  if (todasCanceladas) return 'pendente';

  const todasEfetivadas = parcelas.every(p => ['recebida', 'paga', 'cancelada'].includes(p.status));
  if (todasEfetivadas) return 'pago_total';

  const algumVencida = parcelas.some(p => p.status === 'atrasada');
  if (algumVencida) return 'atrasado';

  const algumPaga = parcelas.some(p => ['recebida', 'paga'].includes(p.status));
  if (algumPaga) return 'pago_parcial';

  return 'pendente';
}

/**
 * Valida integridade de uma parcela
 */
export function validarIntegridadeParcela(
  parcela: Parcela,
  direcao: DirecaoPagamento
): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  // 1. Parcela recebida/paga deve ter forma de pagamento
  if (['recebida', 'paga'].includes(parcela.status)) {
    if (!parcela.formaPagamento) {
      erros.push(
        `Parcela ${parcela.numeroParcela} (ID: ${parcela.id}) esta ${parcela.status} mas nao possui forma de pagamento.`
      );
    }
  }

  // 2. Regra de Repasse: Se ha repasse cliente, verificar status
  if (direcao === 'recebimento' && (parcela.valorRepasseCliente ?? 0) > 0) {
    const statusValidosRepasse: StatusRepasse[] = ['pendente_declaracao', 'pendente_transferencia', 'repassado'];
    if (parcela.status === 'recebida' && !statusValidosRepasse.includes(parcela.statusRepasse)) {
      erros.push(
        `Parcela ${parcela.numeroParcela} (ID: ${parcela.id}) tem valor de repasse mas status de repasse invalido (${parcela.statusRepasse}).`
      );
    }
  }

  return { valido: erros.length === 0, erros };
}

// ============================================================================
// Labels para Status de Repasse
// ============================================================================

export const STATUS_REPASSE_LABELS: Record<StatusRepasse, string> = {
  nao_aplicavel: 'Nao Aplicavel',
  pendente_declaracao: 'Pendente Declaracao',
  pendente_transferencia: 'Pendente Transferencia',
  repassado: 'Repassado'
};

// ============================================================================
// Calendar Display Types
// ============================================================================

/**
 * Display item for calendar views - represents a parcela with additional context
 */
export interface DisplayItem {
  id: number;
  acordoId: number;
  descricao: string;
  valor: number;
  status: StatusObrigacao;
  originalParcela: Parcela;
  originalAcordo: AcordoComParcelas;
}
