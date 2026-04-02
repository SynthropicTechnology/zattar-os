import { generatePresignedUrl as getBackblazeUrl } from '@/lib/storage/backblaze-b2.service';
import { createClient } from '@/lib/supabase/server';

export type StorageProvider = 'backblaze' | 'supabase' | 'google_drive';

export async function downloadFile(provider: StorageProvider, key: string): Promise<Buffer> {
  switch (provider) {
    case 'backblaze': {
      const url = await getBackblazeUrl(key);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Falha ao baixar de Backblaze: ${response.status} ${response.statusText || 'erro desconhecido'} (key: ${key})`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    case 'supabase': {
      const supabase = await createClient();
      const { data, error } = await supabase.storage.from('chat-files').download(key);

      if (error) throw error;
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    case 'google_drive': {
      throw new Error('Download do Google Drive não implementado ainda');
    }

    default:
      throw new Error(`Provider de storage desconhecido: ${provider}`);
  }
}

export function extractKeyFromUrl(url: string): string {
  // Extrai a key/path do arquivo de uma URL completa
  // Suporta URLs do Backblaze B2, Supabase Storage, etc.

  try {
    const urlObj = new URL(url);

    // Backblaze B2
    if (urlObj.hostname.includes('backblazeb2.com')) {
      const pathParts = urlObj.pathname.split('/');

      // Formato B2 nativo: https://f005.backblazeb2.com/file/bucket-name/path/to/file.pdf
      // pathname: /file/bucket-name/path/to/file.pdf → slice(3)
      if (pathParts[1] === 'file') {
        return pathParts.slice(3).join('/');
      }

      // Formato S3-compatible: https://s3.region.backblazeb2.com/bucket-name/path/to/file.pdf
      // pathname: /bucket-name/path/to/file.pdf → slice(2)
      return pathParts.slice(2).join('/');
    }

    // Supabase Storage
    if (urlObj.hostname.includes('supabase')) {
      // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/path/to/file.pdf
      const pathParts = urlObj.pathname.split('/');
      // Encontra 'object' ou 'public' e pega o resto após o bucket
      const objectIndex = pathParts.findIndex((p) => p === 'object' || p === 'public');
      if (objectIndex !== -1) {
        return pathParts.slice(objectIndex + 3).join('/');
      }
    }

    // Fallback: retorna o pathname sem a barra inicial
    return urlObj.pathname.replace(/^\//, '');
  } catch {
    // Se não for uma URL válida, assume que já é uma key
    return url;
  }
}

export function getMimeType(tipoMedia: string | null): string {
  if (!tipoMedia) return 'application/octet-stream';

  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    html: 'text/html',
    image: 'image/jpeg',
    video: 'video/mp4',
  };

  const lower = tipoMedia.toLowerCase();
  return mimeMap[lower] || tipoMedia;
}
