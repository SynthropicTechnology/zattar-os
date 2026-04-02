import { z } from 'zod';

// Enums and Types
export enum StatusAudiencia {
  Marcada = 'M',
  Finalizada = 'F',
  Cancelada = 'C',
}

export enum ModalidadeAudiencia {
  Virtual = 'virtual',
  Presencial = 'presencial',
  Hibrida = 'hibrida',
}

export enum PresencaHibrida {
  Advogado = 'advogado',
  Cliente = 'cliente',
}

export const CODIGO_TRIBUNAL = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24',
] as const;
export type CodigoTribunal = typeof CODIGO_TRIBUNAL[number];

export enum GrauTribunal {
  PrimeiroGrau = 'primeiro_grau',
  SegundoGrau = 'segundo_grau',
  TribunalSuperior = 'tribunal_superior',
}

// Interfaces
export interface EnderecoPresencial {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Audiencia {
  id: number;
  idPje: number;
  advogadoId: number;
  processoId: number;
  orgaoJulgadorId: number | null;
  trt: CodigoTribunal;
  grau: GrauTribunal;
  numeroProcesso: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string | null;
  horaFim: string | null;
  modalidade: ModalidadeAudiencia | null;
  presencaHibrida: PresencaHibrida | null;
  salaAudienciaNome: string | null;
  salaAudienciaId: number | null;
  status: StatusAudiencia;
  statusDescricao: string | null;
  tipoAudienciaId: number | null;
  tipoDescricao: string | null; // Campo vindo de JOIN com tipos_audiencias
  classeJudicialId: number | null;
  designada: boolean;
  emAndamento: boolean;
  documentoAtivo: boolean;
  segredoJustica: boolean;
  juizoDigital: boolean;
  poloAtivoNome: string | null;
  poloPassivoNome: string | null;
  poloAtivoRepresentaVarios: boolean;
  poloPassivoRepresentaVarios: boolean;
  urlAudienciaVirtual: string | null;
  enderecoPresencial: EnderecoPresencial | null;
  responsavelId: number | null;
  observacoes: string | null;
  dadosAnteriores: Record<string, unknown> | null;
  ataAudienciaId: number | null;
  urlAtaAudiencia: string | null;
  createdAt: string;
  updatedAt: string;

