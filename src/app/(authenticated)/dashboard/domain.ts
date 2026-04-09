/**
 * Domain Layer for Dashboard Feature
 *
 * Regra arquitetural: domain/repository NÃO carrega cor, carrega `tone`
 * (SemanticTone). UI consome via tokenForTone() do design system.
 * Veja src/lib/design-system/semantic-tones.ts.
 */

import { z } from 'zod';
import type { SemanticTone } from '@/lib/design-system';
import type { DashboardFinanceiroData } from '@/app/(authenticated)/financeiro/services/dashboard';

// ============================================================================
// Tipos Compartilhados
// ============================================================================

export interface ProcessoResumo {
  total: number;
  ativos: number;
  arquivados: number;
  porGrau: {
    grau: string;
    count: number;
  }[];
  porTRT: {
    trt: string;
    count: number;
  }[];
  /** Distribuição detalhada por status (ativos, suspensos, arquivados, em recurso) */
  porStatus?: {
    status: string;
    count: number;
    tone: SemanticTone;
  }[];
  /** Distribuição por área jurídica */
  porSegmento?: {
    segmento: string;
    count: number;
    tone: SemanticTone;
  }[];
  /** Aging por faixas de duração */
  aging?: {
    faixa: string;
    count: number;
    tone: SemanticTone;
  }[];
  /** Tendência mensal de novos processos (últimos 8 meses) */
  tendenciaMensal?: {
    mes: string;
    novos: number;
    resolvidos: number;
  }[];
}

export interface AudienciasResumo {
  total: number;
  hoje: number;
  amanha: number;
  proximos7dias: number;
  proximos30dias: number;
  /** Distribuição por formato: virtual, presencial, híbrida */
  porModalidade?: {
    modalidade: string;
    count: number;
    tone: SemanticTone;
  }[];
  /** Status mensal: marcadas, realizadas, canceladas (últimos 6 meses) */
  statusMensal?: {
    mes: string;
    marcadas: number;
    realizadas: number;
    canceladas: number;
  }[];
  /** Distribuição por tipo: instrução, conciliação, julgamento, etc. */
  porTipo?: {
    tipo: string;
    count: number;
    tone: SemanticTone;
  }[];
  /** Trend de audiências por mês (12 meses) */
  trendMensal?: number[];
  /** Heatmap semanal (35 valores: 5 semanas × 7 dias) */
  heatmapSemanal?: number[];
  /** Duração média em minutos */
  duracaoMedia?: number;
  /** Taxa de comparecimento (percentual 0-100) */
  taxaComparecimento?: number;
}

export interface ExpedientesResumo {
  total: number;
  vencidos: number;
  venceHoje: number;
  venceAmanha: number;
  proximos7dias: number;
  porTipo: {
    tipo: string;
    count: number;
  }[];
  /** Distribuição por origem: PJE, Comunica CNJ, Manual */
  porOrigem?: {
    origem: string;
    count: number;
    tone: SemanticTone;
  }[];
  /** Resultado das decisões: favorável, parcialmente favorável, desfavorável */
  resultadoDecisao?: {
    resultado: string;
    count: number;
    tone: SemanticTone;
  }[];
  /** Volume semanal: recebidos vs baixados por dia */
  volumeSemanal?: {
    dia: string;
    recebidos: number;
    baixados: number;
  }[];
  /** Tendência do prazo médio de resposta em dias (últimas 8 semanas) */
  prazoMedio?: number[];
  /** Heatmap de prazos por dia (35 valores: 5 semanas × 7 dias) */
  calendarioPrazos?: number[];
  /** Tempo médio de resposta em dias */
  tempoRespostaMedio?: number;
  /** Taxa de cumprimento de prazos (percentual 0-100) */
  taxaCumprimento?: number;
  /** Quantidade de expedientes no backlog */
  backlogAtual?: number;
}

export interface ProdutividadeResumo {
  baixasHoje: number;
  baixasSemana: number;
  baixasMes: number;
  mediaDiaria: number;
  comparativoSemanaAnterior: number; // percentual
  porDia: {
    data: string; // YYYY-MM-DD
    baixas: number;
  }[];
  /** Heatmap de tarefas concluídas (35 valores: 5 semanas × 7 dias) */
  heatmap?: number[];
}

// ─── Chat Resumo ────────────────────────────────────────────────────────────

