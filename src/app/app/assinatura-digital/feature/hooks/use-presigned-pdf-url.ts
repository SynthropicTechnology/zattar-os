'use client';

interface UsePresignedPdfUrlResult {
  presignedUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para obter a URL de preview de um PDF de assinatura digital.
 *
 * Usa uma rota proxy server-side (/api/.../[uuid]/pdf) para evitar
 * problemas de CORS quando o PDF.js worker tenta fazer fetch cross-origin
 * de URLs presigned do Backblaze B2.
 *
 * @param originalUrl - URL original do PDF (se null/undefined, retorna null)
 * @param documentoUuid - UUID do documento (usado para construir a URL do proxy)
 * @returns URL do proxy, estado de loading e erro
 */
export function usePresignedPdfUrl(
  originalUrl: string | null | undefined,
  documentoUuid?: string | null
): UsePresignedPdfUrlResult {
  if (!originalUrl || !documentoUuid) {
    return { presignedUrl: null, isLoading: false, error: null };
  }

  return {
    presignedUrl: `/api/assinatura-digital/documentos/${documentoUuid}/pdf`,
    isLoading: false,
    error: null,
  };
}
