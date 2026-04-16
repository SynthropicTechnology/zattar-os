/**
 * Utilitários para manipulação de base64 e data URLs
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Decodifica uma data URL em Buffer e contentType
 */
export function decodeDataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string } {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL format');
  }

  const contentType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  return { buffer, contentType };
}

/**
 * Gera nome de arquivo único com prefixo e extensão
 */
export function buildFileName(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const uuid = uuidv4().slice(0, 8);
  return `${prefix}_${timestamp}_${uuid}.${extension}`;
}

/**
 * Codifica Buffer em data URL
 */
export function encodeBufferToDataUrl(buffer: Buffer, contentType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${contentType};base64,${base64}`;
}
