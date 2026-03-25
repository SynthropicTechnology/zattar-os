import { NextRequest, NextResponse } from "next/server";
import { getMessage } from "@/lib/mail/imap-client";
import { replyToEmail } from "@/lib/mail/smtp-client";
import { authenticateMailRequest, errorResponse, handleMailError } from "@/lib/mail/api-helpers";
import type { ReplyRequest } from "@/lib/mail/types";

export async function POST(request: NextRequest) {
  const result = await authenticateMailRequest(request);
  if (result instanceof NextResponse) return result;
  const { config } = result;

  try {
    const body = (await request.json()) as ReplyRequest;

    if (!body.uid || !body.folder || !body.text) {
      return errorResponse("Campos 'uid', 'folder' e 'text' são obrigatórios", 400);
    }

    const original = await getMessage(config, body.folder, body.uid);
    if (!original) {
      return errorResponse("Mensagem original não encontrada", 404);
    }

    await replyToEmail(config, original, body.text, body.replyAll, body.html);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleMailError(err);
  }
}
