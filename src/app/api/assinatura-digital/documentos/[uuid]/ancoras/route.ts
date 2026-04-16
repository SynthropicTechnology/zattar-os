import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/require-permission";
import { setDocumentoAnchors } from "@/shared/assinatura-digital/services/documentos.service";

const schema = z.object({
  anchors: z.array(
    z.object({
      documento_assinante_id: z.number(),
      tipo: z.enum(["assinatura", "rubrica"]),
      pagina: z.number().int().min(1),
      x_norm: z.number().min(0).max(1),
      y_norm: z.number().min(0).max(1),
      w_norm: z.number().gt(0).max(1),
      h_norm: z.number().gt(0).max(1),
    })
  ),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const authOrError = await requirePermission(request, "assinatura_digital", "editar");
  if (authOrError instanceof NextResponse) return authOrError;

  const { uuid } = await params;

  try {
    const body = await request.json();
    const payload = schema.parse(body);

    const result = await setDocumentoAnchors({
      documentoUuid: uuid,
      anchors: payload.anchors,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Erro ao salvar âncoras";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}