export interface ChatResumo {
  naoLidas: number;
  salasAtivas: number;
  ultimaMensagem: {
    autor: string;
    preview: string;
    tempo: string; // ISO string
    salaId: string;
  } | null;
}

// ─── Documentos Recentes ────────────────────────────────────────────────────

export interface DocumentoRecente {
  id: string;
  nome: string;
  tipo: 'doc' | 'pdf' | 'planilha' | 'outro';
  atualizadoEm: string; // ISO string
}

// ============================================================================
// Tipos para Dados Financeiros Consolidados
// ============================================================================

export interface DadosFinanceirosConsolidados extends DashboardFinanceiroData {
  saldoTotal: number;
  contasPagar: {
    quantidade: number;
    valor: number;
  };
  contasReceber: {
    quantidade: number;
    valor: number;
  };
  alertas: {
    tipo: string;
    mensagem: string;
  }[];
  /** Evolução do saldo nos últimos 12 meses */
  saldoTrend?: number[];
  /** Aging de contas a receber por faixa de vencimento */
  contasReceberAging?: {
    faixa: string;
    valor: number;
    tone: SemanticTone;
  }[];
  /** Aging de contas a pagar por faixa de vencimento */
  contasPagarAging?: {
    faixa: string;
    valor: number;
    tone: SemanticTone;
  }[];
  /** Despesas por categoria */
  despesasPorCategoria?: {
    categoria: string;
    valor: number;
    tone: SemanticTone;
  }[];
  /** DRE comparativo (12 meses de receita, despesa e resultado) */
  dreComparativo?: {
    receita: number[];
    despesa: number[];
    resultado: number[];
  };
  /** Fluxo de caixa mensal (últimos 6 meses) */
  fluxoCaixaMensal?: {
    mes: string;
    receita: number;
    despesa: number;
  }[];
}

// ============================================================================
// Tipos para Contratos
// ============================================================================

export interface ContratosResumo {
  /** Distribuição por status: em contratação, contratado, distribuído, desistência */
  porStatus: {
    status: string;
    count: number;
    tone: SemanticTone;
  }[];
  /** Distribuição por tipo: ajuizamento, defesa, assessoria, etc. */
  porTipo: {
    tipo: string;
    count: number;
  }[];
  /** Obrigações a vencer (próximos 30 dias) */
  obrigacoesVencer: {
    descricao: string;
    valor: number;
    vencimento: string;
    urgencia: string;
    tipo: string;
  }[];
  /** Status das parcelas: pagas, pendentes, atrasadas */
  parcelasStatus: {
    status: string;
    count: number;
    valor: number;
    tone: SemanticTone;
  }[];
  /** Repasses pendentes */
  repassesPendentes: {
    processo: string;
    cliente: string;
    total: number;
    pctCliente: number;
    status: string;
  }[];
  /** Modelo de cobrança: pro labore vs pro êxito */
  modeloCobranca: {
    proLabore: { contratos: number; faturado: number };
    proExito: { contratos: number; potencial: number; taxaRealizacao: number };
  };
  /** Treemap de obrigações por natureza */
  treemapObrigacoes: {
    natureza: string;
    valor: number;
    tone: SemanticTone;
  }[];
  /** Score contratual (0-100) */
  scoreContratual: number;
  total?: number;
  novosMes?: number;
  taxaConversao?: number;
}

// ============================================================================
// Tipos de Audiência para Lista
// ============================================================================

export interface AudienciaProxima {
  id: number;
  processo_id: number;
  numero_processo: string;
  data_audiencia: string;
  hora_audiencia: string | null;
  tipo_audiencia: string | null;
  local: string | null;
  sala: string | null;
  url_audiencia_virtual: string | null;
  responsavel_id: number | null;
  responsavel_nome: string | null;
  polo_ativo_nome: string | null;
  polo_passivo_nome: string | null;
}

// ============================================================================
// Tipos de Expediente para Lista
// ============================================================================

export interface ExpedienteUrgente {
  id: number;
  processo_id: number;
  numero_processo: string;
  tipo_expediente: string;
  descricao_orgao_julgador?: string | null;
  classe_judicial?: string | null;
  nome_parte_autora?: string | null;
  nome_parte_re?: string | null;
  prazo_fatal: string;
  status: string; // 'pendente' | 'em_andamento' | 'concluido' | 'vencido'
  dias_restantes: number; // negativo se vencido
  responsavel_id: number | null;
  responsavel_nome: string | null;
  origem: 'expedientes' | 'expedientes_manuais';
}

