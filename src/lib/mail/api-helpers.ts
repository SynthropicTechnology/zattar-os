import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { getUserMailConfig } from "./credentials";
import type { MailConfig } from "./config";

export interface MailAuthResult {
  usuarioId: number;
  config: MailConfig;
}

/**
 * Autentica a request e busca as credenciais de e-mail do usuário.
 * Aceita ?accountId=N para selecionar conta específica.
 * Retorna { usuarioId, config } se ok, ou NextResponse de erro.
 */
export async function authenticateMailRequest(
  request: NextRequest
): Promise<MailAuthResult | NextResponse> {
  const auth = await authenticateRequest(request);

  if (!auth.authenticated || !auth.usuarioId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const accountIdParam = request.nextUrl.searchParams.get("accountId");
  const accountId = accountIdParam ? Number(accountIdParam) : undefined;

  const config = await getUserMailConfig(auth.usuarioId, accountId);

  if (!config) {
    return NextResponse.json(
      { error: "Credenciais de e-mail não configuradas", code: "EMAIL_NOT_CONFIGURED" },
      { status: 422 }
    );
  }

  return { usuarioId: auth.usuarioId, config };
}

export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function handleMailError(err: unknown) {
  const message = err instanceof Error ? err.message : "Erro desconhecido";

  if (message.includes("auth") || message.includes("AUTH") || message.includes("credentials")) {
    return errorResponse("Falha na autenticação do serviço de email", 401);
  }

  console.error("[mail-api]", message);
  return errorResponse("Erro no serviço de email", 500);
}
