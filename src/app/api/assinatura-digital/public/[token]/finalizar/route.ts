import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { finalizePublicSigner } from "@/shared/assinatura-digital/services/documentos.service";
import { applyRateLimit } from "@/shared/assinatura-digital/utils/rate-limit";
import { checkTokenExpiration } from "@/shared/assinatura-digital/utils/token-expiration";
import { validateMultipleImages } from "@/shared/assinatura-digital/utils/file-validation";
import { createServiceClient } from "@/lib/supabase/service-client";
import {
  TABLE_DOCUMENTOS,
  TABLE_DOCUMENTO_ASSINANTES,
  TABLE_DOCUMENTO_ANCORAS,
} from "@/shared/assinatura-digital/services/constants";

/** Tamanho máximo para imagens: 5MB */
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;

/**
 * Schema de validação para payload de finalização.
 *
 * VALIDAÇÃO CONDICIONAL (feita após parse, vide handler POST):
 * - `selfie_base64`: Obrigatório se `documento.selfie_habilitada = true`
 * - `rubrica_base64`: Obrigatório se existirem âncoras de rubrica para o assinante
 */
const schema = z.object({
  selfie_base64: z.string().optional().nullable(), // Validação condicional após parse
  assinatura_base64: z.string().min(1),
  rubrica_base64: z.string().optional().nullable(), // Validação condicional após parse
  geolocation: z.record(z.unknown()).optional().nullable(),
  dispositivo_fingerprint_raw: z.record(z.unknown()).optional().nullable(),
  termos_aceite: z.boolean().refine((v) => v === true, {
    message: "Aceite dos termos é obrigatório",
  }),
  termos_aceite_versao: z.string().min(1),
});

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return null;
}

/**
 * Endpoint PÚBLICO: finaliza assinatura do assinante (token).
 *
 * Segurança:
 * - Rate limiting: 5 requisições por minuto por IP
 * - Verificação de expiração do token
 *
 * VALIDAÇÃO CONDICIONAL:
 * - `selfie_base64`: Obrigatório se `documento.selfie_habilitada = true`
 * - `rubrica_base64`: Obrigatório se existirem âncoras de rubrica para o assinante
 *   A validação é feita após o parse do schema, retornando erro 400 com formato consistente.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  // Rate limiting: 5 requisições por minuto por IP
  const rateLimitResponse = await applyRateLimit(request, "finalizar");
  if (rateLimitResponse) return rateLimitResponse;

  const { token } = await params;

  try {
    const supabase = createServiceClient();

    // Buscar assinante e documento para validações condicionais
    const { data: signer, error: signerError } = await supabase
      .from(TABLE_DOCUMENTO_ASSINANTES)
      .select("id, documento_id, status, expires_at")
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

    // Verificar se já foi concluído
    if (signer.status === "concluido") {
      return NextResponse.json(
        { success: false, error: "Este link já foi concluído e não pode ser reutilizado." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = schema.parse(body);

    // Validar imagens base64 (tamanho máximo + magic bytes)
    const imageValidation = validateMultipleImages(
      {
        assinatura_base64: parsed.assinatura_base64,
        selfie_base64: parsed.selfie_base64,
        rubrica_base64: parsed.rubrica_base64,
      },
      { maxSize: IMAGE_MAX_SIZE }
    );

    if (!imageValidation.allValid) {
      return NextResponse.json({
        success: false,
        error: "Imagens inválidas",
        message: "Uma ou mais imagens não passaram na validação",
        details: imageValidation.errors,
      }, { status: 400 });
    }

    // Buscar documento para validação de selfie
    const { data: documento } = await supabase
      .from(TABLE_DOCUMENTOS)
      .select("selfie_habilitada")
      .eq("id", signer.documento_id)
      .single();

    // Validação condicional de selfie
    if (documento?.selfie_habilitada === true && !parsed.selfie_base64) {
      return NextResponse.json({
        success: false,
        error: "Dados de assinatura inválidos",
        message: "Selfie é obrigatória para este documento",
        details: {
          selfie_base64: ["Selfie é obrigatória quando o documento exige verificação de identidade"],
        },
      }, { status: 400 });
    }

    // Validação condicional de rubrica (se existirem âncoras de rubrica)
    const { data: anchors } = await supabase
      .from(TABLE_DOCUMENTO_ANCORAS)
      .select("tipo")
      .eq("documento_id", signer.documento_id)
      .eq("documento_assinante_id", signer.id)
      .eq("tipo", "rubrica");

    const requiresRubrica = (anchors ?? []).length > 0;
    if (requiresRubrica && !parsed.rubrica_base64) {
      return NextResponse.json({
        success: false,
        error: "Dados de assinatura inválidos",
        message: "Rubrica é obrigatória para este documento",
        details: {
          rubrica_base64: ["Rubrica é obrigatória quando o documento possui campos de rubrica"],
        },
      }, { status: 400 });
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent");

    const result = await finalizePublicSigner({
      token,
      ip_address: ip,
      user_agent: userAgent,
      geolocation: parsed.geolocation ?? null,
      dispositivo_fingerprint_raw: parsed.dispositivo_fingerprint_raw ?? null,
      termos_aceite_versao: parsed.termos_aceite_versao,
      selfie_base64: parsed.selfie_base64 ?? null,
      assinatura_base64: parsed.assinatura_base64,
      rubrica_base64: parsed.rubrica_base64 ?? null,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Erro ao finalizar assinatura";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}



