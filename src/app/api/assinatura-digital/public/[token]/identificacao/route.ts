import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updatePublicSignerIdentification } from "@/app/(authenticated)/assinatura-digital/feature/services/documentos.service";
import { applyRateLimit } from "@/app/(authenticated)/assinatura-digital/feature/utils/rate-limit";

const schema = z.object({
  nome_completo: z.string().min(3),
  cpf: z.string().length(11),
  email: z.string().email(),
  telefone: z.string().min(10),
});

/**
 * Endpoint PÚBLICO: salva/confirmar identificação do assinante.
 *
 * Segurança:
 * - Rate limiting: 10 requisições por minuto por IP
 * - Para convidados: captura os dados aqui.
 * - Para entidades existentes: serve para confirmar e permitir ajustes
 *   (ex.: se dados estavam incompletos, o assinante preenche no link).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  // Rate limiting: 10 requisições por minuto por IP
  const rateLimitResponse = await applyRateLimit(request, "identificacao");
  if (rateLimitResponse) return rateLimitResponse;

  const { token } = await params;

  try {
    const body = await request.json();
    const dados = schema.parse(body);

    const result = await updatePublicSignerIdentification({ token, dados });
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Erro ao salvar identificação";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}



