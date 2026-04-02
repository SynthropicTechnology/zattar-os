/**
 * ASSINATURA DIGITAL - Tipos de API
 *
 * Tipos para comunicação entre frontend e backend via API REST.
 * Inclui payloads de request, responses e tipos de conformidade legal.
 *
 * IMPORTANTE: Tipos alinhados com entidades de outros módulos:
 * - ClienteBase, ParteContraria de @/app/app/partes
 */

import type {
  Segmento,
  Template,
  Formulario,
  StatusTemplate,
} from './domain';

// Tipos de Cliente e Parte Contrária definidos localmente
// para uso no módulo de assinatura digital
// Estes tipos são compatíveis com os tipos do módulo partes

export interface ClienteBase {
  id: number;
  nome: string;
  cpf?: string | null;
  cnpj?: string | null;
  email?: string | null;
}

export interface ParteContraria {
  id: number;
  nome: string;
  cpf?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
}

// =============================================================================
// DEVICE FINGERPRINT (Conformidade Legal MP 2.200-2/2001)
// =============================================================================

/**
 * Dados de fingerprint do dispositivo para auditoria.
 * Coletados no frontend para identificação única do dispositivo.
 */
export interface DeviceFingerprintData {
  screen_resolution?: string;
  color_depth?: number;
  timezone_offset?: number;
  timezone_name?: string;
  language?: string;
  platform?: string;
  hardware_concurrency?: number;
  device_memory?: number;
  touch_support?: boolean;
  battery_level?: number;
  battery_charging?: boolean;
  canvas_hash?: string;
  webgl_hash?: string;
  plugins?: string[];
  fonts?: string[];
  user_agent?: string;
  [key: string]: unknown;
}

// =============================================================================
// PREVIEW & FINALIZE PAYLOADS
// =============================================================================

export interface PreviewPayload {
  cliente_id: number;
  contrato_id?: number | null;
  template_id: string;
  foto_base64?: string | null;
  request_id?: string | null;
  parte_contraria_dados?: Array<{
    id: number;
    nome: string;
    cpf?: string | null;
    cnpj?: string | null;
    telefone?: string | null;
  }>;
  acao_dados?: Record<string, unknown>;
}

export interface PreviewResult {
  pdf_url: string;
}

/**
 * Payload para finalização de assinatura.
 * Acoplado a domain types globais (ClienteBase, ParteContraria).
 */
export interface FinalizePayload {
  cliente_id: number;
  /** ID do contrato associado a esta assinatura */
  contrato_id?: number | null;

  template_id: string;
  segmento_id: number;
  segmento_nome?: string;
  formulario_id: number;

  /** Cliente completo para geração de PDF */
  cliente_dados?: {
    id: number;
    nome: string;
    cpf?: string | null;
    cnpj?: string | null;
    email?: string | null;
    endereco?: string;
  };
  /** Partes contrárias para contratos */
  parte_contraria_dados?: Array<{
    id: number;
    nome: string;
    cpf?: string | null;
    cnpj?: string | null;
    telefone?: string | null;
  }>;
  acao_dados?: Record<string, unknown>;

  assinatura_base64: string;
  foto_base64?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geolocation_accuracy?: number | null;
  geolocation_timestamp?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  sessao_id?: string | null;
  request_id?: string | null;

  // Conformidade legal MP 2.200-2
  termos_aceite: boolean;
  termos_aceite_versao: string;
  dispositivo_fingerprint_raw?: DeviceFingerprintData | null;
}

export interface FinalizeResult {
  assinatura_id: number;
  protocolo: string;
  pdf_url: string;
  pdf_raw_url: string;
  pdf_key: string;
  pdf_size: number;
}

// =============================================================================
// SESSÃO DE ASSINATURA
// =============================================================================

export interface SessaoAssinaturaRecord {
  id: number;
  contrato_id: number | null;
  sessao_uuid: string;
  status: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: Record<string, unknown> | null;
  geolocation?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  expires_at?: string | null;
}

