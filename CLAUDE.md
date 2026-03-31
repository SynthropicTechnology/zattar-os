# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sinesys (Zattar OS) is a legal management system (gestao juridica) for a Brazilian law firm. The codebase is primarily in Portuguese (variable names, business terms, UI labels).

**Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 (strict), Supabase (PostgreSQL + RLS + pgvector), Redis (optional cache), Tailwind CSS 4, shadcn/ui (new-york style)

**Node**: >= 22.0.0, npm >= 10

## Commands

```bash
# Development
npm run dev                          # Turbopack dev server (default)
npm run dev:webpack                  # Webpack dev server (debugging)
npm run type-check                   # TypeScript validation (run before commits)

# Build
npm run build                        # Standard build
npm run build:ci                     # CI/Docker build (higher heap, 6GB)

# Testing
npm test                             # All tests (Jest 30)
npm run test:watch                   # Watch mode
npm run test:unit                    # Unit tests only
npm run test:integration             # Integration tests only
npm run test:e2e                     # Playwright E2E
npm run test:coverage                # Coverage report (HTML)
npx jest path/to/file.test.ts        # Single test file
npm run test:actions:processos       # Test specific module (also: partes, financeiro, etc.)

# Linting & Architecture Validation
npm run lint                         # ESLint
npm run check:architecture           # FSD import validation (runs before build)
npm run validate:exports             # Barrel export validation

# AI & MCP
npm run mcp:check                    # Verify registered MCP tools
npm run ai:reindex                   # Reindex all documents for RAG
```

## Architecture

### Feature-Sliced Design (FSD) with Domain-Driven Design (DDD)

```
src/
├── app/                     # Next.js App Router
│   ├── app/                 # Main dashboard routes (authenticated)
│   ├── api/                 # API Routes (/api/mcp, /api/plate/ai, etc.)
│   └── portal/              # Client portal (CPF-based auth)
├── features/                # 30+ feature modules (core business logic)
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── shared/              # Zattar design patterns (DataShell, PageShell, etc.)
│   └── layout/              # Sidebar, header, providers
├── lib/                     # Infrastructure (supabase, redis, ai, mcp, auth, security)
├── hooks/                   # Global hooks
└── types/                   # Shared types (database.types.ts is Supabase-generated)
```

### Feature Module Structure

Every feature follows **Domain -> Service -> Repository -> Actions**:

```
src/features/{modulo}/
├── domain.ts            # Zod schemas, types, constants, pure business rules
├── service.ts           # Use cases, business logic orchestration
├── repository.ts        # Supabase data access (CRUD, filters)
├── actions/             # Server Actions (use authenticatedAction wrapper)
├── components/          # React components grouped by entity
├── hooks/               # Feature-specific hooks
├── RULES.md             # Business rules for AI context
└── index.ts             # Barrel exports (MANDATORY)
```

### Data Flow

```
UI (React) -> Server Action (authenticatedAction + Zod validation)
  -> service.ts (business rules)
    -> repository.ts (Supabase query)
      -> after(() => indexarDocumento) (async AI indexing)
  -> revalidatePath -> return { success, data } | { success: false, error }
```

### Routing

- `/` — Public website
- `/app/*` — Dashboard (requires Supabase auth, middleware-enforced)
- `/portal/*` — Client portal (CPF session cookie)
- Auto-redirects configured: `/{module}` -> `/app/{module}`

## Key Rules

### Import Constraints (ESLint-enforced)

```typescript
// CORRECT — use barrel exports
import { ClientesTable, actionListarClientes } from "@/features/partes";

// WRONG — no deep imports into feature internals
import { ClientesTable } from "@/features/partes/components/clientes/clientes-table";
```

Relative imports within the same feature are allowed. Cross-feature imports must use barrel exports.

### Server Actions Pattern

- Always use `authenticatedAction` wrapper from `@/lib/safe-action`
- Naming: `actionCriar`, `actionAtualizar`, `actionListar`, `actionDeletar`
- Return type: `{ success: boolean; data?: T; error?: string }`
- Place in `src/features/{modulo}/actions/{entity}-actions.ts`
- Validate with Zod schemas defined in `domain.ts`

### UI Components — Mandatory Patterns

