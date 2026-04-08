# Plano de Implementação: Fase 2 — Refatoração do Design System (Módulos Restantes)

## Visão Geral

Migração incremental dos 32 módulos restantes para o Design System Synthropic, organizados em 3 grupos por complexidade. A ordem de execução é: pré-requisitos (novas categorias de badge, variáveis CSS de gráficos e videochamada) → Grupo A (complexos) → Grupo B (médios) → Grupo C (leves em batches) → validação cross-módulo e testes.

## Tarefas

- [x] 1. Pré-requisitos — Dependências compartilhadas
  - [x] 1.1 Registrar novas categorias de badge em `@/lib/design-system/variants.ts`
    - Criar `PERICIA_SITUACAO_VARIANTS` com mapeamentos: `F → success`, `A → info`, `C → destructive`, `R → warning`, `P → secondary` (incluir variantes uppercase por extenso: FINALIZADA, AGENDADA, etc.)
    - Criar `PARCELA_STATUS_VARIANTS` com mapeamentos: `pendente → warning`, `paga → success`, `vencida → destructive`, `cancelada → neutral` (incluir variantes UPPERCASE)
    - Criar `REPASSE_STATUS_VARIANTS` com mapeamentos: `nao_aplicavel → neutral`, `pendente_declaracao → warning`, `pendente_transferencia → info`, `realizado → success` (incluir variantes UPPERCASE e sem underscore)
    - Expandir o tipo `BadgeCategory` com `pericia_situacao`, `parcela_status`, `repasse_status`
    - Adicionar os 3 cases correspondentes no switch de `getSemanticBadgeVariant`
    - _Requisitos: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x] 1.2 Criar variáveis CSS de paleta de gráficos em `globals.css`
    - Adicionar `--chart-6`, `--chart-7`, `--chart-8` em `:root`
    - Adicionar `--chart-primary-soft`, `--chart-destructive-soft`, `--chart-warning-soft`, `--chart-success-soft`, `--chart-muted-soft` em `:root` e `.dark`
    - Adicionar `--glow-primary`, `--glow-destructive`, `--glow-warning` em `:root` e `.dark`
    - _Requisitos: 1.3, 2.2, 2.3, 13.2, 21.3_

  - [x] 1.3 Criar variáveis CSS semânticas de videochamada em `globals.css`
    - Adicionar `--video-bg`, `--video-surface`, `--video-surface-hover`, `--video-border`, `--video-muted`, `--video-text`, `--video-skeleton` em `:root`
    - Alternativa: usar `data-theme="dark"` no wrapper de videochamada com classes semânticas (`bg-background`, `bg-card`, `border-border`, `text-muted-foreground`)
    - _Requisitos: 7.2, 21.1_

- [x] 2. Checkpoint — Pré-requisitos validados
  - Garantir que as novas categorias de badge retornam variantes corretas. Garantir que as variáveis CSS estão definidas em `globals.css`. Perguntar ao usuário se há dúvidas antes de prosseguir.


- [x] 3. Migração do módulo financeiro (Grupo A)
  - [x] 3.1 Criar `layout.tsx` com PageShell no módulo financeiro
    - Substituir o `<div className="space-y-4">` atual em `layout.tsx` por PageShell envolvendo children
    - Garantir que todas as sub-rotas (contas-pagar, contas-receber, conciliacao-bancaria, dre, orcamentos, plano-contas, relatorios) herdem o PageShell
    - _Requisitos: 1.1, 1.2_

  - [x] 3.2 Migrar oklch() e cores inline do módulo financeiro
    - Substituir `oklch()` direto em `dre/page-client.tsx` por variáveis CSS `--chart-*-soft` e `--glow-*`
    - Remover classes `bg-{cor}-{shade}`, `text-{cor}-{shade}`, `border-{cor}-{shade}` de componentes de feature
    - _Requisitos: 1.3, 1.7, 21.1, 21.3_

  - [x] 3.3 Migrar tipografia e badges do módulo financeiro
    - Substituir headings manuais por componentes Typography (Heading)
    - Garantir que todos os badges usam `getSemanticBadgeVariant`
    - _Requisitos: 1.4, 1.5_

  - [x] 3.4 Padronizar estrutura FSD do módulo financeiro
    - Consolidar `domain/` (pasta) → `domain.ts` (arquivo com re-exports)
    - Consolidar `services/` → `service.ts`
    - Consolidar `repository/` → `repository.ts`
    - Migrar `server-actions.ts` e `server.ts` → pasta `actions/` com `index.ts`
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 1.8, 1.9, 20.1, 20.3, 20.4_

