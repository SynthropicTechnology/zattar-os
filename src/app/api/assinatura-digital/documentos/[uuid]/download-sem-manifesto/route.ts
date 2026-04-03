import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getDocumentoByUuid,
  getAssinaturaById,
} from "@/app/(authenticated)/assinatura-digital/feature/services/documentos.service";
import { downloadFromStorageUrl } from "@/app/(authenticated)/assinatura-digital/feature/services/signature";

/**
 * Faz download do PDF assinado SEM a última página (manifesto de auditoria).
 *
 * A última página contém os dados de verificação (protocolo, hashes, fingerprint etc.)
 * e é adicionada automaticamente pelo appendManifestPage(). Esse endpoint remove
 * essa página para entregar o documento apenas com as assinaturas.
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
    let titulo = "documento";

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
      titulo = assinatura.clientes?.nome
        ? `contrato-${assinatura.clientes.nome}`
        : `contrato-${assinatura.protocolo}`;
    } else {
      const data = await getDocumentoByUuid(uuid);
      if (!data) {
        return NextResponse.json(
          { success: false, error: "Documento não encontrado." },
          { status: 404 }
        );
      }
      // Preferir PDF final (com assinaturas) se disponível
      pdfStorageUrl = data.documento.pdf_final_url || data.documento.pdf_original_url;
      titulo = data.documento.titulo || "documento";
    }

    if (!pdfStorageUrl) {
      return NextResponse.json(
        { success: false, error: "PDF não disponível para este documento." },
        { status: 404 }
      );
    }

    // Download do PDF do storage
    const originalBuffer = await downloadFromStorageUrl(pdfStorageUrl, {
      service: "download-sem-manifesto",
      operation: "download_pdf",
      uuid,
    });

    // Carregar com pdf-lib e remover última página (manifesto)
    const pdfDoc = await PDFDocument.load(originalBuffer);
    const pageCount = pdfDoc.getPageCount();

    if (pageCount <= 1) {
      // Safety check: não remover se o PDF tem apenas 1 página
      return NextResponse.json(
        {
          success: false,
          error:
            "O PDF possui apenas uma página e não pode ter o manifesto removido.",
        },
        { status: 400 }
      );
    }

    pdfDoc.removePage(pageCount - 1);

    const pdfBytes = await pdfDoc.save();

    // Sanitizar título para uso em filename
    const safeTitle = titulo
      .replace(/[^a-zA-Z0-9À-ÿ\s-_]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);

    return new Response(new Uint8Array(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}-sem-manifesto.pdf"`,
        "Content-Length": String(pdfBytes.length),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao gerar PDF sem manifesto";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
