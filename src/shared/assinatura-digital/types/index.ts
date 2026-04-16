/**
 * ASSINATURA DIGITAL - Types barrel export
 *
 * Re-exporta todos os tipos do módulo de assinatura digital.
 */

// Domain types (entities, schemas, enums)
export type {
  TipoTemplate,
  StatusTemplate,
  MetadadoSeguranca,
  CreateSegmentoInput,
  UpdateSegmentoInput,
  Segmento,
  CreateTemplateInput,
  UpdateTemplateInput,
  Template,
  CreateFormularioInput,
  UpdateFormularioInput,
  Formulario,
  ValidationRule,
  FormFieldOption,
  ConditionalRule,
  FormFieldSchema,
  FormSectionSchema,
  CrossFieldValidation,
  DynamicFormSchema,
  FormFieldValue,
  DynamicFormData,
  CreateAssinaturaDigitalInput,
  UpdateAssinaturaDigitalInput,
  AssinaturaDigital,
  // Upload/Form types
  UploadPdfResult,
  TemplateFormData,
} from "./domain";

// Extended domain (entities with DB-level columns) from shared/domain.ts
export type {
  AssinaturaDigitalTemplate,
  AssinaturaDigitalTemplateList,
  AssinaturaDigitalSegmento,
  AssinaturaDigitalSegmentoList,
  AssinaturaDigitalFormulario,
  AssinaturaDigitalFormularioList,
  UpsertTemplateInput,
  UpsertSegmentoInput,
  UpsertFormularioInput,
  AssinaturaDigitalDocumento,
  AssinaturaDigitalDocumentoStatus,
  AssinaturaDigitalDocumentoAssinante,
  AssinaturaDigitalDocumentoAssinanteTipo,
  AssinaturaDigitalDocumentoAncora,
  AssinaturaDigitalDocumentoAncoraTipo,
  AssinaturaDigitalDocumentoCompleto,
} from "../domain";

export {
  FormFieldType,
  createSegmentoSchema,
  createSegmentoSchema as segmentoSchema, // Alias para retrocompatibilidade
  updateSegmentoSchema,
  createTemplateSchema,
  updateTemplateSchema,
  createFormularioSchema,
  updateFormularioSchema,
  createAssinaturaDigitalSchema,
  updateAssinaturaDigitalSchema,
  fieldRequiresOptions,
  isFormattedBRField,
  // Upload/Form schemas
  uploadPdfSchema,
  templateFormSchema,
} from "./domain";

// PDF preview/editor (zoom/canvas) - usados por `components/pdf/*` e `components/editor/*`
export type {
  PdfPreviewProps,
  PdfPageInfo,
  PdfLoadState,
  PdfZoomConfig,
} from "./pdf-preview.types";

export {
  DEFAULT_ZOOM_CONFIG,
  PDF_CANVAS_SIZE,
} from "./pdf-preview.types";

// API types (payloads, responses, records)
export type {
  DeviceFingerprintData,
  PreviewPayload,
  PreviewResult,
  FinalizePayload,
  FinalizeResult,
  SessaoAssinaturaRecord,
  ListSessoesParams,
  ListSessoesResult,
  AssinaturaDigitalRecord,
  AuditResult,
  ListTemplatesParams,
  TemplateListResponse,
  ListSegmentosParams,
  SegmentoListResponse,
  ListFormulariosParams,
  FormularioListResponse,
  DashboardStats,
  VisualizacaoPdfData,
  VisualizacaoMarkdownData,
  ClienteDadosGeracao,
  DadosGeracao,
  SalvarAcaoRequest,
} from "./api";

// Store types
export type {
  ClienteAssinaturaDigital,
  ContratoPendente,
  DadosCPF,
  DadosPessoaisStore,
  DadosPessoaisDraft,
  DadosContratoStore,
  DadosAssinaturaStore,
  PdfGerado,
  StepConfig,
  FormularioFlowConfig,
  FormularioState,
  FormularioActions,
  FormularioStore,
} from "./store";

// Template types for PDF generation (versão portuguesa, alinhada com DB)
export type {
  TipoVariavel,
  PosicaoCampo,
  EstiloCampo,
  ConteudoComposto,
  TemplateCampo,
  TemplateCampo as TemplateCampoPdf, // Alias para retrocompatibilidade
} from "./template.types";

// Editor helper types and functions live in the admin area now.
// Import directly from @/app/(authenticated)/assinatura-digital/components/editor/editor-helpers