- [x] 4. Migração do módulo dashboard (Grupo A)
  - [x] 4.1 Migrar oklch() dos widgets do dashboard
    - Substituir `oklch()` direto em `obrigacoes-treemap.tsx`, `despesas-treemap.tsx`, `meu-dia.tsx`, `aging-funnel.tsx` por variáveis CSS `--chart-*-soft`
    - _Requisitos: 2.2, 21.3_

  - [x] 4.2 Migrar oklch() dos mocks do dashboard
    - Substituir `oklch()` direto em `section-financeiro.tsx`, `section-expedientes.tsx`, `section-contratos.tsx`, `section-pessoal.tsx`, `primitives.tsx`, `command-hub/page.tsx` por variáveis CSS do tema
    - _Requisitos: 2.3, 21.3_

  - [x] 4.3 Migrar tipografia e cores inline do dashboard
    - Substituir headings manuais em `dashboard-unificada.tsx` por componentes Typography
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 2.4, 2.5, 2.6_

  - [x] 4.4 Padronizar estrutura FSD do dashboard
    - Consolidar `repositories/` → `repository.ts`
    - Consolidar `services/` → `service.ts`
    - Manter `widgets/`, `mock/`, `registry/` como subpastas especializadas
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 2.7, 20.1, 20.3, 20.4_

- [x] 5. Migração do módulo captura (Grupo A)
  - [x] 5.1 Verificar cobertura de PageShell no módulo captura
    - Verificar que todas as sub-rotas (historico, agendamentos, advogados, credenciais, tribunais, configuracoes) usam PageShell
    - Criar `layout.tsx` centralizado se necessário
    - _Requisitos: 3.1_

  - [x] 5.2 Migrar tipografia e cores inline do módulo captura
    - Substituir headings manuais (ex: `configuracoes/assistentes-tipos/page.tsx` com `<h1 className>`) por componentes Typography
    - Manter uso correto de `getSemanticBadgeVariant` já existente
    - Remover cores inline de componentes de feature
    - _Requisitos: 3.2, 3.3, 3.4, 3.5_

  - [x] 5.3 Padronizar estrutura FSD do módulo captura
    - Criar `actions/index.ts` com barrel export
    - Consolidar `services/` com barrel export `services/index.ts` (exceção justificada pela complexidade — 12+ subserviços)
    - Consolidar `types/` com barrel export
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 3.6, 3.7, 20.1, 20.4_

- [x] 6. Migração do módulo obrigações (Grupo A)
  - [x] 6.1 Criar `layout.tsx` com PageShell no módulo obrigações
    - Criar `layout.tsx` garantindo cobertura em todas as sub-rotas: lista, mes, semana, ano, [id], [id]/editar, novo
    - _Requisitos: 4.1_

  - [x] 6.2 Eliminar funções locais de badge do módulo obrigações
    - Remover `getTipoColorClass`, `getDirecaoColorClass`, `getStatusColorClass` de `utils.ts` — migrar para `getSemanticBadgeVariant` com categorias já registradas (`obrigacao_tipo`, `obrigacao_direcao`, `obrigacao_status`)
    - Remover `getStatusBadge` de `repasses-pendentes-list.tsx` — migrar para `getSemanticBadgeVariant` com `repasse_status`
    - Remover `getStatusBadge` e `getStatusRepasseBadge` de `parcelas-table.tsx` — migrar para `getSemanticBadgeVariant` com `parcela_status` e `repasse_status`
    - _Requisitos: 4.2, 4.3, 4.5, 19.2, 19.3, 21.2, 21.4_

  - [x] 6.3 Migrar tipografia e cores inline do módulo obrigações
    - Substituir headings manuais em `[id]/page.tsx` e `components/calendar/obrigacoes-day-list.tsx` por componentes Typography
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 4.4, 4.6, 4.7_

  - [x] 6.4 Padronizar estrutura FSD do módulo obrigações
    - Remover `server-actions.ts` e `server.ts` da raiz
    - Consolidar em pasta `actions/` com `index.ts`
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 4.8, 4.9, 20.1, 20.2, 20.4_


