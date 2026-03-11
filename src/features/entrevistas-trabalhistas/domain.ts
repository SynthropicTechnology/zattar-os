/**
 * ENTREVISTAS TRABALHISTAS - Tipos e Schemas de Validação
 *
 * Ficha de entrevista de investigação trabalhista vinculada ao contrato.
 * Suporta bifurcação por tipo de litígio com módulos específicos por trilha.
 *
 * TRILHAS:
 * A. Trabalhista Clássico (vinculo → jornada → saude_ambiente → ruptura)
 * B. Gig Economy (controle_algoritmico → dependencia_economica → condicoes_trabalho_gig → desligamento_plataforma)
 * C. Pejotização (contrato_pj → subordinacao_real → exclusividade_pessoalidade → fraude_verbas)
 *
 * CONVENÇÕES:
 * - Prefixar schemas de criação com "create" (ex: createEntrevistaSchema)
 * - Interfaces espelham estrutura do banco em camelCase
 */

import { z } from 'zod';

// =============================================================================
// TIPOS BASE (ENUMS)
// =============================================================================

export type TipoLitigio = 'trabalhista_classico' | 'gig_economy' | 'pejotizacao';

export type StatusEntrevista = 'rascunho' | 'em_andamento' | 'concluida';

export type PerfilReclamante =
  // Clássico
  | 'domestica'
  | 'comerciario'
  | 'industrial'
  | 'rural'
  | 'escritorio'
  // Gig Economy
  | 'motorista_app'
  | 'entregador'
  | 'prestador_servicos_app'
  // Pejotização
  | 'profissional_ti'
  | 'profissional_saude'
  | 'vendedor_pj'
  | 'consultor_pj'
  // Genérico
  | 'outro';

export type ModuloEntrevista =
  | 'no_zero'
  // Trilha A: Clássico
  | 'vinculo'
  | 'jornada'
  | 'saude_ambiente'
  | 'ruptura'
  // Trilha B: Gig Economy
  | 'controle_algoritmico'
  | 'dependencia_economica'
  | 'condicoes_trabalho_gig'
  | 'desligamento_plataforma'
  // Trilha C: Pejotização
  | 'contrato_pj'
  | 'subordinacao_real'
  | 'exclusividade_pessoalidade'
  | 'fraude_verbas'
  | 'consolidacao_final';

export interface RespostasConsolidacaoFinal {
  relato_completo_texto?: string;
  observacoes_finais?: string;
  relato_consolidado_ia?: string;
  inconsistencias_ia?: string[];
  justificativas_inconsistencias?: Record<string, string>;
}

// =============================================================================
// TIPOS: Respostas por Módulo (Trilha A — Clássico)
// =============================================================================

export type CtpsAssinada = 'sim_ok' | 'sim_atrasada' | 'nao_informal' | 'obrigado_mei';

export type ControlePonto = 'eletronico' | 'manual' | 'nenhum' | 'britanico';

export type TipoRisco = 'ruido' | 'calor' | 'quimico' | 'biologico' | 'inflamavel' | 'eletricidade';

export type MotivoRuptura =
  | 'demissao_sem_justa_causa'
  | 'pedido_demissao'
  | 'justa_causa'
  | 'empresa_faliu'
  | 'rescisao_indireta';

export type VerbaRecebida = 'tudo' | 'parcial_acordo' | 'nada' | 'fgts_nao_depositado';

export interface RespostasVinculo {
  ctps_assinada?: CtpsAssinada;
  funcao_cargo?: string;
  remuneracao_mensal?: string;
  data_admissao?: string;
  narrativa_subordinacao?: string;
}

export interface RespostasJornada {
  controle_ponto?: ControlePonto[];
  horario_entrada?: string;
  horario_saida?: string;
  intervalo_concedido?: boolean;
  minutos_intervalo_real?: number;
  horas_extras_pagas?: boolean;
  banco_horas_compensado?: boolean;
  narrativa_dia_tipico?: string;
}

export interface RespostasSaudeAmbiente {
  exposicao_riscos?: boolean;
  tipos_risco?: TipoRisco[];
  descricao_risco?: string;
  assedio_moral?: boolean;
  relato_assedio?: string;
  testemunhas_assedio?: string;
}

export interface RespostasRuptura {
  motivo?: MotivoRuptura;
  data_demissao?: string;
  verbas_recebidas?: VerbaRecebida[];
}

export interface RespostasClassico {
  vinculo?: RespostasVinculo;
  jornada?: RespostasJornada;
  saude_ambiente?: RespostasSaudeAmbiente;
  ruptura?: RespostasRuptura;
  consolidacao_final?: RespostasConsolidacaoFinal;
}

