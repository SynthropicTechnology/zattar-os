/**
 * Design System Variants
 *
 * Este arquivo define os mapeamentos semânticos do Design System ZattarOS.
 * Aqui centralizamos TODA a lógica de mapeamento de domínio para variante visual.
 *
 * @ai-context Use getSemanticBadgeVariant() para determinar a variante visual correta.
 * NUNCA crie funções getXXXColorClass() locais - sempre use este módulo centralizado.
 */

// =============================================================================
// TIPOS DE VARIANTES VISUAIS
// =============================================================================

/**
 * Variantes visuais disponíveis para Badge.
 * Estas variantes correspondem às definidas em badge.tsx
 */
export type BadgeVisualVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'accent';

/**
 * Intensidade do badge.
 * - solid: fundo forte, padrão do sistema (visual mais impactante)
 * - soft: fundo leve, sem contorno (para casos específicos de hierarquia visual)
 */
export type BadgeTone = 'soft' | 'solid';

/**
 * Categorias semânticas para mapeamento de badges.
 */
export type BadgeCategory =
  | 'tribunal'
  | 'status'
  | 'grau'
  | 'parte'
  | 'audiencia_status'
  | 'audiencia_modalidade'
  | 'expediente_tipo'
  | 'captura_status'
  | 'polo'
  | 'tipo_contrato'
  | 'tipo_cobranca'
  | 'status_contrato'
  | 'folha_status'
  | 'salario_status'
  | 'call_status'
  | 'network_quality'
  | 'online_status'
  | 'obrigacao_status'
  | 'obrigacao_tipo'
  | 'obrigacao_direcao'
  | 'document_signature_status'
  | 'project_status'
  | 'task_status'
  | 'priority'
  | 'template_status'
  | 'ativo_status'
  | 'expediente_status'
  | 'payment_status'
  | 'financial_alert'
  | 'error_type'
  | 'pericia_situacao'
  | 'parcela_status'
  | 'repasse_status'
  | 'orcamento_status'
  | 'tipo_conta_contabil'
  | 'conciliacao_status'
  | 'orcamento_item_status'
  | 'audiencia_indicador';

/**
 * Determina o tom (intensidade) padrão por categoria.
 * - solid: Para categorias principais (tribunais, graus, polos)
 * - soft: Para categorias de status e tipos (mais suaves visualmente)
 */
export function getSemanticBadgeTone(category: BadgeCategory, _value?: string | number | null): BadgeTone {
  // Categorias que usam soft (fundo leve, sem contorno)
  const softCategories: BadgeCategory[] = [
    'tipo_cobranca',
    'tipo_contrato',
    'captura_status',
    'status_contrato',
    'audiencia_status',
    'template_status',
    'ativo_status',
    'expediente_status',
    'document_signature_status',
    'task_status',
    'payment_status',
    'financial_alert',
    'error_type',
    'pericia_situacao',
    'parcela_status',
    'repasse_status',
    'audiencia_indicador',
  ];

  if (softCategories.includes(category)) {
    return 'soft';
  }

  // Demais categorias usam solid (padrão)
  return 'solid';
}

// =============================================================================
// MAPEAMENTO DE TRIBUNAIS
// =============================================================================

/**
 * Mapeamento de tribunais para variantes visuais.
 * Tribunais são agrupados por similaridade visual para facilitar identificação.
 *
 * Padrão: Tribunais do mesmo tipo/região compartilham variantes.
 */
