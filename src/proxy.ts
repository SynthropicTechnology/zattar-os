/**
 * Next.js Proxy (formerly middleware) for:
 * - Supabase session management
 * - Security headers
 * - IP blocking/whitelisting
 * - Multi-app routing (website, dashboard, portal)
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  applySecurityHeaders,
  shouldApplySecurityHeaders,
  generateNonce,
} from "@/middleware/security-headers";
import { getClientIp } from "@/lib/utils/get-client-ip";
import {
  isIpBlocked,
  isIpWhitelisted,
  getBlockInfo,
  recordSuspiciousActivity,
} from "@/lib/security/ip-blocking-edge";

// CRITICAL: Add safety check at module load time
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY) {
  console.warn(
    '[Proxy Init] Missing critical env vars - will handle gracefully at runtime'
  );
}

/**
 * Proxy para gerenciar autenticação Supabase e roteamento multi-app
 *
 * ARQUITETURA BASEADA EM DIRETÓRIOS:
 * - Website: / (raiz) -> Público
 * - Dashboard: /app/* -> Requer autenticação Supabase
 * - Portal do Cliente: /portal/* -> Requer sessão CPF
 *
 * Responsabilidades:
 * 1. Atualizar sessão do usuário automaticamente
 * 2. Redirecionar usuários não autenticados para /login
 * 3. Permitir acesso a rotas públicas
 * 4. Não interferir em rotas de API (elas têm sua própria autenticação)
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Assets públicos que não precisam de processamento
  const isPublicRootAsset =
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/workbox-") ||
    pathname.startsWith("/android-chrome-") ||
    pathname.startsWith("/apple-touch-icon");

  if (isPublicRootAsset) {
    return NextResponse.next({ request });
  }

  // ============================================================================
  // IP BLOCKING CHECK
  // ============================================================================

  // Endpoints que não devem ser bloqueados
  const ipBlockingExceptions = [
    "/api/health",
    "/api/csp-report",
  ];

  const isIpBlockingExcepted = ipBlockingExceptions.some((path) =>
    pathname.startsWith(path)
  );

  if (!isIpBlockingExcepted) {
    const clientIp = getClientIp(request);

    // Check whitelist first (fast path)
    const whitelisted = isIpWhitelisted(clientIp);

    if (!whitelisted) {
      // Check if IP is blocked
      const blocked = isIpBlocked(clientIp);

      if (blocked) {
        const blockInfo = getBlockInfo(clientIp);
        console.warn(`[Security] Blocked IP attempt: ${clientIp}`, {
          pathname,
          reason: blockInfo?.reason.type,
          blockedAt: blockInfo?.blockedAt,
          expiresAt: blockInfo?.expiresAt,
        });

        return new NextResponse("Access Denied", {
          status: 403,
          statusText: "Forbidden",
          headers: {
            "Content-Type": "text/plain",
            "X-Blocked-Reason": blockInfo?.reason.type || "unknown",
          },
        });
      }
    }
  }

  // Gerar nonce para CSP ANTES de criar o response
  // O nonce precisa estar nos request headers para que o Next.js
  // o aplique automaticamente aos seus inline scripts
  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Headers de debug e segurança
  const applyHeaders = (response: NextResponse) => {
    // Debug headers
    response.headers.set("x-zattar-pathname", pathname);
    response.headers.set("x-zattar-app-type", getAppType(pathname));

    // Security headers (se aplicável)
    if (shouldApplySecurityHeaders(pathname)) {
      applySecurityHeaders(response.headers, nonce);
    }

    return response;
  };

  // Determinar qual app baseado no path
  function getAppType(path: string): "website" | "dashboard" | "portal" {
    if (path.startsWith("/app")) return "dashboard";
    if (path.startsWith("/portal")) return "portal";
    return "website";
  }

  const appType = getAppType(pathname);

  // Detectar endpoints /api/* desconhecidos para acionar auto-blocking
  // (ex.: >20 requisições inválidas em 5min)
  function isKnownEndpoint(path: string): boolean {
    const knownApiPrefixes = [
      '/api/acervo',
      '/api/admin',
      '/api/ai',
      '/api/assinatura-digital',
      '/api/auth',
      '/api/cache',
      '/api/captura',
      '/api/clientes',
      '/api/copilotkit',
      '/api/cron',
      '/api/csp-report',
      '/api/debug',
      '/api/docs',
      '/api/enderecos',
      '/api/fornecedores',
      '/api/health',
      '/api/mcp',
      '/api/me',
      '/api/pastas',
      '/api/pendentes-manifestacao',
      '/api/perfil',
      '/api/permissoes',
      '/api/pje',
      '/api/plate',
      '/api/templates',
      '/api/tipos-expedientes',
      '/api/tribunais',
      '/api/twofauth',
      '/api/webhooks',
    ];

    return knownApiPrefixes.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`)
    );
  }

  // ============================================================================
  // WEBSITE - Público (raiz /)
  // ============================================================================
  if (appType === "website") {
    // Se usuário autenticado acessar "/" redirecionar para o dashboard.
    // Verificação leve via cookie (sem chamada Supabase para evitar latência).
    // O (authenticated)/page.tsx foi removido por causar conflito de rota com
    // app/page.tsx — ambos mapeavam para "/" e causavam InvariantError no standalone.
    if (pathname === "/" || pathname === "") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        try {
          const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
          const authCookiePrefix = `sb-${projectRef}-auth-token`;
          const hasAuthCookie = request.cookies.getAll().some(({ name }) =>
            name.startsWith(authCookiePrefix)
          );
          if (hasAuthCookie) {
            const dashboardUrl = request.nextUrl.clone();
            dashboardUrl.pathname = "/app/dashboard";
            return applyHeaders(NextResponse.redirect(dashboardUrl));
          }
        } catch {
          // Ignorar erros ao parsear URL — continuar para o site
        }
      }
    }
    return applyHeaders(supabaseResponse);
  }

  // ============================================================================
  // PORTAL DO CLIENTE - Requer sessão CPF (/portal/*)
  // ============================================================================
  if (appType === "portal") {
    // Permitir acesso à página de login do portal
    if (pathname === "/portal" || pathname === "/portal/") {
      return applyHeaders(supabaseResponse);
    }

    // Verificar cookie de sessão do portal
    const portalCookie = request.cookies.get("portal-cpf-session");
    if (!portalCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return applyHeaders(NextResponse.redirect(url));
    }

    // Sessão válida, permitir acesso
    return applyHeaders(supabaseResponse);
  }

  // ============================================================================
  // DASHBOARD - Requer autenticação Supabase (/app/*)
  // ============================================================================

  // Rotas de API não devem ser bloqueadas pelo middleware
  // Elas têm sua própria lógica de autenticação
  if (pathname.startsWith("/api/")) {
    if (!isKnownEndpoint(pathname)) {
      // Registrar atividade suspeita (síncrono, in-memory no Edge)
      recordSuspiciousActivity(
        getClientIp(request),
        'invalid_endpoints',
        pathname
      );
    }
    return applyHeaders(supabaseResponse);
  }

  // Rotas públicas do dashboard (login, signup, etc)
  const publicDashboardRoutes = [
    "/app/login",
    "/app/forgot-password",
    "/app/update-password",
    "/app/confirm",
    "/app/error",
  ];

  // Rotas públicas globais (assinatura digital, formulários)
  const globalPublicRoutes = [
    "/assinatura",
    "/formulario",
  ];

  const isPublicRoute =
    publicDashboardRoutes.some((route) => pathname.startsWith(route)) ||
    globalPublicRoutes.some((route) => pathname.startsWith(route));

  // Validar variáveis de ambiente obrigatórias
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
    );
    return NextResponse.next();
  }

  // Criar cliente Supabase para proxy
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Preservar os request headers com nonce ao recriar o response
          const updatedHeaders = new Headers(request.headers);
          updatedHeaders.set("x-nonce", nonce);
          supabaseResponse = NextResponse.next({
            request: { headers: updatedHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANTE: Não executar código entre createServerClient e getClaims().
  // getClaims() valida o JWT localmente e dispara o refresh de tokens
  // quando necessário, mantendo os cookies sincronizados entre browser e server.
  // Usar getSession() aqui causava perda aleatória de sessão no refresh (CTRL+R).
  // Ref: https://supabase.com/docs/guides/troubleshooting/how-to-migrate-from-supabase-auth-helpers-to-ssr-package-5NRunM
  const { data, error: authError } = await supabase.auth.getClaims();

  const user = data?.claims;

  // Se não está autenticado e não é rota pública, redirecionar para login
  if ((!user || authError) && !isPublicRoute) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar erros ao fazer signOut
    }

    const url = request.nextUrl.clone();
    url.pathname = "/app/login";
    url.searchParams.set("redirectTo", pathname);

    const redirectResponse = NextResponse.redirect(url);

    // Limpar TODOS os cookies de auth do Supabase, incluindo chunks.
    // O @supabase/ssr divide tokens grandes em cookies chunked:
    // sb-{ref}-auth-token.0, .1, .2, etc.
    // Precisamos iterar todos os cookies da request para encontrá-los.
    const projectRef = (() => {
      try {
        return new URL(supabaseUrl).hostname.split(".")[0];
      } catch {
        return null;
      }
    })();

    const authCookiePrefix = projectRef ? `sb-${projectRef}-auth-token` : null;

    request.cookies.getAll().forEach(({ name }) => {
      // Limpar cookie base, chunks (.0, .1, ...) e code-verifier
      if (authCookiePrefix && name.startsWith(authCookiePrefix)) {
        redirectResponse.cookies.delete(name);
        redirectResponse.cookies.set(name, "", {
          expires: new Date(0),
          path: "/",
          sameSite: "lax",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });
      }
    });

    return applyHeaders(redirectResponse);
  }

  return applyHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