// =============================================================================
// TIPOS: Respostas por Módulo (Trilha B — Gig Economy)
// =============================================================================

export type TipoPlataforma = 'transporte' | 'entrega' | 'servicos_gerais' | 'outro';

export type RecusaConsequencia = 'sem_punicao' | 'perde_pontuacao' | 'pode_ser_bloqueado';

export type PercentualRenda = 'menos_25' | '25_50' | '50_75' | 'mais_75' | 'unica_renda';

export type QtdPlataformas = 'uma' | 'duas_tres' | 'quatro_mais';

export type FaixaHorasDia = 'ate_8' | '8_10' | '10_12' | 'mais_12';

export type DiasSemana = '5' | '6' | '7';

export type FormaDesligamento = 'bloqueio_definitivo' | 'bloqueio_temporario' | 'conta_desativada' | 'saiu_voluntariamente';

export type TempoPlataforma = 'menos_6m' | '6m_1a' | '1a_2a' | 'mais_2a';

/** B.1 — Controle Algorítmico: como a plataforma controla o trabalhador */
export interface RespostasControleAlgoritmico {
  tipo_plataforma?: TipoPlataforma;
  nome_plataforma?: string;
  renda_mensal_media?: string;
  data_inicio_plataforma?: string;
  plataforma_define_preco?: boolean;
  pode_recusar_corrida?: RecusaConsequencia;
  sistema_avaliacao?: boolean;
  punido_nota_baixa?: boolean;
  tipo_punicao?: string;
  monitoramento_gps?: boolean;
  meta_aceitacao_minima?: boolean;
  narrativa_controle?: string;
}

/** B.2 — Dependência Econômica: nível de dependência financeira da plataforma */
export interface RespostasDependenciaEconomica {
  percentual_renda?: PercentualRenda;
  qtd_plataformas?: QtdPlataformas;
  investimento_especifico?: boolean;
  descricao_investimento?: string;
  unica_fonte_renda?: boolean;
  clausula_exclusividade?: boolean;
}

/** B.3 — Condições de Trabalho: jornada, segurança e dignidade */
export interface RespostasCondicoesTrabalhoGig {
  horas_dia?: FaixaHorasDia;
  dias_semana?: DiasSemana;
  acesso_banheiro_descanso?: boolean;
  sofreu_acidente?: boolean;
  plataforma_assistiu_acidente?: boolean;
  plataforma_fornece_epi?: boolean;
  possui_seguro?: boolean;
  narrativa_condicoes?: string;
}

/** B.4 — Desligamento: como foi a "demissão" pela plataforma */
export interface RespostasDesligamentoPlataforma {
  forma_desligamento?: FormaDesligamento;
  data_fim_plataforma?: string;
  aviso_previo?: boolean;
  direito_defesa?: boolean;
  motivo_informado?: string;
  saldo_retido?: boolean;
  valor_retido_aproximado?: string;
  tempo_plataforma?: TempoPlataforma;
}

export interface RespostasGig {
  controle_algoritmico?: RespostasControleAlgoritmico;
  dependencia_economica?: RespostasDependenciaEconomica;
  condicoes_trabalho_gig?: RespostasCondicoesTrabalhoGig;
  desligamento_plataforma?: RespostasDesligamentoPlataforma;
  consolidacao_final?: RespostasConsolidacaoFinal;
}

// =============================================================================
// TIPOS: Respostas por Módulo (Trilha C — Pejotização)
// =============================================================================

export type OrigemPJ = 'empresa_obrigou' | 'empresa_sugeriu' | 'decisao_propria' | 'contador_sugeriu';

export type TipoPJ = 'mei' | 'simples_nacional' | 'lucro_presumido' | 'outro';

export type ValorPagamento = 'fixo' | 'variavel' | 'misto';

export type LocalTrabalho = 'empresa_exclusivamente' | 'empresa_parcialmente' | 'remoto' | 'hibrido';

export type ProibicaoOutrosClientes = 'sim_expressamente' | 'sim_implicitamente' | 'nao';

export type DuracaoRelacao = 'menos_6m' | '6m_1a' | '1a_3a' | 'mais_3a';

export type RegimeFerias = 'nao_tirava' | 'tirava_sem_pagamento' | 'tirava_com_pagamento_parcial' | 'tirava_normalmente';

export type BeneficioRecebido = 'vt' | 'va' | 'vr' | 'plano_saude' | 'plano_odonto' | 'nenhum';