export const TRIBUNAL_VARIANTS: Record<string, BadgeVisualVariant> = {
  // Tribunais Regionais do Trabalho - Alternância de cores
  TRT1: 'info',       // RJ
  TRT2: 'success',    // SP Capital
  TRT3: 'warning',    // MG
  TRT4: 'destructive',// RS
  TRT5: 'accent',     // BA
  TRT6: 'info',       // PE
  TRT7: 'success',    // CE
  TRT8: 'neutral',    // PA/AP
  TRT9: 'warning',    // PR
  TRT10: 'info',      // DF/TO
  TRT11: 'success',   // AM/RR
  TRT12: 'warning',   // SC
  TRT13: 'accent',    // PB
  TRT14: 'neutral',   // RO/AC
  TRT15: 'info',      // Campinas
  TRT16: 'success',   // MA
  TRT17: 'warning',   // ES
  TRT18: 'info',      // GO
  TRT19: 'success',   // AL
  TRT20: 'warning',   // SE
  TRT21: 'accent',    // RN
  TRT22: 'neutral',   // PI
  TRT23: 'info',      // MT
  TRT24: 'success',   // MS

  // Tribunais Superiores - Neutral/Formal
  TST: 'neutral',
  STJ: 'neutral',
  STF: 'neutral',

  // Tribunais de Justiça - Seguem padrão dos TRTs da região
  TJSP: 'success',
  TJRJ: 'info',
  TJMG: 'warning',
  TJRS: 'destructive',
  TJPR: 'warning',
  TJSC: 'warning',
  TJBA: 'accent',
  TJPE: 'info',
  TJCE: 'success',
  TJGO: 'info',
  TJDF: 'info',
  TJES: 'warning',
  TJMT: 'info',
  TJMS: 'success',
  TJPA: 'neutral',
  TJAM: 'success',
  TJMA: 'success',
  TJPI: 'neutral',
  TJPB: 'accent',
  TJRN: 'accent',
  TJSE: 'warning',
  TJAL: 'success',
  TJRO: 'neutral',
  TJAC: 'neutral',
  TJAP: 'neutral',
  TJRR: 'success',
  TJTO: 'info',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE PROCESSO
// =============================================================================

/**
 * Mapeamento de status de processo para variantes visuais.
 * Status segue semântica intuitiva: ativo=success, arquivado=neutral, etc.
 */
export const STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  // Status ativos
  ATIVO: 'success',
  EM_ANDAMENTO: 'success',
  TRAMITANDO: 'success',

  // Status de atenção
  SUSPENSO: 'warning',
  AGUARDANDO: 'warning',
  PENDENTE: 'warning',
  RECURSAL: 'warning',

  // Status finalizados
  ARQUIVADO: 'neutral',
  ENCERRADO: 'neutral',
  FINALIZADO: 'neutral',
  BAIXADO: 'neutral',

  // Status de erro/problema
  ERRO: 'destructive',
  CANCELADO: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE GRAUS DE PROCESSO
// =============================================================================

/**
 * Mapeamento de graus de jurisdição para variantes visuais.
 */
export const GRAU_VARIANTS: Record<string, BadgeVisualVariant> = {
  primeiro_grau: 'success',
  segundo_grau: 'warning',
  tribunal_superior: 'info',
  '1g': 'success',
  '2g': 'warning',
  'tst': 'info',
  'stj': 'neutral',
  'stf': 'neutral',
} as const;

// =============================================================================
// MAPEAMENTO DE TIPOS DE PARTE
// =============================================================================

/**
 * Mapeamento de tipos de parte (terceiros) para variantes visuais.
 * Agrupados por categoria funcional.
 *
 * IMPORTANTE: Os valores são normalizados pela função getSemanticBadgeVariant()
 * removendo espaços e convertendo para UPPERCASE. Por isso mapeamos tanto
 * "TERCEIRO_INTERESSADO" quanto "TERCEIROINTERESSADO" (resultado da normalização
 * de "TERCEIRO INTERESSADO" vindo do banco).
 */
export const PARTE_TIPO_VARIANTS: Record<string, BadgeVisualVariant> = {
  // Peritos - Info (azul) - técnicos especializados
  PERITO: 'info',
  PERITO_CONTADOR: 'info',
  PERITOCONTADOR: 'info', // normalizado
  PERITO_MEDICO: 'info',
  PERITOMEDICO: 'info', // normalizado

  // Ministério Público - Accent (laranja) - autoridade
  MINISTERIO_PUBLICO: 'accent',
  MINISTERIOPUBLICO: 'accent', // normalizado (com espaço no banco)
  MINISTERIO_PUBLICO_TRABALHO: 'accent',
  MINISTERIOPUBLICODOTRABALHO: 'accent', // normalizado
  MINISTERIOPUBLICOTRABALHO: 'accent', // normalizado

  // Assistentes - Success (verde) - apoio técnico
  ASSISTENTE: 'success',
  ASSISTENTE_TECNICO: 'success',
  ASSISTENTETECNICO: 'success', // normalizado

  // Testemunha - Warning (amarelo) - destaque diferenciado
  TESTEMUNHA: 'warning',

  // Terceiro Interessado - Destructive (vermelho) - parte com interesse no processo
  TERCEIRO_INTERESSADO: 'destructive',
  TERCEIROINTERESSADO: 'destructive', // normalizado (com espaço no banco)

  // Jurídicos - Neutral (cinza) - formal
  CUSTOS_LEGIS: 'neutral',
  CUSTOSLEGIS: 'neutral', // normalizado
  AMICUS_CURIAE: 'neutral',
  AMICUSCURIAE: 'neutral', // normalizado

  // Preposto - Secondary (cinza claro) - representante
  PREPOSTO: 'secondary',

  // Curadores - Secondary (cinza claro) - tutela
  CURADOR: 'secondary',
  CURADOR_ESPECIAL: 'secondary',
  CURADORESPECIAL: 'secondary', // normalizado

  // Administrativos - Neutral (cinza)
  INVENTARIANTE: 'neutral',
  ADMINISTRADOR: 'neutral',
  SINDICO: 'neutral',
  DEPOSITARIO: 'neutral',

  // Leiloeiros - Accent (laranja)
  LEILOEIRO: 'accent',
  LEILOEIRO_OFICIAL: 'accent',
  LEILEIROOFICIAL: 'accent', // normalizado

  // Outros - Default
  OUTRO: 'default',
} as const;

// =============================================================================
// MAPEAMENTO DE POLO PROCESSUAL
// =============================================================================

/**
 * Mapeamento de polo processual para variantes visuais.
 */
export const POLO_VARIANTS: Record<string, BadgeVisualVariant> = {
  ATIVO: 'info',
  PASSIVO: 'destructive',
  AUTOR: 'info',
  REU: 'destructive',
  RECLAMANTE: 'info',
  RECLAMADO: 'destructive',
  REQUERENTE: 'info',
  REQUERIDO: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE AUDIÊNCIA
// =============================================================================

/**
 * Mapeamento de status de audiência para variantes visuais.
 */
export const AUDIENCIA_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  // Códigos de status (M, F, C)
  M: 'info',        // Marcada
  F: 'success',     // Finalizada
  C: 'destructive', // Cancelada
  // Labels completas
  Marcada: 'info',
  MARCADA: 'info',
  Finalizada: 'success',
  FINALIZADA: 'success',
  Cancelada: 'destructive',
  CANCELADA: 'destructive',
  Adiada: 'warning',
  ADIADA: 'warning',
  Reagendada: 'warning',
  REAGENDADA: 'warning',
} as const;

// =============================================================================
// MAPEAMENTO DE MODALIDADE DE AUDIÊNCIA
// =============================================================================

/**
 * Mapeamento de modalidade de audiência para variantes visuais.
 */
export const AUDIENCIA_MODALIDADE_VARIANTS: Record<string, BadgeVisualVariant> = {
  Virtual: 'accent',
  VIRTUAL: 'accent',
  Presencial: 'warning',
  PRESENCIAL: 'warning',
  Hibrida: 'info',
  HIBRIDA: 'info',
  Telepresencial: 'accent',
  TELEPRESENCIAL: 'accent',
} as const;

// =============================================================================
// MAPEAMENTO DE TIPOS DE EXPEDIENTE
// =============================================================================

/**
 * Mapeamento de tipos de expediente por ID para variantes visuais.
 * Usa um ciclo de cores para tipos dinâmicos.
 */
export const EXPEDIENTE_TIPO_VARIANTS: Record<number, BadgeVisualVariant> = {
  1: 'info',
  2: 'success',
  3: 'accent',
  4: 'warning',
  5: 'neutral',
  6: 'info',
  7: 'success',
  8: 'accent',
} as const;

/**
 * Ciclo de variantes para tipos de expediente dinâmicos.
 */
const EXPEDIENTE_TIPO_CYCLE: BadgeVisualVariant[] = [
  'info',
  'success',
  'accent',
  'warning',
  'neutral',
];

/**
 * Obtém variante para tipo de expediente por ID.
 */
export function getExpedienteTipoVariant(tipoId: number | null): BadgeVisualVariant {
  if (!tipoId) return 'neutral';
  return EXPEDIENTE_TIPO_VARIANTS[tipoId] ?? EXPEDIENTE_TIPO_CYCLE[(tipoId - 1) % EXPEDIENTE_TIPO_CYCLE.length];
}

// =============================================================================
// MAPEAMENTO DE STATUS DE CAPTURA
// =============================================================================

/**
 * Mapeamento de status de captura para variantes visuais.
 */
export const CAPTURA_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  pending: 'warning',
  PENDING: 'warning',
  in_progress: 'info',
  IN_PROGRESS: 'info',
  completed: 'success',
  COMPLETED: 'success',
  failed: 'destructive',
  FAILED: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE TIPO DE CONTRATO
// =============================================================================

/**
 * Mapeamento de tipo de contrato para variantes visuais.
 * Evita repetição com status_contrato para badges na mesma linha
 */
export const TIPO_CONTRATO_VARIANTS: Record<string, BadgeVisualVariant> = {
  ajuizamento: 'accent',     // violeta (diferente de distribuído=info)
  AJUIZAMENTO: 'accent',
  defesa: 'warning',         // amarelo
  DEFESA: 'warning',
  ato_processual: 'info',    // azul
  ATO_PROCESSUAL: 'info',
  ATOPROCESSUAL: 'info',     // normalizado
  assessoria: 'success',     // verde
  ASSESSORIA: 'success',
  consultoria: 'secondary',  // cinza claro (diferente de info)
  CONSULTORIA: 'secondary',
  extrajudicial: 'neutral',  // cinza escuro
  EXTRAJUDICIAL: 'neutral',
  parecer: 'secondary',      // cinza claro
  PARECER: 'secondary',
} as const;

// =============================================================================
// MAPEAMENTO DE TIPO DE COBRANÇA
// =============================================================================

/**
 * Mapeamento de tipo de cobrança para variantes visuais.
 */
export const TIPO_COBRANCA_VARIANTS: Record<string, BadgeVisualVariant> = {
  pro_exito: 'success',
  PRO_EXITO: 'success',
  PROEXITO: 'success', // normalizado
  pro_labore: 'info',
  PRO_LABORE: 'info',
  PROLABORE: 'info', // normalizado
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE CONTRATO
// =============================================================================

/**
 * Mapeamento de status de contrato para variantes visuais.
 */
export const STATUS_CONTRATO_VARIANTS: Record<string, BadgeVisualVariant> = {
  em_contratacao: 'warning',
  EM_CONTRATACAO: 'warning',
  EMCONTRATACAO: 'warning', // normalizado
  contratado: 'success',
  CONTRATADO: 'success',
  distribuido: 'info',
  DISTRIBUIDO: 'info',
  desistencia: 'destructive',
  DESISTENCIA: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE COMUNICAÇÃO CNJ
// =============================================================================

/**
 * Mapeamento de tipos de comunicação CNJ para variantes visuais.
 */
export const COMUNICACAO_CNJ_VARIANTS: Record<string, BadgeVisualVariant> = {
  citacao: 'info',
  CITACAO: 'info',
  intimacao: 'warning',
  INTIMACAO: 'warning',
  notificacao: 'accent',
  NOTIFICACAO: 'accent',
  edital: 'neutral',
  EDITAL: 'neutral',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE FOLHA DE PAGAMENTO (RH)
// =============================================================================

/**
 * Mapeamento de status de folha de pagamento para variantes visuais.
 */
export const FOLHA_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  rascunho: 'neutral',
  RASCUNHO: 'neutral',
  aprovada: 'warning',
  APROVADA: 'warning',
  paga: 'success',
  PAGA: 'success',
  cancelada: 'destructive',
  CANCELADA: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE SALÁRIO (RH)
// =============================================================================

/**
 * Mapeamento de status de salário para variantes visuais.
 */
export const SALARIO_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  vigente: 'success',
  VIGENTE: 'success',
  ativo: 'success',
  ATIVO: 'success',
  encerrado: 'neutral',
  ENCERRADO: 'neutral',
  inativo: 'destructive',
  INATIVO: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE CHAMADAS (CHAT)
// =============================================================================

/**
 * Mapeamento de status de chamadas para variantes visuais.
 */
export const CALL_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  iniciada: 'info',
  INICIADA: 'info',
  em_andamento: 'success',
  EM_ANDAMENTO: 'success',
  finalizada: 'neutral',
  FINALIZADA: 'neutral',
  cancelada: 'destructive',
  CANCELADA: 'destructive',
  recusada: 'destructive',
  RECUSADA: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE QUALIDADE DE REDE (CHAT)
// =============================================================================

/**
 * Mapeamento de qualidade de rede para variantes visuais.
 */
export const NETWORK_QUALITY_VARIANTS: Record<string, BadgeVisualVariant> = {
  excellent: 'success',
  EXCELLENT: 'success',
  good: 'info',
  GOOD: 'info',
  poor: 'destructive',
  POOR: 'destructive',
  unknown: 'neutral',
  UNKNOWN: 'neutral',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS ONLINE (CHAT)
// =============================================================================

/**
 * Mapeamento de status de presença do usuário para variantes visuais.
 */
export const ONLINE_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  online: 'success',
  ONLINE: 'success',
  away: 'warning',
  AWAY: 'warning',
  offline: 'neutral',
  OFFLINE: 'neutral',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE OBRIGAÇÃO
// =============================================================================

/**
 * Mapeamento de status de obrigação para variantes visuais.
 */
export const OBRIGACAO_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  pendente: 'warning',
  PENDENTE: 'warning',
  pago_parcial: 'info',
  PAGO_PARCIAL: 'info',
  pago_total: 'success',
  PAGO_TOTAL: 'success',
  atrasado: 'destructive',
  ATRASADO: 'destructive',
  cancelado: 'neutral',
  CANCELADO: 'neutral',
} as const;

// =============================================================================
// MAPEAMENTO DE TIPO DE OBRIGAÇÃO
// =============================================================================

/**
 * Mapeamento de tipo de obrigação para variantes visuais.
 */
export const OBRIGACAO_TIPO_VARIANTS: Record<string, BadgeVisualVariant> = {
  acordo: 'info',
  ACORDO: 'info',
  condenacao: 'warning',
  CONDENACAO: 'warning',
  custas_processuais: 'neutral',
  CUSTAS_PROCESSUAIS: 'neutral',
} as const;

// =============================================================================
// MAPEAMENTO DE SITUAÇÃO DE PERÍCIA
// =============================================================================

/**
 * Mapeamento de situação de perícia para variantes visuais.
 * Inclui códigos de letra (F, A, C, R, P) e labels por extenso.
 */
export const PERICIA_SITUACAO_VARIANTS: Record<string, BadgeVisualVariant> = {
  F: 'success',
  A: 'info',
  C: 'destructive',
  R: 'warning',
  P: 'secondary',
  L: 'warning',
  S: 'warning',
  FINALIZADA: 'success',
  AGENDADA: 'info',
  CANCELADA: 'destructive',
  REAGENDADA: 'warning',
  PENDENTE: 'secondary',
  AGUARDANDOLAUDO: 'warning',
  AGUARDANDOESCLARECIMENTOS: 'warning',
  LAUDOJUNTADO: 'secondary',
  REDESIGNADA: 'warning',
};

// =============================================================================
// MAPEAMENTO DE STATUS DE PARCELA (OBRIGAÇÕES)
// =============================================================================

/**
 * Mapeamento de status de parcela para variantes visuais.
 * Inclui variantes lowercase e UPPERCASE.
 */
export const PARCELA_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  pendente: 'warning',
  PENDENTE: 'warning',
  paga: 'success',
  PAGA: 'success',
  recebida: 'success',
  RECEBIDA: 'success',
  vencida: 'destructive',
  VENCIDA: 'destructive',
  atrasado: 'destructive',
  ATRASADO: 'destructive',
  cancelada: 'neutral',
  CANCELADA: 'neutral',
};

// =============================================================================
// MAPEAMENTO DE STATUS DE REPASSE (OBRIGAÇÕES)
// =============================================================================

/**
 * Mapeamento de status de repasse para variantes visuais.
 * Inclui variantes com underscore, UPPERCASE e sem underscore (normalizado).
 */
export const REPASSE_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  nao_aplicavel: 'neutral',
  NAO_APLICAVEL: 'neutral',
  NAOAPLICAVEL: 'neutral',
  pendente_declaracao: 'warning',
  PENDENTE_DECLARACAO: 'warning',
  PENDENTEDECLARACAO: 'warning',
  pendente_transferencia: 'info',
  PENDENTE_TRANSFERENCIA: 'info',
  PENDENTETRANSFERENCIA: 'info',
  realizado: 'success',
  REALIZADO: 'success',
  repassado: 'success',
  REPASSADO: 'success',
};

// =============================================================================
// MAPEAMENTO DE DIREÇÃO DE PAGAMENTO
// =============================================================================

/**
 * Mapeamento de direção de pagamento para variantes visuais.
 */
export const OBRIGACAO_DIRECAO_VARIANTS: Record<string, BadgeVisualVariant> = {
  recebimento: 'success',
  RECEBIMENTO: 'success',
  pagamento: 'destructive',
  PAGAMENTO: 'destructive',
} as const;

// =============================================================================
// FUNÇÃO PRINCIPAL DE MAPEAMENTO
// =============================================================================

/**
 * Obtém a variante visual semântica para um badge.
 *
 * @param category - A categoria semântica (tribunal, status, parte, etc.)
 * @param key - O valor a ser mapeado (ex: 'TRT1', 'ATIVO', 'PERITO')
 * @returns A variante visual correspondente
 *
 * @example
 * // Uso correto:
 * <Badge variant={getSemanticBadgeVariant('tribunal', 'TRT1')}>TRT1</Badge>
 * <Badge variant={getSemanticBadgeVariant('status', 'ATIVO')}>Ativo</Badge>
 * <Badge variant={getSemanticBadgeVariant('audiencia_status', 'Marcada')}>Marcada</Badge>
 */

// =============================================================================
// MAPEAMENTO DE INDICADORES DE AUDIÊNCIA
// =============================================================================

/**
 * Mapeamento de indicadores booleanos de audiência para variantes visuais.
 * Usados em badges de indicadores (segredo de justiça, juízo digital, etc.)
 */
export const AUDIENCIA_INDICADOR_VARIANTS: Record<string, BadgeVisualVariant> = {
  segredo_justica: 'warning',
  juizo_digital: 'info',
  designada: 'success',
  documento_ativo: 'info',
  litisconsorcio: 'neutral',
  presenca_hibrida: 'accent',
};

export function getSemanticBadgeVariant(
  category: BadgeCategory,
  key: string | number | null | undefined
): BadgeVisualVariant {
  if (key === null || key === undefined) {
    return 'neutral';
  }

  const normalizedKey = typeof key === 'string'
    ? key.replace(/\s+/g, '').toUpperCase()
    : key;

  switch (category) {
    case 'tribunal':
      return TRIBUNAL_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'status':
      return STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'grau':
      return GRAU_VARIANTS[typeof key === 'string' ? key.toLowerCase() : key] ?? 'neutral';

    case 'parte':
      return PARTE_TIPO_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'polo':
      return POLO_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'audiencia_status':
      return AUDIENCIA_STATUS_VARIANTS[key as string] ??
        AUDIENCIA_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'audiencia_modalidade':
      return AUDIENCIA_MODALIDADE_VARIANTS[key as string] ??
        AUDIENCIA_MODALIDADE_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'expediente_tipo':
      return getExpedienteTipoVariant(typeof key === 'number' ? key : parseInt(key as string, 10) || null);

    case 'captura_status':
      return CAPTURA_STATUS_VARIANTS[key as string] ??
        CAPTURA_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'tipo_contrato':
      return TIPO_CONTRATO_VARIANTS[key as string] ??
        TIPO_CONTRATO_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'tipo_cobranca':
      return TIPO_COBRANCA_VARIANTS[key as string] ??
        TIPO_COBRANCA_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'status_contrato':
      return STATUS_CONTRATO_VARIANTS[key as string] ??
        STATUS_CONTRATO_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'folha_status':
      return FOLHA_STATUS_VARIANTS[key as string] ??
        FOLHA_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'salario_status':
      return SALARIO_STATUS_VARIANTS[key as string] ??
        SALARIO_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'call_status':
      return CALL_STATUS_VARIANTS[key as string] ??
        CALL_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'network_quality':
      return NETWORK_QUALITY_VARIANTS[key as string] ??
        NETWORK_QUALITY_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'online_status':
      return ONLINE_STATUS_VARIANTS[key as string] ??
        ONLINE_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'obrigacao_status':
      return OBRIGACAO_STATUS_VARIANTS[key as string] ??
        OBRIGACAO_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'obrigacao_tipo':
      return OBRIGACAO_TIPO_VARIANTS[key as string] ??
        OBRIGACAO_TIPO_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'obrigacao_direcao':
      return OBRIGACAO_DIRECAO_VARIANTS[key as string] ??
        OBRIGACAO_DIRECAO_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'pericia_situacao':
      return PERICIA_SITUACAO_VARIANTS[key as string] ??
        PERICIA_SITUACAO_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'parcela_status':
      return PARCELA_STATUS_VARIANTS[key as string] ??
        PARCELA_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'repasse_status':
      return REPASSE_STATUS_VARIANTS[key as string] ??
        REPASSE_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'expediente_status':
      return EXPEDIENTE_STATUS_VARIANTS[key as string] ??
        EXPEDIENTE_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'template_status':
      return TEMPLATE_STATUS_VARIANTS[key as string] ??
        TEMPLATE_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'ativo_status':
      return ATIVO_STATUS_VARIANTS[key as string] ??
        ATIVO_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'document_signature_status':
      return DOCUMENT_SIGNATURE_STATUS_VARIANTS[key as string] ??
        DOCUMENT_SIGNATURE_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'project_status':
      return PROJECT_STATUS_VARIANTS[key as string] ??
        PROJECT_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'task_status':
      return TASK_STATUS_VARIANTS[key as string] ??
        TASK_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'priority':
      return PRIORITY_VARIANTS[key as string] ??
        PRIORITY_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'payment_status':
      return PAYMENT_STATUS_VARIANTS[key as string] ??
        PAYMENT_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'financial_alert':
      return FINANCIAL_ALERT_VARIANTS[key as string] ??
        FINANCIAL_ALERT_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'error_type':
      return ERROR_TYPE_VARIANTS[key as string] ??
        ERROR_TYPE_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'orcamento_status':
      return ORCAMENTO_STATUS_VARIANTS[key as string] ??
        ORCAMENTO_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'tipo_conta_contabil':
      return TIPO_CONTA_CONTABIL_VARIANTS[key as string] ??
        TIPO_CONTA_CONTABIL_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'conciliacao_status':
      return CONCILIACAO_STATUS_VARIANTS[key as string] ??
        CONCILIACAO_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'orcamento_item_status':
      return ORCAMENTO_ITEM_STATUS_VARIANTS[key as string] ??
        ORCAMENTO_ITEM_STATUS_VARIANTS[normalizedKey as string] ?? 'neutral';

    case 'audiencia_indicador':
      return AUDIENCIA_INDICADOR_VARIANTS[key as string] ??
        AUDIENCIA_INDICADOR_VARIANTS[normalizedKey as string] ?? 'neutral';

    default:
      return 'neutral';
  }
}

// =============================================================================
// MAPEAMENTO DE STATUS DE TEMPLATE (ASSINATURA DIGITAL)
// =============================================================================

/**
 * Mapeamento de status de template para variantes visuais.
 */
export const TEMPLATE_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  ativo: 'success',
  ATIVO: 'success',
  inativo: 'destructive',
  INATIVO: 'destructive',
  rascunho: 'neutral',
  RASCUNHO: 'neutral',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS ATIVO/INATIVO (BOOLEANO)
// =============================================================================

/**
 * Mapeamento de status ativo (booleano) para variantes visuais.
 * Usado em templates e outros contextos onde o status é true/false.
 */
export const ATIVO_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  true: 'success',
  TRUE: 'success',
  false: 'neutral',
  FALSE: 'neutral',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE EXPEDIENTE
// =============================================================================

/**
 * Mapeamento de status de expediente para variantes visuais.
 * Usado em expediente-detalhes-dialog e outros contextos de expedientes.
 */
export const EXPEDIENTE_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  pendente: 'warning',
  PENDENTE: 'warning',
  baixado: 'neutral',
  BAIXADO: 'neutral',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE ASSINATURA DIGITAL
// =============================================================================

export const DOCUMENT_SIGNATURE_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  rascunho: 'neutral',
  RASCUNHO: 'neutral',
  pronto: 'info',
  PRONTO: 'info',
  enviado: 'info',
  ENVIADO: 'info',
  concluido: 'success',
  CONCLUIDO: 'success',
  cancelado: 'destructive',
  CANCELADO: 'destructive',
  expirado: 'warning',
  EXPIRADO: 'warning',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE PROJETO (PROJECT MANAGEMENT)
// =============================================================================

export const PROJECT_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  planejamento: 'neutral',
  PLANEJAMENTO: 'neutral',
  ativo: 'success',
  ATIVO: 'success',
  em_andamento: 'success',
  EM_ANDAMENTO: 'success',
  EMANDAMENTO: 'success',
  pausado: 'warning',
  PAUSADO: 'warning',
  concluido: 'info',
  CONCLUIDO: 'info',
  cancelado: 'destructive',
  CANCELADO: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE TAREFA (PROJECT MANAGEMENT)
// =============================================================================

export const TASK_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  a_fazer: 'neutral',
  A_FAZER: 'neutral',
  AFAZER: 'neutral',
  em_progresso: 'info',
  EM_PROGRESSO: 'info',
  EMPROGRESSO: 'info',
  em_revisao: 'warning',
  EM_REVISAO: 'warning',
  EMREVISAO: 'warning',
  concluida: 'success',
  CONCLUIDA: 'success',
  cancelada: 'destructive',
  CANCELADA: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE PRIORIDADE
// =============================================================================

export const PRIORITY_VARIANTS: Record<string, BadgeVisualVariant> = {
  baixa: 'neutral',
  BAIXA: 'neutral',
  media: 'info',
  MEDIA: 'info',
  alta: 'warning',
  ALTA: 'warning',
  urgente: 'destructive',
  URGENTE: 'destructive',
  critica: 'destructive',
  CRITICA: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE PAGAMENTO (FINANCEIRO)
// =============================================================================

export const PAYMENT_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  pago: 'success',
  PAGO: 'success',
  recebido: 'success',
  RECEBIDO: 'success',
  confirmado: 'success',
  CONFIRMADO: 'success',
  pendente: 'warning',
  PENDENTE: 'warning',
  atrasado: 'destructive',
  ATRASADO: 'destructive',
  vencido: 'destructive',
  VENCIDO: 'destructive',
  parcial: 'info',
  PARCIAL: 'info',
  cancelado: 'neutral',
  CANCELADO: 'neutral',
  estornado: 'secondary',
  ESTORNADO: 'secondary',
} as const;

// =============================================================================
// MAPEAMENTO DE ALERTA FINANCEIRO
// =============================================================================

export const FINANCIAL_ALERT_VARIANTS: Record<string, BadgeVisualVariant> = {
  danger: 'destructive',
  DANGER: 'destructive',
  warning: 'warning',
  WARNING: 'warning',
  info: 'info',
  INFO: 'info',
  success: 'success',
  SUCCESS: 'success',
} as const;

// =============================================================================
// MAPEAMENTO DE TIPO DE ERRO
// =============================================================================

export const ERROR_TYPE_VARIANTS: Record<string, BadgeVisualVariant> = {
  timeout: 'warning',
  TIMEOUT: 'warning',
  auth: 'destructive',
  AUTH: 'destructive',
  network: 'warning',
  NETWORK: 'warning',
  validation: 'info',
  VALIDATION: 'info',
  unknown: 'neutral',
  UNKNOWN: 'neutral',
} as const;

// =============================================================================
// LABELS SEMÂNTICOS
// =============================================================================

/**
 * Labels amigáveis para tipos de parte.
 * Inclui versões normalizadas (sem underscore/espaço) para compatibilidade
 * com valores vindos do banco.
 */
export const PARTE_TIPO_LABELS: Record<string, string> = {
  // Peritos
  PERITO: 'Perito',
  PERITO_CONTADOR: 'Perito Contador',
  PERITOCONTADOR: 'Perito Contador',
  PERITO_MEDICO: 'Perito Médico',
  PERITOMEDICO: 'Perito Médico',

  // Ministério Público
  MINISTERIO_PUBLICO: 'Ministério Público',
  MINISTERIOPUBLICO: 'Ministério Público',
  MINISTERIO_PUBLICO_TRABALHO: 'MP do Trabalho',
  MINISTERIOPUBLICODOTRABALHO: 'MP do Trabalho',
  MINISTERIOPUBLICOTRABALHO: 'MP do Trabalho',

  // Assistentes
  ASSISTENTE: 'Assistente',
  ASSISTENTE_TECNICO: 'Assistente Técnico',
  ASSISTENTETECNICO: 'Assistente Técnico',

  // Testemunha
  TESTEMUNHA: 'Testemunha',

  // Terceiro Interessado
  TERCEIRO_INTERESSADO: 'Terceiro Interessado',
  TERCEIROINTERESSADO: 'Terceiro Interessado',

  // Jurídicos
  CUSTOS_LEGIS: 'Custos Legis',
  CUSTOSLEGIS: 'Custos Legis',
  AMICUS_CURIAE: 'Amicus Curiae',
  AMICUSCURIAE: 'Amicus Curiae',

  // Representantes
  PREPOSTO: 'Preposto',
  CURADOR: 'Curador',
  CURADOR_ESPECIAL: 'Curador Especial',
  CURADORESPECIAL: 'Curador Especial',

  // Administrativos
  INVENTARIANTE: 'Inventariante',
  ADMINISTRADOR: 'Administrador',
  SINDICO: 'Síndico',
  DEPOSITARIO: 'Depositário',

  // Leiloeiros
  LEILOEIRO: 'Leiloeiro',
  LEILOEIRO_OFICIAL: 'Leiloeiro Oficial',
  LEILEIROOFICIAL: 'Leiloeiro Oficial',

  // Outros
  OUTRO: 'Outro',
} as const;

/**
 * Labels amigáveis para graus de processo.
 */
export const GRAU_LABELS: Record<string, string> = {
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  tribunal_superior: 'Tribunal Superior',
} as const;

/**
 * Labels amigáveis para status de captura.
 */
export const CAPTURA_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluida',
  failed: 'Falhou',
} as const;

/**
 * Obtém o label amigável para um tipo de parte.
 */
export function getParteTipoLabel(tipoParte: string): string {
  if (!tipoParte) return '';
  const normalized = tipoParte.toUpperCase().replace(/\s+/g, '_');
  return PARTE_TIPO_LABELS[normalized] ?? tipoParte
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// MAPEAMENTO DE STATUS DE ORÇAMENTO (FINANCEIRO)
// =============================================================================

export const ORCAMENTO_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  rascunho: 'secondary',
  RASCUNHO: 'secondary',
  aprovado: 'info',
  APROVADO: 'info',
  em_execucao: 'success',
  EM_EXECUCAO: 'success',
  EMEXECUCAO: 'success',
  encerrado: 'neutral',
  ENCERRADO: 'neutral',
  cancelado: 'destructive',
  CANCELADO: 'destructive',
} as const;

// =============================================================================
// MAPEAMENTO DE TIPO DE CONTA CONTÁBIL (PLANO DE CONTAS)
// =============================================================================

export const TIPO_CONTA_CONTABIL_VARIANTS: Record<string, BadgeVisualVariant> = {
  ativo: 'info',
  ATIVO: 'info',
  passivo: 'destructive',
  PASSIVO: 'destructive',
  receita: 'success',
  RECEITA: 'success',
  despesa: 'warning',
  DESPESA: 'warning',
  patrimonio_liquido: 'default',
  PATRIMONIO_LIQUIDO: 'default',
  PATRIMONIOLIQUIDO: 'default',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE CONCILIAÇÃO BANCÁRIA
// =============================================================================

export const CONCILIACAO_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  pendente: 'warning',
  PENDENTE: 'warning',
  conciliado: 'success',
  CONCILIADO: 'success',
  divergente: 'destructive',
  DIVERGENTE: 'destructive',
  ignorado: 'neutral',
  IGNORADO: 'neutral',
} as const;

// =============================================================================
// MAPEAMENTO DE STATUS DE ITEM DE ORÇAMENTO
// =============================================================================

export const ORCAMENTO_ITEM_STATUS_VARIANTS: Record<string, BadgeVisualVariant> = {
  dentro_orcamento: 'success',
  DENTRO_ORCAMENTO: 'success',
  DENTROORCAMENTO: 'success',
  atencao: 'warning',
  ATENCAO: 'warning',
  estourado: 'destructive',
  ESTOURADO: 'destructive',
} as const;

// =============================================================================
// EXPORTS AGRUPADOS
// =============================================================================

export const VARIANTS = {
  tribunal: TRIBUNAL_VARIANTS,
  status: STATUS_VARIANTS,
  grau: GRAU_VARIANTS,
  parte: PARTE_TIPO_VARIANTS,
  polo: POLO_VARIANTS,
  audienciaStatus: AUDIENCIA_STATUS_VARIANTS,
  audienciaModalidade: AUDIENCIA_MODALIDADE_VARIANTS,
  expedienteTipo: EXPEDIENTE_TIPO_VARIANTS,
  capturaStatus: CAPTURA_STATUS_VARIANTS,
  comunicacaoCnj: COMUNICACAO_CNJ_VARIANTS,
  tipoContrato: TIPO_CONTRATO_VARIANTS,
  tipoCobranca: TIPO_COBRANCA_VARIANTS,
  statusContrato: STATUS_CONTRATO_VARIANTS,
  folhaStatus: FOLHA_STATUS_VARIANTS,
  salarioStatus: SALARIO_STATUS_VARIANTS,
  callStatus: CALL_STATUS_VARIANTS,
  networkQuality: NETWORK_QUALITY_VARIANTS,
  onlineStatus: ONLINE_STATUS_VARIANTS,
  obrigacaoStatus: OBRIGACAO_STATUS_VARIANTS,
  obrigacaoTipo: OBRIGACAO_TIPO_VARIANTS,
  obrigacaoDirecao: OBRIGACAO_DIRECAO_VARIANTS,
  periciaSituacao: PERICIA_SITUACAO_VARIANTS,
  parcelaStatus: PARCELA_STATUS_VARIANTS,
  repasseStatus: REPASSE_STATUS_VARIANTS,
  templateStatus: TEMPLATE_STATUS_VARIANTS,
  ativoStatus: ATIVO_STATUS_VARIANTS,
  expedienteStatus: EXPEDIENTE_STATUS_VARIANTS,
  documentSignatureStatus: DOCUMENT_SIGNATURE_STATUS_VARIANTS,
  projectStatus: PROJECT_STATUS_VARIANTS,
  taskStatus: TASK_STATUS_VARIANTS,
  priority: PRIORITY_VARIANTS,
  paymentStatus: PAYMENT_STATUS_VARIANTS,
  financialAlert: FINANCIAL_ALERT_VARIANTS,
  errorType: ERROR_TYPE_VARIANTS,
  orcamentoStatus: ORCAMENTO_STATUS_VARIANTS,
  tipoContaContabil: TIPO_CONTA_CONTABIL_VARIANTS,
  conciliacaoStatus: CONCILIACAO_STATUS_VARIANTS,
  orcamentoItemStatus: ORCAMENTO_ITEM_STATUS_VARIANTS,
} as const;

export const LABELS = {
  parte: PARTE_TIPO_LABELS,
  grau: GRAU_LABELS,
  capturaStatus: CAPTURA_STATUS_LABELS,
} as const;
