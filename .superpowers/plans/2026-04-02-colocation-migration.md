# Colocation Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate `src/features/` by moving all feature modules into their corresponding route directories in `src/app/app/` (modules with routes) or `src/lib/` (infrastructure/domain modules without routes).

**Architecture:** Mechanical migration using `mv` + `sed` for import updates. No code rewriting. Each module migrated atomically with type-check and tests between each. Barrel exports (index.ts) preserved as public API for each module.

**Tech Stack:** Bash (mv, sed, grep), TypeScript (type-check), Jest (tests)

**Spec:** `docs/superpowers/specs/2026-04-02-colocation-migration-design.md`

---

## Task 0: Create Migration Helper Script

**Files:**
- Create: `scripts/migrate-feature.sh`

This script automates the mechanical work for each module. It handles both simple moves and directory merges.

- [ ] **Step 1: Create the migration script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/migrate-feature.sh <feature-name> <destination-path>
# Example: ./scripts/migrate-feature.sh audiencias src/app/app/audiencias
# Example: ./scripts/migrate-feature.sh ai src/lib/ai

FEATURE=$1
DEST=$2
SRC="src/features/$FEATURE"

if [ ! -d "$SRC" ]; then
  echo "ERROR: $SRC does not exist"
  exit 1
fi

echo "=== Migrating $FEATURE ==="
echo "  From: $SRC"
echo "  To:   $DEST"

# Step 1: Create destination if it doesn't exist
mkdir -p "$DEST"

