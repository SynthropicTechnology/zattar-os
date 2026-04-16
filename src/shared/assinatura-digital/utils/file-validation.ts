/**
 * ASSINATURA DIGITAL - File Validation Utilities
 *
 * Implementa validação de arquivos por magic bytes para prevenir
 * uploads de arquivos maliciosos com MIME type spoofado.
 */

/**
 * PDF Magic Bytes: %PDF- (hex: 25 50 44 46 2D)
 * Alguns PDFs podem ter bytes BOM antes do header, então verificamos os primeiros 1024 bytes
 */
const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-

/**
 * Resultado da validação de arquivo
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Opções para validação de PDF
 */
export interface PdfValidationOptions {
  /** Tamanho máximo em bytes (default: 50MB) */
  maxSize?: number;
  /** Verificar marcador EOF (default: false - alguns PDFs válidos não têm) */
  checkEof?: boolean;
}

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Valida se um buffer contém um arquivo PDF válido baseado em magic bytes.
 *
 * Verifica:
 * 1. Magic bytes: %PDF- nos primeiros 1024 bytes (permite BOM e whitespace)
 * 2. Tamanho máximo do arquivo
 * 3. Opcionalmente, marcador %%EOF no final
 *
 * @param buffer - Buffer do arquivo
 * @param options - Opções de validação
 * @returns Resultado da validação
 */
