/**
 * ASSINATURA DIGITAL - Tipos do Store (Zustand)
 *
 * Tipos específicos para o gerenciamento de estado do formulário multi-step.
 */

import type {
  DynamicFormSchema,
  Template,
  MetadadoSeguranca,
} from './domain';
import type {
  DeviceFingerprintData,
  VisualizacaoPdfData,
  VisualizacaoMarkdownData,
} from './api';

// =============================================================================
// CLIENTE ASSINATURA DIGITAL
// =============================================================================

/**
 * Dados do cliente adaptados para o fluxo de assinatura digital
 */
export interface ClienteAssinaturaDigital {
  id: number;
  nome: string;
  cpf?: string | null;
  rg?: string | null;
  data_nascimento?: string | null;
  estado_civil?: string | null;
  genero?: string | null;
  nacionalidade?: string | null;
  email?: string | null;
  celular?: string | null;
  telefone?: string | null;
  // Endereço
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
}

// =============================================================================
// ETAPAS DO FORMULÁRIO
// =============================================================================

export interface DadosCPF {
  cpf: string;
  clienteExistente: boolean;
  clienteId?: number;
  dadosCliente?: ClienteAssinaturaDigital;
}

/**
 * Contrato pendente (em_contratacao sem assinatura concluída).
 * Retornado pela API verificar-cpf quando o cliente tem contratos não assinados.
 */
export interface ContratoPendente {
  id: number;
  segmento_id: number;
  segmento_nome: string | null;
  cadastrado_em: string;
  observacoes: string | null;
  partes: Array<{
    tipo_entidade: string;
    nome_snapshot: string | null;
    cpf_cnpj_snapshot: string | null;
    papel_contratual: string;
  }>;
}

/**
 * Dados pessoais do cliente armazenados no store.
 * Todos os campos usam snake_case para compatibilidade com API.
 */
export interface DadosPessoaisStore {
  cliente_id: number;
  nome_completo: string;
  cpf: string;
  rg?: string;
  data_nascimento: string;
  estado_civil: string;
  genero: string;
  nacionalidade: string;
  email: string;
  celular: string;
  telefone?: string;
  endereco_cep: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento?: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_uf: string;
}

export interface DadosContratoStore {
  contrato_id: number | null;
  [key: string]: unknown;
}

/**
 * Draft acumulado dos substeps de Dados Pessoais (Identidade / Contatos / Endereço).
 * Vive apenas em memória/sessionStorage até o último substep (Endereço) persistir o cliente.
 * Todos os campos são opcionais porque cada substep preenche uma fatia.
 */
export interface DadosPessoaisDraft {
  // Identidade
  name?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  genero?: string;
  nacionalidade?: string;
  estadoCivil?: string;
  // Contatos
  email?: string;
  celular?: string;
  telefone?: string;
  // Endereço
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

/**
 * Dados da assinatura coletados durante o fluxo.
 * assinatura_id pode ser null quando n8n falha ao salvar metadados
 * mas o PDF é gerado com sucesso (sucesso parcial).
 */
export interface DadosAssinaturaStore {
  assinatura_id: number | null;
  assinatura_base64: string;
  foto_base64: string;
  ip_address: string;
  user_agent: string;
  latitude?: number;
  longitude?: number;
  geolocation_accuracy?: number;
  geolocation_timestamp?: string;
  data_assinatura: string;
  dispositivo_fingerprint_raw?: DeviceFingerprintData | null;
}

export interface PdfGerado {
  template_id: string;
  pdf_url: string;
  protocolo: string;
  assinatura_id: number | null;
}

// =============================================================================
// CONFIGURAÇÃO DE ETAPAS
// =============================================================================

export interface StepConfig {
  id: string;
  index: number;
  component: string;
  required: boolean;
  enabled: boolean;
}

/**
 * Configuração de controle de fluxo do formulário.
 * Define quais etapas são obrigatórias durante o preenchimento.
 */
export interface FormularioFlowConfig {
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
  metadados_seguranca?: MetadadoSeguranca[];
}

// =============================================================================
// STATE DO STORE
// =============================================================================

export interface FormularioState {
  // Dados do contexto
  segmentoId: number | null;
  formularioId: number | null;
  templateIds: string[] | null;
  templateIdSelecionado: string | null;
  sessaoId: string | null;