# Step 2: Move each item from source to destination
for item in "$SRC"/*; do
  basename=$(basename "$item")

  # Skip __tests__ for now (handled separately)
  if [ "$basename" = "__tests__" ]; then
    continue
  fi

  if [ -d "$item" ] && [ -d "$DEST/$basename" ]; then
    # MERGE: both source and dest have this directory
    echo "  MERGE: $basename/ (both exist)"
    for subitem in "$item"/*; do
      subbase=$(basename "$subitem")
      if [ -e "$DEST/$basename/$subbase" ]; then
        echo "    COLLISION: $basename/$subbase — skipping (review manually)"
      else
        mv "$subitem" "$DEST/$basename/"
        echo "    Moved: $basename/$subbase"
      fi
    done
    # Remove source dir if empty
    rmdir "$item" 2>/dev/null || echo "    NOTE: $basename/ not empty after merge, review manually"
  else
    # SIMPLE: just move
    mv "$item" "$DEST/"
    echo "  Moved: $basename"
  fi
done

# Step 3: Move __tests__ if present
if [ -d "$SRC/__tests__" ]; then
  if [ -d "$DEST/__tests__" ]; then
    echo "  MERGE: __tests__/ (both exist)"
    for subitem in "$SRC/__tests__"/*; do
      subbase=$(basename "$subitem")
      if [ -e "$DEST/__tests__/$subbase" ]; then
        echo "    COLLISION: __tests__/$subbase — skipping"
      else
        mv "$subitem" "$DEST/__tests__/"
        echo "    Moved: __tests__/$subbase"
      fi
    done
    rmdir "$SRC/__tests__" 2>/dev/null || true
  else
    mv "$SRC/__tests__" "$DEST/"
    echo "  Moved: __tests__/"
  fi
fi

# Step 4: Remove source directory if empty
if [ -d "$SRC" ]; then
  find "$SRC" -type d -empty -delete 2>/dev/null || true
  if [ -d "$SRC" ]; then
    echo "  WARNING: $SRC not fully empty — review remaining files:"
    ls -la "$SRC"
  else
    echo "  Removed empty source: $SRC"
  fi
fi

echo "=== Move complete for $FEATURE ==="
```

- [ ] **Step 2: Create import update script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/update-imports.sh <feature-name> <new-import-path>
# Example: ./scripts/update-imports.sh audiencias @/app/app/audiencias
# Example: ./scripts/update-imports.sh ai @/lib/ai

FEATURE=$1
NEW_PATH=$2
OLD_PATH="@/features/$FEATURE"

echo "=== Updating imports for $FEATURE ==="
echo "  Old: $OLD_PATH"
echo "  New: $NEW_PATH"

# Find all files that reference the old path
FILES=$(grep -rl "$OLD_PATH" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "  No imports found to update"
  exit 0
fi

COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo "  Found $COUNT files to update"

# Replace all occurrences
echo "$FILES" | while read -r file; do
  # Replace both barrel imports and deep imports
  sed -i '' "s|$OLD_PATH|$NEW_PATH|g" "$file"
  echo "  Updated: $file"
done

# Verify no references remain
REMAINING=$(grep -rl "$OLD_PATH" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -n "$REMAINING" ]; then
  echo "  WARNING: Some references still remain:"
  echo "$REMAINING"
else
  echo "  All references updated successfully"
fi

echo "=== Import update complete for $FEATURE ==="
```

- [ ] **Step 3: Make scripts executable**

Run: `chmod +x scripts/migrate-feature.sh scripts/update-imports.sh`

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-feature.sh scripts/update-imports.sh
git commit -m "chore: add migration helper scripts for colocation migration"
```

---

## Task 1: Migrate Onda 1 — Infrastructure to lib/ (7 modules)

**Modules:** ai, busca, system-prompts, twofauth, dify, chatwoot, integracoes
**Destination:** `src/lib/{module}/`
**Risk:** LOW — These are infrastructure modules with few or no cross-feature dependencies. Some (busca, tasks) have 0 imports.

**Files:**
- Move: `src/features/ai/` → `src/lib/ai/`
- Move: `src/features/busca/` → `src/lib/busca/`
- Move: `src/features/system-prompts/` → `src/lib/system-prompts/`
- Move: `src/features/twofauth/` → `src/lib/twofauth/`
- Move: `src/features/dify/` → `src/lib/dify/`
- Move: `src/features/chatwoot/` → `src/lib/chatwoot/`
- Move: `src/features/integracoes/` → `src/lib/integracoes/`

**Pre-check:** Verify `src/lib/` does NOT already have folders with these names.

- [ ] **Step 1: Verify no collisions in lib/**

Run:
```bash
for mod in ai busca system-prompts twofauth dify chatwoot integracoes; do
  if [ -d "src/lib/$mod" ]; then echo "COLLISION: src/lib/$mod already exists"; fi
done
```

Expected: No output (no collisions). If there ARE collisions (e.g., `src/lib/ai/` already exists), merge manually before proceeding.

- [ ] **Step 2: Move all 7 modules**

```bash
for mod in ai busca system-prompts twofauth dify chatwoot integracoes; do
  ./scripts/migrate-feature.sh "$mod" "src/lib/$mod"
done
```

- [ ] **Step 3: Update all imports**

```bash
for mod in ai busca system-prompts twofauth dify chatwoot integracoes; do
  ./scripts/update-imports.sh "$mod" "@/lib/$mod"
done
```

- [ ] **Step 4: Verify no remaining references**

Run:
```bash
for mod in ai busca system-prompts twofauth dify chatwoot integracoes; do
  REMAINING=$(grep -rl "@/features/$mod" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$REMAINING" -gt 0 ]; then echo "REMAINING: @/features/$mod has $REMAINING references"; fi
done
```

Expected: No output (all references updated).

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: PASS with no errors

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: PASS (same number of passing tests as before migration)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: migrate infrastructure features to lib/ (ai, busca, system-prompts, twofauth, dify, chatwoot, integracoes)"
```

---

## Task 2: Migrate Onda 2 — Cross-cutting Domain to lib/domain/ (5 modules)

**Modules:** tags, audit, profiles, config-atribuicao, tasks
**Destination:** `src/lib/domain/{module}/`
**Risk:** LOW — Small modules with few imports (0-6 each).

**Files:**
- Move: `src/features/tags/` → `src/lib/domain/tags/`
- Move: `src/features/audit/` → `src/lib/domain/audit/`
- Move: `src/features/profiles/` → `src/lib/domain/profiles/`
- Move: `src/features/config-atribuicao/` → `src/lib/domain/config-atribuicao/`
- Move: `src/features/tasks/` → `src/lib/domain/tasks/`

- [ ] **Step 1: Create destination directory**

Run: `mkdir -p src/lib/domain`

- [ ] **Step 2: Move all 5 modules**

```bash
for mod in tags audit profiles config-atribuicao tasks; do
  ./scripts/migrate-feature.sh "$mod" "src/lib/domain/$mod"
done
```

- [ ] **Step 3: Update all imports**

```bash
for mod in tags audit profiles config-atribuicao tasks; do
  ./scripts/update-imports.sh "$mod" "@/lib/domain/$mod"
done
```

- [ ] **Step 4: Verify no remaining references**

Run:
```bash
for mod in tags audit profiles config-atribuicao tasks; do
  REMAINING=$(grep -rl "@/features/$mod" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$REMAINING" -gt 0 ]; then echo "REMAINING: @/features/$mod has $REMAINING references"; fi
done
```

Expected: No output.

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: migrate cross-cutting domain features to lib/domain/ (tags, audit, profiles, config-atribuicao, tasks)"
```

---

## Task 3: Migrate Onda 3a — Zero-Dependency Modules (10 modules)

**Modules:** advogados, agenda-eventos, assistentes-tipos, calculadoras, cargos, enderecos, entrevistas-trabalhistas, tipos-expedientes, portal, website
**Destination:** `src/app/app/{module}/` (merge with existing route if present)
**Risk:** LOW — No cross-feature dependencies, safe to migrate in any order.

These modules either have no route yet (simple mv) or have a route with minimal content (page.tsx only).

- [ ] **Step 1: Identify which modules need route creation vs merge**

Run:
```bash
for mod in advogados agenda-eventos assistentes-tipos calculadoras cargos enderecos entrevistas-trabalhistas tipos-expedientes portal website; do
  if [ -d "src/app/app/$mod" ]; then
    echo "MERGE: $mod (route exists)"
  elif [ -d "src/app/$mod" ]; then
    echo "MERGE (root): $mod (route exists at app/ root)"
  else
    echo "CREATE: $mod (no route, simple mv)"
  fi
done
```

- [ ] **Step 2: Handle special name mappings**

Some features map to differently-named routes:
- `agenda-eventos` → merge with `src/app/app/agenda/` (if exists)
- `assistentes-tipos` → merge with `src/app/app/assistentes/` (if exists)
- `portal` → merge with `src/app/portal/`
- `website` → content goes to public pages at `src/app/` root

For standard-named modules, use the script directly:
```bash
for mod in advogados calculadoras cargos enderecos entrevistas-trabalhistas tipos-expedientes; do
  ./scripts/migrate-feature.sh "$mod" "src/app/app/$mod"
done
```

For special mappings:
```bash
./scripts/migrate-feature.sh agenda-eventos src/app/app/agenda
./scripts/migrate-feature.sh assistentes-tipos src/app/app/assistentes
./scripts/migrate-feature.sh portal src/app/portal
./scripts/migrate-feature.sh website src/app
```

- [ ] **Step 3: Update all imports**

```bash
for mod in advogados calculadoras cargos enderecos entrevistas-trabalhistas tipos-expedientes; do
  ./scripts/update-imports.sh "$mod" "@/app/app/$mod"
done

./scripts/update-imports.sh agenda-eventos "@/app/app/agenda"
./scripts/update-imports.sh assistentes-tipos "@/app/app/assistentes"
./scripts/update-imports.sh portal "@/app/portal"
./scripts/update-imports.sh website "@/app"
```

- [ ] **Step 4: Verify no remaining references**

Run:
```bash
for mod in advogados agenda-eventos assistentes-tipos calculadoras cargos enderecos entrevistas-trabalhistas tipos-expedientes portal website; do
  REMAINING=$(grep -rl "@/features/$mod" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$REMAINING" -gt 0 ]; then echo "REMAINING: @/features/$mod has $REMAINING references"; fi
done
```

Expected: No output.

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: migrate zero-dependency features to app/ (advogados, agenda-eventos, assistentes-tipos, calculadoras, cargos, enderecos, entrevistas-trabalhistas, tipos-expedientes, portal, website)"
```

---

## Task 4: Migrate Onda 3b — Core Entity: partes (106 imports)

**Module:** partes
**Destination:** `src/app/app/partes/` (MERGE — both have components/)
**Risk:** HIGH — Most imported module in the codebase (106 files depend on it).
**Collisions:** actions, components, hooks (all exist in both source and destination)

This is the highest-risk migration. The feature has: RULES.md, __tests__, actions/, actions.ts, adapters/, components/, domain.ts, errors.ts, hooks/, index.ts, repositories/, repository-compat.ts, repository.ts, server-actions.ts, server.ts, service.ts, types/, utils/

The route already has: clientes/, layout.tsx, mock/, page.tsx, partes-client.tsx, partes-contrarias/, representantes/, terceiros/

No file name collisions expected since the app/ side has page-level files while features/ has domain-level files.

- [ ] **Step 1: Inspect for actual file collisions**

Run:
```bash
echo "=== Features ===" && ls src/features/partes/
echo "=== App ===" && ls src/app/app/partes/
echo "=== Components Features ===" && ls src/features/partes/components/ 2>/dev/null
echo "=== Components App ===" && ls src/app/app/partes/components/ 2>/dev/null
```

Review output for same-name files/folders.

- [ ] **Step 2: Move feature into app route**

```bash
./scripts/migrate-feature.sh partes src/app/app/partes
```

Review output carefully for any COLLISION warnings.

- [ ] **Step 3: Update all imports (106 files)**

```bash
./scripts/update-imports.sh partes "@/app/app/partes"
```

- [ ] **Step 4: Verify no remaining references**

Run:
```bash
grep -rl "@/features/partes" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

Expected: No output.

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: PASS. If errors occur, they will likely be import path issues — fix each one manually.

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: migrate partes feature to app/app/partes/ (106 imports updated)"
```

---

## Task 5: Migrate Onda 3c — High-Impact Modules (captura, usuarios, financeiro, contratos)

**Modules:** captura (84 imports), usuarios (55), financeiro (46), contratos (46)
**Destination:** `src/app/app/{module}/` (MERGE for all)
**Risk:** HIGH — These are heavily imported. captura has the most complex internal structure.
**Collisions:** All have components/ and hooks/ in both source and destination.

Migrate one at a time with verification between each.

- [ ] **Step 1: Migrate captura**

```bash
./scripts/migrate-feature.sh captura src/app/app/captura
./scripts/update-imports.sh captura "@/app/app/captura"
grep -rl "@/features/captura" src/ --include="*.ts" --include="*.tsx" 2>/dev/null && echo "REMAINING REFS" || echo "OK"
npm run type-check
```

If type-check passes, continue. If not, fix errors before proceeding.

- [ ] **Step 2: Migrate usuarios**

```bash
./scripts/migrate-feature.sh usuarios src/app/app/usuarios
./scripts/update-imports.sh usuarios "@/app/app/usuarios"
grep -rl "@/features/usuarios" src/ --include="*.ts" --include="*.tsx" 2>/dev/null && echo "REMAINING REFS" || echo "OK"
npm run type-check
```

- [ ] **Step 3: Migrate financeiro**

```bash
./scripts/migrate-feature.sh financeiro src/app/app/financeiro
./scripts/update-imports.sh financeiro "@/app/app/financeiro"
grep -rl "@/features/financeiro" src/ --include="*.ts" --include="*.tsx" 2>/dev/null && echo "REMAINING REFS" || echo "OK"
npm run type-check
```

- [ ] **Step 4: Migrate contratos**

```bash
./scripts/migrate-feature.sh contratos src/app/app/contratos
./scripts/update-imports.sh contratos "@/app/app/contratos"
grep -rl "@/features/contratos" src/ --include="*.ts" --include="*.tsx" 2>/dev/null && echo "REMAINING REFS" || echo "OK"
npm run type-check
```

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: migrate high-impact features to app/ (captura, usuarios, financeiro, contratos)"
```

---

## Task 6: Migrate Onda 3d — Medium-Impact Modules (11 modules)

**Modules:** expedientes (32 imports), obrigacoes (27), documentos (26), processos (21), audiencias (21), chat (18), acervo (13), calendar (11), pericias (11), rh (9), pecas-juridicas (8)
**Destination:** `src/app/app/{module}/` (MERGE for all)
**Risk:** MEDIUM — All have components/hooks/actions collisions but fewer dependents.

- [ ] **Step 1: Migrate all 11 modules sequentially**

```bash
for mod in expedientes obrigacoes documentos processos audiencias chat acervo calendar pericias rh pecas-juridicas; do
  echo "=== Migrating $mod ==="
  ./scripts/migrate-feature.sh "$mod" "src/app/app/$mod"
  ./scripts/update-imports.sh "$mod" "@/app/app/$mod"
  REMAINING=$(grep -rl "@/features/$mod" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$REMAINING" -gt 0 ]; then
    echo "WARNING: $mod still has $REMAINING references"
  fi
done
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: PASS. Fix any errors before proceeding.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: migrate medium-impact features to app/ (expedientes, obrigacoes, documentos, processos, audiencias, chat, acervo, calendar, pericias, rh, pecas-juridicas)"
```

---

## Task 7: Migrate Onda 3e — Low-Impact Modules (7 modules)

**Modules:** admin (6 imports), perfil (2), repasses (2), notificacoes (2), obrigacoes (already done if in task 6 — skip)
**Remaining:** admin, perfil, repasses, notificacoes
**Destination:** `src/app/app/{module}/`
**Risk:** LOW — Few imports, simple structure.

- [ ] **Step 1: Migrate remaining modules**

```bash
for mod in admin perfil repasses notificacoes; do
  echo "=== Migrating $mod ==="
  ./scripts/migrate-feature.sh "$mod" "src/app/app/$mod"
  ./scripts/update-imports.sh "$mod" "@/app/app/$mod"
done
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: migrate low-impact features to app/ (admin, perfil, repasses, notificacoes)"
```

---

## Task 8: Verify and Remove src/features/

- [ ] **Step 1: Check for any remaining features**

Run:
```bash
ls src/features/ 2>/dev/null
```

Expected: Empty directory or "No such file or directory". If files remain, migrate them manually.

- [ ] **Step 2: Verify no remaining import references**

Run:
```bash
grep -r "@/features/" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

Expected: No output. If references remain, update them manually.

- [ ] **Step 3: Remove the features directory**

Run:
```bash
rm -rf src/features/
```

- [ ] **Step 4: Type-check and test**

Run:
```bash
npm run type-check && npm test
```

Expected: Both PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove empty src/features/ directory"
```

---

## Task 9: Update Project Configuration

**Files:**
- Modify: `tsconfig.json` — remove `@/features/*` path alias if present
- Modify: `CLAUDE.md` — update architecture documentation
- Modify: `.eslintrc.*` or `eslint.config.*` — update import restriction rules
- Modify: `package.json` — update `check:architecture` script

- [ ] **Step 1: Check if tsconfig has features path alias**

Run:
```bash
grep -n "features" tsconfig.json
```

If found, remove the path alias entry.

- [ ] **Step 2: Update tsconfig.json**

Remove any `@/features/*` path alias. The paths section should only have:
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/app/*": ["./src/app/*"],
    "@/components/*": ["./src/components/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/hooks/*": ["./src/hooks/*"],
    "@/types/*": ["./src/types/*"],
    "@/types/domain/*": ["./src/types/domain/*"],
    "@/types/contracts/*": ["./src/types/contracts/*"]
  }
}
```

- [ ] **Step 3: Update ESLint import rules**

Search for feature-related ESLint rules:
```bash
grep -rn "features" .eslintrc* eslint.config* 2>/dev/null
```

Update any `no-restricted-imports` or architecture validation rules to reference the new paths.

- [ ] **Step 4: Update check:architecture script**

```bash
grep -n "features" package.json
```

Update the `check:architecture` and `validate:exports` scripts to reference new paths.

- [ ] **Step 5: Update CLAUDE.md**

Replace the Architecture section to reflect the new colocation structure:
- Remove references to `src/features/`
- Update Feature Module Structure to show modules live in `app/{module}/`
- Update Import Constraints to use `@/app/app/{module}` barrel imports
- Update path aliases section

- [ ] **Step 6: Full build verification**

Run:
```bash
npm run build
```

Expected: PASS. This is the definitive verification that everything works.

- [ ] **Step 7: Run full test suite**

Run:
```bash
npm test
```

Expected: PASS with same coverage as before migration.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: update project config for colocation architecture (tsconfig, eslint, CLAUDE.md)"
```

---

## Task 10: Cleanup Migration Scripts

- [ ] **Step 1: Remove migration scripts**

```bash
rm scripts/migrate-feature.sh scripts/update-imports.sh
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove migration scripts (migration complete)"
```

---

## Verification Checklist (Run After All Tasks)

- [ ] `grep -r "@/features/" src/` returns zero results
- [ ] `ls src/features/` returns "No such file or directory"
- [ ] `npm run type-check` passes
- [ ] `npm test` passes with same coverage
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] All barrel imports (`@/app/app/{module}`) resolve correctly
- [ ] Dev server starts without errors: `npm run dev`

## Rollback Strategy

If any task fails catastrophically:
```bash
git stash  # or git reset --hard HEAD
```

Each task produces an atomic commit, so you can roll back to any point:
```bash
git log --oneline  # find the last good commit
git reset --hard <commit-hash>
```