- [x] 7. Migração do módulo perícias (Grupo A)
  - [x] 7.1 Criar `layout.tsx` com PageShell centralizado no módulo perícias
    - Substituir o uso individual de PageShell em cada page.tsx por `layout.tsx` centralizado
    - Garantir cobertura em todas as sub-rotas: lista, mes, semana, ano, [id]
    - _Requisitos: 5.1_

  - [x] 7.2 Eliminar funções locais de badge do módulo perícias
    - Remover `getSituacaoVariant` de `columns.tsx` e `pericia-detalhes-dialog.tsx`
    - Remover `getBadgeVariant` de `pericias-day-list.tsx`
    - Migrar para `getSemanticBadgeVariant` com categoria `pericia_situacao`
    - _Requisitos: 5.2, 19.1, 21.2, 21.4_

  - [x] 7.3 Migrar tipografia e cores inline do módulo perícias
    - Substituir headings manuais em `pericias-client.tsx` por componentes Typography
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 5.3, 5.4, 5.5_

  - [x] 7.4 Padronizar estrutura FSD do módulo perícias
    - Criar `actions/index.ts` com barrel export para `actions/pericias-actions.ts`
    - Consolidar `types.ts` dentro de `domain.ts`
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 5.6, 5.7, 20.1, 20.2, 20.4_

- [x] 8. Migração do módulo usuários (Grupo A)
  - [x] 8.1 Criar `layout.tsx` com PageShell no módulo usuários
    - Criar `layout.tsx` com PageShell (page.tsx atualmente renderiza `<UsuariosPageContent />` direto)
    - _Requisitos: 6.1_

  - [x] 8.2 Migrar tipografia, badges e cores inline do módulo usuários
    - Substituir headings manuais por componentes Typography
    - Garantir que todos os badges usam `getSemanticBadgeVariant`
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 6.2, 6.3, 6.4, 6.5_

  - [x] 8.3 Padronizar estrutura FSD do módulo usuários
    - Unificar `repository.ts`, `repository-atividades.ts`, `repository-audit-atividades.ts`, `repository-auth-logs.ts` em `repository.ts` com re-exports
    - Consolidar `services/` → `service.ts`
    - Consolidar `types/` → `domain.ts`
    - Criar `actions/index.ts` com barrel export
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 6.6, 6.7, 20.1, 20.3, 20.4_

- [ ] 9. Migração do módulo chat (Grupo A)
  - [x] 9.1 Criar `layout.tsx` com PageShell no módulo chat
    - Criar `layout.tsx` com PageShell (page.tsx atualmente renderiza `<ChatLayout>` direto)
    - _Requisitos: 7.1_

  - [-] 9.2 Migrar cores hardcoded de videochamada do módulo chat
    - Substituir `bg-gray-950`, `bg-gray-900`, `bg-gray-800`, `bg-gray-700`, `bg-gray-600`, `border-gray-800`, `text-gray-300`, `text-gray-400` nos 7+ componentes de videochamada
    - Usar `data-theme="dark"` no wrapper + classes semânticas (`bg-background`, `bg-card`, `bg-muted`, `border-border`, `text-muted-foreground`) OU variáveis `--video-*`
    - Componentes afetados: `meeting-error-boundary.tsx`, `layout-switcher.tsx`, `custom-meeting-ui.tsx`, `video-call-dialog.tsx`, `custom-video-grid.tsx`, `meeting-skeleton.tsx`, `custom-call-controls.tsx`
    - _Requisitos: 7.2, 21.1_

  - [~] 9.3 Migrar tipografia e cores inline do módulo chat
    - Substituir headings manuais por componentes Typography
    - Remover cores inline restantes de componentes de feature (fora videochamada)
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 7.3, 7.4_

  - [~] 9.4 Padronizar estrutura FSD do módulo chat
    - Mover `components/types.ts` → `domain.ts`
    - Mover `components/useChatStore.ts` → `hooks/` ou `store.ts`
    - Unificar `utils/` (pasta) e `utils.ts` (arquivo)
    - Criar `actions/index.ts` com barrel export
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 7.5, 7.6, 20.1, 20.2, 20.4_