// ============================================================================
// Tipos de Lembretes (Reminders)
// ============================================================================

export type PrioridadeLembrete = 'low' | 'medium' | 'high';

export interface Lembrete {
  id: number;
  usuario_id: number;
  texto: string;
  prioridade: PrioridadeLembrete;
  categoria: string;
  data_lembrete: string; // ISO 8601
  concluido: boolean;
  created_at: string;
  updated_at: string;
}

export interface LembreteDetalhado extends Lembrete {
  usuario_nome?: string;
}

// ============================================================================
// Schemas Zod para Lembretes
// ============================================================================

export const criarLembreteSchema = z.object({
  texto: z.string().min(1, 'Texto do lembrete é obrigatório').max(500, 'Texto muito longo'),
  prioridade: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Prioridade inválida' }),
  }),
  categoria: z.string().min(1, 'Categoria é obrigatória').max(100, 'Categoria muito longa'),
  data_lembrete: z.string().datetime('Data do lembrete inválida'),
});

export const atualizarLembreteSchema = z.object({
  id: z.number().int().positive(),
  texto: z.string().min(1).max(500).optional(),
  prioridade: z.enum(['low', 'medium', 'high']).optional(),
  categoria: z.string().min(1).max(100).optional(),
  data_lembrete: z.string().datetime().optional(),
  concluido: z.boolean().optional(),
});

export const listarLembretesSchema = z.object({
  usuario_id: z.number().int().positive(),
  concluido: z.boolean().optional(),
  limite: z.number().int().positive().max(100).default(10),
});

export const marcarLembreteConcluidoSchema = z.object({
  id: z.number().int().positive(),
  concluido: z.boolean(),
});

export const deletarLembreteSchema = z.object({
  id: z.number().int().positive(),
});

export type CriarLembreteInput = z.infer<typeof criarLembreteSchema>;
export type AtualizarLembreteInput = z.infer<typeof atualizarLembreteSchema>;
export type ListarLembretesParams = z.infer<typeof listarLembretesSchema>;
export type MarcarLembreteConcluidoInput = z.infer<typeof marcarLembreteConcluidoSchema>;
export type DeletarLembreteInput = z.infer<typeof deletarLembreteSchema>;

// ============================================================================
// Constantes para Lembretes
// ============================================================================

export const PRIORIDADE_LABELS: Record<PrioridadeLembrete, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
} as const;

export const CATEGORIAS_LEMBRETE = [
  'Reunião',
  'Educação em Design',
  'Suporte ao Cliente',
  'Pessoal',
  'Trabalho',
  'Processos',
  'Audiências',
  'Expedientes',
  'Outros',
] as const;

// ============================================================================
// Tipos para Dashboard de Usuário
// ============================================================================

export interface DashboardUsuarioData {
  role: 'user';
  usuario: {
    id: number;
    nome: string;
  };
  processos: ProcessoResumo;
  audiencias: AudienciasResumo;
  expedientes: ExpedientesResumo;
  produtividade: ProdutividadeResumo;
  proximasAudiencias: AudienciaProxima[];
  expedientesUrgentes: ExpedienteUrgente[];
  dadosFinanceiros: DadosFinanceirosConsolidados;
  contratos?: ContratosResumo;
  chatResumo?: ChatResumo;
  documentosRecentes?: DocumentoRecente[];
  ultimaAtualizacao: string;
}

// ============================================================================
// Tipos para Dashboard de Admin
// ============================================================================

export interface MetricasEscritorio {
  totalProcessos: number;
  processosAtivos: number;
  processosArquivados: number; // Contagem de processos arquivados únicos
  processosAtivosUnicos: number; // Contagem por número de processo único
  totalAudiencias: number;
  audienciasMes: number;
  totalExpedientes: number;
  expedientesPendentes: number;
  expedientesVencidos: number;
  totalUsuarios: number;
  taxaResolucao: number; // percentual de expedientes resolvidos no prazo
  comparativoMesAnterior: {
    processos: number;
    audiencias: number;
    expedientes: number;
  };
  evolucaoMensal: {
    mes: string; // YYYY-MM
    processos: number;
    audiencias: number;
    expedientes: number;
  }[];
}

export interface CargaUsuario {
  usuario_id: number;
  usuario_nome: string;
  processosAtivos: number;
  expedientesPendentes: number;
  audienciasProximas: number;
  cargaTotal: number; // soma ponderada
}

