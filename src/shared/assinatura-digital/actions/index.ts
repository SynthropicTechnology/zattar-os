/**
 * ASSINATURA DIGITAL ACTIONS - Export Central
 *
 * Re-exporta todas as server actions do módulo de assinatura digital.
 * Organizado por domínio seguindo o padrão FSD.
 *
 * Nota: Cada arquivo de action individual já possui "use server".
 * Este barrel file NÃO deve ter "use server" pois re-exports não são
 * permitidos em arquivos "use server" (Next.js 16+).
 */

// =============================================================================
// Segmentos
// =============================================================================
export {
  listarSegmentosAction,
  criarSegmentoAction,
  atualizarSegmentoAction,
} from "./segmentos-actions";

// =============================================================================
// Templates (Legacy - fluxo original)
// =============================================================================
export {
  listarTemplatesAction,
  criarTemplateAction,
  processarTemplateAction,
  gerarPdfDeMarkdownAction,
} from "./legacy-templates-actions";

// =============================================================================
// Templates (Novo Padrão - authenticatedAction)
// =============================================================================
export {
  actionCreateTemplate,
  actionUpdateTemplate,
  actionDeleteTemplate,
  actionListTemplates,
  actionGetTemplateById,
  actionGetTemplateByUuid,
} from "./templates-actions";

// =============================================================================
// Documentos (Novo Fluxo)
// =============================================================================
export {
  actionCreateDocumento,
  actionGetDocumento,
  actionSetDocumentoAnchors,
  actionAddDocumentoSigner,
  actionRemoveDocumentoSigner,
  actionUpdateDocumentoSettings,
  actionDeleteDocumento,
  actionFinalizeDocumento,
  actionListDocumentos,
  actionDocumentosStats,
  actionGetPresignedPdfUrl,
  actionGetAssinatura,
} from "./documentos-actions";

// =============================================================================
// Partes / Clientes (Busca)
// =============================================================================
export {
  searchClienteByCPF,
  searchParteContraria,
  searchPartesContrariasList,
} from "./partes-actions";

// =============================================================================
// Formulários
// =============================================================================
export {
  listarFormulariosAction,
} from "./formularios-actions";
