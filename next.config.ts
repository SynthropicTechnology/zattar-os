import type { NextConfig } from "next";
import path from "path";
import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Bundle analyzer for performance analysis (enabled via ANALYZE=true)
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? bundleAnalyzer({
        enabled: true,
        analyzerMode: "static",
        openAnalyzer: false,
      })
    : (config: NextConfig) => config;

const APP_MODULES = [
  "acordos-condenacoes",
  "assinatura-digital",
  "assistentes",
  "audiencias",
  "captura",
  "chat",
  "contratos",
  "dashboard",
  "documentos",
  "expedientes",
  "financeiro",
  "notificacoes",
  "partes",
  "perfil",
  "pericias",
  "processos",
  "rh",
  "usuarios",
];

// Git revision for cache busting and version tracking
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  }).stdout?.trim() ?? crypto.randomUUID();

function parseAllowedOrigins(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .filter((origin) => /^https?:\/\//.test(origin));
}

function getServerActionAllowedOrigins(): string[] {
  const defaults = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://zattaradvogados.com",
    "https://zattaradvogados.com.br",
    "https://app.sinesys.com.br",
  ];

  const configuredOrigins = [
    ...parseAllowedOrigins(process.env.SERVER_ACTIONS_ALLOWED_ORIGINS),
    ...parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
    ...parseAllowedOrigins(process.env.CLOUDRON_APP_ORIGIN),
    ...parseAllowedOrigins(process.env.NEXT_PUBLIC_APP_URL),
    ...parseAllowedOrigins(process.env.NEXT_PUBLIC_WEBSITE_URL),
    ...parseAllowedOrigins(process.env.APP_URL),
  ];

  return Array.from(new Set([...defaults, ...configuredOrigins]));
}

const serverActionAllowedOrigins = getServerActionAllowedOrigins();

