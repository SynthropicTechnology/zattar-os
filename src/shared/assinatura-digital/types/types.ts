/**
 * Assinatura Digital Types (Backend)
 *
 * IMPORTANTE: Estes tipos são simplificados para payloads de API.
 * Para tipos completos e tipados, veja: @/types/assinatura-digital/
 *
 * Diferenças principais:
 * - AssinaturaDigitalTemplate.campos: string (JSON) vs Template.campos: TemplateCampo[]
 * - AssinaturaDigitalFormulario.form_schema: unknown vs FormularioEntity.form_schema: DynamicFormSchema
 * - AssinaturaDigitalSegmento é compatível com Segmento (mesma estrutura)
 *
 * Acoplamento com domain types:
 * - ClienteBase de @/app/(authenticated)/partes/domain
 * - ParteContraria para dados de partes contrárias
 * - contrato_id: Referência ao contrato associado
 */

import type { ClienteBase, ParteContraria } from "@/app/(authenticated)/partes";

export interface AssinaturaDigitalTemplate {
  id: number;
  template_uuid: string;
  nome: string;
  descricao?: string | null;
  arquivo_original: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  pdf_url?: string | null;
  status: string;
  versao: number;
  ativo: boolean;
  campos: string;
  conteudo_markdown?: string | null;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssinaturaDigitalTemplateList {
  templates: AssinaturaDigitalTemplate[];
  total: number;
}

export type StatusTemplate = "ativo" | "inativo" | "rascunho";

export interface ListTemplatesParams {
  search?: string;
  ativo?: boolean;
  status?: StatusTemplate;
  segmento_id?: number;
}

export interface UpsertTemplateInput {
  nome: string;
  arquivo_original: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  template_uuid?: string;
  descricao?: string | null;
  pdf_url?: string | null;
  status?: string;
  versao?: number;
  ativo?: boolean;
  campos?: string;
  conteudo_markdown?: string | null;
  criado_por?: string | null;
}

export interface AssinaturaDigitalSegmento {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo: boolean;
  /**
   * Number of formularios associated with this segmento.
   * Populated by the list service when needed.
   */
  formularios_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ListSegmentosParams {
  ativo?: boolean;
  search?: string;
}

export interface AssinaturaDigitalSegmentoList {
  segmentos: AssinaturaDigitalSegmento[];
  total: number;
}

export interface UpsertSegmentoInput {
  nome: string;
  slug: string;
  descricao?: string | null;
  ativo?: boolean;
}

export interface AssinaturaDigitalFormulario {
  id: number;
  formulario_uuid: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  segmento_id: number;
  form_schema?: unknown;
  schema_version?: string;
  template_ids?: string[];
  ativo: boolean;
  ordem?: number | null;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
  metadados_seguranca?: string;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
  segmento?: AssinaturaDigitalSegmento;
  tipo_formulario?: 'contrato' | 'documento' | 'cadastro' | null;
  contrato_config?: ContratoConfigInput | null;
}

export interface ListFormulariosParams {
  segmento_id?: number | number[];
  ativo?: boolean;
  search?: string;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
}

export interface AssinaturaDigitalFormularioList {
  formularios: AssinaturaDigitalFormulario[];
  total: number;
}

export interface ContratoConfigInput {
  tipo_contrato_id: number;
  tipo_cobranca_id: number;
  papel_cliente: 'autora' | 're';
  pipeline_id: number;
}

export interface UpsertFormularioInput {
  nome: string;
  slug: string;
  segmento_id: number;
  descricao?: string | null;
  form_schema?: unknown;
  schema_version?: string;
  template_ids?: string[];
  ativo?: boolean;
  ordem?: number | null;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
  metadados_seguranca?: string;
  criado_por?: string | null;
  tipo_formulario?: 'contrato' | 'documento' | 'cadastro' | null;
  contrato_config?: ContratoConfigInput | null;
}

export interface AssinaturaDigitalDashboardStats {
  templatesAtivos: number;
  assinaturasHoje: number;
  totalAssinaturasHoje: number;
  pdfsGeradosHoje: number;
  taxaSucesso: number;
  ultimaAtualizacao: string;
}

/**
 * Assinatura Digital Signature Types (Backend)
 *
 * IMPORTANTE: Estes tipos são para payloads de API de assinatura.
 * Para tipos completos de Template e DadosGeracao, veja: @/types/assinatura-digital/template.types
 *
 * Relação com frontend:
 * - PreviewPayload e FinalizePayload são específicos de API
 * - DadosGeracao (frontend) é mais completo e inclui todos os dados para geração de PDF
 * - Template (frontend) define a estrutura completa do template
 */

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
  /** Dados do formulário dinâmico (campos acao.*) para resolução de variáveis no PDF */
  acao_dados?: Record<string, unknown>;
}

/**
 * Payload finalização: Acoplado a domain types globais.
 * - cliente_dados: Cliente completo (nome, CPF, endereço) de domain/partes
 * - parte_contraria_dados: Partes contrárias para contratos
 * - contrato_id: Referência ao contrato associado
 * Hashes calculados backend.
 */
export interface FinalizePayload {
  cliente_id: number;
  /** ID do contrato associado a esta assinatura */
  contrato_id?: number | null;