/** C.1 — Contrato PJ: como a relação PJ foi constituída */
export interface RespostasContratoPJ {
  origem_pj?: OrigemPJ;
  tipo_pj?: TipoPJ;
  data_inicio_pj?: string;
  data_fim_pj?: string;
  remuneracao_liquida_mensal?: string;
  contrato_formal?: boolean;
  empresa_paga_custos_cnpj?: boolean;
  emissao_nf_mensal?: boolean;
  tipo_pagamento?: ValorPagamento;
  valor_mensal_aproximado?: string;
}

/** C.2 — Subordinação Real: se havia controle típico de emprego */
export interface RespostasSubordinacaoReal {
  cumpre_horario_fixo?: boolean;
  recebe_ordens_superior?: boolean;
  reunioes_obrigatorias?: boolean;
  pede_autorizacao_falta?: boolean;
  usa_cracha_email_uniforme?: boolean;
  local_trabalho?: LocalTrabalho;
  narrativa_rotina?: string;
}

/** C.3 — Exclusividade e Pessoalidade: indícios de vínculo */
export interface RespostasExclusividadePessoalidade {
  atende_exclusivamente?: boolean;
  pode_enviar_substituto?: boolean;
  proibicao_outros_clientes?: ProibicaoOutrosClientes;
  liberdade_recusar_tarefas?: boolean;
  duracao_relacao?: DuracaoRelacao;
}

/** C.4 — Fraude nas Verbas: prejuízos ao trabalhador */
export interface RespostasFraudeVerbas {
  valor_mensal_fixo?: boolean;
  valor_aproximado?: string;
  beneficios_recebidos?: BeneficioRecebido[];
  decimo_terceiro_disfarado?: boolean;
  regime_ferias?: RegimeFerias;
  recebeu_verbas_rescisao?: boolean;
  controle_como_clt?: boolean;
}

export interface RespostasPejotizacao {
  contrato_pj?: RespostasContratoPJ;
  subordinacao_real?: RespostasSubordinacaoReal;
  exclusividade_pessoalidade?: RespostasExclusividadePessoalidade;
  fraude_verbas?: RespostasFraudeVerbas;
  consolidacao_final?: RespostasConsolidacaoFinal;
}

// =============================================================================
// TIPO UNIFICADO DE RESPOSTAS (interseção — cada trilha usa apenas suas chaves)
// =============================================================================

export type RespostasEntrevista = RespostasClassico & RespostasGig & RespostasPejotizacao;

// =============================================================================
// ENTIDADES PRINCIPAIS
// =============================================================================

