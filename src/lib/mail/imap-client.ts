import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { MailConfig } from "./config";
import type {
  MailFolder,
  MailMessage,
  MailMessagePreview,
  MailAddress,
  PaginatedResponse,
} from "./types";

// --- Connection helper ---

async function withImapConnection<T>(
  config: MailConfig,
  operation: (client: ImapFlow) => Promise<T>
): Promise<T> {
  const { imap } = config;
  const client = new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: true,
    auth: { user: imap.user, pass: imap.pass },
    logger: false,
  });

  await client.connect();
  try {
    return await operation(client);
  } finally {
    await client.logout();
  }
}

// --- Address parsing ---

function parseAddress(
  addr: { name?: string; address?: string } | undefined
): MailAddress {
  return {
    name: addr?.name ?? "",
    address: addr?.address ?? "",
  };
}

function parseAddressList(
  addrs:
    | Array<{ name?: string; address?: string }>
    | { name?: string; address?: string }
    | undefined
): MailAddress[] {
  if (!addrs) return [];
  if (Array.isArray(addrs)) return addrs.map(parseAddress);
  return [parseAddress(addrs)];
}

// --- Folder operations ---

export async function listFolders(config: MailConfig): Promise<MailFolder[]> {
  return withImapConnection(config, async (client) => {
    const mailboxes = await client.list();
    const folders: MailFolder[] = [];

    for (const mailbox of mailboxes) {
      try {
        const status = await client.status(mailbox.path, {
          messages: true,
          unseen: true,
        });
        folders.push({
          name: mailbox.name,
          path: mailbox.path,
          total: status.messages ?? 0,
          unread: status.unseen ?? 0,
          specialUse: mailbox.specialUse,
        });
      } catch {
        folders.push({
          name: mailbox.name,
          path: mailbox.path,
          total: 0,
          unread: 0,
          specialUse: mailbox.specialUse,
        });
      }
    }

    return folders;
  });
}

// --- Message listing ---

export async function listMessages(
  config: MailConfig,
  folder: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<MailMessagePreview>> {
  return withImapConnection(config, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      const mailbox = client.mailbox;
      const total = (mailbox && typeof mailbox === "object" && "exists" in mailbox) ? mailbox.exists : 0;

      if (total === 0) {
        return { data: [], total: 0, page, limit, hasMore: false };
      }

      // IMAP sequence numbers: 1 = oldest, total = newest
      // We want newest first, so calculate range from the end
      const end = total - (page - 1) * limit;
      const start = Math.max(1, end - limit + 1);

      if (end < 1) {
        return { data: [], total, page, limit, hasMore: false };
      }

      const messages: MailMessagePreview[] = [];

      for await (const msg of client.fetch(`${start}:${end}`, {
        envelope: true,
        flags: true,
        bodyStructure: true,
        headers: ["message-id"],
      })) {
        const env = msg.envelope!;
        const flags = Array.from(msg.flags ?? []);

        messages.push({
          uid: msg.uid,
          messageId: env.messageId ?? "",
          from: parseAddress(env.from?.[0]),
          to: parseAddressList(env.to),
          subject: env.subject ?? "(sem assunto)",
          preview: "",
          date: env.date?.toISOString() ?? new Date().toISOString(),
          read: flags.includes("\\Seen"),
          flagged: flags.includes("\\Flagged"),
          answered: flags.includes("\\Answered"),
          folder,
        });
      }

      // Reverse to show newest first
      messages.reverse();

      return {
        data: messages,
        total,
        page,
        limit,
        hasMore: start > 1,
      };
    } finally {
      lock.release();
    }
  });
}

// --- Single message ---

export async function getMessage(
  config: MailConfig,
  folder: string,
  uid: number
): Promise<MailMessage | null> {
  return withImapConnection(config, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      const msg = await client.fetchOne(String(uid), {
        envelope: true,
        source: true,
        flags: true,
        uid: true,
      });

      if (!msg) return null;

      const env = msg.envelope!;
      const flags = Array.from(msg.flags ?? []);

      let text = "";
      let html: string | undefined;

      // Parse MIME content using mailparser for proper HTML/text extraction
      if (msg.source) {
        try {
          const parsed = await simpleParser(msg.source);
          text = parsed.text ?? "";
          html = parsed.html || undefined;
        } catch {
          // Fallback: raw extraction
          const raw = msg.source.toString();
          const bodyStart = raw.indexOf("\r\n\r\n");
          if (bodyStart !== -1) {
            text = raw.substring(bodyStart + 4);
          }
        }
      }

      // Mark as seen
      await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });

      return {
        uid: msg.uid,
        messageId: env.messageId ?? "",
        from: parseAddress(env.from?.[0]),
        to: parseAddressList(env.to),
        cc: parseAddressList(env.cc),
        subject: env.subject ?? "(sem assunto)",
        text,
        html,
        date: env.date?.toISOString() ?? new Date().toISOString(),
        flags,
        folder,
      };
    } finally {
      lock.release();
    }
  });
}

// --- Flag operations ---

export async function updateFlags(
  config: MailConfig,
  folder: string,
  uid: number,
  add: string[] = [],
  remove: string[] = []
): Promise<void> {
  return withImapConnection(config, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      if (add.length > 0) {
        await client.messageFlagsAdd(String(uid), add, { uid: true });
      }
      if (remove.length > 0) {
        await client.messageFlagsRemove(String(uid), remove, { uid: true });
      }
    } finally {
      lock.release();
    }
  });
}

// --- Move message ---

export async function moveMessage(
  config: MailConfig,
  folder: string,
  uid: number,
  toFolder: string
): Promise<void> {
  return withImapConnection(config, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      await client.messageMove(String(uid), toFolder, { uid: true });
    } finally {
      lock.release();
    }
  });
}

// --- Search messages ---

export async function searchMessages(
  config: MailConfig,
  folder: string,
  query: string
): Promise<MailMessagePreview[]> {
  return withImapConnection(config, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      const results = await client.search({
        or: [
          { subject: query },
          { from: query },
          { to: query },
          { body: query },
        ],
      });

      if (!results || results.length === 0) return [];

      const messages: MailMessagePreview[] = [];
      const uidList = results.join(",");

      for await (const msg of client.fetch(uidList, {
        envelope: true,
        flags: true,
        uid: true,
      })) {
        const env = msg.envelope!;
        const flags = Array.from(msg.flags ?? []);

        messages.push({
          uid: msg.uid,
          messageId: env.messageId ?? "",
          from: parseAddress(env.from?.[0]),
          to: parseAddressList(env.to),
          subject: env.subject ?? "(sem assunto)",
          preview: "",
          date: env.date?.toISOString() ?? new Date().toISOString(),
          read: flags.includes("\\Seen"),
          flagged: flags.includes("\\Flagged"),
          answered: flags.includes("\\Answered"),
          folder,
        });
      }

      messages.reverse();
      return messages;
    } finally {
      lock.release();
    }
  });
}

// --- Append message (for saving to Sent) ---

export async function appendMessage(
  config: MailConfig,
  folder: string,
  raw: Buffer | string,
  flags: string[] = []
): Promise<void> {
  return withImapConnection(config, async (client) => {
    await client.append(folder, raw, flags);
  });
}