const nextConfig: NextConfig = {
  // Expose build ID to client for version mismatch detection
  env: {
    NEXT_PUBLIC_BUILD_ID: revision,
  },
  // Generates a build optimized for Docker, reducing image size and improving startup time
  output: "standalone",
  outputFileTracingExcludes: {
    "*": ["**/*src_features_partes_actions_data*"],
  },
  // Custom cache handler for persistent caching across builds (production only)
  // Turbopack in dev mode doesn't support custom cache handlers
  ...(process.env.NODE_ENV === "production" && {
    cacheHandler: path.resolve(__dirname, "./cache-handler.js"),
    cacheMaxMemorySize: 0,
  }),
  serverExternalPackages: [
    // Logging
    "pino",
    "pino-pretty",
    "thread-stream",
    // Avoid bundling Playwright (Turbopack can choke on recorder assets like .ttf)
    "playwright",
    "playwright-core",
    // PDF libraries need legacy builds for Node.js environments
    "pdf-lib",
    "pdfjs-dist",
    "@pdfjs-dist/font-data",
    "pdf-parse",
    // Redis client - Node.js only, should not be bundled for client
    "ioredis",
    "swagger-jsdoc",
    // Document manipulation libraries - Node.js only
    "docx",
    "exceljs",
    "jszip",
    "mustache",
    "papaparse",
    "ofx-js",
    // Storage clients - Node.js only
    "minio",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    // AI/ML libraries - Node.js only
    "@langchain/core",
  ],
  // Transpile ESM-only packages for compatibility
  transpilePackages: [
    // Remark/Rehype ecosystem (ESM-only)
    "remark-gfm",
    "remark-math",
    "rehype-raw",
    "rehype-sanitize",
    "unified",
    "vfile",
    "unist-util-visit",
    "hast-util-sanitize",
    "mdast-util-gfm",
  ],
  // Disables browser source maps in production to save ~500MB during build and reduce bundle size
  productionBrowserSourceMaps: false,
  // Exclude test files from compilation
  excludeDefaultMomentLocales: true,
  pageExtensions: ["tsx", "ts", "jsx", "js"].filter(
    (ext) => !ext.includes("test"),
  ),
  // ESLint disabled via NEXT_LINT_DISABLED=true in Dockerfile
  // (eslint config key removed - not supported in Next.js 16)
  // Força imports granulares, reduzindo bundle em 20-30%
  // Movido de experimental para root em Next.js 13.5+
  modularizeImports: {
    "date-fns": {
      transform: "date-fns/{{member}}",
    },
    "lodash-es": {
      transform: "lodash-es/{{member}}",
    },
    // NOTE: @radix-ui/react-icons and recharts removed from modularizeImports
    // Modern versions don't use dist/ or es6/ subpaths - they export from main package
    // Tree-shaking is handled by optimizePackageImports instead
  },
  experimental: {
    // NOTA: Warnings de "Invalid source map" do Turbopack são conhecidos no Next.js 16.0.10
    // Não há opção para desabilitar source maps do Turbopack. O warning não afeta funcionalidade.
    // Alternativas: atualizar Next.js ou desabilitar Turbopack com `turbo: false` (não recomendado)
    // Aumenta limite de tamanho do body para Server Actions (upload de imagens)
    serverActions: {
      bodySizeLimit: "50mb",
      allowedOrigins: serverActionAllowedOrigins,
    },
    optimizePackageImports: [
      // Bibliotecas
      "date-fns",
      "lucide-react",
      "recharts",
      "framer-motion",
      // Radix UI - todos os componentes
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-aspect-ratio",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-context-menu",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toolbar",
      "@radix-ui/react-tooltip",
      // Plate.js - editor de texto rico
      "@platejs/core",
      "@platejs/common",
      "@platejs/ai",
      "@platejs/autoformat",
      "@platejs/basic-nodes",
      "@platejs/basic-styles",
      "@platejs/callout",
      "@platejs/caption",
      "@platejs/code-block",
      "@platejs/combobox",
      "@platejs/comment",
      "@platejs/date",
      "@platejs/dnd",
      "@platejs/docx",
      "@platejs/emoji",
      "@platejs/floating",
      "@platejs/indent",
      "@platejs/layout",
      "@platejs/link",
      "@platejs/list",
      "@platejs/markdown",
      "@platejs/math",
      "@platejs/media",
      "@platejs/mention",
      "@platejs/selection",
      "@platejs/suggestion",
      "@platejs/table",
      "@platejs/yjs",
    ],
  },
  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname, "src"),
      "@/lib": path.resolve(__dirname, "src/lib"),
      "@/backend": path.resolve(__dirname, "backend"),
    },
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js"],
  },
  typescript: {
    // Build will fail on TypeScript errors - ensures type safety
    // Can be skipped in Docker builds with SKIP_TYPE_CHECK=true (already done in CI)
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === "true",
  },
  // Fetch logging desabilitado - use DEBUG_SUPABASE=true para logs legíveis
  // logging: {
  //   fetches: {
  //     fullUrl: true,
  //   },
  // },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Strapi Media Library (produção)
      {
        protocol: "https",
        hostname: "*.zattaradvogados.com.br",
      },
      // Strapi local dev
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
      },
    ],
  },
  async redirects() {
    return APP_MODULES.flatMap((module) => [
      {
        source: `/${module}`,
        destination: `/app/${module}`,
        permanent: true,
      },
      {
        source: `/${module}/:path*`,
        destination: `/app/${module}/:path*`,
        permanent: true,
      },
    ]);
  },
  async rewrites() {
    return [
      {
        source: "/app",
        destination: "/dashboard",
      },
      {
        source: "/app/:path*",
        destination: "/:path*",
      },
      // Website public pages — expose without /website/ prefix
      {
        source: "/expertise",
        destination: "/website/expertise",
      },
      {
        source: "/insights",
        destination: "/website/insights",
      },
      {
        source: "/insights/tendencias",
        destination: "/website/insights/tendencias",
      },
      // Artigos dinâmicos do Strapi — deve ficar APÓS /tendencias
      {
        source: "/insights/:slug",
        destination: "/website/insights/:slug",
      },
      {
        source: "/servicos",
        destination: "/website/servicos",
      },
      {
        source: "/solucoes",
        destination: "/website/solucoes",
      },
      {
        source: "/contato",
        destination: "/website/contato",
      },
      {
        source: "/faq",
        destination: "/website/faq",
      },
      {
        source: "/politica-de-privacidade",
        destination: "/website/politica-de-privacidade",
      },
      {
        source: "/termos-de-uso",
        destination: "/website/termos-de-uso",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/workbox-:path([a-zA-Z0-9._-]+)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
  allowedDevOrigins: [
    "192.168.1.100",
    "192.168.1.100:3000",
    "192.168.1.103",
    "192.168.1.103:3000",
    "192.168.1.150",
    "192.168.1.150:3000",
  ],
};

// ============================================================================
// PWA Configuration (@serwist/next)
// ============================================================================
// Service worker is defined in src/app/sw.ts with runtime caching strategies.
// Serwist supports both Webpack and Turbopack bundlers natively.
// See DEPLOY.md section "Progressive Web App (PWA)" for troubleshooting.
//
// Bundle Analyzer: Set ANALYZE=true to generate bundle analysis reports
// Reports are saved to scripts/results/bundle-analysis/
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  disable:
    process.env.NODE_ENV === "development" ||
    process.env.DISABLE_PWA === "true",
});

export default withBundleAnalyzer(withSerwist(nextConfig));