export interface EntrevistaTrabalhista {
  id: number;
  contratoId: number;
  tipoLitigio: TipoLitigio;
  perfilReclamante: string | null;
  status: StatusEntrevista;
  moduloAtual: string;
  respostas: RespostasEntrevista;
  notasOperador: Record<string, string> | null;
  testemunhasMapeadas: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntrevistaAnexo {
  id: number;
  entrevistaId: number;
  modulo: string;
  noReferencia: string | null;
  tipoAnexo: string;
  arquivoUrl: string;
  descricao: string | null;
  createdAt: string;
}

// =============================================================================
// ZOD SCHEMAS — Enums
// =============================================================================

export const tipoLitigioSchema = z.enum([
  'trabalhista_classico',
  'gig_economy',
  'pejotizacao',
]);

export const statusEntrevistaSchema = z.enum([
  'rascunho',
  'em_andamento',
  'concluida',
]);

export const perfilReclamanteSchema = z.enum([
  'domestica',
  'comerciario',
  'industrial',
  'rural',
  'escritorio',
  'motorista_app',
  'entregador',
  'prestador_servicos_app',
  'profissional_ti',
  'profissional_saude',
  'vendedor_pj',
  'consultor_pj',
  'outro',
]);

export const moduloEntrevistaSchema = z.enum([
  'no_zero',
  'vinculo',
  'jornada',
  'saude_ambiente',
  'ruptura',
  'controle_algoritmico',
  'dependencia_economica',
  'condicoes_trabalho_gig',
  'desligamento_plataforma',
  'contrato_pj',
  'subordinacao_real',
  'exclusividade_pessoalidade',
  'fraude_verbas',
  'consolidacao_final',
]);

// =============================================================================
// ZOD SCHEMAS — Respostas por Módulo (Trilha A — Clássico)
// =============================================================================

export const respostasVinculoSchema = z.object({
  ctps_assinada: z.enum(['sim_ok', 'sim_atrasada', 'nao_informal', 'obrigado_mei']).optional(),
  funcao_cargo: z.string().max(200).optional(),
  remuneracao_mensal: z.string().max(200).optional(),
  data_admissao: z.string().optional(),
  narrativa_subordinacao: z.string().max(5000).optional(),
});

export const respostasJornadaSchema = z.object({
  controle_ponto: z.array(z.enum(['eletronico', 'manual', 'nenhum', 'britanico'])).optional(),
  horario_entrada: z.string().max(10).optional(),
  horario_saida: z.string().max(10).optional(),
  intervalo_concedido: z.boolean().optional(),
  minutos_intervalo_real: z.number().int().min(0).max(480).optional(),
  horas_extras_pagas: z.boolean().optional(),
  banco_horas_compensado: z.boolean().optional(),
  narrativa_dia_tipico: z.string().max(10000).optional(),
});

export const respostasSaudeAmbienteSchema = z.object({
  exposicao_riscos: z.boolean().optional(),
  tipos_risco: z.array(z.enum(['ruido', 'calor', 'quimico', 'biologico', 'inflamavel', 'eletricidade'])).optional(),
  descricao_risco: z.string().max(5000).optional(),
  assedio_moral: z.boolean().optional(),
  relato_assedio: z.string().max(10000).optional(),
  testemunhas_assedio: z.string().max(5000).optional(),
});

export const respostasRupturaSchema = z.object({
  motivo: z.enum([
    'demissao_sem_justa_causa',
    'pedido_demissao',
    'justa_causa',
    'empresa_faliu',
    'rescisao_indireta',
  ]).optional(),
  data_demissao: z.string().optional(),
  verbas_recebidas: z.array(z.enum(['tudo', 'parcial_acordo', 'nada', 'fgts_nao_depositado'])).optional(),
});

export const respostasClassicoSchema = z.object({
  vinculo: respostasVinculoSchema.optional(),
  jornada: respostasJornadaSchema.optional(),
  saude_ambiente: respostasSaudeAmbienteSchema.optional(),
  ruptura: respostasRupturaSchema.optional(),
});

// =============================================================================
// ZOD SCHEMAS — Respostas por Módulo (Trilha B — Gig Economy)
// =============================================================================

export const respostasControleAlgoritmicoSchema = z.object({
  tipo_plataforma: z.enum(['transporte', 'entrega', 'servicos_gerais', 'outro']).optional(),
  nome_plataforma: z.string().max(200).optional(),
  renda_mensal_media: z.string().max(200).optional(),
  data_inicio_plataforma: z.string().optional(),
  plataforma_define_preco: z.boolean().optional(),
  pode_recusar_corrida: z.enum(['sem_punicao', 'perde_pontuacao', 'pode_ser_bloqueado']).optional(),
  sistema_avaliacao: z.boolean().optional(),
  punido_nota_baixa: z.boolean().optional(),
  tipo_punicao: z.string().max(2000).optional(),
  monitoramento_gps: z.boolean().optional(),
  meta_aceitacao_minima: z.boolean().optional(),
  narrativa_controle: z.string().max(10000).optional(),
});

export const respostasDependenciaEconomicaSchema = z.object({
  percentual_renda: z.enum(['menos_25', '25_50', '50_75', 'mais_75', 'unica_renda']).optional(),
  qtd_plataformas: z.enum(['uma', 'duas_tres', 'quatro_mais']).optional(),
  investimento_especifico: z.boolean().optional(),
  descricao_investimento: z.string().max(2000).optional(),
  unica_fonte_renda: z.boolean().optional(),
  clausula_exclusividade: z.boolean().optional(),
});

export const respostasCondicoesTrabalhoGigSchema = z.object({
  horas_dia: z.enum(['ate_8', '8_10', '10_12', 'mais_12']).optional(),
  dias_semana: z.enum(['5', '6', '7']).optional(),
  acesso_banheiro_descanso: z.boolean().optional(),
  sofreu_acidente: z.boolean().optional(),
  plataforma_assistiu_acidente: z.boolean().optional(),
  plataforma_fornece_epi: z.boolean().optional(),
  possui_seguro: z.boolean().optional(),
  narrativa_condicoes: z.string().max(10000).optional(),
});

export const respostasDesligamentoPlataformaSchema = z.object({
  forma_desligamento: z.enum(['bloqueio_definitivo', 'bloqueio_temporario', 'conta_desativada', 'saiu_voluntariamente']).optional(),
  data_fim_plataforma: z.string().optional(),
  aviso_previo: z.boolean().optional(),
  direito_defesa: z.boolean().optional(),
  motivo_informado: z.string().max(2000).optional(),
  saldo_retido: z.boolean().optional(),
  valor_retido_aproximado: z.string().max(200).optional(),
  tempo_plataforma: z.enum(['menos_6m', '6m_1a', '1a_2a', 'mais_2a']).optional(),
});

export const respostasGigSchema = z.object({
  controle_algoritmico: respostasControleAlgoritmicoSchema.optional(),
  dependencia_economica: respostasDependenciaEconomicaSchema.optional(),
  condicoes_trabalho_gig: respostasCondicoesTrabalhoGigSchema.optional(),
  desligamento_plataforma: respostasDesligamentoPlataformaSchema.optional(),
});

// =============================================================================
// ZOD SCHEMAS — Respostas por Módulo (Trilha C — Pejotização)
// =============================================================================

export const respostasContratoPJSchema = z.object({
  origem_pj: z.enum(['empresa_obrigou', 'empresa_sugeriu', 'decisao_propria', 'contador_sugeriu']).optional(),
  tipo_pj: z.enum(['mei', 'simples_nacional', 'lucro_presumido', 'outro']).optional(),
  data_inicio_pj: z.string().optional(),
  data_fim_pj: z.string().optional(),
  remuneracao_liquida_mensal: z.string().max(200).optional(),
  contrato_formal: z.boolean().optional(),
  empresa_paga_custos_cnpj: z.boolean().optional(),
  emissao_nf_mensal: z.boolean().optional(),
  tipo_pagamento: z.enum(['fixo', 'variavel', 'misto']).optional(),
  valor_mensal_aproximado: z.string().max(200).optional(),
});

export const respostasSubordinacaoRealSchema = z.object({
  cumpre_horario_fixo: z.boolean().optional(),
  recebe_ordens_superior: z.boolean().optional(),
  reunioes_obrigatorias: z.boolean().optional(),
  pede_autorizacao_falta: z.boolean().optional(),
  usa_cracha_email_uniforme: z.boolean().optional(),
  local_trabalho: z.enum(['empresa_exclusivamente', 'empresa_parcialmente', 'remoto', 'hibrido']).optional(),
  narrativa_rotina: z.string().max(10000).optional(),
});

export const respostasExclusividadePessoalidadeSchema = z.object({
  atende_exclusivamente: z.boolean().optional(),
  pode_enviar_substituto: z.boolean().optional(),
  proibicao_outros_clientes: z.enum(['sim_expressamente', 'sim_implicitamente', 'nao']).optional(),
  liberdade_recusar_tarefas: z.boolean().optional(),
  duracao_relacao: z.enum(['menos_6m', '6m_1a', '1a_3a', 'mais_3a']).optional(),
});

export const respostasFraudeVerbasSchema = z.object({
  valor_mensal_fixo: z.boolean().optional(),
  valor_aproximado: z.string().max(200).optional(),
  beneficios_recebidos: z.array(z.enum(['vt', 'va', 'vr', 'plano_saude', 'plano_odonto', 'nenhum'])).optional(),
  decimo_terceiro_disfarado: z.boolean().optional(),
  regime_ferias: z.enum(['nao_tirava', 'tirava_sem_pagamento', 'tirava_com_pagamento_parcial', 'tirava_normalmente']).optional(),
  recebeu_verbas_rescisao: z.boolean().optional(),
  controle_como_clt: z.boolean().optional(),
});

export const respostasPejotizacaoSchema = z.object({
  contrato_pj: respostasContratoPJSchema.optional(),
  subordinacao_real: respostasSubordinacaoRealSchema.optional(),
  exclusividade_pessoalidade: respostasExclusividadePessoalidadeSchema.optional(),
  fraude_verbas: respostasFraudeVerbasSchema.optional(),
});

export const respostasConsolidacaoFinalSchema = z.object({
  relato_completo_texto: z.string().max(20000).optional(),
  observacoes_finais: z.string().max(10000).optional(),
  relato_consolidado_ia: z.string().max(50000).optional(),
  inconsistencias_ia: z.array(z.string().max(2000)).optional(),
  justificativas_inconsistencias: z.record(z.string().max(5000)).optional(),
});

// =============================================================================
// ZOD SCHEMAS — Operações CRUD
// =============================================================================

export const createEntrevistaSchema = z.object({
  contratoId: z.number().int().positive('ID do contrato deve ser positivo'),
  tipoLitigio: tipoLitigioSchema,
  perfilReclamante: perfilReclamanteSchema.optional(),
  createdBy: z.number().int().positive().nullable().optional(),
});

export const salvarModuloSchema = z.object({
  entrevistaId: z.number().int().positive(),
  modulo: moduloEntrevistaSchema,
  respostas: z.record(z.unknown()),
  notaOperador: z.string().max(5000).optional(),
});

export const createAnexoSchema = z.object({
  entrevistaId: z.number().int().positive(),
  modulo: z.string().min(1),
  noReferencia: z.string().optional(),
  tipoAnexo: z.string().min(1),
  arquivoUrl: z.string().url(),
  descricao: z.string().max(1000).optional(),
});

// =============================================================================
// TIPOS INFERIDOS
// =============================================================================

export type CreateEntrevistaInput = z.infer<typeof createEntrevistaSchema>;
export type SalvarModuloInput = z.infer<typeof salvarModuloSchema>;
export type CreateAnexoInput = z.infer<typeof createAnexoSchema>;

// =============================================================================
// CONSTANTES — Labels
// =============================================================================

export const TIPO_LITIGIO_LABELS: Record<TipoLitigio, string> = {
  trabalhista_classico: 'Empresa Física/Tradicional',
  gig_economy: 'Plataforma/Aplicativo',
  pejotizacao: 'Pejotização',
};

export const TIPO_LITIGIO_DESCRICAO: Record<TipoLitigio, string> = {
  trabalhista_classico: 'Comércio, Indústria, Doméstica, Escritório',
  gig_economy: 'Uber, iFood, 99, GetNinjas',
  pejotizacao: 'MEI/CNPJ para tomadora única',
};

export const STATUS_ENTREVISTA_LABELS: Record<StatusEntrevista, string> = {
  rascunho: 'Rascunho',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
};

export const PERFIL_RECLAMANTE_LABELS: Record<PerfilReclamante, string> = {
  domestica: 'Empregada Doméstica',
  comerciario: 'Comerciário',
  industrial: 'Industrial',
  rural: 'Trabalhador Rural',
  escritorio: 'Escritório/Administrativo',
  motorista_app: 'Motorista de Aplicativo',
  entregador: 'Entregador',
  prestador_servicos_app: 'Prestador de Serviços por App',
  profissional_ti: 'Profissional de TI',
  profissional_saude: 'Profissional de Saúde',
  vendedor_pj: 'Vendedor PJ',
  consultor_pj: 'Consultor PJ',
  outro: 'Outro',
};

export const MODULO_LABELS: Record<ModuloEntrevista, string> = {
  no_zero: 'Tipo de Litígio',
  // Trilha A
  vinculo: 'Vínculo Empregatício',
  jornada: 'Jornada e Descanso',
  saude_ambiente: 'Saúde e Ambiente',
  ruptura: 'Ruptura e Acerto',
  // Trilha B
  controle_algoritmico: 'Controle Algorítmico',
  dependencia_economica: 'Dependência Econômica',
  condicoes_trabalho_gig: 'Condições de Trabalho',
  desligamento_plataforma: 'Desligamento da Plataforma',
  // Trilha C
  contrato_pj: 'Contrato PJ',
  subordinacao_real: 'Subordinação Real',
  exclusividade_pessoalidade: 'Exclusividade e Pessoalidade',
  fraude_verbas: 'Fraude nas Verbas',
  consolidacao_final: 'Consolidação Final',
};

// =============================================================================
// CONSTANTES — Módulos por Trilha
// =============================================================================

export const MODULOS_CLASSICO: ModuloEntrevista[] = [
  'vinculo',
  'jornada',
  'saude_ambiente',
  'ruptura',
  'consolidacao_final',
];

export const MODULOS_GIG: ModuloEntrevista[] = [
  'controle_algoritmico',
  'dependencia_economica',
  'condicoes_trabalho_gig',
  'desligamento_plataforma',
  'consolidacao_final',
];

export const MODULOS_PEJOTIZACAO: ModuloEntrevista[] = [
  'contrato_pj',
  'subordinacao_real',
  'exclusividade_pessoalidade',
  'fraude_verbas',
  'consolidacao_final',
];

export function getModulosPorTrilha(tipoLitigio: TipoLitigio): ModuloEntrevista[] {
  switch (tipoLitigio) {
    case 'trabalhista_classico': return MODULOS_CLASSICO;
    case 'gig_economy': return MODULOS_GIG;
    case 'pejotizacao': return MODULOS_PEJOTIZACAO;
  }
}

/**
 * Perfis de reclamante filtrados por trilha (exibidos no Nó Zero)
 */
export const PERFIS_POR_TRILHA: Record<TipoLitigio, PerfilReclamante[]> = {
  trabalhista_classico: ['domestica', 'comerciario', 'industrial', 'rural', 'escritorio', 'outro'],
  gig_economy: ['motorista_app', 'entregador', 'prestador_servicos_app', 'outro'],
  pejotizacao: ['profissional_ti', 'profissional_saude', 'vendedor_pj', 'consultor_pj', 'outro'],
};

// =============================================================================
// CONSTANTES — Opções de Campos (Trilha A — Clássico)
// =============================================================================

export const CTPS_OPTIONS = [
  { value: 'sim_ok', label: 'Sim, tudo certo' },
  { value: 'sim_atrasada', label: 'Sim, mas com data atrasada' },
  { value: 'nao_informal', label: 'Não, trabalhei sem registro (na informalidade)' },
  { value: 'obrigado_mei', label: 'Fui obrigado a abrir MEI/CNPJ' },
] as const;

export const CONTROLE_PONTO_OPTIONS = [
  { value: 'eletronico', label: 'Relógio de ponto eletrônico' },
  { value: 'manual', label: 'Folha de ponto manual (papel)' },
  { value: 'nenhum', label: 'Não havia controle' },
  { value: 'britanico', label: 'Ponto britânico (sempre o mesmo horário exato)' },
] as const;

export const JORNADA_INTERVALO_OPTIONS = [
  { value: 'almoco_1h', label: 'Tirava 1h de almoço' },
  { value: 'almoco_reduzido', label: 'Almoçava em 15/30 min para voltar ao trabalho' },
  { value: 'horas_extras_pagas', label: 'Recebia todas as horas extras' },
  { value: 'hora_extra_gratis', label: 'Fazia hora extra de graça ou ia para banco de horas que nunca folgava' },
] as const;

export const TIPO_RISCO_OPTIONS = [
  { value: 'ruido', label: 'Ruído' },
  { value: 'calor', label: 'Calor' },
  { value: 'quimico', label: 'Químico' },
  { value: 'biologico', label: 'Biológico' },
  { value: 'inflamavel', label: 'Inflamável' },
  { value: 'eletricidade', label: 'Eletricidade' },
] as const;

export const MOTIVO_RUPTURA_OPTIONS = [
  { value: 'demissao_sem_justa_causa', label: 'Fui demitido sem justa causa' },
  { value: 'pedido_demissao', label: 'Pedi demissão' },
  { value: 'justa_causa', label: 'Levei Justa Causa' },
  { value: 'empresa_faliu', label: 'A empresa sumiu/faliu' },
  { value: 'rescisao_indireta', label: 'Quero sair mas a empresa não me demite (Rescisão Indireta)' },
] as const;

export const VERBAS_RECEBIDAS_OPTIONS = [
  { value: 'tudo', label: 'Recebi tudo' },
  { value: 'parcial_acordo', label: 'Recebi só uma parte (fizeram acordo por fora)' },
  { value: 'nada', label: 'Não recebi nada' },
  { value: 'fgts_nao_depositado', label: 'Não depositaram meu FGTS durante o contrato' },
] as const;

export const TIPO_ANEXO_OPTIONS = [
  { value: 'foto_ctps', label: 'Foto da CTPS' },
  { value: 'print_whatsapp', label: 'Print de WhatsApp' },
  { value: 'audio_relato', label: 'Áudio de relato' },
  { value: 'audio_whatsapp', label: 'Áudio de WhatsApp' },
  { value: 'trct', label: 'Termo de Rescisão (TRCT)' },
  { value: 'extrato_fgts', label: 'Extrato do FGTS' },
  { value: 'holerite', label: 'Holerite/Contracheque' },
  { value: 'foto_ambiente', label: 'Foto do ambiente de trabalho' },
  { value: 'documento_medico', label: 'Documento médico' },
  { value: 'print_app', label: 'Print do aplicativo/plataforma' },
  { value: 'contrato_pj', label: 'Contrato de prestação de serviços' },
  { value: 'comprovante_pagamento', label: 'Comprovante de pagamento' },
  { value: 'outro', label: 'Outro' },
] as const;

// =============================================================================
// CONSTANTES — Opções de Campos (Trilha B — Gig Economy)
// =============================================================================

export const TIPO_PLATAFORMA_OPTIONS = [
  { value: 'transporte', label: 'Transporte de passageiros (Uber, 99, InDriver)' },
  { value: 'entrega', label: 'Entrega de alimentos/encomendas (iFood, Rappi, Loggi)' },
  { value: 'servicos_gerais', label: 'Serviços gerais (GetNinjas, Workana)' },
  { value: 'outro', label: 'Outro' },
] as const;

export const RECUSA_CONSEQUENCIA_OPTIONS = [
  { value: 'sem_punicao', label: 'Sim, posso recusar sem consequências' },
  { value: 'perde_pontuacao', label: 'Não, perco pontuação/avaliação' },
  { value: 'pode_ser_bloqueado', label: 'Não, posso ser bloqueado/suspenso' },
] as const;

export const PERCENTUAL_RENDA_OPTIONS = [
  { value: 'menos_25', label: 'Menos de 25%' },
  { value: '25_50', label: 'Entre 25% e 50%' },
  { value: '50_75', label: 'Entre 50% e 75%' },
  { value: 'mais_75', label: 'Mais de 75%' },
  { value: 'unica_renda', label: 'Era minha única fonte de renda' },
] as const;

export const QTD_PLATAFORMAS_OPTIONS = [
  { value: 'uma', label: 'Apenas uma plataforma' },
  { value: 'duas_tres', label: '2 a 3 plataformas' },
  { value: 'quatro_mais', label: '4 ou mais plataformas' },
] as const;

export const FAIXA_HORAS_DIA_OPTIONS = [
  { value: 'ate_8', label: 'Até 8 horas' },
  { value: '8_10', label: '8 a 10 horas' },
  { value: '10_12', label: '10 a 12 horas' },
  { value: 'mais_12', label: 'Mais de 12 horas' },
] as const;

export const DIAS_SEMANA_OPTIONS = [
  { value: '5', label: '5 dias por semana' },
  { value: '6', label: '6 dias por semana' },
  { value: '7', label: '7 dias por semana (sem folga)' },
] as const;

export const FORMA_DESLIGAMENTO_OPTIONS = [
  { value: 'bloqueio_definitivo', label: 'Bloqueio definitivo da conta' },
  { value: 'bloqueio_temporario', label: 'Bloqueio temporário que virou permanente' },
  { value: 'conta_desativada', label: 'Conta desativada sem explicação' },
  { value: 'saiu_voluntariamente', label: 'Saí por conta própria' },
] as const;

export const TEMPO_PLATAFORMA_OPTIONS = [
  { value: 'menos_6m', label: 'Menos de 6 meses' },
  { value: '6m_1a', label: '6 meses a 1 ano' },
  { value: '1a_2a', label: '1 a 2 anos' },
  { value: 'mais_2a', label: 'Mais de 2 anos' },
] as const;

// =============================================================================
// CONSTANTES — Opções de Campos (Trilha C — Pejotização)
// =============================================================================

export const ORIGEM_PJ_OPTIONS = [
  { value: 'empresa_obrigou', label: 'A empresa me obrigou a abrir CNPJ/MEI' },
  { value: 'empresa_sugeriu', label: 'A empresa sugeriu "para pagar menos imposto"' },
  { value: 'decisao_propria', label: 'Decidi por conta própria' },
  { value: 'contador_sugeriu', label: 'O contador da empresa sugeriu' },
] as const;

export const TIPO_PJ_OPTIONS = [
  { value: 'mei', label: 'MEI (Microempreendedor Individual)' },
  { value: 'simples_nacional', label: 'Simples Nacional' },
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'outro', label: 'Outro regime' },
] as const;