| Use Case | Component | Import From |
|----------|-----------|-------------|
| Page layout | `PageShell` | `@/components/shared/page-shell` |
| Data table page | `DataShell` + `DataTable` | `@/components/shared/data-shell` |
| Table toolbar | `DataTableToolbar` | `@/components/shared/data-shell` |
| Pagination | `DataPagination` | `@/components/shared/data-shell` |
| Column header | `DataTableColumnHeader` | `@/components/shared/data-shell` |
| Form dialog | `DialogFormShell` | `@/components/shared/dialog-form-shell` |
| Detail panel | `DetailSheet` | `@/components/shared/detail-sheet` |
| Empty states | `EmptyState` | `@/components/shared/empty-state` |

**Gold standard reference**: `src/features/partes/components/clientes/clientes-table-wrapper.tsx`

**Full component documentation**: `src/components/shared/AI_INSTRUCTIONS.md`

### DataShell Table Pattern

- Flat layout: toolbar floats above, table has `rounded-md border bg-card`, pagination floats below
- Server component fetches initial data -> Client wrapper manages state
- `useDebounce` for search (500ms), reset `pageIndex` on filter/search changes
- Server-side pagination: `pageIndex` is 0-based (UI), API uses 1-based
- Columns as factory function: `getColumns(onEdit, onDelete)` injects callbacks
- All toolbar elements: `h-9` (36px height)
- `actionButton` goes on `DataShell`, NOT on `DataTableToolbar`

### Badge Colors — NEVER Hardcode

```typescript
// CORRECT
import { getSemanticBadgeVariant } from '@/lib/design-system';
<Badge variant={getSemanticBadgeVariant('status', 'ATIVO')}>Ativo</Badge>

// WRONG — never use inline color classes on badges
<Badge className="bg-blue-100 text-blue-800">TRT1</Badge>
```

Categories: `tribunal`, `status`, `grau`, `parte`, `prioridade`, `tipo`

### Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `cliente-form.tsx` |
| Components | PascalCase | `ClienteForm` |
| Functions | camelCase | `criarCliente` |
| Types | PascalCase | `Cliente`, `CriarClienteParams` |
| Constants | UPPER_SNAKE_CASE | `STATUS_LABELS` |
| SQL | snake_case | `table_name`, `column_name` |

### Path Aliases

```
@/* -> ./src/*
@/components/* -> ./src/components/*
@/lib/* -> ./src/lib/*
@/hooks/* -> ./src/hooks/*
@/types/* -> ./src/types/*
```

## Database (Supabase)

- All tables require RLS (Row-Level Security) policies
- Migrations in `supabase/migrations/` named `YYYYMMDDHHmmss_description.sql`
- SQL style: lowercase keywords, snake_case identifiers, plural table names
- `database.types.ts` is auto-generated — do not edit manually
- Use `createClient()` from `@/lib/supabase/server` for server-side queries

## Testing

- **Framework**: Jest 30 + Testing Library + Playwright
- **Coverage thresholds**: 80% global, 90% for domain.ts/service.ts, 95% for lib/formatters/utils
- Unit tests: `src/**/__tests__/unit/`
- Integration tests: `src/**/__tests__/integration/`
- Test by module: `npm run test:actions:processos`, `npm run test:actions:partes`, etc.

## Key Subsystems

- **Processos**: Legal case management with PJE/TRT tribunal integration via Playwright
- **Partes**: Clients, opposing parties, representatives (CPF/CNPJ validation)
- **Documentos**: Collaborative editor (Plate + Yjs) with AI-powered editing
- **Captura**: Automated data capture from tribunals (PJE, TRT, Comunica CNJ drivers)
- **Financeiro**: Dashboard, accounts payable/receivable, OFX/CSV bank reconciliation
- **AI/RAG**: OpenAI embeddings -> pgvector storage -> semantic search
- **MCP**: Server Actions exposed as AI tools via SSE endpoint at `/api/mcp`

## Environment Variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SERVICE_API_KEY`, `CRON_SECRET`

AI/RAG: `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL` (default: text-embedding-3-small)

Optional: Redis (`ENABLE_REDIS_CACHE`, `REDIS_URL`), Dyte, 2FAuth, Storage (B2), Browser service, MCP

Full list in `.env.example`.

## Extended Documentation

- `docs/architecture/AGENTS.md` — Full agent-friendly reference with data flows, troubleshooting, and development hints
- `src/components/shared/AI_INSTRUCTIONS.md` — Complete UI component patterns with code examples
- `src/features/*/RULES.md` — Business rules per feature module (processos, partes, documentos, financeiro, contratos, busca, notificacoes, obrigacoes, audiencias)
