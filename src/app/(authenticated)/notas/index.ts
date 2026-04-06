/**
 * NOTAS MODULE - Exports
 *
 * Re-exporta tipos, schemas, serviços e actions do módulo de notas.
 * Este arquivo é o ponto de entrada para consumidores externos.
 */

// =============================================================================
// DOMAIN - Tipos, Schemas e Constantes
// =============================================================================

export {
  // Schemas
  noteTypeSchema,
  noteChecklistItemSchema,
  noteLabelSchema,
  noteSchema,
  notasPayloadSchema,
  listNotasSchema,
  createNotaSchema,
  updateNotaSchema,
  deleteNotaSchema,
  setNotaArquivadaSchema,
  createEtiquetaSchema,
  updateEtiquetaSchema,
  deleteEtiquetaSchema,

  // Tipos
  type NoteType,
  type NoteChecklistItem,
  type NoteLabel,
  type Note,
  type NotasPayload,
  type ListNotasInput,
  type CreateNotaInput,
  type UpdateNotaInput,
  type DeleteNotaInput,
  type SetNotaArquivadaInput,
  type CreateEtiquetaInput,
  type UpdateEtiquetaInput,
  type DeleteEtiquetaInput,
} from './domain';

// =============================================================================
// SERVICE - Casos de Uso
// =============================================================================

export {
  listarDadosNotas,
  criarNota,
  atualizarNota,
  arquivarNota,
  excluirNota,
  criarEtiqueta,
  atualizarEtiqueta,
  excluirEtiqueta,
} from './service';

// =============================================================================
// ACTIONS - Server Actions
// =============================================================================

export {
  actionListarDadosNotas,
  actionCriarNota,
  actionAtualizarNota,
  actionArquivarNota,
  actionExcluirNota,
  actionCriarEtiqueta,
  actionAtualizarEtiqueta,
  actionExcluirEtiqueta,
  actionPingNotas,
} from './actions/notas-actions';
