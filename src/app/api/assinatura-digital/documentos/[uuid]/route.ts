import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { getDocumentoByUuid } from "@/app/(authenticated)/assinatura-digital/feature/services/documentos.service";

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
    const data = await getDocumentoByUuid(uuid);
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Documento não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao obter documento";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}