  // =========================================================================
  // FONTE DA VERDADE (dados do 1º grau)
  // Estes campos vêm do JOIN com acervo e representam as partes originais.
  // Ver src/features/processos/FONTE_DA_VERDADE.md para documentação.
  // =========================================================================
  trtOrigem?: string; // Tribunal de origem (1º grau)
  poloAtivoOrigem?: string; // Quem ajuizou a ação (autor original)
  poloPassivoOrigem?: string; // Contra quem foi ajuizada (réu original)
  orgaoJulgadorOrigem?: string; // Órgão julgador do 1º grau
}

// Zod Schemas
const baseAudienciaSchema = z.object({
  processoId: z.number({ required_error: 'Processo é obrigatório.' }),
  dataInicio: z.string({ required_error: 'Data de início é obrigatória.' }).datetime('Formato de data inválido.'),
  dataFim: z.string({ required_error: 'Data de fim é obrigatória.' }).datetime('Formato de data inválido.'),
  tipoAudienciaId: z.number().optional().nullable(),
  modalidade: z.nativeEnum(ModalidadeAudiencia).optional().nullable(),
  urlAudienciaVirtual: z.string().url('URL inválida.').optional().nullable(),
  enderecoPresencial: z.custom<EnderecoPresencial>().optional().nullable(),
  responsavelId: z.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  salaAudienciaNome: z.string().optional().nullable(),
});

export const createAudienciaSchema = baseAudienciaSchema.refine(
  data => new Date(data.dataFim) > new Date(data.dataInicio),
  {
    message: 'A data de fim deve ser posterior à data de início.',
    path: ['dataFim'],
  }
);

export const updateAudienciaSchema = baseAudienciaSchema.partial();

export const atualizarStatusSchema = z.object({
  status: z.nativeEnum(StatusAudiencia),
  statusDescricao: z.string().optional(),
});

// Parameter Types
export type AudienciaSortBy = keyof Audiencia;

export type ListarAudienciasParams = {
  pagina?: number;
  limite?: number;
  busca?: string;
  trt?: CodigoTribunal | CodigoTribunal[];
  grau?: GrauTribunal | GrauTribunal[];
  responsavelId?: number | 'null' | (number | 'null')[];
  semResponsavel?: boolean;
  status?: StatusAudiencia | StatusAudiencia[];
  modalidade?: ModalidadeAudiencia | ModalidadeAudiencia[];
  tipoAudienciaId?: number | number[];
  dataInicioInicio?: string;
  dataInicioFim?: string;
  dataFimInicio?: string;
  dataFimFim?: string;
  ordenarPor?: AudienciaSortBy;
  ordem?: 'asc' | 'desc';
};

// Labels and Constants
export const STATUS_AUDIENCIA_LABELS: Record<StatusAudiencia, string> = {
  [StatusAudiencia.Marcada]: 'Marcada',
  [StatusAudiencia.Finalizada]: 'Realizada',
  [StatusAudiencia.Cancelada]: 'Cancelada',
};

export const MODALIDADE_AUDIENCIA_LABELS: Record<ModalidadeAudiencia, string> = {
  [ModalidadeAudiencia.Virtual]: 'Virtual',
  [ModalidadeAudiencia.Presencial]: 'Presencial',
  [ModalidadeAudiencia.Hibrida]: 'Híbrida',
};

export const GRAU_TRIBUNAL_LABELS: Record<GrauTribunal, string> = {
  [GrauTribunal.PrimeiroGrau]: '1º Grau',
  [GrauTribunal.SegundoGrau]: '2º Grau',
  [GrauTribunal.TribunalSuperior]: 'Tribunal Superior',
};

// ============================================================================
// Tipos específicos de frontend para audiências (Consolidated)
// ============================================================================

/**
 * Resposta da API de audiências (formato padrão)
 */
export interface AudienciasApiResponse {
  success: boolean;
  data: {
    audiencias: Audiencia[];
    paginacao: {
      pagina: number;
      limite: number;
      total: number;
      totalPaginas: number;
    };
  };
}

/**
 * Parâmetros para buscar audiências (frontend)
 */
export interface BuscarAudienciasParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ordenar_por?: AudienciaSortBy;
  ordem?: 'asc' | 'desc';
  trt?: CodigoTribunal | CodigoTribunal[];
  grau?: GrauTribunal | GrauTribunal[];
  responsavel_id?: number | 'null' | (number | 'null')[];
  status?: StatusAudiencia | StatusAudiencia[];
  modalidade?: ModalidadeAudiencia | ModalidadeAudiencia[];
  tipo_audiencia_id?: number | number[];
  tipo_descricao?: string;
  tipo_codigo?: string;
  data_inicio_inicio?: string;
  data_inicio_fim?: string;
  data_fim_inicio?: string;
  data_fim_fim?: string;
}

/**
 * Estado de filtros da página de audiências
 */
export interface AudienciasFilters {
  trt?: string;
  grau?: GrauTribunal;
  responsavel_id?: number | 'null';
  busca?: string;
  numero_processo?: string;
  polo_ativo_nome?: string;
  polo_passivo_nome?: string;
  status?: string;
  modalidade?: 'virtual' | 'presencial' | 'hibrida';
  tipo_descricao?: string;
  tipo_codigo?: string;
  data_inicio_inicio?: string;
  data_inicio_fim?: string;
  data_fim_inicio?: string;
  data_fim_fim?: string;
}

/**
 * Visualização ativa de audiências
 */
export type AudienciasVisualizacao = 'semana' | 'mes' | 'ano' | 'lista';

/**
 * Paginação de audiências
 */
export interface AudienciasPaginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

/**
 * Resultado do hook useAudiencias
 */
