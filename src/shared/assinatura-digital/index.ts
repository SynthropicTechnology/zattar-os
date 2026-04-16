/**
 * Barrel de exportação do domínio compartilhado assinatura-digital.
 *
 * Consumido por:
 * - Rota pública (`src/app/(assinatura-digital)/`) — wizard de formulário e assinatura por token
 * - Rota admin  (`src/app/(authenticated)/assinatura-digital/`) — backoffice
 * - API routes (`src/app/api/assinatura-digital/`)
 *
 * Componentes exclusivos do admin (editor, schema-builder, templates, workflow,
 * flow, upload, dialogs de CRUD) vivem em
 * `src/app/(authenticated)/assinatura-digital/components/` e NÃO são exportados daqui.
 */

// Types, constants, actions, service, repository
export * from './types'
export * from './constants'
export * from './actions'
export * from './service'
export * from './repository'

// Store
export { useFormularioStore } from './store/formulario-store'

// UI shared components
export { PdfPreviewDynamic } from './components/pdf'
export { default as PdfPreview } from './components/pdf/PdfPreview'
export { default as CanvasAssinatura } from './components/signature/canvas-assinatura'

// Hooks
export { usePresignedPdfUrl } from './hooks/use-presigned-pdf-url'

// Utils comumente usados
export {
  generateSlug,
  generateFormularioSlug,
  validateSlug,
  formatFileSize,
  getTemplateDisplayName,
  getSegmentoDisplayName,
  getFormularioDisplayName,
  getTemplatePreviewText,
  truncateText,
  formatAtivoBadge,
  formatAtivoStatus,
  getAtivoBadgeTone,
  formatBooleanBadge,
  formatTemplateStatus,
  formatCPF,
  parseCPF,
  formatCNPJ,
  parseCNPJ,
  formatCpfCnpj,
  parseCpfCnpj,
  formatTelefone,
  parseTelefone,
  formatCEP,
  parseCEP,
  formatData,
  formatDataHora,
  parseDataBR,
  collectDeviceFingerprint,
  generateZodSchema,
  validateFormSchema,
} from './utils'

// Services comumente consumidos fora (inclui backend)
export { getSegmentoBySlug } from './services/segmentos.service'
export {
  getFormularioBySlugAndSegmentoId,
} from './services/formularios.service'
export { getTemplate } from './services/templates.service'
export { generatePdfFromTemplate } from './services/template-pdf.service'
export { storePdf } from './services/storage.service'
export { generateMockDataForPreview } from './utils/mock-data-generator'