  // Cache de dados
  formSchema: DynamicFormSchema | null;
  formularioNome: string | null;
  segmentoNome: string | null;
  formularioFlowConfig: FormularioFlowConfig | null;
  cachedTemplates: Map<string, Template>;

  // Etapa atual
  etapaAtual: number;

  // Dados das etapas
  dadosCPF: DadosCPF | null;
  dadosPessoais: DadosPessoaisStore | null;
  dadosContrato: DadosContratoStore | null;
  dadosVisualizacaoPdf: VisualizacaoPdfData | null;
  dadosVisualizacaoMarkdown: VisualizacaoMarkdownData | null;
  dadosAssinatura: DadosAssinaturaStore | null;
  pdfsGerados: PdfGerado[] | null;

  // Dados temporários
  fotoBase64: string | null;
  assinaturaBase64: string | null;
  latitude: number | null;
  longitude: number | null;
  geolocationAccuracy: number | null;
  geolocationTimestamp: string | null;

  // Termos de aceite
  termosAceite: boolean | null;
  termosVersao: string | null;
  termosDataAceite: string | null;

  // Contratos pendentes (não assinados)
  contratosPendentes: ContratoPendente[] | null;

  // Configuração dinâmica
  stepConfigs: StepConfig[] | null;
  pdfUrlFinal: string | null;

  // Draft acumulado do sub-wizard Dados Pessoais (persistido em sessionStorage)
  dadosPessoaisDraft: DadosPessoaisDraft | null;

  // Flag de idempotência — garante que persistência da ação só dispara uma vez
  contratoJaCriado: boolean;

  // Metadata do cache persistido (timestamp e versão do schema)
  _timestamp: number | null;
  _schemaVersion: number | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
}

export interface FormularioActions {
  setContexto: (segmentoId: number, formularioId: number) => void;
  hydrateContext: (ctx: {
    segmentoId: number;
    formularioId: number;
    templateIds?: string[];
    formularioNome?: string;
    segmentoNome?: string;
    formSchema?: DynamicFormSchema;
    flowConfig?: FormularioFlowConfig;
  }) => void;
  setTemplateIds: (templateIds: string[]) => void;
  setTemplateIdSelecionado: (templateId: string) => void;
  setSessaoId: (sessaoId: string) => void;
  setFormSchema: (schema: DynamicFormSchema | null) => void;
  setFormularioFlowConfig: (config: FormularioFlowConfig | null) => void;
  getCachedTemplate: (templateId: string) => Template | undefined;
  setCachedTemplate: (templateId: string, template: Template) => void;
  clearTemplateCache: () => void;
  setEtapaAtual: (etapa: number) => void;
  setDadosCPF: (dados: DadosCPF) => void;
  setDadosPessoais: (dados: DadosPessoaisStore) => void;
  setDadosContrato: (dados: Partial<DadosContratoStore>) => void;
  setDadosVisualizacaoPdf: (dados: VisualizacaoPdfData | null) => void;
  setDadosVisualizacaoMarkdown: (dados: VisualizacaoMarkdownData | null) => void;
  setDadosAssinatura: (dados: DadosAssinaturaStore) => void;
  setPdfsGerados: (pdfs: PdfGerado[]) => void;
  setFotoBase64: (foto: string) => void;
  setAssinaturaBase64: (assinatura: string) => void;
  setGeolocation: (latitude: number, longitude: number, accuracy: number, timestamp: string) => void;
  clearGeolocation: () => void;
  setTermosAceite: (aceite: boolean, versao: string, dataAceite: string) => void;
  clearTermosAceite: () => void;
  setContratosPendentes: (contratos: ContratoPendente[]) => void;
  clearContratosPendentes: () => void;
  mergeDadosPessoaisDraft: (patch: Partial<DadosPessoaisDraft>) => void;
  getDadosPessoaisDraft: () => DadosPessoaisDraft;
  resetDadosPessoaisDraft: () => void;
  setContratoJaCriado: (flag: boolean) => void;
  setStepConfigs: (configs: StepConfig[]) => void;
  getStepByIndex: (index: number) => StepConfig | undefined;
  getTotalSteps: () => number;
  getCurrentStepConfig: () => StepConfig | undefined;
  setPdfUrlFinal: (url: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  resetFormulario: () => void;
  resetAll: () => void;
  proximaEtapa: () => void;
  etapaAnterior: () => void;
}

export type FormularioStore = FormularioState & FormularioActions;