- [ ] 10. Migração do módulo RH (Grupo A)
  - [~] 10.1 Criar `layout.tsx` com PageShell centralizado no módulo RH
    - Substituir o uso direto de PageShell no page.tsx client component por `layout.tsx`
    - _Requisitos: 8.1_

  - [~] 10.2 Migrar tipografia, badges e cores inline do módulo RH
    - Substituir headings manuais por componentes Typography
    - Garantir que todos os badges usam `getSemanticBadgeVariant`
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 8.2, 8.3, 8.4, 8.5_

  - [~] 10.3 Padronizar estrutura FSD do módulo RH
    - Consolidar `types.ts` dentro de `domain.ts`
    - Criar `actions/index.ts` com barrel export para `folhas-pagamento-actions.ts` e `salarios-actions.ts`
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 8.6, 8.7, 20.1, 20.2, 20.4_

- [~] 11. Checkpoint — Grupo A (módulos complexos) migrado
  - Garantir que todos os testes passam. Verificar que nenhum módulo do Grupo A contém oklch() direto, cores hardcoded, funções locais de badge ou estrutura FSD divergente. Perguntar ao usuário se há dúvidas.


- [ ] 12. Migração do módulo tarefas (Grupo B)
  - [~] 12.1 Migrar tipografia, badges e cores inline do módulo tarefas
    - Manter uso correto de PageShell e DataShell/DataTableToolbar já existentes
    - Substituir headings manuais em `task-detail-sheet.tsx` por componentes Typography
    - Garantir que todos os badges usam `getSemanticBadgeVariant`
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [~] 12.2 Padronizar estrutura FSD do módulo tarefas
    - Criar `actions/index.ts` com barrel export para `actions/tarefas-actions.ts`
    - Mover `data/data.ts` para `domain.ts` ou `constants.ts`
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 9.7, 9.8, 20.1, 20.2, 20.4_

- [ ] 13. Migração do módulo documentos (Grupo B)
  - [~] 13.1 Criar `layout.tsx` com PageShell no módulo documentos
    - Substituir o uso direto de PageShell no page.tsx por `layout.tsx`
    - _Requisitos: 10.1_

  - [~] 13.2 Migrar tipografia, badges e cores inline do módulo documentos
    - Substituir headings manuais por componentes Typography
    - Garantir que todos os badges usam `getSemanticBadgeVariant`
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 10.2, 10.3, 10.4, 10.5_

  - [~] 13.3 Padronizar estrutura FSD do módulo documentos
    - Criar `actions/index.ts` com barrel export
    - Consolidar `services/` → `service.ts`
    - Consolidar `types.ts` dentro de `domain.ts`
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 10.6, 10.7, 20.1, 20.3, 20.4_

- [ ] 14. Migração do módulo peças jurídicas (Grupo B)
  - [~] 14.1 Criar `layout.tsx` com PageShell no módulo peças jurídicas
    - Substituir o uso direto de PageShell no page.tsx por `layout.tsx`
    - _Requisitos: 11.1_

  - [~] 14.2 Migrar tipografia e cores inline do módulo peças jurídicas
    - Manter uso correto de DataShell/DataTableToolbar já existente
    - Substituir headings manuais em `peca-modelo-view-sheet.tsx` e `[id]/editar/client.tsx` por componentes Typography
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 11.2, 11.3, 11.4, 11.5_

  - [~] 14.3 Padronizar barrel export do módulo peças jurídicas
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 11.6, 20.4_

- [ ] 15. Migração do módulo project-management (Grupo B)
  - [~] 15.1 Criar `layout.tsx` com PageShell no módulo project-management
    - Substituir o `<div className="space-y-4">` atual em `layout.tsx` por PageShell
    - _Requisitos: 12.1_

  - [~] 15.2 Migrar tipografia, badges e cores inline do módulo project-management
    - Substituir headings manuais por componentes Typography
    - Garantir que todos os badges usam `getSemanticBadgeVariant`
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 12.2, 12.3, 12.4, 12.5_

  - [~] 15.3 Padronizar estrutura FSD do módulo project-management
    - Mover `lib/domain.ts` → `domain.ts` na raiz
    - Mover `lib/services/` → `service.ts`
    - Mover `lib/repositories/` → `repository.ts`
    - Mover `lib/actions/` → `actions/`
    - Criar `RULES.md` documentando regras de negócio
    - Criar barrel export (`index.ts`) com seções claras
    - _Requisitos: 12.6, 12.7, 12.8, 20.1, 20.3, 20.4, 20.6_

