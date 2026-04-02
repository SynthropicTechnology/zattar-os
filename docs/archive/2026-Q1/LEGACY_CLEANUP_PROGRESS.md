# Legacy Code Cleanup Progress

**Started:** 2025-12-10
**Status:** IN PROGRESS

## Overview

Systematic cleanup and consolidation of legacy code into pure FSD architecture.

- Eliminating `backend/`, `src/core/`, `src/app/_lib/`
- Consolidating all features into `src/features/`
- Moving infrastructure to `src/lib/`
- Converting REST APIs to Server Actions

## Progress Tracking

### ✅ Fase 1: Migrar Módulos Não-FSD para Features

#### 1.1 Criar `src/features/acervo/` ✅ COMPLETED

- [x] Created `types.ts` - Consolidated all acervo types with Zod schemas
- [x] Created `domain.ts` - Business logic and mappings
- [x] Created `repository.ts` - Data access layer with caching
- [x] Created `service.ts` - Business service layer with CPF search
- [x] Created `utils.ts` - Formatting and transformation utilities
- [x] Created `actions/acervo-actions.ts` - Server Actions (5 actions)
- [x] Created `hooks/use-acervo.ts` - React hooks (5 hooks)
- [x] Created `components/list/acervo-table.tsx` - Table component
- [x] Created `components/list/acervo-filters.tsx` - Filter component
- [x] Created `index.ts` - Barrel exports
- [x] Created `README.md` - Complete documentation

**Summary**: 11 files created, ~2,000 lines of code
**Features**: List, search, filter, assign, export, CPF search

#### 1.2 Criar `src/features/advogados/`

- [ ] Not started

#### 1.3 Criar `src/features/tipos-expedientes/`

- [ ] Not started

#### 1.4 Criar `src/features/cargos/`

- [ ] Not started

### ⏸️ Fase 2: Consolidar Infraestrutura em `src/lib/`

- [ ] Not started

### ⏸️ Fase 3: Eliminar Duplicações

- [ ] Not started

### ⏸️ Fase 4: Migrar `src/app/_lib/`

- [ ] Not started

### ⏸️ Fase 5: Converter REST APIs

- [ ] Not started

### ⏸️ Fase 6: Consolidar `backend/types/`

- [ ] Not started

### ⏸️ Fase 7: Consolidar Módulos Relacionados

- [ ] Not started

### ⏸️ Fase 8: Atualizar Imports e Validar

- [ ] Not started

### ⏸️ Fase 9: Deletar Diretórios Legados

- [ ] Not started

## Current Focus

✅ **Completed**: Fase 1.1 - Acervo feature (100% complete)
🔄 **Next**: Fase 1.2 - Advogados feature

## Notes

- This is a large-scale refactoring affecting ~1,200 files
- Expected reduction: ~58% of files, ~75% of duplication
- No backward compatibility - clean break from legacy
