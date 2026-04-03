/**
 * PEÇAS JURÍDICAS FEATURE
 *
 * Módulo para gestão de modelos de peças jurídicas e geração
 * de documentos a partir de contratos.
 *
 * @example
 * ```typescript
 * import {
 *   // Types
 *   type PecaModelo,
 *   type ContratoDocumento,
 *   type TipoPecaJuridica,
 *
 *   // Constants
 *   TIPO_PECA_LABELS,
 *   TIPOS_PECA_JURIDICA,
 *
 *   // Placeholders
 *   ALL_PLACEHOLDERS,
 *   getAllIndexedPlaceholders,
 *
 *   // Actions
 *   actionCriarPecaModelo,
 *   actionGerarPecaDeContrato,
 * } from '@/app/(authenticated)/pecas-juridicas';
 * ```
 */

// Domain - Types, Schemas, Constants
export {
  // Types
  type PecaModelo,
  type PecaModeloListItem,
  type ContratoDocumento,
  type TipoPecaJuridica,
  type VisibilidadeModelo,
  type CreatePecaModeloInput,
  type UpdatePecaModeloInput,
  type CreateContratoDocumentoInput,
  type GerarPecaInput,
  type ListarPecasModelosParams,
  type ListarContratoDocumentosParams,
  // Constants
  TIPOS_PECA_JURIDICA,
  VISIBILIDADE_MODELO,
  TIPO_PECA_LABELS,
  // Schemas
  createPecaModeloSchema,
  updatePecaModeloSchema,
  createContratoDocumentoSchema,
  gerarPecaSchema,
  tipoPecaJuridicaSchema,
  visibilidadeModeloSchema,
} from './domain';

// Placeholders
export {
  // Types
  type PlaceholderDefinition,
  type PlaceholderCategory,
  type PlaceholderContext,
  type ParteProcessual,
  type PlaceholderResolution,
  type DadosContrato,
  type DadosAdvogado,
  // Constants
  PLACEHOLDER_CATEGORIES,
  PLACEHOLDERS_AUTOR,
  PLACEHOLDERS_REU,
  PLACEHOLDERS_META,
  PLACEHOLDERS_CONTRATO,
  ALL_PLACEHOLDERS,
  // Functions
  getIndexedPlaceholders,
  getAllIndexedPlaceholders,
  groupPlaceholdersByCategory,
  extractPlaceholders,
  isValidPlaceholder,
  resolvePlaceholder,
  resolveAllPlaceholders,
  resolvePlateContent,
  generatePreview,
} from './placeholders';

// Service
export {
  // Modelos
  buscarPecaModelo,
  listarPecasModelos,
  criarPecaModelo,
  atualizarPecaModelo,
  deletarPecaModelo,
  // Geração
  gerarPecaDeContrato,
  previewGeracaoPeca,
  type GerarPecaResult,
  // Contrato Documentos
  listarDocumentosDoContrato,
  vincularDocumentoAoContrato,
  desvincularDocumentoDoContrato,
} from './service';

// Actions
export {
  // Modelos Actions
  actionBuscarPecaModelo,
  actionListarPecasModelos,
  actionCriarPecaModelo,
  actionAtualizarPecaModelo,
  actionDeletarPecaModelo,
  actionGetTiposPecaOptions,
  // Geração Actions
  actionBuscarContextoContrato,
  actionPreviewGeracaoPeca,
  actionGerarPecaDeContrato,
  actionListarDocumentosDoContrato,
  actionDesvincularDocumentoDoContrato,
  // Types
  type ActionResult,
} from './actions';

// Components
export {
  PlaceholderNodeElement,
  PlaceholderNodeStatic,
  PlaceholderInsertMenu,
  PlaceholderToolbarButton,
  GerarPecaDialog,
  ContratoDocumentosList,
  PecasModelosTableWrapper,
  PecaModeloEditor,
  PecaModeloViewSheet,
} from './components';