- [ ] 16. Migração do módulo agenda/calendar (Grupo B)
  - [~] 16.1 Criar `layout.tsx` com PageShell no módulo agenda
    - Criar `layout.tsx` (page.tsx atualmente renderiza `<AgendaApp>` direto)
    - _Requisitos: 13.1_

  - [~] 16.2 Migrar oklch(), tipografia e cores inline do módulo agenda
    - Substituir `oklch()` direto em `agenda/mock/page.tsx` por variáveis CSS do tema
    - Substituir headings manuais em `agenda/mock/page.tsx` por componentes Typography
    - Manter uso correto de Heading do Typography em `toolbar.tsx`
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 13.2, 13.3, 13.4, 13.5, 13.6_

  - [~] 16.3 Padronizar estrutura FSD do módulo agenda/calendar
    - Criar `actions/index.ts` em agenda com barrel export para `actions/agenda-eventos-actions.ts`
    - Consolidar `types.ts` dentro de `domain.ts` em calendar
    - Organizar barrel export (`index.ts`) com seções claras em ambos os módulos
    - _Requisitos: 13.7, 13.8, 20.1, 20.2, 20.4_

- [ ] 17. Migração do módulo assistentes (Grupo B)
  - [~] 17.1 Criar `layout.tsx` com PageShell no módulo assistentes
    - Substituir o uso direto de PageShell no page.tsx por `layout.tsx`
    - _Requisitos: 14.1_

  - [~] 17.2 Migrar tipografia e cores inline do módulo assistentes
    - Manter uso correto de DataShell/DataTableToolbar já existente
    - Substituir headings manuais por componentes Typography
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 14.2, 14.3, 14.4, 14.5_

  - [~] 17.3 Padronizar estrutura FSD do módulo assistentes
    - Unificar estrutura duplicada raiz/feature (manter uma única camada)
    - Migrar `actions.ts` (arquivo) → pasta `actions/` com `index.ts`
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 14.6, 14.7, 20.1, 20.2, 20.4_

- [ ] 18. Migração do módulo notas (Grupo B)
  - [~] 18.1 Criar `layout.tsx` com PageShell no módulo notas
    - Criar `layout.tsx` (page.tsx atualmente renderiza `<NotesApp>` direto)
    - _Requisitos: 15.1_

  - [~] 18.2 Migrar tipografia e cores inline do módulo notas
    - Substituir headings manuais em `note-list-item.tsx` e `note-content.tsx` por componentes Typography
    - Verificar e migrar cores hardcoded em `label-colors.ts` para variáveis CSS do tema
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 15.2, 15.3, 15.4, 15.5_

  - [~] 18.3 Padronizar estrutura FSD do módulo notas
    - Mover componentes da raiz (note-app.tsx, note-content.tsx, note-list-item.tsx, note-sidebar.tsx, add-note-modal.tsx, edit-labels-modal.tsx) → pasta `components/`
    - Criar `actions/index.ts`
    - Organizar barrel export (`index.ts`) com seções claras
    - _Requisitos: 15.6, 15.7, 20.1, 20.4_

- [ ] 19. Migração do módulo mail (Grupo B)
  - [~] 19.1 Criar `layout.tsx` com PageShell no módulo mail
    - Criar `layout.tsx` (page.tsx atualmente renderiza `<Mail>` direto)
    - _Requisitos: 16.1_

  - [~] 19.2 Migrar tipografia e cores inline do módulo mail
    - Substituir headings manuais por componentes Typography
    - Remover cores inline de componentes de feature
    - Verificar espaçamentos Grid 4px
    - _Requisitos: 16.2, 16.3, 16.4_

  - [~] 19.3 Padronizar estrutura FSD do módulo mail
    - Criar estrutura FSD completa: `domain.ts`, `service.ts`, `repository.ts`
    - Mover `use-mail.ts` → `hooks/`
    - Mover `lib/` → `utils/`
    - Criar `actions/index.ts`
    - Criar barrel export (`index.ts`) com seções claras
    - _Requisitos: 16.5, 16.6, 20.1, 20.4_

- [~] 20. Checkpoint — Grupo B (módulos médios) migrado
  - Garantir que todos os testes passam. Verificar que nenhum módulo do Grupo B contém violações do Design System. Perguntar ao usuário se há dúvidas.


