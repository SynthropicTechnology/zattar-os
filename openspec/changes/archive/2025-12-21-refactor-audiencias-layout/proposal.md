# Change: Refatorar Layout do Módulo de Audiências para Padrão Expedientes

## Why

O módulo de audiências está funcional mas apresenta inconsistências arquiteturais significativas que impactam manutenibilidade e experiência do usuário:

1. **Tipos duplicados** em 3 locais diferentes (`domain.ts`, `types/ai-agent.types.ts`, `src/types/synthropic/audiencias.ts`) causando inconsistência e dificuldade de manutenção
2. **Layout divergente** do padrão estabelecido em Expedientes - usa `TemporalViewShell` ao invés de carrosséis integrados com tabs Chrome-style
3. **Componentes de calendário** não seguem o padrão visual de Expedientes (carrosséis internos ao invés de gerenciados pelo parent)
4. **Arquivos obsoletos** que não são mais necessários (`audiencias-calendar-filters.tsx`, `audiencias-calendar-week-view.tsx`)

## What Changes

### Consolidação de Tipos
- Consolidar todos os tipos em `domain.ts`
- Remover `types/ai-agent.types.ts` (mover tipos úteis para domain)
- Remover `src/types/synthropic/audiencias.ts` (tipos legados)
- Atualizar imports em todos os arquivos do módulo

### Migração de Layout (padrão Expedientes)
- Refatorar `audiencias-content.tsx` para usar tabs Chrome-style + carrosséis integrados
- Criar `audiencias-table-wrapper.tsx` (visualização "dia" com DataShell + DataTable)
- Criar `audiencias-toolbar-filters.tsx` (filtros inline com Select components)
- Refatorar `audiencias-calendar-month-view.tsx` (remover carrossel interno)
- Refatorar `audiencias-calendar-year-view.tsx` (remover carrossel interno)

### Remoção de Componentes Obsoletos
- Remover `audiencias-calendar-week-view.tsx` (substituído por table-wrapper)
- Remover `audiencias-calendar-filters.tsx` (substituído por toolbar-filters)
- Remover `audiencias-month-day-cell.tsx` (integrado em month-view)

### Refinamento de Componentes
- Revisar `audiencia-card.tsx` para consistência visual
- Revisar badges (status, modalidade) para usar design system
- Revisar `audiencia-detail-sheet.tsx` para layout consistente
- Revisar `nova-audiencia-dialog.tsx` para usar `DialogFormShell`

## Impact

- Affected specs: `frontend-audiencias`
- Affected code:
  - `src/features/audiencias/` (todo o módulo)
  - `src/types/synthropic/audiencias.ts` (remover)
  - `src/app/(dashboard)/audiencias/` (páginas)
- Nenhuma mudança de comportamento de backend (actions, service, repository mantidos)
- Nenhuma mudança de API