export const VALOR_PAGAMENTO_OPTIONS = [
  { value: 'fixo', label: 'Valor mensal fixo' },
  { value: 'variavel', label: 'Variável (por projeto/demanda)' },
  { value: 'misto', label: 'Misto (fixo + variável)' },
] as const;

export const LOCAL_TRABALHO_OPTIONS = [
  { value: 'empresa_exclusivamente', label: 'Nas dependências da empresa (exclusivamente)' },
  { value: 'empresa_parcialmente', label: 'Parcialmente na empresa' },
  { value: 'remoto', label: 'Totalmente remoto' },
  { value: 'hibrido', label: 'Híbrido (presencial + remoto)' },
] as const;

export const PROIBICAO_OUTROS_OPTIONS = [
  { value: 'sim_expressamente', label: 'Sim, havia cláusula expressa no contrato' },
  { value: 'sim_implicitamente', label: 'Sim, era proibido na prática (mas não por escrito)' },
  { value: 'nao', label: 'Não havia proibição' },
] as const;

export const DURACAO_RELACAO_OPTIONS = [
  { value: 'menos_6m', label: 'Menos de 6 meses' },
  { value: '6m_1a', label: '6 meses a 1 ano' },
  { value: '1a_3a', label: '1 a 3 anos' },
  { value: 'mais_3a', label: 'Mais de 3 anos' },
] as const;

export const REGIME_FERIAS_OPTIONS = [
  { value: 'nao_tirava', label: 'Não tirava férias' },
  { value: 'tirava_sem_pagamento', label: 'Tirava, mas sem receber' },
  { value: 'tirava_com_pagamento_parcial', label: 'Tirava com pagamento parcial' },
  { value: 'tirava_normalmente', label: 'Tirava normalmente (30 dias)' },
] as const;

export const BENEFICIO_RECEBIDO_OPTIONS = [
  { value: 'vt', label: 'Vale-transporte' },
  { value: 'va', label: 'Vale-alimentação' },
  { value: 'vr', label: 'Vale-refeição' },
  { value: 'plano_saude', label: 'Plano de saúde' },
  { value: 'plano_odonto', label: 'Plano odontológico' },
  { value: 'nenhum', label: 'Nenhum benefício' },
] as const;
