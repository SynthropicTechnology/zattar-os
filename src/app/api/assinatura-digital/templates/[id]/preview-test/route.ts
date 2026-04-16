import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  getTemplate,
  generatePdfFromTemplate,
  storePdf,
  generateMockDataForPreview,
} from "@/shared/assinatura-digital";
import { generatePresignedUrl } from "@/lib/storage/backblaze-b2.service";
import type {
  TemplateCampo,
  StatusTemplate,
} from "@/shared/assinatura-digital";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Validar que body é um objeto
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { success: false, error: "Payload inválido: esperado um objeto" },
        { status: 400 }
      );
    }

    // Validar segmento se presente: deve ter id numérico e nome string
    let validatedSegmento: { id: number; nome: string } | undefined;
    if (body.segmento !== undefined) {
      if (
        typeof body.segmento !== "object" ||
        body.segmento === null ||
        typeof body.segmento.id !== "number" ||
        typeof body.segmento.nome !== "string"
      ) {
        // Ignorar segmento inválido (fall back to defaults)
        validatedSegmento = undefined;
      } else {
        validatedSegmento = { id: body.segmento.id, nome: body.segmento.nome };
      }
    }

    // Autenticação
    const authOrError = await requirePermission(
      request,
      "assinatura_digital",
      "visualizar"
    );
    if (authOrError instanceof NextResponse) return authOrError;

    // Buscar template
    const template = await getTemplate(id);
    if (!template)
      return NextResponse.json(
        { success: false, error: "Template não encontrado" },
        { status: 404 }
      );

    // Parse e merge campos
    let campos_parsed: TemplateCampo[] = [];
    try {
      campos_parsed =
        typeof template.campos === "string"
          ? JSON.parse(template.campos)
          : template.campos;
    } catch {
      campos_parsed = [];
    }

    const finalCampos = body.campos || campos_parsed;

    // Validar template tem conteúdo
    const hasCampos = finalCampos.length > 0;
    const hasMarkdown =
      !!template.conteudo_markdown &&
      template.conteudo_markdown.trim().length > 0;
    if (!hasCampos && !hasMarkdown) {
      return NextResponse.json(
        {
          success: false,
          error: "Template deve ter campos ou markdown para preview",
        },
        { status: 400 }
      );
    }

    // Gerar dados mock
    const mockData = generateMockDataForPreview(
      {
        id: String(template.id),
        template_uuid: template.template_uuid,
        nome: template.nome,
        descricao: template.descricao ?? undefined,
        arquivo_original: template.arquivo_original,
        arquivo_nome: template.arquivo_nome,
        arquivo_tamanho: template.arquivo_tamanho,
        status: template.status as StatusTemplate,
        versao: template.versao,
        ativo: template.ativo,
        campos: finalCampos,
        conteudo_markdown: template.conteudo_markdown ?? null,
      },
      {
        segmentoId: validatedSegmento?.id,
        segmentoNome: validatedSegmento?.nome,
      }
    );

    // Gerar PDF
    const templateBasico = {
      id: template.id,
      template_uuid: template.template_uuid,
      nome: template.nome,
      ativo: template.ativo,
      arquivo_original: template.arquivo_original,
      pdf_url: template.pdf_url,
      campos: JSON.stringify(finalCampos),
      conteudo_markdown: template.conteudo_markdown,
    };

    const pdfBuffer = await generatePdfFromTemplate(
      templateBasico,
      {
        cliente: mockData.cliente,
        segmento: mockData.segmento,
        formulario: mockData.formulario,
        protocolo: mockData.protocolo,
        ip: mockData.ip,
        user_agent: mockData.user_agent,
      },
      mockData.extras,
      mockData.images
    );

    // Armazenar PDF temporariamente
    const stored = await storePdf(pdfBuffer);
    // Gerar URL presigned para acesso ao bucket privado (1h de validade)
    const pdfUrl = await generatePresignedUrl(stored.key, 3600);
    // Derivar nome do arquivo do key retornado pelo storage (ex: "assinatura-digital/pdfs/documento-xxx.pdf" -> "documento-xxx.pdf")
    const storedFileName = stored.key.split("/").pop() || `preview-${id}.pdf`;

    return NextResponse.json(
      {
        success: true,
        arquivo_url: pdfUrl,
        arquivo_nome: storedFileName,
        is_preview: true,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Preview-Mode": "true",
        },
      }
    );
  } catch (error) {
    console.error("Preview generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao gerar preview",
        detalhes: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
