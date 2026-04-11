---
phase: 05-indicadores-detail-dialog
plan: 01
subsystem: ui
tags: [semantic-badge, design-system, audiencia, pje, domain]

requires:
  - phase: none
    provides: existing variants.ts and domain.ts structure
provides:
  - BadgeCategory audiencia_indicador with 6 indicator variants (soft tone)
  - AUDIENCIA_FIELD_LABELS mapping 22 snake_case fields to PT-BR labels
  - buildPjeUrl(trt, numeroProcesso) helper for PJe URL construction
affects: [05-02, 05-03, 05-04, 05-05, detail-dialog, lista-view, mes-view, ano-view]

tech-stack:
  added: []
  patterns: [indicator badge category with soft tone, field label record for timeline rendering]

key-files:
  created: []
  modified:
    - src/lib/design-system/variants.ts
    - src/app/(authenticated)/audiencias/domain.ts

key-decisions:
  - "AUDIENCIA_INDICADOR_VARIANTS placed as Record before getSemanticBadgeVariant for consistency with existing pattern"
  - "AUDIENCIA_FIELD_LABELS uses snake_case keys matching dados_anteriores JSON format"

patterns-established:
  - "Indicator badges use soft tone (not solid) for visual hierarchy distinction"

requirements-completed: [INDIC-01, INDIC-02, INDIC-03, INDIC-04, INDIC-05, INDIC-06, DIALOG-02, DIALOG-03, DIALOG-09]

duration: 2min
completed: 2026-04-11
---

# Phase 05 Plan 01: Design System and Domain Foundations Summary

**SemanticBadge audiencia_indicador category with 6 soft-tone variants plus AUDIENCIA_FIELD_LABELS (22 fields) and buildPjeUrl helper in domain.ts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-11T21:08:46Z
- **Completed:** 2026-04-11T21:10:55Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Extended BadgeCategory union type with audiencia_indicador and added to softCategories for soft tone rendering
- Created AUDIENCIA_INDICADOR_VARIANTS mapping 6 indicators: segredo_justica=warning, juizo_digital=info, designada=success, documento_ativo=info, litisconsorcio=neutral, presenca_hibrida=accent
- Added AUDIENCIA_FIELD_LABELS with 22 snake_case-to-PT-BR label mappings for timeline rendering
- Added buildPjeUrl(trt, numeroProcesso) returning valid PJe consultation URLs

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend SemanticBadge design system with audiencia_indicador category** - `c94df427` (feat)
2. **Task 2: Add AUDIENCIA_FIELD_LABELS and buildPjeUrl to domain.ts** - `0e9f1274` (feat)
3. **Task 3: Type check validation** - no commit (validation only, zero errors in modified files)

## Files Created/Modified
- `src/lib/design-system/variants.ts` - Added audiencia_indicador to BadgeCategory, AUDIENCIA_INDICADOR_VARIANTS constant, switch case, and softCategories
- `src/app/(authenticated)/audiencias/domain.ts` - Added AUDIENCIA_FIELD_LABELS record and buildPjeUrl function

## Decisions Made
- AUDIENCIA_INDICADOR_VARIANTS placed as a named Record constant before getSemanticBadgeVariant, consistent with all other category variant maps in the file
- AUDIENCIA_FIELD_LABELS keys use snake_case to match dados_anteriores JSON format from the database

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- audiencia_indicador category ready for consumption by indicator badge components in plans 02-05
- AUDIENCIA_FIELD_LABELS ready for timeline rendering in detail dialog
- buildPjeUrl ready for PJe link generation in detail dialog header

---
*Phase: 05-indicadores-detail-dialog*
*Completed: 2026-04-11*
