import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getDocumentoByUuid,
  getAssinaturaById,
} from "@/app/app/assinatura-digital/feature/services/documentos.service";
import { downloadFromStorageUrl } from "@/app/app/assinatura-digital/feature/services/signature";
import { validatePdfBuffer } from "@/app/app/assinatura-digital/feature/utils/file-validation";

/**
 * Proxy para servir PDFs de documentos de assinatura digital.
 *
 * Baixa o PDF do Backblaze B2 server-side e retorna ao browser,
 * evitando problemas de CORS que ocorrem quando o PDF.js worker
 * tenta fazer fetch cross-origin de URLs presigned.
 *
 * Query params:
 * - type=final: retorna o PDF assinado (com imagens de assinatura) em vez do original
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const authOrError = await requirePermission(
    request,
    "assinatura_digital",
    "visualizar"
  );
  if (authOrError instanceof NextResponse) return authOrError;

  const { uuid } = await params;

  try {
    let pdfStorageUrl: string | null = null;
    const isFormulario = uuid.startsWith("ass-");

    if (isFormulario) {
      const id = Number(uuid.replace("ass-", ""));
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, error: "ID inválido." },
          { status: 400 }
        );
      }
      const assinatura = await getAssinaturaById(id);
      if (!assinatura) {
        return NextResponse.json(
          { success: false, error: "Assinatura não encontrada." },
          { status: 404 }
        );
      }
      pdfStorageUrl = assinatura.pdf_url;
    } else {
      const data = await getDocumentoByUuid(uuid);
      if (!data) {
        return NextResponse.json(
          { success: false, error: "Documento não encontrado." },
          { status: 404 }
        );
      }
      const type = request.nextUrl.searchParams.get("type");
      pdfStorageUrl =
        type === "final" && data.documento.pdf_final_url
          ? data.documento.pdf_final_url
          : data.documento.pdf_original_url;
    }

    if (!pdfStorageUrl) {
      return NextResponse.json(
        { success: false, error: "PDF não disponível para este documento." },
        { status: 404 }
      );
    }

    const buffer = await downloadFromStorageUrl(pdfStorageUrl, {
      service: "pdf-proxy",
      operation: "preview",
      uuid,
    });

    const validation = validatePdfBuffer(buffer);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || "O arquivo recuperado do storage não é um PDF válido.",
        },
        { status: 502 }
      );
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar PDF";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
