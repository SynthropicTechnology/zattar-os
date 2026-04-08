/**
 * Security Headers Module
 *
 * Implementa headers HTTP de segurança para proteção contra:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MITM (Man-in-the-Middle)
 * - MIME-type sniffing
 * - Information disclosure
 *
 * CSP é aplicado em modo report-only por padrão para evitar quebras.
 * Configure CSP_REPORT_ONLY=false após validação em produção.
 */

/**
 * Modo report-only para CSP
 * Em report-only, violações são reportadas mas não bloqueadas
 */
export const REPORT_ONLY_MODE = process.env.CSP_REPORT_ONLY !== "false";

/**
 * URI para relatórios de violação CSP
 */
export const CSP_REPORT_URI = process.env.CSP_REPORT_URI || "/api/csp-report";

/**
 * Domínios confiáveis para cada diretiva CSP
 */
const TRUSTED_DOMAINS = {
  // Supabase - Backend/API
  supabase: ["https://*.supabase.co", "wss://*.supabase.co"],
  // Backblaze B2 - Storage
  storage: [
    "https://*.backblazeb2.com",
    "https://s3.us-east-005.backblazeb2.com",
  ],
  // Google Fonts
  fonts: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
  // AI Services
  ai: ["https://api.openai.com", "https://api.cohere.ai"],
  // Dyte - Video Calls
  dyte: ["https://api.dyte.io", "https://dyte.io", "https://*.dyte.io", "wss://*.dyte.io"],
  // Images
  images: ["https://images.unsplash.com"],
  // Chatwoot
  chatwoot: ["https://chatwoot-web.platform.synthropic.app"],
  // CopilotKit
  copilotkit: ["https://api.cloud.copilotkit.ai", "https://cdn.copilotkit.ai"],
  // Cloudflare Stream - Video hosting (usado no hero da landing page)
  cloudflareStream: ["https://customer-lvnfk43x7eec1csc.cloudflarestream.com"],
} as const;

/**
 * Assets públicos que não precisam de headers de segurança
 */
const PUBLIC_ASSETS = [
  "/sw.js",
  "/manifest.json",
  "/robots.txt",
  "/favicon.ico",
  "/sitemap.xml",
  "/browserconfig.xml",
] as const;

/**
 * Prefixos de assets públicos
 */
const PUBLIC_ASSET_PREFIXES = [
  "/workbox-",
  "/android-chrome-",
  "/apple-touch-icon",
  "/_next/static/",
] as const;

/**
 * Verifica se deve aplicar headers de segurança para o pathname
 */
export function shouldApplySecurityHeaders(pathname: string): boolean {
  // Assets públicos específicos
  if (PUBLIC_ASSETS.includes(pathname as (typeof PUBLIC_ASSETS)[number])) {
    return false;
  }

  // Prefixos de assets públicos
  for (const prefix of PUBLIC_ASSET_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return false;
    }
  }

  return true;
}

/**
 * Constrói as diretivas CSP
 */
export function buildCSPDirectives(nonce?: string): string {
  const isProduction = process.env.NODE_ENV === "production";

  // Base para script-src e style-src
  // Chatwoot requires stricter script-src if we want to be safe, but it loads dynamic scripts.
  // Adding trusted domain to script-src allows the initial loader to fetch the SDK.
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' ${TRUSTED_DOMAINS.chatwoot[0]}`
    : `'self' 'unsafe-inline' 'unsafe-eval' ${TRUSTED_DOMAINS.chatwoot[0]}`;

  const styleSrc = nonce
    ? `'self' 'nonce-${nonce}' ${TRUSTED_DOMAINS.fonts[0]} ${TRUSTED_DOMAINS.chatwoot[0]}`
    : `'self' 'unsafe-inline' ${TRUSTED_DOMAINS.fonts[0]} ${TRUSTED_DOMAINS.chatwoot[0]}`;

  // CSP3: separar <style> (elem) de style="..." (attr)
  // Widgets de terceiros (Chatwoot, Dyte) injetam <style> sem nonce.
  // Com nonce no CSP3, 'unsafe-inline' é ignorado, causando violações inevitáveis.
  // Solução pragmática: usar 'unsafe-inline' para style-src-elem (risco baixo)
  // e manter nonce apenas para script-src (risco alto - XSS).
  const styleSrcElem = `'self' 'unsafe-inline' ${TRUSTED_DOMAINS.fonts[0]} ${TRUSTED_DOMAINS.chatwoot[0]}`;
  const styleSrcAttr = "'unsafe-inline'";

  const directives: Record<string, string> = {
    "default-src": "'self'",

    "script-src": scriptSrc,

    "style-src": styleSrc,

    "style-src-elem": styleSrcElem,

    "style-src-attr": styleSrcAttr,

    "font-src": `'self' ${TRUSTED_DOMAINS.fonts[1]} data: ${TRUSTED_DOMAINS.chatwoot[0]}`,

    "img-src": `'self' data: blob: ${TRUSTED_DOMAINS.images.join(" ")} ${
      TRUSTED_DOMAINS.supabase[0]
    } ${TRUSTED_DOMAINS.storage.join(" ")} ${TRUSTED_DOMAINS.chatwoot[0]} ${TRUSTED_DOMAINS.cloudflareStream[0]}`,

    "connect-src": `'self' ${TRUSTED_DOMAINS.supabase.join(
      " "
    )} ${TRUSTED_DOMAINS.storage.join(" ")} ${TRUSTED_DOMAINS.ai.join(
      " "
    )} ${TRUSTED_DOMAINS.dyte.join(" ")} ${TRUSTED_DOMAINS.chatwoot[0]} ${TRUSTED_DOMAINS.copilotkit.join(" ")}`,

    "frame-src": `'self' ${TRUSTED_DOMAINS.dyte.slice(1).join(" ")} ${
      TRUSTED_DOMAINS.chatwoot[0]
    } ${TRUSTED_DOMAINS.cloudflareStream[0]}`,

    "media-src": `'self' blob: ${
      TRUSTED_DOMAINS.supabase[0]
    } ${TRUSTED_DOMAINS.storage.join(" ")} ${TRUSTED_DOMAINS.dyte.join(" ")} ${TRUSTED_DOMAINS.cloudflareStream[0]}`,

    "worker-src": "'self' blob:",

    "object-src": "'none'",

    "base-uri": "'self'",

    "form-action": "'self'",

    "frame-ancestors": "'none'",

    "report-uri": CSP_REPORT_URI,

    "report-to": "csp-endpoint",
  };

  // Upgrade insecure requests apenas em produção
  if (isProduction) {
    directives["upgrade-insecure-requests"] = "";
  }

  // Construir string de diretivas
  return Object.entries(directives)
    .map(([key, value]) => (value ? `${key} ${value}` : key))
    .join("; ");
}