export interface ListSessoesParams {
  segmento_id?: number;
  formulario_id?: number;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListSessoesResult {
  sessoes: SessaoAssinaturaRecord[];
  total: number;
  page: number;
  pageSize: number;
}

// =============================================================================
// REGISTRO DE ASSINATURA DIGITAL (Banco de Dados)
// =============================================================================

/**
 * Registro completo de assinatura digital no banco de dados.
 * Inclui todos os campos de conformidade legal MP 2.200-2/2001.
 */
export interface AssinaturaDigitalRecord {
  id: number;
  cliente_id: number;
  /** ID do contrato associado a esta assinatura */
  contrato_id?: number | null;
  template_uuid: string;
  segmento_id: number;
  formulario_id: number;
  sessao_uuid: string;
  assinatura_url: string;
  foto_url: string | null;
  pdf_url: string;
  protocolo: string;
  ip_address: string | null;
  user_agent: string | null;
  latitude: number | null;
  longitude: number | null;
  geolocation_accuracy: number | null;
  geolocation_timestamp: string | null;
  data_assinatura: string;
  status: string;
  enviado_sistema_externo: boolean;
  data_envio_externo: string | null;

  // Campos conformidade legal MP 2.200-2
  hash_original_sha256: string;
  hash_final_sha256: string | null;
  termos_aceite_versao: string;
  termos_aceite_data: string;
  dispositivo_fingerprint_raw: DeviceFingerprintData | null;

  created_at: string;
  updated_at: string;

  // Dados expandidos via join (opcional)
  cliente_dados?: {
    id: number;
    nome: string;
    cpf?: string | null;
    cnpj?: string | null;
  };
  parte_contraria_dados?: Array<{
    id: number;
    nome: string;
    cpf?: string | null;
    cnpj?: string | null;
    telefone?: string | null;
  }>;
}

// =============================================================================
// AUDITORIA
// =============================================================================

/**
 * Resultado de auditoria de integridade de assinatura digital.
 */
export interface AuditResult {
  assinatura_id: number;
  protocolo: string;
  status: 'valido' | 'invalido' | 'erro';
  hashes_validos: boolean;
  hash_original_registrado: string;
  hash_original_recalculado?: string;
  hash_final_registrado: string;
  hash_final_recalculado: string;
  entropia_suficiente: boolean;
  entropia_detalhes?: {
    campos_presentes: number;
    campos_obrigatorios: number;
    campos_recomendados: number;
  };
  foto_embedada?: boolean;
  avisos: string[];
  erros: string[];
  auditado_em: string;
}

// =============================================================================
// LISTAGEM E FILTROS
// =============================================================================

export interface ListTemplatesParams {
  search?: string;
  ativo?: boolean;
  status?: StatusTemplate;
  segmento_id?: number;
  tipo_template?: 'pdf' | 'markdown';
  pagina?: number;
  limite?: number;
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
}

export interface ListSegmentosParams {
  ativo?: boolean;
  search?: string;
}

export interface SegmentoListResponse {
  segmentos: Segmento[];
  total: number;
}

export interface ListFormulariosParams {
  segmento_id?: number | number[];
  ativo?: boolean;
  search?: string;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
}

export interface FormularioListResponse {
  formularios: Formulario[];
  total: number;
}

// =============================================================================
// DASHBOARD STATS
// =============================================================================

export interface DashboardStats {
  templatesAtivos: number;
  assinaturasHoje: number;
  totalAssinaturasHoje: number;
  pdfsGeradosHoje: number;
  taxaSucesso: number;
  ultimaAtualizacao: string;
}

// =============================================================================
// VISUALIZAÇÃO DE PDF/MARKDOWN
// =============================================================================

export interface VisualizacaoPdfData {
  pdf_url: string;
  template_id: string;
  template_nome?: string;
  gerado_em?: string;
}

export interface VisualizacaoMarkdownData {
  conteudo_html: string;
  conteudoMarkdown?: string; // Alias para compatibilidade
  template_id: string;
  template_nome?: string;
  gerado_em?: string;
  geradoEm?: string; // Alias para compatibilidade
}

// Tipos para geração de documentos
export interface ClienteDadosGeracao {
  nome: string;
  cpf: string;
  rg?: string;
  data_nascimento: string;
  estado_civil: string;
  genero: string;
  nacionalidade: string;
  email: string;
  celular: string;
  telefone?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface DadosGeracao {
  template_id: string;
  cliente: ClienteDadosGeracao;
  acao: Record<string, unknown>;
  assinatura: {
    foto_base64: string;
    assinatura_base64: string;
  };
  sistema: Record<string, unknown>;
  segmento?: {
    id: number;
    nome: string;
    slug: string;
    ativo: boolean;
  };
  [key: string]: unknown; // Index signature for Variables compatibility
}

export interface SalvarAcaoRequest {
  segmentoId: number;
  segmentoNome: string;
  formularioId: string | number;
  formularioNome: string;
  clienteId: number;
  clienteNome: string;
  clienteCpf: string;
  trt_id: string;
  trt_nome: string;
  dados: Record<string, unknown>;
}
