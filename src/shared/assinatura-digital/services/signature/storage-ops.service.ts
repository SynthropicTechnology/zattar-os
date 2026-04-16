/**
 * Serviço de Operações de Storage para Assinatura Digital
 *
 * Operações de download de PDFs do Backblaze B2 para auditoria
 * e verificação de integridade.
 *
 * @module signature/storage-ops.service
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { logger, LogServices, LogOperations } from "../logger";

const SERVICE = LogServices.SIGNATURE;

interface StorageLocation {
  bucket: string;
  key: string;
  urlFormat: "backblaze-file" | "virtual-hosted" | "path-style";
}

export function extractStorageLocationFromUrl(fileUrl: string): StorageLocation {
  const urlObj = new URL(fileUrl);
  const pathParts = urlObj.pathname.split("/").filter(Boolean);
  const hostParts = urlObj.hostname.split(".");
  const isBackblazeFileUrl = pathParts[0] === "file" && pathParts.length >= 3;
  const isBackblazeDownloadHost = /^f\d+$/i.test(hostParts[0] ?? "") && urlObj.hostname.includes("backblazeb2.com");

  if (isBackblazeFileUrl) {
    return {
      bucket: pathParts[1],
      key: pathParts.slice(2).join("/"),
      urlFormat: "backblaze-file",
    };
  }

  if (pathParts[0] === "file") {
    throw new Error("URL de storage inválida: formato /file/bucket/key incompleto");
  }

  if (
    hostParts.length > 2 &&
    !hostParts[0].includes("s3") &&
    !isBackblazeDownloadHost &&
    pathParts.length >= 1
  ) {
    return {
      bucket: hostParts[0],
      key: pathParts.join("/"),
      urlFormat: "virtual-hosted",
    };
  }

  if (pathParts.length >= 2) {
    return {
      bucket: pathParts[0],
      key: pathParts.slice(1).join("/"),
      urlFormat: "path-style",
    };
  }

  throw new Error("URL de storage inválida: não foi possível extrair bucket e chave");
}

/**
 * Baixa PDF do Backblaze B2 para auditoria.
 *
 * Usa cliente S3-compatible para acessar o Backblaze B2 e
 * baixar o PDF armazenado para verificação de integridade.
 *
 * @param pdfUrl - URL pública do PDF no storage
 * @returns Buffer do PDF baixado
 * @throws {Error} Se configuração do B2 estiver incompleta ou download falhar
 *
 * @example
 * const pdfBuffer = await downloadPdfFromStorage(
 *   "https://endpoint/bucket/assinaturas/FS-20250110143022-84721.pdf"
 * );
 * const hash = calculateHash(pdfBuffer);
 */
export async function downloadPdfFromStorage(pdfUrl: string): Promise<Buffer> {
  const context = {
    service: SERVICE,
    operation: LogOperations.DOWNLOAD,
  };

  try {
    const buffer = await downloadFromStorageUrl(pdfUrl, context);
    return buffer;
  } catch (error) {
    logger.error("Erro ao baixar PDF do storage", error, context);
    throw new Error(
      `Falha ao baixar PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Baixa qualquer arquivo do storage (Backblaze B2 / S3 compatível) a partir de uma URL.
 *
 * Mantém a mesma lógica de extração bucket+key usada por downloadPdfFromStorage,
 * porém genérica para permitir reuso (ex.: baixar imagens de assinatura/selfie).
 */
export async function downloadFromStorageUrl(
  fileUrl: string,
  baseContext: { service: string; operation: string; [key: string]: unknown }
): Promise<Buffer> {
  // Extrair bucket e key da URL - suporte a múltiplos formatos
  // Formato 1 (Backblaze /file/): https://endpoint/file/bucket/key
  // Formato 2 (S3-style virtual-hosted): https://bucket.endpoint/key
  // Formato 3 (path-style): https://endpoint/bucket/key
  const { bucket, key, urlFormat } = extractStorageLocationFromUrl(fileUrl);

  logger.debug("Baixando arquivo do storage", {
    ...baseContext,
    bucket,
    key,
    url_format: urlFormat,
  });

  // Configurar cliente S3 para Backblaze
  // Support both naming conventions (BACKBLAZE_* priority, fallback to B2_*)
  const endpoint = process.env.BACKBLAZE_ENDPOINT || process.env.B2_ENDPOINT;
  const region = process.env.BACKBLAZE_REGION || process.env.B2_REGION;
  const keyId = process.env.BACKBLAZE_ACCESS_KEY_ID || process.env.B2_KEY_ID;
  const applicationKey = process.env.BACKBLAZE_SECRET_ACCESS_KEY || process.env.B2_APPLICATION_KEY;

  if (!endpoint || !region || !keyId || !applicationKey) {
    throw new Error(
      "Configuração do Backblaze B2 incompleta. Verifique as variáveis de ambiente: " +
      "BACKBLAZE_ENDPOINT (ou B2_ENDPOINT), BACKBLAZE_REGION (ou B2_REGION), " +
      "BACKBLAZE_ACCESS_KEY_ID (ou B2_KEY_ID), BACKBLAZE_SECRET_ACCESS_KEY (ou B2_APPLICATION_KEY)"
    );
  }

  const client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: applicationKey,
    },
  });

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);
  if (!response.Body) {
    throw new Error("Resposta do storage sem corpo");
  }

  // Converter stream para buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  logger.debug("Arquivo baixado com sucesso", { ...baseContext, size: buffer.length });
  return buffer;
}
