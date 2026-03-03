import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import {
  getAllEmailCredentials,
  saveEmailCredentials,
  deleteEmailCredentials,
  type EmailCredentials,
  type SaveEmailCredentialsInput,
} from "@/lib/mail/credentials";

function maskCredentials(creds: EmailCredentials) {
  return {
    id: creds.id,
    nome_conta: creds.nome_conta,
    imap_host: creds.imap_host,
    imap_port: creds.imap_port,
    imap_user: creds.imap_user,
    imap_pass: "••••••••",
    smtp_host: creds.smtp_host,
    smtp_port: creds.smtp_port,
    smtp_user: creds.smtp_user,
    smtp_pass: "••••••••",
    active: creds.active,
    updated_at: creds.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated || !auth.usuarioId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const allCreds = await getAllEmailCredentials(auth.usuarioId);
  if (allCreds.length === 0) {
    return NextResponse.json({ configured: false, accounts: [] });
  }

  return NextResponse.json({
    configured: true,
    accounts: allCreds.map(maskCredentials),
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated || !auth.usuarioId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SaveEmailCredentialsInput;

    if (!body.imap_user || !body.imap_pass || !body.smtp_user || !body.smtp_pass) {
      return NextResponse.json(
        { error: "Campos imap_user, imap_pass, smtp_user e smtp_pass são obrigatórios" },
        { status: 400 }
      );
    }

    const creds = await saveEmailCredentials(auth.usuarioId, body);

    return NextResponse.json({
      success: true,
      account: maskCredentials(creds),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar credenciais";
    console.error("[mail-credentials]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated || !auth.usuarioId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const accountIdParam = request.nextUrl.searchParams.get("accountId");
    const accountId = accountIdParam ? Number(accountIdParam) : undefined;
    await deleteEmailCredentials(auth.usuarioId, accountId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao remover credenciais";
    console.error("[mail-credentials]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