  template_id: string;
  segmento_id: number;
  segmento_nome?: string;
  formulario_id: number;

  // Dados completos acoplados a domain types (nome, endereço, CPF, partes contrárias)
  /** Cliente completo para geração de PDF (inclui nome, CPF, telefone, endereço) */
  cliente_dados?: {
    id: number;
    nome: string;
    cpf?: string | null;
    cnpj?: string | null;
    email?: string | null;
    celular?: string | null;
    telefone?: string | null;
    endereco?: string;
  };
  /** Partes contrárias para contratos (nome, CPF/CNPJ, telefone) */
  parte_contraria_dados?: Array<{
    id: number;
    nome: string;
    cpf?: string | null;
    cnpj?: string | null;
    telefone?: string | null;
  }>;
  /** Dados do formulário dinâmico (campos acao.*) para resolução de variáveis no PDF */
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
  /** Aceite obrigatório dos termos (deve ser true) */
  termos_aceite: boolean;
  /**
   * Versão dos termos aceitos (ex: "v1.0-MP2200-2").
   * IMPORTANTE: Este campo usa nomenclatura `termos_aceite_versao` em todas as camadas:
   * - Payload API (FinalizePayload)
   * - Coluna PostgreSQL (assinatura_digital_assinaturas.termos_aceite_versao)
   * - Record TypeScript (AssinaturaDigitalRecord)
   * - ManifestData.termos.versao (mapeado internamente)
   */
  termos_aceite_versao: string;
  /** Fingerprint do dispositivo para auditoria */
  dispositivo_fingerprint_raw?: DeviceFingerprintData | null;
}

export interface FinalizeResult {
  assinatura_id: number;
  protocolo: string;
  pdf_url: string;
  /** URL raw do Backblaze (bucket privado, para armazenar em arquivos.b2_url) */
  pdf_raw_url: string;
  /** Key do objeto no Backblaze (ex: assinatura-digital/pdfs/documento-xxx.pdf) */
  pdf_key: string;
  /** Tamanho do PDF em bytes */
  pdf_size: number;
}

export interface PreviewResult {
  pdf_url: string;
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

export interface ListSessoesResult {
  sessoes: SessaoAssinaturaRecord[];
  total: number;
  page: number;
  pageSize: number;
}

// #region Conformidade Legal MP 2.200-2

/**
 * Dados de fingerprint do dispositivo para auditoria.
 * Coletados no frontend para identificação única do dispositivo.
 */
export interface DeviceFingerprintData {
  /** Resolução de tela (ex: "1920x1080") */
  screen_resolution?: string;
  /** Profundidade de cor (ex: 24) */
  color_depth?: number;
  /** Timezone offset em minutos */
  timezone_offset?: number;
  /** Nome do timezone (ex: "America/Sao_Paulo") */
  timezone_name?: string;
  /** Idioma do navegador */
  language?: string;
  /** Plataforma (ex: "Win32", "MacIntel") */
  platform?: string;
  /** Número de núcleos de CPU */
  hardware_concurrency?: number;
  /** Memória do dispositivo em GB */
  device_memory?: number;
  /** Suporte a touch */
  touch_support?: boolean;
  /** Nível de bateria (0-1) */
  battery_level?: number;
  /** Se está carregando */
  battery_charging?: boolean;
  /** Canvas fingerprint hash */
  canvas_hash?: string;
  /** WebGL fingerprint hash */
  webgl_hash?: string;
  /** Plugins instalados */
  plugins?: string[];
  /** Fontes detectadas */
  fonts?: string[];
  /** User agent completo */
  user_agent?: string;
  /** Dados adicionais */
  [key: string]: unknown;
}

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
  /** Hash SHA-256 do PDF pré-assinatura */
  hash_original_sha256: string;
  /** Hash SHA-256 do PDF final com manifesto */
  hash_final_sha256: string | null;
  /** Versão dos termos aceitos */
  termos_aceite_versao: string;
  /** Timestamp do aceite dos termos */
  termos_aceite_data: string;
  /** Fingerprint do dispositivo */
  dispositivo_fingerprint_raw: DeviceFingerprintData | null;

  created_at: string;
  updated_at: string;

