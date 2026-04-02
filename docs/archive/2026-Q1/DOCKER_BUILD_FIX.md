# Docker Build Fix - Client/Server Boundary Violation

## Problem

The Docker build was failing with the following error:

```
Error: Turbopack build failed with 1 errors:
./src/lib/supabase/server.ts:2:1
You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory.
```

## Root Cause

The error occurred because server-only code (`src/lib/supabase/server.ts` which uses `next/headers`) was being imported into client components through a chain of barrel exports:

1. Client component (`configuracoes-tabs-content.tsx`) with `'use client'` directive
2. Imported from `@/features/integracoes` barrel export
3. Which exported service functions from `./service`
4. Which imported from `./repository`
5. Which imported `createClient` from `@/lib/supabase/server`
6. Which uses `next/headers` (server-only API)

This violated Next.js App Router's client/server boundary rules.

## Solution

### 1. Fixed `src/features/integracoes/index.ts`

Removed service function exports from the barrel export. Only export:
- Types and schemas (safe for client)
- Server Actions (safe for client - they're RPC calls)
- Components (safe for client)

**Before:**
```typescript
// Service
export {
  listar,
  listarPorTipo,
  buscarPorId,
  // ... other service functions
} from "./service";
```

**After:**
```typescript
// Service - Server-only exports (use in Server Components and Actions only)
// Import directly from "./service" when needed in server context
```

### 2. Fixed `src/app/portal/feature/index.ts`

Same issue - removed service exports from barrel.

**Before:**
```typescript
export * from "./service";
```

**After:**
```typescript
// Service - Server-only exports (use in Server Components and Actions only)
// Import directly from "./service" when needed in server context
```

### 3. Fixed `src/app/app/configuracoes/page.tsx`

Added proper type narrowing for the integracoes result to fix TypeScript errors.

**Before:**
```typescript
const integracao2FAuth = integracoesResult.success
  ? integracoesResult.data.find(i => i.ativo) || integracoesResult.data[0] || null
  : null;
```

**After:**
```typescript
let integracao2FAuth = null;
if (integracoesResult.success && Array.isArray(integracoesResult.data)) {
  integracao2FAuth = integracoesResult.data.find((i) => i.ativo) || integracoesResult.data[0] || null;
}
```

## Architecture Rules

To prevent this issue in the future, follow these rules:

### ✅ DO: Safe Exports in Feature Barrel Files

```typescript
// src/features/{module}/index.ts

// Types and schemas (safe for client)
export type { Entity } from "./domain";
export { entitySchema } from "./domain";

// Server Actions (safe for client - RPC calls)
export { actionCreate, actionList } from "./actions/entity-actions";

// Components (safe for client)
export { EntityTable } from "./components/entity-table";
```

### ❌ DON'T: Export Service or Repository Functions

```typescript
// ❌ WRONG - Don't export service functions in barrel
export { listar, criar, atualizar } from "./service";

// ❌ WRONG - Don't export repository functions in barrel
export { findAll, create } from "./repository";
```

### ✅ DO: Import Service Functions Directly in Server Context

```typescript
// In Server Components or Server Actions
import * as service from "@/features/{module}/service";
// or
import { listar } from "@/features/{module}/service";
```

## Verification

Run these commands to verify the fix:

```bash
# Check architecture rules
npm run check:architecture

# Type check (should not show client/server boundary errors)
npm run type-check

# Build (should succeed)
npm run build:ci
```

## Related Files

- `src/features/integracoes/index.ts` - Fixed barrel exports
- `src/app/portal/feature/index.ts` - Fixed barrel exports
- `src/app/app/configuracoes/page.tsx` - Fixed type narrowing
- `src/app/app/configuracoes/components/configuracoes-tabs-content.tsx` - Client component (no changes needed)

## Prevention

1. Always use `'use client'` directive explicitly in client components
2. Never export service or repository functions from feature barrel exports
3. Use Server Actions for client-to-server communication
4. Import service functions directly (not through barrel) in server context
5. Run `npm run check:architecture` before committing

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Feature-Sliced Design](https://feature-sliced.design/)
- Project: `AGENTS.md` - Architecture section
