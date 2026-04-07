import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import noHardcodedSecrets from "./eslint-rules/no-hardcoded-secrets.js";
import noHslVarTokens from "./eslint-rules/no-hsl-var-tokens.js";

const eslintConfig = defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
      "react-runtime": "automatic",
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-html-link-for-pages": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Auto-generated service worker files (next-pwa)
    "public/sw.js",
    "public/workbox-*.js",
    "public/fallback-*.js",
    // Third-party libraries in public folder (pre-built, not our code)
    "public/pdfjs/**",
    // Library folder (component library, not part of main app)
    "library/**",
    // Coverage reports (auto-generated)
    "coverage/**",
    // Non-code files (avoid parser errors)
    ".env.example",
    "docs/**",
  ]),
  {
    plugins: {
      custom: {
        rules: {
          "no-hardcoded-secrets": noHardcodedSecrets,
          "no-hsl-var-tokens": noHslVarTokens,
        },
      },
    },
    rules: {
      "custom/no-hardcoded-secrets": "error",
      // ERROR — quebra build. CSS inválido detectado em produção em 36 arquivos
      // antes desta sessão. Não é estilo, é bug visual confirmado.
      // Aplica em TODO o codebase, sem exclusões.
      "custom/no-hsl-var-tokens": "error",
    },
  },
  // Exceções para arquivos de exemplo e documentação
  {
    files: [".env.example", "src/app/(ajuda)/**/*.tsx", "docs/**/*.md"],
    rules: {
      "custom/no-hardcoded-secrets": "off",
    },
  },
  {
    rules: {
      // Permitir variáveis não utilizadas com prefixo underscore (ex: _description, _program)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Prevenir imports diretos de caminhos internos de módulos
      // NOTA: Imports relativos dentro do mesmo módulo são permitidos (ex: ../hooks/use-x)
      // Mas imports absolutos de caminhos internos de outros módulos são bloqueados
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Bloqueia imports absolutos de caminhos internos de módulos colocados
              // Exemplo proibido: import { X } from '@/app/(authenticated)/partes/components/...'
              // Exemplo permitido: import { X } from '@/app/(authenticated)/partes'
              // Exemplo permitido (dentro do módulo): import { X } from '../hooks/...'
              group: [
                "@/app/(authenticated)/*/components/**",
                "@/app/(authenticated)/*/hooks/**",
                "@/app/(authenticated)/*/actions/**",
                "@/app/(authenticated)/*/utils/**",
                "@/app/(authenticated)/*/types/**",
                "@/app/(authenticated)/*/domain.ts",
                "@/app/(authenticated)/*/service.ts",
                "@/app/(authenticated)/*/repository.ts",
              ],
              message:
                "Use barrel exports (@/app/(authenticated)/{modulo}) instead of direct internal paths. For imports within the same module, use relative paths (../hooks/...). Example: import { Component } from '@/app/(authenticated)/partes'",
            },
            {
              // Bloqueia imports de pastas legadas em src/
              group: ["**/backend/**", "@/core/**", "@/app/_lib/**", "@/features/**"],
              message:
                "Legacy imports are not allowed. Use modules from @/app/(authenticated)/{modulo}, @/lib/{service}, or @/components/{type} instead.",
            },
          ],
        },
      ],
    },
  },
  // Scripts utilitários (não fazem parte do bundle do app) — permitir usos pragmáticos de `any` e padrões Node.
  {
    files: ["scripts/**/*.ts", "scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@next/next/no-assign-module-variable": "off",
      "prefer-const": "off",
    },
  },
  // Testes (unit/integration/e2e): permitir `any` e flexibilizar regras de hooks que são muito restritivas em cenários de teste.
  {
    files: [
      "src/**/__tests__/**/*.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
      "src/testing/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/immutability": "off",
    },
  },
  // Endpoints de recovery (debug/diagnóstico) — permitem parsing flexível de JSON.
  {
    files: ["src/app/api/captura/recovery/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Serviços de recovery/análise (internos) — permitir `any` para lidar com payloads heterogêneos.
  {
    files: ["src/app/(authenticated)/captura/services/recovery/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Governança do Design System: impedir uso direto do Badge em módulos de feature.
  // Use SemanticBadge / wrappers semânticos para manter consistência.
  {
    files: ["src/app/(authenticated)/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components/ui/badge",
              message:
                "Do not import Badge directly in feature code. Use SemanticBadge (or specialized semantic wrappers) so badge styles remain consistent across the app.",
            },
          ],
        },
      ],
    },
  },
  // Governança do Design System (Tokens de Cor):
  // Bloqueia padrões que ignoram os tokens semânticos definidos em globals.css.
  //
  // Exclusões legítimas (com justificativa):
  //   - editor/**: color pickers, syntax highlighting, equation editor — cores
  //     são DOMÍNIO desses componentes, não decoração
  //   - charts/**: wrappers Recharts que recebem cores via props (var(--chart-*))
  //   - lib/domain/tags/domain.ts: SINGLE SOURCE OF TRUTH dos hex de tags
  //     (banco armazena hex, este arquivo é a tabela de mapeamento canônica)
  //   - **/mock/**: dados de mock/seed para playgrounds visuais — não vão
  //     pra produção, mas precisam de cores literais para visualização
  //   - (dev)/library/**: páginas de documentação que MOSTRAM os tokens
  //     visualmente, podem precisar de literals para demos
  //   - testes: fixtures
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    ignores: [
      "src/components/editor/**",
      "src/components/ui/chart.tsx",
      "src/components/ui/charts/**",
      "src/lib/domain/tags/domain.ts",
      "src/app/(authenticated)/notas/label-colors.ts",
      "src/app/globals.css",
      "**/mock/**",
      "**/mocks/**",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "src/app/(dev)/**",
    ],
    rules: {
      // WARN — apontamentos de débito técnico, não bloqueia build.
      // A regra hsl(var(--)) foi promovida para custom/no-hsl-var-tokens (error)
      // pois é bug visual real, não dívida estilística.
      "no-restricted-syntax": [
        "warn",
        {
          // Cores Tailwind cruas (text-red-500, bg-blue-200, etc.) — use tokens semânticos
          // text-success, text-destructive, text-warning, text-info, text-muted-foreground
          selector:
            "Literal[value=/(?:^|\\s)(?:text|bg|border|ring|fill|stroke|from|to|via)-(?:red|green|blue|yellow|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-\\d/]",
          message:
            "Não use cores Tailwind cruas (ex: text-red-500). Use tokens semânticos: text-success, text-destructive, text-warning, text-info, text-muted-foreground, text-primary. Para casos decorativos use --chart-1..5 ou --portal-*-soft.",
        },
        {
          // OKLCH literal (sem `from var(--`) — provável valor cru
          // Permitido: oklch(from var(--token) ...) — relative color syntax
          selector:
            "Literal[value=/oklch\\(\\s*\\d/]",
          message:
            "Literal OKLCH detectado. Use tokens (--primary, --success, etc.) ou oklch(from var(--token) l c h / alpha) para opacidade. Veja globals.css para a lista de tokens.",
        },
      ],
    },
  },
  // Governança do Design System (Tipografia):
  // Para evitar estilos ad hoc, obrigamos o uso de `Typography.*` (ou classes `typography-*`)
  // nas telas/componentes de Usuários (escopo inicial, para não gerar milhares de erros no repo).
  {
    files: [
      "src/features/usuarios/**/*.{ts,tsx}",
      "src/app/**/usuarios/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='h1']",
          message:
            "Não use <h1> direto. Use `Typography.H1` (ou `className=\"typography-h1\"`).",
        },
        {
          selector: "JSXOpeningElement[name.name='h2']",
          message:
            "Não use <h2> direto. Use `Typography.H2` (ou `className=\"typography-h2\"`).",
        },
        {
          selector: "JSXOpeningElement[name.name='h3']",
          message:
            "Não use <h3> direto. Use `Typography.H3` (ou `className=\"typography-h3\"`).",
        },
        {
          selector: "JSXOpeningElement[name.name='h4']",
          message:
            "Não use <h4> direto. Use `Typography.H4` (ou `className=\"typography-h4\"`).",
        },
        {
          selector: "JSXOpeningElement[name.name='h5']",
          message:
            "Não use <h5> direto. Use `Typography.H4` (ou `className=\"typography-h4\"`) para títulos menores.",
        },
        {
          selector: "JSXOpeningElement[name.name='h6']",
          message:
            "Não use <h6> direto. Use `Typography.H4` (ou `className=\"typography-h4\"`) para títulos menores.",
        },
      ],
    },
  },
]);

export default eslintConfig;
