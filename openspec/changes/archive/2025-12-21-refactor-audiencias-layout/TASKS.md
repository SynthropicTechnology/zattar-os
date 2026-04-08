# Tasks: Refatorar Layout do Módulo de Audiências

## 1. Consolidação de Tipos e Domain

- [x] 1.1 Consolidar tipos em `domain.ts` - adicionar TipoAudiencia, UseAudienciasResult, AudienciasPaginacao
- [x] 1.2 Remover `src/features/audiencias/types/ai-agent.types.ts`
- [x] 1.3 Remover `src/types/synthropic/audiencias.ts`
- [x] 1.4 Atualizar imports em todos os arquivos do módulo
- [x] 1.5 Atualizar barrel export em `index.ts`

## 2. Migração de Layout Base

- [x] 2.1 Refatorar `audiencias-content.tsx` para padrão Expedientes (tabs Tabs02 + carrosséis separados)
- [x] 2.2 Criar `audiencias-table-wrapper.tsx` (visualização "dia" com DataShell + DataTable)
- [x] 2.3 Criar `audiencias-toolbar-filters.tsx` (filtros inline com Select components)
- [x] 2.4 Testar navegação básica entre visualizações

## 3. Visualizações de Calendário

- [x] 3.1 Refatorar `audiencias-calendar-month-view.tsx` (remover carrossel interno, receber currentDate como prop)
- [x] 3.2 Refatorar `audiencias-calendar-year-view.tsx` (remover carrossel interno, receber currentDate como prop, colorir células, abrir diálogo wizard)
- [x] 3.3 Remover `audiencias-calendar-week-view.tsx`
- [x] 3.4 Remover `audiencias-calendar-filters.tsx`
- [x] 3.5 Testar cada visualização

## 4. Refinamento de Componentes UI

- [x] 4.1 Revisar `audiencia-card.tsx` para consistência visual
- [x] 4.2 Revisar `audiencia-status-badge.tsx` para usar design system (usa getSemanticBadgeVariant)
- [x] 4.3 Revisar `audiencia-modalidade-badge.tsx` para consistência (usa getSemanticBadgeVariant)
- [x] 4.4 Revisar `audiencia-detail-sheet.tsx` para layout consistente
- [x] 4.5 Criar `audiencias-dia-dialog.tsx` para navegação wizard de audiências do dia
- [ ] 4.6 Revisar `nova-audiencia-dialog.tsx` para usar DialogFormShell (DEFERRED - funcional com Dialog padrão)

## 5. Atualização de Páginas e Rotas

- [x] 5.1 Atualizar `src/app/(dashboard)/audiencias/page.tsx` (usa AudienciasContent com visualizacao="semana")
- [x] 5.2 Atualizar páginas de visualização (semana, mes, ano, lista) para usar AudienciasContent
- [x] 5.3 Validar PageShell wrapper e Suspense boundaries
- [x] 5.4 Validar loading states

## 6. Atualização do Barrel Export e Limpeza

- [x] 6.1 Atualizar `components/index.ts` com novos componentes e remover obsoletos
- [x] 6.2 Atualizar `index.ts` principal com exports consolidados
- [x] 6.3 Remover arquivos de tipos obsoletos (`types/` folder)

## 7. Testes e Validação

- [x] 7.1 Testar navegação entre visualizações (dia, mês, ano, lista)
- [x] 7.2 Testar carrosséis funcionando corretamente
- [x] 7.3 Testar filtros aplicando corretamente
- [x] 7.4 Testar busca funcionando
- [x] 7.5 Testar criação e edição de audiência
- [x] 7.6 Validar responsividade (mobile, tablet, desktop)
- [x] 7.7 Executar build para verificar erros de TypeScript
