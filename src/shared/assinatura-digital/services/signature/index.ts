/**
 * Barrel exports para o módulo de Assinatura Digital
 *
 * Este módulo centraliza todos os exports públicos do serviço de assinatura,
 * permitindo imports simplificados nos consumidores.
 *
 * @module signature
 */

// =============================================================================
// Validações Legais
// =============================================================================
export {
  validateDeviceFingerprintEntropy,
  validatePhotoEmbedding,
} from "./validation.service";

// =============================================================================
// Preview
// =============================================================================
export { generatePreview } from "./preview.service";

// =============================================================================
// Finalização
// =============================================================================
export { finalizeSignature } from "./finalization.service";

// =============================================================================
// Auditoria
// =============================================================================
export { auditSignatureIntegrity } from "./audit.service";

// =============================================================================
// Storage
// =============================================================================
export { downloadPdfFromStorage } from "./storage-ops.service";
export { downloadFromStorageUrl } from "./storage-ops.service";

// =============================================================================
// Persistência
// =============================================================================
export { buildProtocol, insertAssinaturaRecord } from "./persistence.service";

// =============================================================================
// Utilitários
// =============================================================================
export {
  inferMimeTypeFromBuffer,
  decodeDataUrlToBuffer,
} from "./image-utils";