export interface StatusCaptura {
  trt: string;
  grau: string;
  ultimaExecucao: string | null;
  status: 'sucesso' | 'erro' | 'pendente' | 'executando';
  mensagemErro: string | null;
  processosCapturados: number;
  audienciasCapturadas: number;
  expedientesCapturados: number;
}

export interface PerformanceAdvogado {
  usuario_id: number;
  usuario_nome: string;
  baixasSemana: number;
  baixasMes: number;
  taxaCumprimentoPrazo: number; // percentual
  expedientesVencidos: number;
}

export interface DashboardAdminData {
  role: 'admin';
  usuario: {
    id: number;
    nome: string;
  };
  metricas: MetricasEscritorio;
  cargaUsuarios: CargaUsuario[];
  statusCapturas: StatusCaptura[];
  performanceAdvogados: PerformanceAdvogado[];
  proximasAudiencias: AudienciaProxima[];
  expedientesUrgentes: ExpedienteUrgente[];
  dadosFinanceiros: DadosFinanceirosConsolidados;
  contratos?: ContratosResumo;
  chatResumo?: ChatResumo;
  documentosRecentes?: DocumentoRecente[];
  ultimaAtualizacao: string;
}

// ============================================================================
// Tipo União para Response da API
// ============================================================================

export type DashboardData = DashboardUsuarioData | DashboardAdminData;

// ============================================================================
// Parâmetros de Consulta
// ============================================================================

export interface DashboardQueryParams {
  usuarioId?: number;
  periodo?: '7dias' | '30dias' | '90dias';
  trt?: string;
}

// ============================================================================
// Cache Keys
// ============================================================================

export const DASHBOARD_CACHE_KEYS = {
  usuario: (userId: number) => `dashboard:user:${userId}`,
  admin: () => 'dashboard:admin',
  metricas: () => 'dashboard:metricas',
  capturas: () => 'dashboard:capturas',
} as const;

export const DASHBOARD_CACHE_TTL = {
  usuario: 300, // 5 minutos
  admin: 600, // 10 minutos
  metricas: 600, // 10 minutos
  capturas: 120, // 2 minutos (mais volátil)
} as const;


// ============================================================================
// Schemas de Query Params
// ============================================================================