/**
 * Constrói a Permissions-Policy
 * Desabilita recursos não utilizados para maior segurança
 */
export function buildPermissionsPolicy(): string {
  const policies: Record<string, string> = {
    // Geolocalização permitida para assinatura digital
    geolocation: "(self)",
    camera: "(self)", // Dyte precisa de acesso via getUserMedia
    microphone: "(self)", // Dyte precisa de acesso via getUserMedia
    payment: "()",
    usb: "()",
    magnetometer: "()",
    gyroscope: "()",
    accelerometer: "()",
    autoplay: "(self)",
    "encrypted-media": "(self)",
    fullscreen: "(self)",
    "picture-in-picture": "(self)",
  };

  return Object.entries(policies)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

/**
 * Retorna o URI para relatórios CSP
 */
export function getCSPReportUri(): string {
  return CSP_REPORT_URI;
}

/**
 * Interface para os headers de segurança
 */
export interface SecurityHeaders {
  "Content-Security-Policy"?: string;
  "Content-Security-Policy-Report-Only"?: string;
  "Strict-Transport-Security": string;
  "X-Frame-Options": string;
  "X-Content-Type-Options": string;
  "Referrer-Policy": string;
  "Permissions-Policy": string;
  "X-DNS-Prefetch-Control": string;
  "Report-To"?: string;
}

/**
 * Constrói todos os headers de segurança
 */
export function buildSecurityHeaders(
  nonce?: string,
  reportOnly: boolean = REPORT_ONLY_MODE
): SecurityHeaders {
  const isProduction = process.env.NODE_ENV === "production";
  const cspDirectives = buildCSPDirectives(nonce);

  const headers: SecurityHeaders = {
    // HSTS - Force HTTPS (apenas em produção)
    "Strict-Transport-Security": isProduction
      ? "max-age=31536000; includeSubDomains; preload"
      : "max-age=0",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Prevent MIME-type sniffing
    "X-Content-Type-Options": "nosniff",

    // Control referrer information
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy
    "Permissions-Policy": buildPermissionsPolicy(),

    // DNS Prefetch Control
    "X-DNS-Prefetch-Control": "on",
  };

  // CSP header - report-only ou enforcement
  if (reportOnly) {
    headers["Content-Security-Policy-Report-Only"] = cspDirectives;
  } else {
    headers["Content-Security-Policy"] = cspDirectives;
  }

  // Report-To header para CSP reporting
  if (isProduction) {
    headers["Report-To"] = JSON.stringify({
      group: "csp-endpoint",
      max_age: 10886400,
      endpoints: [{ url: CSP_REPORT_URI }],
    });
  }

  return headers;
}

/**
 * Aplica headers de segurança em um objeto Headers
 */
export function applySecurityHeaders(
  headers: Headers,
  nonce?: string,
  reportOnly: boolean = REPORT_ONLY_MODE
): void {
  const securityHeaders = buildSecurityHeaders(nonce, reportOnly);

  for (const [key, value] of Object.entries(securityHeaders)) {
    if (value) {
      headers.set(key, value);
    }
  }

  // Adicionar nonce como header customizado para uso em componentes
  if (nonce) {
    headers.set("x-nonce", nonce);
  }
}

/**
 * Gera um nonce seguro para CSP
 * Usa crypto.randomUUID() disponível no Edge Runtime
 */
export function generateNonce(): string {
  // crypto.randomUUID() é disponível no Edge Runtime do Next.js
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }

  // Fallback usando getRandomValues
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  // Último fallback (não deve acontecer em ambiente moderno)
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
