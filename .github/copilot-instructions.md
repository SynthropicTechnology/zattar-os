## Project

Synthropic (Zattar OS) — legal management system (gestao juridica) for a Brazilian law firm.
Codebase is primarily in Portuguese (variable names, business terms, UI labels).

**Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 (strict), Supabase (PostgreSQL + RLS + pgvector), Tailwind CSS 4, shadcn/ui (new-york style)

## Commands

```bash
npm run dev                    # Turbopack dev server
npm run type-check             # TypeScript validation
npm run build                  # Standard build
npm test                       # All tests (Jest 30)
npm run lint                   # ESLint
npm run check:architecture     # FSD import validation
npx jest path/to/file.test.ts  # Single test file
```

## Architecture

Feature-Sliced Design (FSD) with DDD. 42 feature modules in `src/features/`.

Each feature: `domain.ts` (Zod schemas) -> `service.ts` (use cases) -> `repository.ts` (Supabase) -> `actions/` (Server Actions with `authenticatedAction`).

Data flow: UI -> Server Action (authenticatedAction + Zod) -> service -> repository -> revalidatePath. Returns `{ success, data?, error? }`.

## Key Rules

- **Imports**: cross-feature imports must use barrel exports (`@/features/{module}`). No deep imports.
- **Server Actions**: use `authenticatedAction` from `@/lib/safe-action`. Name: `actionCriar`, `actionAtualizar`, `actionListar`, `actionDeletar`.
- **UI**: use `PageShell`, `DataShell`+`DataTable`, `DialogFormShell`, `DetailSheet` from `@/components/shared/`.
- **Badges**: never hardcode colors. Use `getSemanticBadgeVariant()` from `@/lib/design-system`.
- **Naming**: files=kebab-case, components=PascalCase, functions=camelCase, types=PascalCase, constants=UPPER_SNAKE_CASE, SQL=snake_case.
- **Database**: all tables require RLS. `database.types.ts` is auto-generated, do not edit.
- **Testing**: 80% coverage global, 90% for domain/service, 95% for lib/utils.

## Structure

```
src/
  app/            # Next.js App Router (app/, api/, portal/)
  features/       # Feature modules (domain/service/repository/actions)
  components/     # ui/ (shadcn), shared/ (patterns), layout/
  lib/            # Infrastructure (supabase, redis, ai, mcp, auth)
```

Gold standard reference: `src/features/partes/components/clientes/clientes-table-wrapper.tsx`

Component patterns: `src/components/shared/AI_INSTRUCTIONS.md`

Business rules: `src/features/*/RULES.md`