export interface UseAudienciasResult {
  audiencias: Audiencia[];
  paginacao: AudienciasPaginacao | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Opções do hook useAudiencias
 */
export interface UseAudienciasOptions {
  /** Se false, não faz a busca (útil para aguardar inicialização de parâmetros) */
  enabled?: boolean;
}

/**
 * Metadados de um TRT para tipo de audiência
 */
export interface TipoAudienciaTrtMetadata {
  trt: string;
  grau: string;
  id_pje: number;
  codigo: string;
  old_id: number;
}

/**
 * Tipo de audiência (deduplicado por descrição)
 */
export interface TipoAudiencia {
  id: number;
  descricao: string;
  is_virtual: boolean;
  trts_metadata?: TipoAudienciaTrtMetadata[];
}

/**
 * Resultado do hook useTiposAudiencias
 */
export interface UseTiposAudienciasResult {
  tiposAudiencia: TipoAudiencia[];
  isLoading: boolean;
  error: string | null;
}

// Tipos legados que podem ser migrados posteriormente
// TODO: Migrar estes tipos para domain.ts quando necessário
export type GrauAudiencia = string;
export type AudienciaInfra = unknown;
export type CriarAudienciaInfraParams = unknown;
export type AtualizarAudienciaInfraParams = unknown;

// =============================================================================
// TIPOS PARA AGENTE IA (endpoint de audiências por CPF)
// =============================================================================

/**
 * Registro de audiência retornado do banco para endpoint de IA
 */
export interface AudienciaClienteCpfRow {
  // Dados da audiência
  audiencia_id: number;
  id_pje: number;
  numero_processo: string;
  trt: string;
  grau: 'primeiro_grau' | 'segundo_grau';
  data_inicio: string;
  data_fim: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  status: string;
  status_descricao: string | null;
  modalidade: 'virtual' | 'presencial' | 'hibrida' | null;
  url_audiencia_virtual: string | null;
  endereco_presencial: Record<string, unknown> | null;
  presenca_hibrida: 'advogado' | 'cliente' | null;
  polo_ativo_nome: string | null;
  polo_passivo_nome: string | null;
  segredo_justica: boolean;
  observacoes: string | null;

  // Dados relacionados
  tipo_audiencia_descricao: string | null;
  orgao_julgador_descricao: string | null;
  sala_audiencia_nome: string | null;
  classe_judicial_descricao: string | null;