export const dashboardQuerySchema = z.object({
  usuarioId: z.number().optional(),
  periodo: z.enum(['7dias', '30dias', '90dias']).optional(),
  trt: z.string().optional(),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;

// ============================================================================
// Schemas de Validação de Resposta
// ============================================================================

export const processoResumoSchema = z.object({
  total: z.number(),
  ativos: z.number(),
  arquivados: z.number(),
  porGrau: z.array(z.object({
    grau: z.string(),
    count: z.number(),
  })),
  porTRT: z.array(z.object({
    trt: z.string(),
    count: z.number(),
  })),
});

export const audienciasResumoSchema = z.object({
  total: z.number(),
  hoje: z.number(),
  amanha: z.number(),
  proximos7dias: z.number(),
  proximos30dias: z.number(),
});

export const expedientesResumoSchema = z.object({
  total: z.number(),
  vencidos: z.number(),
  venceHoje: z.number(),
  venceAmanha: z.number(),
  proximos7dias: z.number(),
  porTipo: z.array(z.object({
    tipo: z.string(),
    count: z.number(),
  })),
});

export const produtividadeResumoSchema = z.object({
  baixasHoje: z.number(),
  baixasSemana: z.number(),
  baixasMes: z.number(),
  mediaDiaria: z.number(),
  comparativoSemanaAnterior: z.number(),
  porDia: z.array(z.object({
    data: z.string(),
    baixas: z.number(),
  })),
});

export const audienciaProximaSchema = z.object({
  id: z.number(),
  processo_id: z.number(),
  numero_processo: z.string(),
  data_audiencia: z.string(),
  hora_audiencia: z.string().nullable(),
  tipo_audiencia: z.string().nullable(),
  local: z.string().nullable(),
  sala: z.string().nullable(),
  url_audiencia_virtual: z.string().nullable(),
  responsavel_id: z.number().nullable(),
  responsavel_nome: z.string().nullable(),
  polo_ativo_nome: z.string().nullable(),
  polo_passivo_nome: z.string().nullable(),
});

export const expedienteUrgenteSchema = z.object({
  id: z.number(),
  processo_id: z.number(),
  numero_processo: z.string(),
  tipo_expediente: z.string(),
  descricao_orgao_julgador: z.string().nullable().optional(),
  classe_judicial: z.string().nullable().optional(),
  nome_parte_autora: z.string().nullable().optional(),
  nome_parte_re: z.string().nullable().optional(),
  prazo_fatal: z.string(),
  status: z.string(),
  dias_restantes: z.number(),
  responsavel_id: z.number().nullable(),
  responsavel_nome: z.string().nullable(),
  origem: z.enum(['expedientes', 'expedientes_manuais']),
});

export const dadosFinanceirosConsolidadosSchema = z.object({
  saldoTotal: z.number(),
  contasPagar: z.object({
    quantidade: z.number(),
    valor: z.number(),
  }),
  contasReceber: z.object({
    quantidade: z.number(),
    valor: z.number(),
  }),
  alertas: z.array(z.object({
    tipo: z.string(),
    mensagem: z.string(),
  })),
});

export const dashboardUsuarioDataSchema = z.object({
  role: z.literal('user'),
  usuario: z.object({
    id: z.number(),
    nome: z.string(),
  }),
  processos: processoResumoSchema,
  audiencias: audienciasResumoSchema,
  expedientes: expedientesResumoSchema,
  produtividade: produtividadeResumoSchema,
  proximasAudiencias: z.array(audienciaProximaSchema),
  expedientesUrgentes: z.array(expedienteUrgenteSchema),
  dadosFinanceiros: dadosFinanceirosConsolidadosSchema,
  ultimaAtualizacao: z.string(),
});

export const metricasEscritorioSchema = z.object({
  totalProcessos: z.number(),
  processosAtivos: z.number(),
  processosArquivados: z.number(),
  processosAtivosUnicos: z.number(),
  totalAudiencias: z.number(),
  audienciasMes: z.number(),
  totalExpedientes: z.number(),
  expedientesPendentes: z.number(),
  expedientesVencidos: z.number(),
  totalUsuarios: z.number(),
  taxaResolucao: z.number(),
  comparativoMesAnterior: z.object({
    processos: z.number(),
    audiencias: z.number(),
    expedientes: z.number(),
  }),
  evolucaoMensal: z.array(z.object({
    mes: z.string(),
    processos: z.number(),
    audiencias: z.number(),
    expedientes: z.number(),
  })),
});

export const cargaUsuarioSchema = z.object({
  usuario_id: z.number(),
  usuario_nome: z.string(),
  processosAtivos: z.number(),
  expedientesPendentes: z.number(),
  audienciasProximas: z.number(),
  cargaTotal: z.number(),
});

export const statusCapturaSchema = z.object({
  trt: z.string(),
  grau: z.string(),
  ultimaExecucao: z.string().nullable(),
  status: z.enum(['sucesso', 'erro', 'pendente', 'executando']),
  mensagemErro: z.string().nullable(),
  processosCapturados: z.number(),
  audienciasCapturadas: z.number(),
  expedientesCapturados: z.number(),
});

export const performanceAdvogadoSchema = z.object({
  usuario_id: z.number(),
  usuario_nome: z.string(),
  baixasSemana: z.number(),
  baixasMes: z.number(),
  taxaCumprimentoPrazo: z.number(),
  expedientesVencidos: z.number(),
});

export const dashboardAdminDataSchema = z.object({
  role: z.literal('admin'),
  usuario: z.object({
    id: z.number(),
    nome: z.string(),
  }),
  metricas: metricasEscritorioSchema,
  cargaUsuarios: z.array(cargaUsuarioSchema),
  statusCapturas: z.array(statusCapturaSchema),
  performanceAdvogados: z.array(performanceAdvogadoSchema),
  proximasAudiencias: z.array(audienciaProximaSchema),
  expedientesUrgentes: z.array(expedienteUrgenteSchema),
  dadosFinanceiros: dadosFinanceirosConsolidadosSchema,
  ultimaAtualizacao: z.string(),
});

export const dashboardDataSchema = z.discriminatedUnion('role', [
  dashboardUsuarioDataSchema,
  dashboardAdminDataSchema,
]);

// ============================================================================
// Type Guards
// ============================================================================

export function isDashboardAdmin(
  data: DashboardData | null
): data is DashboardAdminData {
  return data?.role === 'admin';
}

export function isDashboardUsuario(
  data: DashboardData | null
): data is DashboardUsuarioData {
  return data?.role === 'user';
}