- [ ] 21. Migração Batch C1 — Configurações, Notificações, Perfil (Grupo C)
  - [~] 21.1 Migrar módulo configurações
    - Criar `layout.tsx` com PageShell
    - Manter uso correto de Typography já existente em `configuracoes-settings-layout.tsx` e `settings-section-header.tsx`
    - Criar `domain.ts`, `service.ts`, `repository.ts` se aplicável
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 17.1, 17.3, 17.7, 17.8, 20.1, 20.6_

  - [~] 21.2 Migrar módulo notificações
    - Criar `layout.tsx` com PageShell (page.tsx atualmente renderiza `<NotificacoesList>` direto)
    - Manter uso correto de DataShell/DataTableToolbar já existente
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 17.1, 17.4, 17.7, 17.8, 20.1, 20.6_

  - [~] 21.3 Migrar módulo perfil
    - Criar `layout.tsx` com PageShell (substituir uso direto no page.tsx)
    - Substituir heading manual em `perfil-view.tsx` (`<h1 className="text-3xl font-bold">`) por componente Typography
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 17.1, 17.2, 17.7, 17.8, 20.1, 20.6_

- [ ] 22. Migração Batch C2 — Tipos-Expedientes, Repasses, Pangea (Grupo C)
  - [~] 22.1 Migrar módulo tipos-expedientes
    - Criar `layout.tsx` com PageShell (substituir uso direto no page.tsx)
    - Criar `actions/index.ts` com barrel export
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 17.1, 17.7, 17.8, 20.1, 20.2_

  - [~] 22.2 Migrar módulo repasses
    - Criar `layout.tsx` com PageShell (substituir uso direto no page.tsx)
    - Criar `domain.ts`, `service.ts`, `repository.ts` se aplicável
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 17.1, 17.7, 17.8, 20.1_

  - [~] 22.3 Migrar módulo pangea
    - Criar `layout.tsx` com PageShell (substituir uso direto no page.tsx)
    - Manter uso correto de Typography já existente
    - Organizar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 17.1, 17.3, 17.7, 17.8, 20.1_

- [ ] 23. Migração Batch C3 — Entrevistas-Trabalhistas, Acervo, Admin (Grupo C)
  - [~] 23.1 Migrar módulo entrevistas-trabalhistas
    - Módulo embarcado em contratos (sem page.tsx próprio)
    - Migrar `queries.ts` para padrão FSD (`repository.ts`)
    - Criar `actions/index.ts` se aplicável
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 18.1, 18.5, 18.6, 18.7, 20.1_

  - [~] 23.2 Migrar módulo acervo
    - Módulo de serviço/biblioteca (sem page.tsx)
    - Substituir headings manuais em `acervo-filters.tsx` por componentes Typography
    - Remover cores inline de componentes de feature
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 18.2, 18.3, 18.4, 18.6, 18.7, 20.1_

  - [~] 23.3 Migrar módulo admin
    - Verificar sub-rotas e aplicar PageShell onde houver páginas renderizáveis
    - Consolidar `repositories/` → `repository.ts` e `services/` → `service.ts`
    - Criar `domain.ts`
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 18.1, 18.5, 18.6, 18.7, 20.1, 20.3_

- [ ] 24. Migração Batch C4 — Calculadoras, Endereços, Cargos, Advogados (Grupo C)
  - [~] 24.1 Migrar módulo calculadoras
    - Módulo mínimo (sem page.tsx) — apenas estrutura FSD
    - Criar `domain.ts`, `service.ts`, `repository.ts` se aplicável
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 18.5, 18.6, 18.7, 20.1_

  - [~] 24.2 Migrar módulo endereços
    - Módulo de serviço (sem page.tsx) — apenas estrutura FSD
    - Consolidar `types/` dentro de `domain.ts`
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 18.5, 18.6, 18.7, 20.1, 20.3_

  - [~] 24.3 Migrar módulo cargos
    - Módulo de serviço (sem page.tsx) — apenas estrutura FSD
    - Consolidar `types.ts` dentro de `domain.ts`
    - Criar `actions/index.ts` com barrel export
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 18.5, 18.6, 18.7, 20.1, 20.2, 20.3_

  - [~] 24.4 Migrar módulo advogados
    - Módulo de serviço (sem page.tsx) — apenas estrutura FSD
    - Criar `actions/index.ts` com barrel export
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 18.5, 18.6, 18.7, 20.1, 20.2_

