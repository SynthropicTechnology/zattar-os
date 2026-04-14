---
phase: quick
plan: 260414-cqb
subsystem: captura
tags: [refactor, glass-briefing, ux]
dependency_graph:
  requires: []
  provides: [dynamic-header-button, glass-advogados-filter]
  affects: [captura-client, credenciais-page, agendamentos-page, tribunais-page, advogados-filter, credenciais-advogado-dialog]
tech_stack:
  added: []
  patterns: [dynamic-header-button-per-tab, glass-filter-dropdown]
key_files:
  created: []
  modified:
    - src/app/(authenticated)/captura/captura-client.tsx
    - src/app/(authenticated)/captura/credenciais/page-client.tsx
    - src/app/(authenticated)/captura/agendamentos/page-client.tsx
    - src/app/(authenticated)/captura/tribunais/page-client.tsx
    - src/app/(authenticated)/captura/components/advogados/advogados-filter.tsx
    - src/app/(authenticated)/captura/components/advogados/credenciais-advogado-dialog.tsx
decisions:
  - Parent captura-client owns all creation dialogs; sub-tabs retain edit dialogs
  - AdvogadosFilter rewritten to Popover+button pattern matching CapturaFilterBar
  - Credencial row styling uses bg-white opacity for glass consistency
metrics:
  duration: 3min
  completed: "2026-04-14T12:17:04Z"
---

# Quick Task 260414-cqb: Refatorar Captura Module - Botao Dinamico Summary

Dynamic header button per active tab with glass-aligned filter dropdown and credential dialog styling fixes.

## Tasks Completed

### Task 1: Dynamic header button + remove sub-tab duplicate buttons
**Commit:** 54f9ee7be

- Added dynamic `headerButtonConfig` map in `captura-client.tsx` mapping each tab to label+onClick
- Header button now shows "Nova Captura" / "Novo Agendamento" / "Nova Credencial" / "Nova Configuracao" based on active tab
- All four creation dialogs (CapturaDialog, AgendamentoDialog, selecionarAdvogado+CredenciaisAdvogadoDialog, TribunaisDialog) rendered from parent captura-client
- Removed duplicate action buttons from credenciais toolbar, agendamentos toolbar, and tribunais toolbar
- Removed AgendamentoDialog import/state/render from agendamentos page-client (no longer needed)
- Cleaned up unused imports (Plus from credenciais, Plus+AgendamentoDialog from agendamentos)

### Task 2: Glass-align AdvogadosFilter + fix credential dialog styling
**Commit:** 42f840524

- Rewrote AdvogadosFilter from Command-based component to glass FilterDropdown pattern
- Removed Command/CommandInput/CommandList/CommandGroup/CommandItem/CommandSeparator/CommandEmpty, Badge, Separator dependencies
- New trigger: rounded-lg border with primary/20 active state, border-border/15 inactive state, ChevronDown/X icons
- PopoverContent: glass-dropdown class, rounded-2xl, button list with bg-primary/8 selected state
- Props interface unchanged (title, options, value, onValueChange) -- zero breaking changes
- Credential rows in CredenciaisAdvogadoDialog: bg-white/[0.03] active, bg-white/[0.015] inactive, rounded-xl

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

All 6 modified files verified on disk. Both task commits (54f9ee7be, 42f840524) confirmed in git log.
