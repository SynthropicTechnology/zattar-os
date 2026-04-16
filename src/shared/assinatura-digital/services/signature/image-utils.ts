/**
 * Utilitários de Imagem para Assinatura Digital
 *
 * Funções para inferência de MIME types a partir de magic bytes.
 * A função de decodificação de data URLs é reutilizada do módulo base64.ts.
 *
 * @module signature/image-utils
 */

import { decodeDataUrlToBuffer as decodeDataUrl } from "../base64";

/**
 * Infere o MIME type de um buffer baseado nos magic bytes (assinatura do arquivo).
 * @param buffer - Buffer da imagem
 * @returns MIME type inferido ou padrão 'image/jpeg'
 */
export function inferMimeTypeFromBuffer(buffer: Buffer): string {
  // PNG: 89 50 4E 47
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  // Padrão: assumir JPEG
  return "image/jpeg";
}

/**
 * Decodifica data URL (base64) para Buffer, com suporte a múltiplos formatos.
 *
 * Aceita tanto data URLs completas ('data:image/png;base64,iVBOR...')
 * quanto strings base64 puras (sem prefixo 'data:').
 *
 * Esta função é um wrapper sobre a função utilitária de base64.ts,
 * adicionando suporte a base64 puro e inferência de MIME type.
 *
 * @param dataUrlOrBase64 - Data URL completa ou string base64 pura
 * @returns Buffer com os dados da imagem e mimeType inferido
 * @throws {Error} Se a string for inválida ou não for base64 válido
 */
export function decodeDataUrlToBuffer(dataUrlOrBase64: string): {
  buffer: Buffer;
  mimeType: string;
} {
  // Tentar match de data URL completa primeiro
  if (dataUrlOrBase64.startsWith("data:")) {
    try {
      const { buffer, contentType } = decodeDataUrl(dataUrlOrBase64);
      return { buffer, mimeType: contentType };
    } catch {
      throw new Error(
        "Formato inválido: esperado data URL (data:image/...;base64,...)"
      );
    }
  }

  // Se não é data URL, assumir que é base64 puro
  // Validar que parece ser base64 válido (caracteres alfanuméricos + / e =)
  if (!/^[A-Za-z0-9+/]+=*$/.test(dataUrlOrBase64.trim())) {
    throw new Error(
      "Formato inválido: esperado data URL (data:image/...;base64,...) ou string base64 pura"
    );
  }

  try {
    const buffer = Buffer.from(dataUrlOrBase64, "base64");
    // Se conseguiu decodificar, inferir mimeType padrão baseado nos magic bytes
    const mimeType = inferMimeTypeFromBuffer(buffer);
    return { buffer, mimeType };
  } catch (error) {
    throw new Error(
      `Erro ao decodificar base64: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