export function validatePdfBuffer(
  buffer: Buffer,
  options: PdfValidationOptions = {}
): FileValidationResult {
  const { maxSize = DEFAULT_MAX_SIZE, checkEof = false } = options;

  // Validar tamanho
  if (buffer.length > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo permitido: ${maxSizeMB}MB`,
    };
  }

  // Validar tamanho mínimo (pelo menos os magic bytes)
  if (buffer.length < PDF_MAGIC_BYTES.length) {
    return {
      valid: false,
      error: "Arquivo muito pequeno para ser um PDF válido",
    };
  }

  // Procurar magic bytes nos primeiros 1024 bytes
  // Isso permite arquivos com BOM (Byte Order Mark) ou whitespace inicial
  const searchRange = Math.min(1024, buffer.length);
  const headerBytes = buffer.subarray(0, searchRange);

  let foundMagicBytes = false;
  for (let i = 0; i <= searchRange - PDF_MAGIC_BYTES.length; i++) {
    if (headerBytes.subarray(i, i + PDF_MAGIC_BYTES.length).equals(PDF_MAGIC_BYTES)) {
      foundMagicBytes = true;
      break;
    }
  }

  if (!foundMagicBytes) {
    return {
      valid: false,
      error: "Arquivo inválido. O conteúdo não corresponde a um PDF válido.",
    };
  }

  // Verificar marcador EOF (opcional, pois alguns PDFs válidos podem não ter)
  if (checkEof) {
    const tailBytes = buffer.subarray(-1024);
    const eofMarker = Buffer.from("%%EOF");
    if (!tailBytes.includes(eofMarker)) {
      return {
        valid: false,
        error: "Arquivo PDF malformado. Marcador de fim não encontrado.",
      };
    }
  }

  return { valid: true };
}

/**
 * Valida um arquivo File do FormData como PDF.
 *
 * Esta função converte o File para Buffer e valida os magic bytes.
 *
 * @param file - Arquivo do FormData
 * @param options - Opções de validação
 * @returns Resultado da validação e o buffer do arquivo se válido
 */
export async function validatePdfFile(
  file: File,
  options: PdfValidationOptions = {}
): Promise<FileValidationResult & { buffer?: Buffer }> {
  // Validação básica do tipo MIME (primeira linha de defesa)
  if (file.type && file.type !== "application/pdf") {
    return {
      valid: false,
      error: "Tipo de arquivo inválido. Apenas PDFs são permitidos.",
    };
  }

  // Converter para buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validar magic bytes
  const result = validatePdfBuffer(buffer, options);

  if (!result.valid) {
    return result;
  }

  return { valid: true, buffer };
}

/**
 * Tipos de arquivo suportados para validação futura
 */
export const SUPPORTED_MAGIC_BYTES = {
  PDF: { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], extension: ".pdf" }, // %PDF-
  PNG: { bytes: [0x89, 0x50, 0x4e, 0x47], extension: ".png" }, // .PNG
  JPEG: { bytes: [0xff, 0xd8, 0xff], extension: ".jpg" }, // JPEG SOI
  GIF: { bytes: [0x47, 0x49, 0x46, 0x38], extension: ".gif" }, // GIF8
  WEBP: { bytes: [0x52, 0x49, 0x46, 0x46], extension: ".webp" }, // RIFF (+ WEBP check)
} as const;

/**
 * Detecta o tipo real do arquivo baseado em magic bytes.
 *
 * @param buffer - Buffer do arquivo
 * @returns Tipo detectado ou null se não reconhecido
 */
export function detectFileType(buffer: Buffer): keyof typeof SUPPORTED_MAGIC_BYTES | null {
  if (buffer.length < 4) return null;

  for (const [type, { bytes }] of Object.entries(SUPPORTED_MAGIC_BYTES)) {
    const magic = Buffer.from(bytes);
    if (buffer.subarray(0, magic.length).equals(magic)) {
      // Verificação adicional para WEBP (RIFF é usado por vários formatos)
      if (type === "WEBP" && buffer.length >= 12) {
        const webpMarker = buffer.subarray(8, 12).toString("ascii");
        if (webpMarker !== "WEBP") continue;
      }
      return type as keyof typeof SUPPORTED_MAGIC_BYTES;
    }
  }

  return null;
}

// ============================================================================
// VALIDAÇÃO DE IMAGENS BASE64 (assinatura, selfie, rubrica)
// ============================================================================

/**
 * Tipos de imagem permitidos para assinatura digital
 */
export type AllowedImageType = "PNG" | "JPEG";

/**
 * Opções para validação de imagem base64
 */
export interface ImageBase64ValidationOptions {
  /** Tamanho máximo em bytes (default: 5MB) */
  maxSize?: number;
  /** Tipos de imagem permitidos (default: PNG e JPEG) */
  allowedTypes?: AllowedImageType[];
  /** Nome do campo para mensagens de erro */
  fieldName?: string;
}

/**
 * Resultado da validação de imagem base64
 */
export interface ImageBase64ValidationResult {
  valid: boolean;
  error?: string;
  /** Tipo de imagem detectado */
  detectedType?: AllowedImageType;
  /** Tamanho do buffer em bytes */
  size?: number;
  /** Buffer decodificado (para uso posterior) */
  buffer?: Buffer;
}

/** Tamanho máximo padrão para imagens: 5MB */
const DEFAULT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

/** Tipos de imagem permitidos por padrão */
const DEFAULT_ALLOWED_TYPES: AllowedImageType[] = ["PNG", "JPEG"];

/**
 * Valida uma string data URL base64 de imagem.
 *
 * Verifica:
 * 1. Formato da data URL (data:image/...;base64,...)
 * 2. MIME type declarado corresponde aos tipos permitidos
 * 3. Tamanho máximo do buffer decodificado
 * 4. Magic bytes correspondem ao tipo de imagem real
 *
 * @param dataUrl - String data URL (ex: "data:image/png;base64,iVBOR...")
 * @param options - Opções de validação
 * @returns Resultado da validação
 *
 * @example
 * ```typescript
 * const result = validateImageBase64(assinatura_base64, {
 *   maxSize: 2 * 1024 * 1024, // 2MB
 *   fieldName: 'assinatura'
 * });
 * if (!result.valid) {
 *   throw new Error(result.error);
 * }
 * ```
 */
export function validateImageBase64(
  dataUrl: string | null | undefined,
  options: ImageBase64ValidationOptions = {}
): ImageBase64ValidationResult {
  const {
    maxSize = DEFAULT_IMAGE_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    fieldName = "imagem",
  } = options;

  // Verificar se a string foi fornecida
  if (!dataUrl) {
    return { valid: true }; // Campo opcional não fornecido
  }

  // Validar formato da data URL
  const dataUrlRegex = /^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)$/;
  const matches = dataUrl.match(dataUrlRegex);

  if (!matches) {
    return {
      valid: false,
      error: `${fieldName}: Formato inválido. Esperado data URL de imagem (data:image/png;base64,... ou data:image/jpeg;base64,...)`,
    };
  }

  const declaredMimeType = matches[1].toUpperCase() === "JPG" ? "JPEG" : matches[1].toUpperCase();
  const base64Data = matches[2];

  // Verificar se o tipo declarado é permitido
  if (!allowedTypes.includes(declaredMimeType as AllowedImageType)) {
    return {
      valid: false,
      error: `${fieldName}: Tipo de imagem não permitido (${declaredMimeType}). Tipos aceitos: ${allowedTypes.join(", ")}`,
    };
  }

  // Decodificar base64
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, "base64");
  } catch {
    return {
      valid: false,
      error: `${fieldName}: Dados base64 inválidos`,
    };
  }

  // Verificar tamanho
  if (buffer.length > maxSize) {
    const maxSizeKB = Math.round(maxSize / 1024);
    const actualSizeKB = Math.round(buffer.length / 1024);
    return {
      valid: false,
      error: `${fieldName}: Imagem muito grande (${actualSizeKB}KB). Tamanho máximo: ${maxSizeKB}KB`,
    };
  }

  // Verificar tamanho mínimo
  if (buffer.length < 8) {
    return {
      valid: false,
      error: `${fieldName}: Imagem muito pequena para ser válida`,
    };
  }

  // Verificar magic bytes
  const detectedType = detectFileType(buffer);

  if (!detectedType || !["PNG", "JPEG"].includes(detectedType)) {
    return {
      valid: false,
      error: `${fieldName}: Conteúdo não corresponde a uma imagem válida (PNG ou JPEG)`,
    };
  }

  // Verificar se o tipo detectado corresponde ao declarado
  if (detectedType !== declaredMimeType) {
    return {
      valid: false,
      error: `${fieldName}: Tipo declarado (${declaredMimeType}) não corresponde ao conteúdo real (${detectedType})`,
    };
  }

  return {
    valid: true,
    detectedType: detectedType as AllowedImageType,
    size: buffer.length,
    buffer,
  };
}

/**
 * Valida múltiplas imagens base64 de uma vez.
 *
 * Útil para validar assinatura, selfie e rubrica em uma única chamada.
 *
 * @param images - Objeto com as imagens a validar
 * @param options - Opções de validação (aplicadas a todas)
 * @returns Objeto com resultados por campo e flag de sucesso geral
 *
 * @example
 * ```typescript
 * const results = validateMultipleImages({
 *   assinatura_base64: payload.assinatura_base64,
 *   selfie_base64: payload.selfie_base64,
 *   rubrica_base64: payload.rubrica_base64,
 * });
 *
 * if (!results.allValid) {
 *   return NextResponse.json({
 *     error: "Imagens inválidas",
 *     details: results.errors
 *   }, { status: 400 });
 * }
 * ```
 */
export function validateMultipleImages(
  images: Record<string, string | null | undefined>,
  options: Omit<ImageBase64ValidationOptions, "fieldName"> = {}
): {
  allValid: boolean;
  results: Record<string, ImageBase64ValidationResult>;
  errors: Record<string, string[]>;
} {
  const results: Record<string, ImageBase64ValidationResult> = {};
  const errors: Record<string, string[]> = {};
  let allValid = true;

  for (const [fieldName, dataUrl] of Object.entries(images)) {
    const result = validateImageBase64(dataUrl, { ...options, fieldName });
    results[fieldName] = result;

    if (!result.valid && result.error) {
      allValid = false;
      errors[fieldName] = [result.error];
    }
  }

  return { allValid, results, errors };
}