- [ ] 25. Migração Batch C5 — Comunica-CNJ, Editor, Ajuda (Grupo C)
  - [~] 25.1 Migrar módulo comunica-cnj
    - Criar `layout.tsx` com PageShell se houver página renderizável
    - Remover cores inline de componentes de feature
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 17.1, 17.5, 17.6, 17.7, 17.8, 20.1_

  - [~] 25.2 Migrar módulo editor
    - Criar `layout.tsx` com PageShell se houver página renderizável
    - Remover cores inline de componentes de feature
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 17.1, 17.5, 17.6, 17.7, 17.8, 20.1_

  - [~] 25.3 Migrar módulo ajuda
    - Criar `layout.tsx` com PageShell se houver página renderizável
    - Remover cores inline de componentes de feature
    - Criar barrel export (`index.ts`) com seções claras e `RULES.md`
    - _Requisitos: 17.1, 17.5, 17.6, 17.7, 17.8, 20.1_

- [~] 26. Checkpoint — Grupo C (módulos leves) migrado
  - Garantir que todos os testes passam. Verificar que nenhum módulo do Grupo C contém violações do Design System. Perguntar ao usuário se há dúvidas.


- [ ] 27. Validação cross-módulo de importações FSD
  - [~] 27.1 Verificar regras de importação cross-módulo
    - Garantir que nenhum módulo externo importa diretamente de subpastas de outro módulo
    - Toda importação cross-módulo deve passar pelo barrel export (`index.ts`)
    - Executar `npm run check:architecture` para validar
    - _Requisitos: 20.5_

  - [~] 27.2 Verificar RULES.md em todos os módulos da Fase 2
    - Garantir que cada módulo possui `RULES.md` atualizado com entidades, regras de validação, regras de negócio, filtros, integrações e revalidação de cache
    - _Requisitos: 20.6_

- [ ] 28. Testes de validação
  - [~] 28.1 Estender property test — Cobertura completa de variantes de badge (Fase 2)
    - **Property 1: Cobertura completa de variantes de badge para todos os valores de domínio (expandida)**
    - Expandir o test existente da Fase 1 para incluir pares (categoria, valor) das novas categorias: `pericia_situacao` (F, A, C, R, P), `parcela_status` (pendente, paga, vencida, cancelada), `repasse_status` (nao_aplicavel, pendente_declaracao, pendente_transferencia, realizado)
    - Usar fast-check com mínimo 100 iterações
    - **Valida: Requisitos 19.5, 22.1**

  - [~] 28.2 Estender property test — Idempotência da normalização (Fase 2)
    - **Property 2: Idempotência da normalização de badge variant (expandida)**
    - Expandir o test existente para incluir as novas categorias no gerador de inputs
    - Usar fast-check com mínimo 100 iterações
    - **Valida: Requisitos 22.1**

  - [~] 28.3 Estender smoke tests de análise estática (Fase 2)
    - Expandir escopo dos smoke tests existentes para cobrir todos os módulos da Fase 2
    - Verificar ausência de `oklch()` direto em componentes de feature (exceto `globals.css` e primitivos UI)
    - Verificar ausência de `bg-gray-*` em componentes de chat (devem usar variáveis semânticas)
    - Verificar existência de variáveis CSS `--chart-*-soft`, `--glow-*` e `--video-*` em `globals.css`
    - Verificar ausência de funções locais `getXXXVariant`, `getXXXBadge`, `getXXXColorClass` em todos os módulos
    - Verificar existência de `layout.tsx` com PageShell em cada módulo com página renderizável
    - Verificar existência de `domain.ts`, `service.ts`, `repository.ts`, `actions/`, `index.ts`, `RULES.md` em cada módulo
    - **Valida: Requisitos 22.2, 22.3, 22.4, 22.5**

- [~] 29. Checkpoint final — Validação completa da Fase 2
  - Executar `npm run check:architecture`, `npm run validate:exports`, `npm test`, `npm run lint`
  - Garantir que todos os testes passam. Perguntar ao usuário se há dúvidas.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental entre grupos
- Property tests validam propriedades universais de corretude da função `getSemanticBadgeVariant` (expandidas com novas categorias)
- Smoke tests validam regras estruturais do Design System via análise estática (expandidos para todos os módulos da Fase 2)
- Módulos de serviço (sem page.tsx) não precisam de layout.tsx nem PageShell — apenas estrutura FSD
