import { config } from "dotenv";

// Prefer .env.local (Next.js convention). Fallback to default dotenv behavior.
config({ path: ".env.local" });
config();

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: unknown;
};

type Args = {
  baseUrl: string;
  endpointPath: string;
  toolName: string;
  cpf: string;
  apiKey?: string;
  timeoutMs: number;
};

function normalizeEndpointPath(input: string): string {
  // On Windows Git Bash (MSYS), arguments like "/api/mcp/messages" can be rewritten
  // to something like "C:/Program Files/Git/api/mcp/messages".
  // That breaks URL construction because it looks like a scheme ("c:").
  const trimmed = input.trim();

  // If user already passed a full URL, keep it.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // If MSYS rewrote the path to a Windows path, recover the /api/... portion.
  // Example: C:/Program Files/Git/api/mcp/messages -> /api/mcp/messages
  const apiIndex = trimmed.toLowerCase().indexOf("/api/");
  if (apiIndex !== -1) {
    return trimmed.slice(apiIndex);
  }

  // Ensure we always return a path starting with '/'
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function parseArgs(argv: string[]): Args {
  const get = (name: string, fallback?: string) => {
    const idx = argv.indexOf(`--${name}`);
    if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
    return fallback;
  };

  const baseUrl =
    get("baseUrl") ||
    process.env.MCP_SYNTHROPIC_API_URL ||
    "http://localhost:3000";

  const endpointRaw = get("endpoint") || "/api/mcp/stream";
  const endpointPath = normalizeEndpointPath(endpointRaw);
  const toolName = get("tool") || "buscar_processos_por_cpf";
  const cpf = get("cpf") || "15543028709";

  const apiKey =
    get("apiKey") || process.env.MCP_SYNTHROPIC_API_KEY || process.env.SERVICE_API_KEY;

  const timeoutMsRaw = get("timeoutMs") || process.env.MCP_TEST_TIMEOUT_MS || "15000";
  const timeoutMs = Number(timeoutMsRaw);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`timeoutMs inválido: ${timeoutMsRaw}`);
  }

  return { baseUrl, endpointPath, toolName, cpf, apiKey, timeoutMs };
}

async function jsonRpcCall(
  baseUrl: string,
  endpointPath: string,
  apiKey: string | undefined,
  timeoutMs: number,
  req: JsonRpcRequest
) {
  const url = new URL(endpointPath, baseUrl);
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (apiKey) {
    headers["x-service-api-key"] = apiKey;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    console.log(`\n-> POST ${url.toString()}  method=${req.method}  timeoutMs=${timeoutMs}`);
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(req),
      signal: controller.signal,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Falha ao chamar ${url.toString()} (timeoutMs=${timeoutMs}). Motivo: ${reason}`
    );
  } finally {
    clearTimeout(timeout);
  }

  console.log(`<- HTTP ${res.status} ${res.statusText}`);

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body: json };
}

function pickStructuredSummary(result: unknown) {
  const resObj = result as { result?: { structuredContent?: unknown; content?: unknown } } | null;
  const sc = resObj?.result?.structuredContent;
  const content = resObj?.result?.content;

  const contentTypes = Array.isArray(content)
    ? (content as Array<{ type?: unknown }>).map((c) => c?.type)
    : typeof content;

  const firstTextPreview =
    Array.isArray(content) && (content as Array<{ type?: unknown; text?: unknown }>)[0]?.type === "text"
      ? String((content as Array<{ type?: unknown; text?: unknown }>)[0]?.text ?? "").slice(0, 200)
      : undefined;

  return {
    hasStructuredContent: sc !== undefined,
    structuredContentType: sc === null ? "null" : typeof sc,
    contentTypes,
    firstTextPreview,
  };
}

async function main() {
  const args = parseArgs(process.argv);

  const callId = Date.now();

  console.log("== MCP Test Call ==");
  console.log(JSON.stringify({
    baseUrl: args.baseUrl,
    endpointPath: args.endpointPath,
    toolName: args.toolName,
    hasApiKey: Boolean(args.apiKey),
    timeoutMs: args.timeoutMs,
  }, null, 2));

  // 1) tools/list
  const listReq: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: `${callId}_list`,
    method: "tools/list",
  };

  const listRes = await jsonRpcCall(
    args.baseUrl,
    args.endpointPath,
    args.apiKey,
    args.timeoutMs,
    listReq
  );
  console.log("\n== tools/list response ==");
  console.log(JSON.stringify(listRes.body, null, 2));

  // 2) tools/call
  const callReq: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: `${callId}_call`,
    method: "tools/call",
    params: {
      name: args.toolName,
      arguments: { cpf: args.cpf },
    },
  };

  const callRes = await jsonRpcCall(
    args.baseUrl,
    args.endpointPath,
    args.apiKey,
    args.timeoutMs,
    callReq
  );
  console.log("\n== tools/call response (full) ==");
  console.log(JSON.stringify(callRes.body, null, 2));

  console.log("\n== tools/call summary ==");
  console.log(JSON.stringify(pickStructuredSummary(callRes.body), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
