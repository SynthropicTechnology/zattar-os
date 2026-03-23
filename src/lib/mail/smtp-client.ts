import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { MailConfig } from "./config";
import { appendMessage } from "./imap-client";
import type { MailMessage, SendEmailRequest } from "./types";

function buildRawPlainTextMessage(headers: Array<string | undefined>, text: string): string {
  return [
    ...headers,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
  ]
    .filter(Boolean)
    .join("\r\n");
}

function createTransporter(config: MailConfig): Transporter {
  const { smtp } = config;
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: false, // STARTTLS
    auth: { user: smtp.user, pass: smtp.pass },
    tls: { rejectUnauthorized: false },
  });
}

function getFromAddress(config: MailConfig): string {
  return config.smtp.user;
}

async function saveToSent(config: MailConfig, raw: string): Promise<void> {
  try {
    await appendMessage(config, "Sent", raw, ["\\Seen"]);
  } catch {
    // Non-critical: log but don't fail the send
    console.error("[mail] Failed to save copy to Sent folder");
  }
}

// --- Send new email ---

export async function sendEmail(
  config: MailConfig,
  req: SendEmailRequest
): Promise<void> {
  const transporter = createTransporter(config);
  const from = getFromAddress(config);

  const info = await transporter.sendMail({
    from,
    to: req.to.join(", "),
    cc: req.cc?.join(", "),
    bcc: req.bcc?.join(", "),
    subject: req.subject,
    text: req.text,
  });

  // Save copy to Sent
  if (info.response) {
    const raw = buildRawPlainTextMessage(
      [
        `From: ${from}`,
        `To: ${req.to.join(", ")}`,
        req.cc ? `Cc: ${req.cc.join(", ")}` : undefined,
        req.bcc ? `Bcc: ${req.bcc.join(", ")}` : undefined,
        `Subject: ${req.subject}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: ${info.messageId}`,
      ],
      req.text
    );
    await saveToSent(config, raw);
  }
}

// --- Reply to email ---

export async function replyToEmail(
  config: MailConfig,
  original: MailMessage,
  text: string,
  replyAll: boolean
): Promise<void> {
  const transporter = createTransporter(config);
  const from = getFromAddress(config);

  // Build recipient list
  const to = [original.from.address];
  const cc: string[] = [];

  if (replyAll) {
    // Add original To recipients (excluding ourselves)
    for (const addr of original.to) {
      if (addr.address && addr.address !== from) {
        cc.push(addr.address);
      }
    }
    // Add original CC recipients (excluding ourselves)
    for (const addr of original.cc ?? []) {
      if (addr.address && addr.address !== from) {
        cc.push(addr.address);
      }
    }
  }

  // Build subject with Re: prefix
  const subject = original.subject.startsWith("Re:")
    ? original.subject
    : `Re: ${original.subject}`;

  // Build references chain
  const references = original.messageId;

  // Quote original message
  const quotedBody = [
    text,
    "",
    `Em ${original.date}, ${original.from.name || original.from.address} escreveu:`,
    "",
    ...original.text.split("\n").map((line) => `> ${line}`),
  ].join("\n");

  const info = await transporter.sendMail({
    from,
    to: to.join(", "),
    cc: cc.length > 0 ? cc.join(", ") : undefined,
    subject,
    text: quotedBody,
    inReplyTo: original.messageId,
    references,
  });

  if (info.response) {
    const raw = buildRawPlainTextMessage(
      [
        `From: ${from}`,
        `To: ${to.join(", ")}`,
        cc.length > 0 ? `Cc: ${cc.join(", ")}` : undefined,
        `Subject: ${subject}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: ${info.messageId}`,
        `In-Reply-To: ${original.messageId}`,
        `References: ${references}`,
      ],
      quotedBody
    );
    await saveToSent(config, raw);
  }
}

// --- Forward email ---

export async function forwardEmail(
  config: MailConfig,
  original: MailMessage,
  to: string[],
  text: string
): Promise<void> {
  const transporter = createTransporter(config);
  const from = getFromAddress(config);

  const subject = original.subject.startsWith("Fwd:")
    ? original.subject
    : `Fwd: ${original.subject}`;

  const forwardedBody = [
    text,
    "",
    "---------- Mensagem encaminhada ----------",
    `De: ${original.from.name} <${original.from.address}>`,
    `Data: ${original.date}`,
    `Assunto: ${original.subject}`,
    `Para: ${original.to.map((a) => a.address).join(", ")}`,
    "",
    original.text,
  ].join("\n");

  const info = await transporter.sendMail({
    from,
    to: to.join(", "),
    subject,
    text: forwardedBody,
  });

  if (info.response) {
    const raw = buildRawPlainTextMessage(
      [
        `From: ${from}`,
        `To: ${to.join(", ")}`,
        `Subject: ${subject}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: ${info.messageId}`,
      ],
      forwardedBody
    );
    await saveToSent(config, raw);
  }
}
