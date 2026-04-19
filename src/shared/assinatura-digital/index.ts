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
// PdfPreviewDynamic é o export canônico (dynamic import com ssr:false internamente).
// PdfPreview NÃO é re-exportado daqui — importa react-pdf estaticamente, o que
// causa `ReferenceError: DOMMatrix is not defined` quando o barrel é avaliado em
// contexto server (ex: qualquer step do wizard importando `sucesso.tsx` que
// importa deste barrel). Ver src/shared/assinatura-digital/components/pdf/index.ts
export { PdfPreviewDynamic } from './components/pdf'
export { default as CanvasAssinatura } from './components/signature/canvas-assinatura'

// Public wizard shell (rota pública de assinatura digital)
export {
  PublicWizardShell,
  PublicWizardHeader,
  PublicWizardProgress,
  PublicStepCard,
  PublicStepFooter,
  DocumentPeekCard,
  SelfieCaptureSheet,
  SuccessHero,
  type PublicWizardStep,
} from './components/public-shell'

// Hooks
export { usePresignedPdfUrl } from './hooks/use-presigned-pdf-url'
export {
  useWizardProgress,
  type WizardProgress,
} from './hooks/use-wizard-progress'

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

// Pacote de assinatura (agrupamento de múltiplos documentos sob 1 link compartilhado)
export { criarPacote, lerPacotePorToken } from './services/pacote.service'
export type {
  Pacote,
  PacoteComDocumentos,
  DocumentoNoPacote,
  PacoteStatus,
} from './types/pacote'
export { criarPacoteInputSchema } from './schemas/pacote'
export type { CriarPacoteInput } from './schemas/pacote'
