import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { generatePresignedUrl } from "@/lib/storage/backblaze-b2.service";
import {
  TABLE_DOCUMENTOS,
  TABLE_DOCUMENTO_ASSINANTES,
  TABLE_DOCUMENTO_ANCORAS,
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
 * Endpoint PÚBLICO: retorna contexto do link do assinante.
 *
 * Segurança:
 * - Rate limiting: 30 requisições por minuto por IP
 * - Token opaco (não enumerável) + bloqueio por status no fluxo.
 * - Este endpoint não autentica; retorna apenas o necessário para a jornada pública.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  // Rate limiting: 30 requisições por minuto por IP
  const rateLimitResponse = await applyRateLimit(request, "tokenView");
  if (rateLimitResponse) return rateLimitResponse;

  const { token } = await params;

  try {
    const supabase = createServiceClient();

    const { data: signer, error: signerError } = await supabase
      .from(TABLE_DOCUMENTO_ASSINANTES)
      .select("*")
      .eq("token", token)
      .single();

    if (signerError) {
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
        { status: 410 } // 410 Gone - recurso não está mais disponível
      );
    }

    const { data: doc, error: docError } = await supabase
      .from(TABLE_DOCUMENTOS)
      .select("documento_uuid, titulo, status, selfie_habilitada, pdf_original_url, pdf_final_url")
      .eq("id", signer.documento_id)
      .single();

    if (docError) {
      return NextResponse.json(
        { success: false, error: "Documento não encontrado." },
        { status: 404 }
      );
    }

    const { data: anchors, error: anchorsError } = await supabase
      .from(TABLE_DOCUMENTO_ANCORAS)
      .select("tipo, pagina, x_norm, y_norm, w_norm, h_norm")
      .eq("documento_id", signer.documento_id)
      .eq("documento_assinante_id", signer.id);

    if (anchorsError) {
      return NextResponse.json(
        { success: false, error: "Erro ao carregar âncoras." },
        { status: 500 }
      );
    }

    // Gerar URLs pré-assinadas para acesso aos PDFs (URLs do Backblaze são privadas)
    let pdfOriginalPresignedUrl = doc.pdf_original_url;
    let pdfFinalPresignedUrl = doc.pdf_final_url;

    if (doc.pdf_original_url) {
      const originalKey = extractKeyFromBackblazeUrl(doc.pdf_original_url);
      if (originalKey) {
        pdfOriginalPresignedUrl = await generatePresignedUrl(originalKey, 3600);
      }
    }

    if (doc.pdf_final_url) {
      const finalKey = extractKeyFromBackblazeUrl(doc.pdf_final_url);
      if (finalKey) {
        pdfFinalPresignedUrl = await generatePresignedUrl(finalKey, 3600);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        documento: {
          ...doc,
          pdf_original_url: pdfOriginalPresignedUrl,
          pdf_final_url: pdfFinalPresignedUrl,
        },
        assinante: {
          id: signer.id,
          status: signer.status,
          dados_snapshot: signer.dados_snapshot,
          dados_confirmados: signer.dados_confirmados,
        },
        anchors: anchors ?? [],
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}



