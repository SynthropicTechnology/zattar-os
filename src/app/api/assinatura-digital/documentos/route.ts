import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  createDocumentoFromUploadedPdf,
  listDocumentos,
} from "@/shared/assinatura-digital/services/documentos.service";
import { validatePdfFile } from "@/shared/assinatura-digital/utils/file-validation";

const createSchema = z.object({
  titulo: z.string().optional().nullable(),
  selfie_habilitada: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  assinantes: z
    .string()
    .min(2)
    .transform((v) => JSON.parse(v) as unknown),
});

const assinantesSchema = z.array(
  z.object({
    assinante_tipo: z.enum([
      "cliente",
      "parte_contraria",
      "representante",
      "terceiro",
      "usuario",
      "convidado",
    ]),
    assinante_entidade_id: z.number().optional().nullable(),
    dados_snapshot: z.record(z.unknown()).optional(),
  })
);

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(
    request,
    "assinatura_digital",
    "visualizar"
  );
  if (authOrError instanceof NextResponse) return authOrError;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || "50");

  try {
    const data = await listDocumentos({ limit });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar documentos";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Cria um documento de assinatura a partir de um PDF uploadado (admin).
 *
 * Request: multipart/form-data
 * - file: PDF
 * - titulo?: string
 * - selfie_habilitada: "true" | "false"
 * - assinantes: JSON string (array)
 */
export async function POST(request: NextRequest) {
  const authOrError = await requirePermission(request, "assinatura_digital", "criar");
  if (authOrError instanceof NextResponse) return authOrError;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Arquivo PDF é obrigatório (campo: file)." },
        { status: 400 }
      );
    }

    // Validar PDF por magic bytes (previne MIME type spoofing)
    const pdfValidation = await validatePdfFile(file, { maxSize: 50 * 1024 * 1024 });
    if (!pdfValidation.valid || !pdfValidation.buffer) {
      return NextResponse.json(
        { success: false, error: pdfValidation.error ?? "Arquivo PDF inválido." },
        { status: 400 }
      );
    }

    const raw = {
      titulo: form.get("titulo")?.toString() ?? null,
      selfie_habilitada: form.get("selfie_habilitada")?.toString() ?? "false",
      assinantes: form.get("assinantes")?.toString() ?? "[]",
    };

    const parsed = createSchema.parse(raw);
    const assinantes = assinantesSchema.parse(parsed.assinantes);

    const pdfBuffer = pdfValidation.buffer;

    const result = await createDocumentoFromUploadedPdf({
      titulo: parsed.titulo ?? null,
      selfie_habilitada: parsed.selfie_habilitada ?? false,
      pdfBuffer,
      created_by: authOrError.usuarioId,
      assinantes: assinantes.map((a) => ({
        assinante_tipo: a.assinante_tipo,
        assinante_entidade_id: a.assinante_entidade_id ?? null,
        dados_snapshot: a.dados_snapshot ?? {},
      })),
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erro ao criar documento";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}



