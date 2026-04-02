
import { z } from 'zod';

// ============================================================================
// Enums e Types de Domínio
// ============================================================================

/**
 * Status da folha de pagamento
 */
export type StatusFolhaPagamento = 'rascunho' | 'aprovada' | 'paga' | 'cancelada';

/**
 * Forma de pagamento para folha
 */
export type FormaPagamentoFolha =
  | 'transferencia_bancaria'
  | 'ted'
  | 'pix'
  | 'deposito'
  | 'dinheiro';

// ============================================================================
// Interfaces de Resumo (para joins)
// ============================================================================

/**
 * Dados resumidos de usuário
 */
export interface UsuarioResumo {
  id: number;
  nomeExibicao: string;
  email: string;
  cargo?: string;
}

/**
 * Dados resumidos de cargo
 */
export interface CargoResumo {
  id: number;
  nome: string;
  descricao: string | null;
}

/**
 * Dados resumidos de conta contábil
 */
export interface ContaContabilResumo {
  id: number;
  codigo: string;
  nome: string;
}

/**
 * Dados resumidos de centro de custo
 */
export interface CentroCustoResumo {
  id: number;
  codigo: string;
  nome: string;
}

/**
 * Dados resumidos de conta bancária
 */
export interface ContaBancariaResumo {
  id: number;
  nome: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
}

/**
 * Dados resumidos de lançamento financeiro
 */
export interface LancamentoFinanceiroResumo {
  id: number;
  descricao: string;
  valor: number;
  status: string;
  dataVencimento: string | null;
  dataEfetivacao: string | null;
}

// ============================================================================
// Interfaces Principais - Salários
// ============================================================================

/**
 * Interface principal de Salário
 */
export interface Salario {
  id: number;

  // Funcionário
  usuarioId: number;
  cargoId: number | null;

  // Valor
  salarioBruto: number;

  // Vigência
  dataInicioVigencia: string;
  dataFimVigencia: string | null;

  // Informações adicionais
  observacoes: string | null;

  // Status
  ativo: boolean;

  // Auditoria
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Salário com detalhes de relacionamentos
 */
export interface SalarioComDetalhes extends Salario {
  usuario?: UsuarioResumo;
  cargo?: CargoResumo;
}

// ============================================================================
// Interfaces Principais - Folha de Pagamento
// ============================================================================

/**
 * Interface principal de Folha de Pagamento
 */
export interface FolhaPagamento {
  id: number;

  // Período de referência
  mesReferencia: number;
  anoReferencia: number;

  // Datas
  dataGeracao: string;
  dataPagamento: string | null;

  // Totais
  valorTotal: number;

  // Status
  status: StatusFolhaPagamento;

  // Informações adicionais
  observacoes: string | null;

  // Auditoria
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Folha de Pagamento com detalhes
 */
export interface FolhaPagamentoComDetalhes extends FolhaPagamento {
  itens: ItemFolhaComDetalhes[];
  totalFuncionarios: number;
}

/**
 * Interface de Item da Folha de Pagamento
 */
export interface ItemFolhaPagamento {
  id: number;

  // Vinculação
  folhaPagamentoId: number;
  usuarioId: number;
  salarioId: number;

  // Valores
  valorBruto: number;

  // Lançamento gerado
  lancamentoFinanceiroId: number | null;

  // Informações adicionais
  observacoes: string | null;

