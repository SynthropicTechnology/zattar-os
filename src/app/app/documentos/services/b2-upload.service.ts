/**
 * Serviço de upload para Backblaze B2
 *
 * Gerencia uploads de arquivos para o Backblaze B2 (S3-compatible)
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// Helper para obter variáveis de ambiente com fallback
function getEnvVar(...keys: string[]): string | undefined {
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }
  return undefined;
}

// Configuração do cliente S3 para Backblaze B2
// Usar lazy initialization ou getter para garantir que env vars estejam carregadas e permitir validação
let s3ClientInstance: S3Client | null = null;

function getS3Client() {
  if (s3ClientInstance) return s3ClientInstance;

  const endpoint = getEnvVar("BACKBLAZE_ENDPOINT", "B2_ENDPOINT");
  const region = getEnvVar("BACKBLAZE_REGION", "B2_REGION") || "us-east-1";
  const accessKeyId = getEnvVar(
    "BACKBLAZE_ACCESS_KEY_ID",
    "B2_KEY_ID",
    "B2_ACCESS_KEY_ID"
  );
  const secretAccessKey = getEnvVar(
    "BACKBLAZE_SECRET_ACCESS_KEY",
    "B2_APPLICATION_KEY",
    "B2_SECRET_ACCESS_KEY"
  );

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "Credenciais do Backblaze não encontradas. Verifique B2_KEY_ID/B2_APPLICATION_KEY."
    );
  }

  s3ClientInstance = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3ClientInstance;
}

const getBucketName = () =>
  getEnvVar("BACKBLAZE_BUCKET_NAME", "B2_BUCKET", "B2_BUCKET_NAME") ||
  "zattar-advogados";

/**
 * Gera um nome único para o arquivo
 */
function generateUniqueFileName(originalName: string): string {
  const extension = originalName.split(".").pop();
  const randomHash = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();

  return `${timestamp}-${randomHash}.${extension}`;
}

/**
 * Determina o tipo de mídia baseado no MIME type
 */
function getTipoMedia(
  mimeType: string
): "imagem" | "video" | "audio" | "pdf" | "outros" {
  if (mimeType.startsWith("image/")) return "imagem";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  return "outros";
}

/**
 * Faz upload de um arquivo para o Backblaze B2
 */
export async function uploadFileToB2(params: {
  file: Buffer;
  fileName: string;
  contentType: string;
  folder?: string;
}): Promise<{
  key: string;
  url: string;
  size: number;
}> {
  const uniqueFileName = generateUniqueFileName(params.fileName);
  const key = params.folder
    ? `${params.folder}/${uniqueFileName}`
    : uniqueFileName;

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: params.file,
    ContentType: params.contentType,
    // ACL removido - Supabase Storage não suporta. Configure o bucket como público no dashboard.
  });

  await getS3Client().send(command);

  // URL pública do arquivo (formato path-style: endpoint/bucket/key)
  const endpoint = process.env.BACKBLAZE_ENDPOINT || process.env.B2_ENDPOINT;
  const bucket = getBucketName();
  const url = endpoint?.startsWith("http")
    ? `${endpoint}/${bucket}/${key}`
    : `https://${endpoint}/${bucket}/${key}`;

  return {
    key,
    url,
    size: params.file.length,
  };
}

/**
 * Deleta um arquivo do Backblaze B2
 */
export async function deleteFileFromB2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  await getS3Client().send(command);
}

/**
 * Gera URL assinada para upload direto do cliente
 */
export async function generatePresignedUploadUrl(params: {
  fileName: string;
  contentType: string;
  folder?: string;
  expiresIn?: number;
}): Promise<{
  uploadUrl: string;
  key: string;
  publicUrl: string;
}> {
  const uniqueFileName = generateUniqueFileName(params.fileName);
  const key = params.folder
    ? `${params.folder}/${uniqueFileName}`
    : uniqueFileName;

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: params.contentType,
    // ACL removido - Supabase Storage não suporta. Configure o bucket como público no dashboard.
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: params.expiresIn || 3600, // 1 hora
  });

  // URL pública do arquivo (formato path-style: endpoint/bucket/key)
  const endpoint = process.env.BACKBLAZE_ENDPOINT || process.env.B2_ENDPOINT;
  const bucket = getBucketName();
  const publicUrl = endpoint?.startsWith("http")
    ? `${endpoint}/${bucket}/${key}`
    : `https://${endpoint}/${bucket}/${key}`;

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

/**
 * Valida tipo de arquivo permitido
 */
export function validateFileType(contentType: string): boolean {
  const allowedTypes = [
    // Imagens
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Vídeos
    "video/mp4",
    "video/webm",
    "video/ogg",
    // Áudio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    // Documentos
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Outros
    "text/plain",
  ];

  return allowedTypes.includes(contentType);
}

/**
 * Valida tamanho do arquivo (max 50MB)
 */
export function validateFileSize(size: number): boolean {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  return size <= MAX_SIZE;
}

export { getTipoMedia };
