import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { generatePresignedUrl } from "@/lib/storage/backblaze-b2.service";
import {
  TABLE_DOCUMENTOS,
  TABLE_DOCUMENTO_ASSINANTES,
} from "@/app/(authenticated)/assinatura-digital/feature/services/constants";
import { applyRateLimit } from "@/app/(authenticated)/assinatura-digital/feature/utils/rate-limit";
import { checkTokenExpiration } from "@/app/(authenticated)/assinatura-digital/feature/utils/token-expiration";

/**
 * Extrai a key do arquivo a partir da URL completa do Backblaze.
 *
 * URL formato: https://s3.us-east-005.backblazeb2.com/bucket-name/path/to/file.pdf
 * Key extraída: path/to/file.pdf
 */
function extractKeyFromBackblazeUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return null;
    }
    // Remove o primeiro segmento (bucket name) e junta o resto
    return pathParts.slice(1).join('/');
  } catch {
    return null;
  }
}

/**
 * Endpoint PÚBLICO: gera URL presigned para download do PDF assinado.
 *
 * Segurança:
 * - Rate limiting: 20 requisições por minuto por IP
 * - Token opaco (não enumerável)
 * - Só permite download de pdf_final_url (documento já assinado)
 * - Verifica se o assinante completou a assinatura
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  // Rate limiting: 20 requisições por minuto por IP
  const rateLimitResponse = await applyRateLimit(request, "download");
  if (rateLimitResponse) return rateLimitResponse;

  const { token } = await params;

  try {
    const supabase = createServiceClient();

    // Buscar assinante pelo token
    const { data: signer, error: signerError } = await supabase
      .from(TABLE_DOCUMENTO_ASSINANTES)
      .select("documento_id, status, expires_at")
      .eq("token", token)
      .single();

    if (signerError || !signer) {
      return NextResponse.json(
        { success: false, error: "Link inválido." },
        { status: 404 }
      );
    }

    // Verificar expiração do token
    const expirationCheck = checkTokenExpiration(signer.expires_at);
    if (expirationCheck.expired) {
      return NextResponse.json(
        { success: false, error: expirationCheck.error, expired: true },
        { status: 410 }
      );
    }

    // Verificar se o assinante concluiu a assinatura
    if (signer.status !== "concluido") {
      return NextResponse.json(
        { success: false, error: "Assinatura ainda não concluída." },
        { status: 403 }
      );
    }

    // Buscar documento com pdf_final_url
    const { data: doc, error: docError } = await supabase
      .from(TABLE_DOCUMENTOS)
      .select("pdf_final_url")
      .eq("id", signer.documento_id)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { success: false, error: "Documento não encontrado." },
        { status: 404 }
      );
    }

    if (!doc.pdf_final_url) {
      return NextResponse.json(
        { success: false, error: "PDF assinado ainda não disponível." },
        { status: 404 }
      );
    }

    // Extrair key da URL
    const key = extractKeyFromBackblazeUrl(doc.pdf_final_url);
    if (!key) {
      return NextResponse.json(
        { success: false, error: "URL do PDF inválida." },
        { status: 500 }
      );
    }

    // Gerar URL presigned com 1 hora de validade
    const presignedUrl = await generatePresignedUrl(key, 3600);

    return NextResponse.json({
      success: true,
      data: { presignedUrl },
    });
  } catch (error) {
    console.error("[Download API] Erro:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