  // Auditoria
  createdAt: string;
  updatedAt: string;
}

/**
 * Item da Folha com detalhes de relacionamentos
 */
export interface ItemFolhaComDetalhes extends ItemFolhaPagamento {
  usuario?: UsuarioResumo;
  salario?: Salario;
  lancamento?: LancamentoFinanceiroResumo;
}

// ============================================================================
// DTOs - Salários
// ============================================================================

/**
 * DTO para criar novo salário
 */
export interface CriarSalarioDTO {
  usuarioId: number;
  cargoId?: number;
  salarioBruto: number;
  dataInicioVigencia: string;
  observacoes?: string;
}

/**
 * DTO para atualizar salário
 */
export interface AtualizarSalarioDTO {
  salarioBruto?: number;
  cargoId?: number | null;
  dataFimVigencia?: string;
  observacoes?: string | null;
  ativo?: boolean;
}

// ============================================================================
// DTOs - Folha de Pagamento
// ============================================================================

/**
 * DTO para gerar nova folha de pagamento
 */
export interface GerarFolhaDTO {
  mesReferencia: number;
  anoReferencia: number;
  dataPagamento?: string;
  observacoes?: string;
}

/**
 * DTO para aprovar folha de pagamento
 */
export interface AprovarFolhaDTO {
  contaBancariaId: number;
  contaContabilId: number;
  centroCustoId?: number;
  observacoes?: string;
}

/**
 * DTO para pagar folha de pagamento
 */
export interface PagarFolhaDTO {
  formaPagamento: FormaPagamentoFolha;
  contaBancariaId: number;
  dataEfetivacao?: string;
  observacoes?: string;
}

/**
 * DTO para cancelar folha de pagamento
 */
export interface CancelarFolhaDTO {
  motivo?: string;
}

// ============================================================================
// Parâmetros e Respostas - Salários
// ============================================================================

/**
 * Parâmetros para listagem de salários
 */
export interface ListarSalariosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  usuarioId?: number;
  cargoId?: number;
  ativo?: boolean;
  vigente?: boolean; // Filtrar apenas salários vigentes na data atual
  ordenarPor?: 'data_inicio_vigencia' | 'salario_bruto' | 'usuario' | 'created_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Resposta paginada de listagem de salários
 */
export interface ListarSalariosResponse {
  items: SalarioComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
  totais?: {
    totalFuncionarios: number;
    totalBrutoMensal: number;
  };
  usuariosSemSalario?: UsuarioResumo[];
}

// ============================================================================
// Parâmetros e Respostas - Folhas de Pagamento
// ============================================================================

/**
 * Parâmetros para listagem de folhas
 */
export interface ListarFolhasParams {
  pagina?: number;
  limite?: number;
  mesReferencia?: number;
  anoReferencia?: number;
  status?: StatusFolhaPagamento | StatusFolhaPagamento[];
  ordenarPor?: 'periodo' | 'valor_total' | 'status' | 'created_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Resposta paginada de listagem de folhas
 */
export interface ListarFolhasResponse {
  items: FolhaPagamentoComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
  resumo?: {
    totalRascunho: number;
    totalAprovada: number;
    totalPaga: number;
    valorTotalRascunho: number;
    valorTotalAprovada: number;
    valorTotalPaga: number;
  };
  totais?: TotaisFolhasPorStatus;
}

/**
 * Resultado de operação em salário
 */
export interface OperacaoSalarioResult {
  sucesso: boolean;
  salario?: Salario;
  erro?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Resultado de operação em folha de pagamento
 */
export interface OperacaoFolhaResult {
  sucesso: boolean;
  folha?: FolhaPagamentoComDetalhes;
  erro?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Totais por status (para dashboards)
 */
export interface TotaisFolhasPorStatus {
  rascunho: { quantidade: number; valorTotal: number };
  aprovada: { quantidade: number; valorTotal: number };
  paga: { quantidade: number; valorTotal: number };
  cancelada: { quantidade: number; valorTotal: number };
}

// ============================================================================
// Filtros para UI
// ============================================================================

/**
 * Filtros para toolbar de salários
 */
export interface SalariosFilters {
  busca?: string;
  usuarioId?: number;
  cargoId?: number;
  ativo?: boolean;
  vigente?: boolean;
}

/**
 * Filtros para toolbar de folhas de pagamento
 */
export interface FolhasPagamentoFilters {
  mesReferencia?: number;
  anoReferencia?: number;
  status?: StatusFolhaPagamento | StatusFolhaPagamento[];
}

// ============================================================================
// Schemas Zod
// ============================================================================

export const criarSalarioSchema = z.object({
  usuarioId: z.number().int().positive('ID do usuário é obrigatório e deve ser um número positivo'),
  cargoId: z.number().int().positive('ID do cargo deve ser um número positivo').optional(),
  salarioBruto: z.number().positive('Salário bruto deve ser maior que zero'),
  dataInicioVigencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início da vigência deve estar no formato YYYY-MM-DD'),
  observacoes: z.string().optional(),
});

export const atualizarSalarioSchema = z.object({
  salarioBruto: z.number().positive('Salário bruto deve ser maior que zero').optional(),
  cargoId: z.number().int().positive('ID do cargo deve ser um número positivo').optional().nullable(),
  dataFimVigencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim da vigência deve estar no formato YYYY-MM-DD').optional(),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
}).refine(
  (data) => 
    data.salarioBruto !== undefined || 
    data.cargoId !== undefined || 
    data.dataFimVigencia !== undefined || 
    data.observacoes !== undefined || 
    data.ativo !== undefined,
  {
    message: 'Pelo menos um campo deve ser fornecido para atualização',
  }
);

export const gerarFolhaSchema = z.object({
  mesReferencia: z.number().int().min(1, 'Mês deve ser entre 1 e 12').max(12, 'Mês deve ser entre 1 e 12'),
  anoReferencia: z.number().int().min(2020, 'Ano deve ser maior ou igual a 2020'),
  dataPagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de pagamento deve estar no formato YYYY-MM-DD').optional(),
  observacoes: z.string().optional(),
}).refine((data) => {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;
  
  let mesLimite = mesAtual + 1;
  let anoLimite = anoAtual;
  if (mesLimite > 12) {
    mesLimite = 1;
    anoLimite++;
  }
  
  const periodoReferencia = data.anoReferencia * 12 + data.mesReferencia;
  const periodoLimite = anoLimite * 12 + mesLimite;
  
  return periodoReferencia <= periodoLimite;
}, {
  message: 'Não é possível gerar folha para período muito distante no futuro. Permitido apenas até o próximo mês.',
  path: ['mesReferencia'] // Associate error with a field
});

export const aprovarFolhaSchema = z.object({
  contaBancariaId: z.number().int().positive('Conta bancária é obrigatória'),
  contaContabilId: z.number().int().positive('Conta contábil é obrigatória'),
  centroCustoId: z.number().int().positive('ID do centro de custo deve ser um número positivo').optional(),
  observacoes: z.string().optional(),
});

export const pagarFolhaSchema = z.object({
  formaPagamento: z.enum([
    'transferencia_bancaria',
    'ted',
    'pix',
    'deposito',
    'dinheiro'
  ] as [string, ...string[]]).refine((val) => isFormaPagamentoFolhaValida(val), {
      message: 'Forma de pagamento inválida'
  }),
  contaBancariaId: z.number().int().positive('Conta bancária é obrigatória'),
  dataEfetivacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de efetivação deve estar no formato YYYY-MM-DD').optional(),
  observacoes: z.string().optional(),
});

// ============================================================================
// Type Guards
// ============================================================================

export const STATUS_FOLHA_VALIDOS: StatusFolhaPagamento[] = ['rascunho', 'aprovada', 'paga', 'cancelada'];
const FORMAS_PAGAMENTO_FOLHA_VALIDAS: FormaPagamentoFolha[] = [
  'transferencia_bancaria',
  'ted',
  'pix',
  'deposito',
  'dinheiro',
];

export const isStatusFolhaValido = (status: unknown): status is StatusFolhaPagamento => {
  return typeof status === 'string' && STATUS_FOLHA_VALIDOS.includes(status as StatusFolhaPagamento);
};

export const isFormaPagamentoFolhaValida = (fp: unknown): fp is FormaPagamentoFolha => {
  return typeof fp === 'string' && FORMAS_PAGAMENTO_FOLHA_VALIDAS.includes(fp as FormaPagamentoFolha);
};

export const isTransicaoStatusValida = (
  statusAtual: StatusFolhaPagamento,
  novoStatus: StatusFolhaPagamento
): boolean => {
  const transicoesValidas: Record<StatusFolhaPagamento, StatusFolhaPagamento[]> = {
    rascunho: ['aprovada', 'cancelada'],
    aprovada: ['paga', 'cancelada'],
    paga: [], // Não pode mudar de paga
    cancelada: [], // Não pode mudar de cancelada
  };

  return transicoesValidas[statusAtual]?.includes(novoStatus) ?? false;
};

// ============================================================================
// Labels e Constantes
// ============================================================================

export const STATUS_FOLHA_LABELS: Record<StatusFolhaPagamento, string> = {
  rascunho: 'Rascunho',
  aprovada: 'Aprovada',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

export const FORMA_PAGAMENTO_FOLHA_LABELS: Record<FormaPagamentoFolha, string> = {
  transferencia_bancaria: 'Transferência Bancária',
  ted: 'TED',
  pix: 'PIX',
  deposito: 'Depósito',
  dinheiro: 'Dinheiro',
};

export const MESES_LABELS: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

export const MESES_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];