  // Dados expandidos via join (opcional)
  /** Cliente completo populável via join */
  cliente_dados?: ClienteBase;
  /** Partes contrárias populável via join */
  parte_contraria_dados?: ParteContraria[];
}

/**
 * Resultado de auditoria de integridade de assinatura digital.
 *
 * Usado pela função auditSignatureIntegrity para retornar análise detalhada
 * de conformidade legal (MP 2.200-2/2001) de assinaturas concluídas.
 */
export interface AuditResult {
  /** ID da assinatura auditada */
  assinatura_id: number;
  /** Protocolo da assinatura */
  protocolo: string;
  /** Status da auditoria */
  status: "valido" | "invalido" | "erro";
  /** Se os hashes conferem */
  hashes_validos: boolean;
  /** Hash original registrado no banco */
  hash_original_registrado: string;
  /** Hash original recalculado (se disponível) */
  hash_original_recalculado?: string;
  /** Hash final registrado no banco */
  hash_final_registrado: string;
  /** Hash final recalculado do PDF armazenado */
  hash_final_recalculado: string;
  /** Se a entropia do fingerprint é suficiente */
  entropia_suficiente: boolean;
  /** Detalhes da entropia */
  entropia_detalhes?: {
    campos_presentes: number;
    campos_obrigatorios: number;
    campos_recomendados: number;
  };
  /** Se a foto está embedada (se aplicável) */
  foto_embedada?: boolean;
  /** Mensagens de aviso */
  avisos: string[];
  /** Mensagens de erro */
  erros: string[];
  /** Timestamp da auditoria */
  auditado_em: string;
}

// #endregion

// Re-export domain types para conveniência
export type {
  ClienteBase,
  ClientePessoaFisica,
  ParteContraria,
} from "@/app/(authenticated)/partes";

// =============================================================================
// NOVO FLUXO: Documento via upload de PDF + links públicos
// =============================================================================

export type AssinaturaDigitalDocumentoStatus =
  | "rascunho"
  | "pronto"
  | "concluido"
  | "cancelado";

export type AssinaturaDigitalDocumentoAssinanteTipo =
  | "cliente"
  | "parte_contraria"
  | "representante"
  | "terceiro"
  | "usuario"
  | "convidado";

export type AssinaturaDigitalDocumentoAncoraTipo = "assinatura" | "rubrica";

export interface AssinaturaDigitalDocumento {
  id: number;
  documento_uuid: string;
  titulo?: string | null;
  status: AssinaturaDigitalDocumentoStatus;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  pdf_final_url?: string | null;
  hash_original_sha256?: string | null;
  hash_final_sha256?: string | null;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssinaturaDigitalDocumentoAssinante {
  id: number;
  documento_id: number;
  assinante_tipo: AssinaturaDigitalDocumentoAssinanteTipo;
  assinante_entidade_id?: number | null;
  dados_snapshot: Record<string, unknown>;
  dados_confirmados: boolean;
  token: string;
  status: "pendente" | "concluido";
  /** Data/hora de expiração do token. NULL = sem expiração (retrocompatibilidade). */
  expires_at?: string | null;
  selfie_url?: string | null;
  assinatura_url?: string | null;
  rubrica_url?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  geolocation?: Record<string, unknown> | null;
  termos_aceite_versao?: string | null;
  termos_aceite_data?: string | null;
  dispositivo_fingerprint_raw?: Record<string, unknown> | null;
  concluido_em?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssinaturaDigitalDocumentoAncora {
  id: number;
  documento_id: number;
  documento_assinante_id: number;
  tipo: AssinaturaDigitalDocumentoAncoraTipo;
  pagina: number;
  x_norm: number;
  y_norm: number;
  w_norm: number;
  h_norm: number;
  created_at?: string;
}

export interface CreateAssinaturaDigitalDocumentoAssinanteInput {
  assinante_tipo: AssinaturaDigitalDocumentoAssinanteTipo;
  assinante_entidade_id?: number | null;
  dados_snapshot?: Record<string, unknown>;
}

export interface CreateAssinaturaDigitalDocumentoInput {
  titulo?: string | null;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  hash_original_sha256?: string | null;
  created_by?: number | null;
  assinantes: CreateAssinaturaDigitalDocumentoAssinanteInput[];
}

export interface UpsertAssinaturaDigitalDocumentoAncoraInput {
  documento_assinante_id: number;
  tipo: AssinaturaDigitalDocumentoAncoraTipo;
  pagina: number;
  x_norm: number;
  y_norm: number;
  w_norm: number;
  h_norm: number;
}

// =============================================================================
// TIPOS PARA PÁGINA DE VERIFICAÇÃO
// =============================================================================

export interface SignatarioVerificacaoData {
  id: number;
  tipo: string;
  nome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  status: string;
  concluidoEm?: string | null;
  token?: string;
  publicLink?: string;
  assinaturaUrl?: string | null;
  selfieUrl?: string | null;
  rubricaUrl?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  geolocation?: {
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    timestamp?: string | null;
  } | null;
  dispositivoFingerprint?: Record<string, unknown> | null;
  termosAceiteVersao?: string | null;
  termosAceiteData?: string | null;
}

export interface DocumentoVerificacaoData {
  tipo: "documento" | "formulario";
  id: number;
  uuid: string;
  titulo: string;
  status: string;
  pdfUrl: string;
  pdfOriginalUrl?: string | null;
  pdfFinalUrl?: string | null;
  hashOriginal?: string | null;
  hashFinal?: string | null;
  createdAt: string;
  protocolo?: string | null;
  clienteNome?: string | null;
  clienteCpf?: string | null;
  selfieHabilitada?: boolean;
  signatarios: SignatarioVerificacaoData[];
}