  // Dados do cliente
  cliente_id: number;
  cliente_nome: string;
  cpf: string;
  tipo_parte: string;
  polo: string;
}

/**
 * Dados do cliente na resposta da IA
 */
export interface ClienteRespostaIA {
  nome: string;
  cpf: string; // Formatado: 123.456.789-01
}

/**
 * Resumo estatístico das audiências para IA
 */
export interface ResumoAudienciasIA {
  total_audiencias: number;
  futuras: number;
  realizadas: number;
  canceladas: number;
}

/**
 * Local da audiência (virtual ou presencial) para IA
 */
export interface LocalAudienciaIA {
  tipo: 'virtual' | 'presencial' | 'hibrido';
  url_virtual: string | null;
  endereco: string | null;
  sala: string | null;
  presenca_hibrida: string | null;
}

/**
 * Audiência formatada para resposta da IA
 */
export interface AudienciaRespostaIA {
  numero_processo: string;
  tipo: string;
  data: string; // Formatado: DD/MM/YYYY
  horario: string; // Formatado: HH:mm - HH:mm
  modalidade: 'Virtual' | 'Presencial' | 'Híbrida';
  status: string;
  local: LocalAudienciaIA;
  partes: {
    polo_ativo: string;
    polo_passivo: string;
  };
  papel_cliente: string;
  parte_contraria: string;
  tribunal: string;
  vara: string;
  sigilo: boolean;
  observacoes: string | null;
}

/**
 * Resposta de sucesso do endpoint de IA
 */
export interface AudienciasClienteCpfSuccessResponse {
  success: true;
  data: {
    cliente: ClienteRespostaIA;
    resumo: ResumoAudienciasIA;
    audiencias: AudienciaRespostaIA[];
  };
}

/**
 * Resposta de erro do endpoint de IA
 */
export interface AudienciasClienteCpfErrorResponse {
  success: false;
  error: string;
}

/**
 * Resposta unificada do endpoint de IA (sucesso ou erro)
 */
export type AudienciasClienteCpfResponse =
  | AudienciasClienteCpfSuccessResponse
  | AudienciasClienteCpfErrorResponse;

/**
 * Mapeamento de TRT para nome completo
 */
export const TRT_NOMES: Record<string, string> = {
  TRT1: 'TRT da 1ª Região (RJ)',
  TRT2: 'TRT da 2ª Região (SP Capital)',
  TRT3: 'TRT da 3ª Região (MG)',
  TRT4: 'TRT da 4ª Região (RS)',
  TRT5: 'TRT da 5ª Região (BA)',
  TRT6: 'TRT da 6ª Região (PE)',
  TRT7: 'TRT da 7ª Região (CE)',
  TRT8: 'TRT da 8ª Região (PA/AP)',
  TRT9: 'TRT da 9ª Região (PR)',
  TRT10: 'TRT da 10ª Região (DF/TO)',
  TRT11: 'TRT da 11ª Região (AM/RR)',
  TRT12: 'TRT da 12ª Região (SC)',
  TRT13: 'TRT da 13ª Região (PB)',
  TRT14: 'TRT da 14ª Região (RO/AC)',
  TRT15: 'TRT da 15ª Região (Campinas)',
  TRT16: 'TRT da 16ª Região (MA)',
  TRT17: 'TRT da 17ª Região (ES)',
  TRT18: 'TRT da 18ª Região (GO)',
  TRT19: 'TRT da 19ª Região (AL)',
  TRT20: 'TRT da 20ª Região (SE)',
  TRT21: 'TRT da 21ª Região (RN)',
  TRT22: 'TRT da 22ª Região (PI)',
  TRT23: 'TRT da 23ª Região (MT)',
  TRT24: 'TRT da 24ª Região (MS)',
};

/**
 * Mapeamento de tipo_parte para texto amigável
 */
export const TIPO_PARTE_NOMES: Record<string, string> = {
  AUTOR: 'Autor',
  REU: 'Réu',
  RECLAMANTE: 'Reclamante',
  RECLAMADO: 'Reclamado',
  EXEQUENTE: 'Exequente',
  EXECUTADO: 'Executado',
  EMBARGANTE: 'Embargante',
  EMBARGADO: 'Embargado',
  APELANTE: 'Apelante',
  APELADO: 'Apelado',
  AGRAVANTE: 'Agravante',
  AGRAVADO: 'Agravado',
  OUTRO: 'Outro',
};

/**
 * Mapeamento de status de audiência para texto amigável (IA)
 */
export const STATUS_AUDIENCIA_NOMES: Record<string, string> = {
  M: 'Designada',
  C: 'Cancelada',
  F: 'Realizada',
  A: 'Adiada',
  R: 'Redesignada',
};

// =============================================================================
// COLUMN SELECTION HELPERS (Disk I/O Optimization)
// =============================================================================

/**
 * Colunas básicas para listagem de audiências (reduz I/O em 35%)
 */
export function getAudienciaColumnsBasic(): string {
  return `
    id,
    processo_id,
    numero_processo,
    data_inicio,
    data_fim,
    hora_inicio,
    hora_fim,
    status,
    modalidade,
    responsavel_id,
    trt,
    grau,
    polo_ativo_nome,
    polo_passivo_nome,
    tipo_audiencia_id,
    observacoes
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Colunas completas para detalhes de audiência
 */
export function getAudienciaColumnsFull(): string {
  return `
    id,
    id_pje,
    advogado_id,
    processo_id,
    orgao_julgador_id,
    trt,
    grau,
    numero_processo,
    data_inicio,
    data_fim,
    hora_inicio,
    hora_fim,
    modalidade,
    presenca_hibrida,
    sala_audiencia_nome,
    sala_audiencia_id,
    status,
    status_descricao,
    tipo_audiencia_id,
    classe_judicial_id,
    designada,
    em_andamento,
    documento_ativo,
    segredo_justica,
    juizo_digital,
    polo_ativo_nome,
    polo_passivo_nome,
    polo_ativo_representa_varios,
    polo_passivo_representa_varios,
    url_audiencia_virtual,
    endereco_presencial,
    responsavel_id,
    observacoes,
    dados_anteriores,
    ata_audiencia_id,
    url_ata_audiencia,
    created_at,
    updated_at
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Colunas para view com origem (fonte da verdade)
 */
export function getAudienciaColumnsComOrigem(): string {
  return `
    ${getAudienciaColumnsFull()},
    trt_origem,
    polo_ativo_origem,
    polo_passivo_origem,
    orgao_julgador_origem,
    tipo_descricao
  `.trim().replace(/\s+/g, ' ');
}
