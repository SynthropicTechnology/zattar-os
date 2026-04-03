/**
 * ASSINATURA DIGITAL - Utils barrel export
 */

export { generateZodSchema } from "./zod-schema-generator";

// Formatadores
export {
  formatCPF,
  parseCPF,
  formatCNPJ,
  parseCNPJ,
  formatCpfCnpj,
  parseCpfCnpj,
  formatTelefone,
  parseTelefone,
  formatCelularWithCountryCode,
  formatCEP,
  parseCEP,
  formatData,
  formatDataHora,
  parseDataBR,
} from "./formatters";

// Validadores
export {
  validateCPF,
  validateCNPJ,
  validateTelefone,
  validateCpfCnpj,
} from "./validators";

// Validações de negócio / UX (retornam { valid, message/issues })
export {
  TEXT_LIMITS,
  validateTextLength,
  validateBirthDate,
  validateBrazilianPhone,
  validateCPFDigits,
  validateEmail,
  validateCEP,
  validateGeolocation,
  validatePhotoQuality,
  validateSignatureQuality,
  validateDataConsistency,
} from "./business-validations";

// Schema builder (validação de schema dinâmico)
export { validateFormSchema } from "./form-schema-validation";

// Signature metrics
export type { AssinaturaMetrics } from "./signature-metrics";

// Device Fingerprint
export { collectDeviceFingerprint } from "./device-fingerprint";

// Display Utils (badges, formatação de nomes, truncate, etc.)
export {
  // Template utils
  formatFileSize,
  formatTemplateStatus,
  getStatusBadgeVariant,
  getTemplateDisplayName,
  // Segmento utils
  getSegmentoDisplayName,
  // Formulario utils
  getFormularioDisplayName,
  getTemplatePreviewText,
  // Generic badge utils
  truncateText,
  formatAtivoBadge,
  formatAtivoStatus,
  getAtivoBadgeVariant,
  getAtivoBadgeTone,
  formatBooleanBadge,
  getBooleanBadgeVariant,
} from "./display";

// Slug Helpers
export {
  SLUG_PATTERN,
  normalizeString,
  generateSlug,
  generateFormularioSlug,
  validateSlug,
} from "./slug-helpers";

// Rate Limiting - Server-only, import directly:
// import { applyRateLimit, checkPublicRateLimit } from "@/app/(authenticated)/assinatura-digital/feature/utils/rate-limit";

// File Validation (magic bytes para PDF e imagens)
export type {
  FileValidationResult,
  PdfValidationOptions,
  AllowedImageType,
  ImageBase64ValidationOptions,
  ImageBase64ValidationResult,
} from "./file-validation";
export {
  validatePdfBuffer,
  validatePdfFile,
  detectFileType,
  validateImageBase64,
  validateMultipleImages,
  SUPPORTED_MAGIC_BYTES,
} from "./file-validation";

// Token Expiration
export type { TokenExpirationCheck } from "./token-expiration";
export {
  checkTokenExpiration,
  calculateTokenExpiration,
  calculatePostSignatureExpiration,
  formatRemainingTime,
} from "./token-expiration";
