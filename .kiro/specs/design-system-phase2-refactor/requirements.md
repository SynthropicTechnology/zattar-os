# Documento de Requisitos — Fase 2: Refatoração do Design System (Módulos Restantes)

## Introdução

Este documento define os requisitos para a Fase 2 da refatoração de consistência visual do Synthropic/Zattar OS. A Fase 1 migrou com sucesso os módulos **partes** (padrão ouro), **processos**, **contratos**, **assinatura-digital**, **audiências** e **expedientes**. A Fase 2 expande a refatoração para todos os módulos e páginas restantes do sistema, aplicando o mesmo padrão ouro para garantir consistência visual e arquitetural completa.

### Módulos Identificados para Migração

Os módulos foram agrupados por complexidade e criticidade:

**Grupo A — Módulos Complexos (muitas páginas, sub-rotas, componentes ricos):**
financeiro, dashboard, captura, obrigacoes, usuarios, chat, pericias, rh

**Grupo B — Módulos Médios (funcionalidade focada, algumas sub-rotas):**
tarefas, documentos, pecas-juridicas, project-management, agenda/calendar, assistentes, notas, mail

**Grupo C — Módulos Leves (poucas páginas, funcionalidade simples):**
configuracoes, notificacoes, perfil, tipos-expedientes, repasses, pangea, entrevistas-trabalhistas, acervo, admin, calculadoras, enderecos, cargos, advogados, comunica-cnj, editor, ajuda

## Glossário

- **Design_System**: Conjunto de protocolos visuais e arquiteturais definidos em `design-system-protocols.md`, incluindo regras de layout, badges, tipografia, espaçamento e cores
- **PageShell**: Componente wrapper obrigatório para todas as páginas, localizado em `@/components/shared/page-shell`
- **DataShell**: Componente wrapper para tabelas de dados com toolbar integrada, localizado em `@/components/shared/data-shell`
- **getSemanticBadgeVariant**: Função centralizada em `@/lib/design-system` para obter variantes semânticas de badges sem hardcodear cores
- **Typography**: Componentes de tipografia semântica (`Heading`, `Typography.H1`, etc.) em `@/components/ui/typography`
- **FSD**: Feature-Sliced Design — arquitetura de módulos colocados com barrel exports obrigatórios via `index.ts`
- **Barrel_Export**: Arquivo `index.ts` que serve como API pública do módulo, centralizando todas as exportações
- **RULES_MD**: Arquivo `RULES.md` obrigatório em cada módulo, documentando regras de negócio para agentes de IA
- **Módulo_Alvo**: Qualquer um dos módulos a ser refatorado nesta Fase 2
- **Padrão_Ouro**: O módulo partes, que serve como referência de implementação correta do Design System
- **Grid_4px**: Sistema de espaçamento baseado em múltiplos de 4px, com valores permitidos: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24

## Requisitos

### Requisito 1: Migração do Módulo Financeiro para o Design System

**User Story:** Como desenvolvedor, quero que o módulo financeiro siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- `layout.tsx` existe mas NÃO usa PageShell (usa `<div className="space-y-4">` manual)
- Usa `oklch()` direto em `dre/page-client.tsx` (color-mix com oklch para paleta de gráficos)
- Estrutura FSD divergente: usa `domain/` (pasta com múltiplos arquivos), `services/` (pasta), `repository/` (pasta) em vez de arquivos únicos na raiz
- Possui `server-actions.ts` e `server.ts` na raiz em vez de pasta `actions/`
- Módulo grande com sub-rotas: contas-pagar, contas-receber, conciliacao-bancaria, dre, orcamentos, plano-contas, relatorios

#### Critérios de Aceitação

1. WHEN a página principal do financeiro é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper via `layout.tsx` (substituir o `<div className="space-y-4">` atual)
2. WHEN qualquer sub-página do financeiro é renderizada, THE Módulo_Alvo SHALL garantir que PageShell é herdado do layout pai ou aplicado localmente
3. THE Módulo_Alvo SHALL substituir todas as ocorrências de `oklch()` direto em `dre/page-client.tsx` por variáveis CSS do tema ou paleta de gráficos do Design System
4. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography (Heading) em vez de tags HTML com classes inline
5. THE Módulo_Alvo SHALL garantir que todos os badges utilizem getSemanticBadgeVariant em vez de funções locais ou cores hardcoded
6. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
7. THE Módulo_Alvo SHALL remover qualquer cor inline (`bg-{cor}-{shade}`, `text-{cor}-{shade}`) de componentes de feature, delegando ao Design System
8. THE Módulo_Alvo SHALL consolidar a estrutura FSD: migrar `domain/` (pasta) para `domain.ts` (arquivo único com re-exports), `services/` para `service.ts`, `repository/` para `repository.ts`, e `server-actions.ts` para pasta `actions/` com `index.ts`
9. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras: Components, Hooks, Actions, Types/Domain, Utils, Errors

### Requisito 2: Migração do Módulo Dashboard para o Design System

**User Story:** Como desenvolvedor, quero que o módulo dashboard siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- `layout.tsx` já usa PageShell corretamente
- Uso extensivo de `oklch()` em widgets: `obrigacoes-treemap.tsx`, `despesas-treemap.tsx`, `meu-dia.tsx`, `aging-funnel.tsx`
- Uso extensivo de `oklch()` em mocks: `section-financeiro.tsx`, `section-expedientes.tsx`, `section-contratos.tsx`, `section-pessoal.tsx`, `primitives.tsx`, `command-hub/page.tsx`
- Headings manuais em `dashboard-unificada.tsx`
- Estrutura FSD divergente: usa `repositories/` (pasta), `services/` (pasta), `registry/`, `widgets/`, `mock/`, `v2/`

#### Critérios de Aceitação

1. THE Módulo_Alvo SHALL manter o uso correto de PageShell que já existe no `layout.tsx`
2. THE Módulo_Alvo SHALL substituir todas as ocorrências de `oklch()` direto nos widgets (`obrigacoes-treemap.tsx`, `despesas-treemap.tsx`, `meu-dia.tsx`, `aging-funnel.tsx`) por variáveis CSS do tema
3. THE Módulo_Alvo SHALL substituir todas as ocorrências de `oklch()` direto nos mocks (`section-financeiro.tsx`, `section-expedientes.tsx`, `section-contratos.tsx`, `section-pessoal.tsx`, `primitives.tsx`, `command-hub/page.tsx`) por variáveis CSS do tema
4. THE Módulo_Alvo SHALL substituir headings manuais em `dashboard-unificada.tsx` por componentes Typography
5. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
6. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
7. THE Módulo_Alvo SHALL consolidar a estrutura FSD: migrar `repositories/` para `repository.ts`, `services/` para `service.ts`, e organizar o Barrel_Export com seções claras

### Requisito 3: Migração do Módulo Captura para o Design System

**User Story:** Como desenvolvedor, quero que o módulo captura siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx redireciona para sub-rota)
- Sub-páginas (advogados, credenciais, tribunais, historico/[id]) já usam PageShell individualmente
- Já usa `getSemanticBadgeVariant` corretamente em `captura-list.tsx`, `captura-erros-formatados.tsx`, `captura-raw-logs.tsx`, `agendamentos-list.tsx`
- Estrutura FSD divergente: usa `services/` (pasta com muitos subserviços), `types/` (pasta), `drivers/`, `credentials/`
- Sem `actions/index.ts` (actions espalhadas sem barrel)

#### Critérios de Aceitação

1. WHEN qualquer sub-página da captura é renderizada, THE Módulo_Alvo SHALL garantir que PageShell é utilizado (verificar cobertura completa em todas as sub-rotas: historico, agendamentos, advogados, credenciais, tribunais, configuracoes)
2. THE Módulo_Alvo SHALL manter o uso correto de getSemanticBadgeVariant que já existe nos componentes de listagem
3. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline (verificar `configuracoes/assistentes-tipos/page.tsx` que usa `<h1 className>`)
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts` com barrel export, consolidar `services/` com barrel export ou `service.ts`, consolidar `types/` com barrel export
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 4: Migração do Módulo Obrigações para o Design System

**User Story:** Como desenvolvedor, quero que o módulo obrigações siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx redireciona para sub-rota lista)
- Sub-páginas usam PageShell em alguns casos (editar, novo) mas não em todos
- Já usa `getSemanticBadgeVariant` em `table/columns.tsx` para obrigacao_tipo, obrigacao_direcao, obrigacao_status
- Possui funções locais de cor: `getTipoColorClass`, `getDirecaoColorClass`, `getStatusColorClass` em `utils.ts`
- Possui funções locais de badge: `getStatusBadge` em `repasses-pendentes-list.tsx`, `getStatusBadge` e `getStatusRepasseBadge` em `parcelas-table.tsx`
- Headings manuais em `[id]/page.tsx` (`<h1 className>`, `<h2 className>`)
- Já usa DataShell/DataTableToolbar em table, calendar/year, calendar/month
- Possui `server-actions.ts` e `server.ts` na raiz além de pasta `actions/`
- Usa Typography parcialmente (obrigacoes/novo, obrigacoes/[id]/editar, repasses-pendentes-list)

#### Critérios de Aceitação

1. WHEN qualquer página de obrigações é renderizada, THE Módulo_Alvo SHALL garantir que PageShell é utilizado (criar `layout.tsx` ou garantir cobertura em todas as sub-rotas: lista, mes, semana, ano, [id], [id]/editar, novo)
2. THE Módulo_Alvo SHALL remover as funções locais `getTipoColorClass`, `getDirecaoColorClass` e `getStatusColorClass` de `utils.ts`, migrando para getSemanticBadgeVariant com categorias já registradas
3. THE Módulo_Alvo SHALL remover as funções locais `getStatusBadge` de `repasses-pendentes-list.tsx` e `getStatusBadge`/`getStatusRepasseBadge` de `parcelas-table.tsx`, migrando para getSemanticBadgeVariant com novas categorias `parcela_status` e `repasse_status`
4. THE Módulo_Alvo SHALL substituir headings manuais em `[id]/page.tsx` e `components/calendar/obrigacoes-day-list.tsx` por componentes Typography
5. THE Módulo_Alvo SHALL manter o uso correto de getSemanticBadgeVariant e DataShell que já existe em `table/columns.tsx` e wrappers de calendário
6. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
7. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
8. THE Módulo_Alvo SHALL consolidar a estrutura FSD: remover `server-actions.ts` e `server.ts` da raiz, migrar para pasta `actions/` com `index.ts`
9. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 5: Migração do Módulo Perícias para o Design System

**User Story:** Como desenvolvedor, quero que o módulo perícias siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (cada sub-página usa PageShell individualmente em page.tsx, mes, semana, ano, lista)
- Possui funções locais de badge: `getSituacaoVariant` duplicada em `columns.tsx` e `pericia-detalhes-dialog.tsx`, `getBadgeVariant` em `pericias-day-list.tsx`
- Headings manuais em `pericias-client.tsx` (`<h3 className>`)
- Sem `actions/index.ts` (apenas `actions/pericias-actions.ts` sem barrel)
- Possui `types.ts` separado do `domain.ts`

#### Critérios de Aceitação

1. WHEN qualquer página de perícias é renderizada, THE Módulo_Alvo SHALL utilizar PageShell via `layout.tsx` centralizado (substituir o uso individual em cada page.tsx)
2. THE Módulo_Alvo SHALL remover as funções locais `getSituacaoVariant` de `columns.tsx` e `pericia-detalhes-dialog.tsx`, e `getBadgeVariant` de `pericias-day-list.tsx`, migrando para getSemanticBadgeVariant com nova categoria `pericia_situacao` registrada em `variants.ts`
3. THE Módulo_Alvo SHALL substituir headings manuais em `pericias-client.tsx` por componentes Typography
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts` com barrel export, consolidar `types.ts` dentro de `domain.ts`
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 6: Migração do Módulo Usuários para o Design System

**User Story:** Como desenvolvedor, quero que o módulo usuários siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx renderiza `<UsuariosPageContent />` direto)
- Headings manuais em `perfil-view.tsx` (referenciado via componentes de detalhe)
- Múltiplos repositories na raiz: `repository.ts`, `repository-atividades.ts`, `repository-audit-atividades.ts`, `repository-auth-logs.ts`
- Possui `services/` (pasta), `types/` (pasta)
- Sem `actions/index.ts` (actions espalhadas sem barrel)

#### Critérios de Aceitação

1. WHEN a página de usuários é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper (criar `layout.tsx` ou aplicar PageShell no `page.tsx`)
2. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
3. THE Módulo_Alvo SHALL garantir que todos os badges utilizem getSemanticBadgeVariant em vez de cores hardcoded
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: unificar repositories em `repository.ts` com barrel, consolidar `services/` em `service.ts`, consolidar `types/` em `domain.ts`, criar `actions/index.ts`
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 7: Migração do Módulo Chat para o Design System

**User Story:** Como desenvolvedor, quero que o módulo chat siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx renderiza `<ChatLayout>` direto com `<div className="flex h-full flex-col">`)
- Uso massivo de cores hardcoded nos componentes de videochamada: `bg-gray-950`, `bg-gray-900`, `bg-gray-800`, `bg-gray-700`, `bg-gray-600` em `meeting-error-boundary.tsx`, `layout-switcher.tsx`, `custom-meeting-ui.tsx`, `video-call-dialog.tsx`, `custom-video-grid.tsx`, `meeting-skeleton.tsx`, `custom-call-controls.tsx`
- Sem `actions/index.ts` (actions espalhadas sem barrel)
- Possui `utils/` (pasta) e `utils.ts` (arquivo) duplicados
- Possui `components/types.ts` e `components/useChatStore.ts` fora do padrão FSD

#### Critérios de Aceitação

1. WHEN a página de chat é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper (criar `layout.tsx` ou aplicar no `page.tsx`)
2. THE Módulo_Alvo SHALL substituir todas as cores hardcoded (`bg-gray-950`, `bg-gray-900`, `bg-gray-800`, `bg-gray-700`, `bg-gray-600`, `border-gray-800`, `text-gray-300`, `text-gray-400`) nos componentes de videochamada por variáveis CSS semânticas do tema (`bg-background`, `bg-card`, `bg-muted`, `border-border`, `text-muted-foreground`)
3. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts`, mover `components/types.ts` para `domain.ts`, mover `components/useChatStore.ts` para `hooks/` ou `store.ts`
6. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 8: Migração do Módulo RH para o Design System

**User Story:** Como desenvolvedor, quero que o módulo RH siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx é client component que usa PageShell diretamente)
- Possui `types.ts` separado do `domain.ts`
- Sem `actions/index.ts` (actions espalhadas: `folhas-pagamento-actions.ts`, `salarios-actions.ts`)
- Sub-rotas: folhas-pagamento, salarios (com sub-rotas próprias)

#### Critérios de Aceitação

1. WHEN a página de RH é renderizada, THE Módulo_Alvo SHALL utilizar PageShell via `layout.tsx` centralizado (substituir o uso direto no page.tsx client component)
2. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
3. THE Módulo_Alvo SHALL garantir que todos os badges utilizem getSemanticBadgeVariant em vez de cores hardcoded
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts`, consolidar `types.ts` dentro de `domain.ts`
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 9: Migração do Módulo Tarefas para o Design System

**User Story:** Como desenvolvedor, quero que o módulo tarefas siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- `layout.tsx` já usa PageShell corretamente
- Já usa DataShell/DataTableToolbar em `data-table.tsx`
- Headings manuais em `task-detail-sheet.tsx` (`<h3 className>`)
- Possui `data/data.ts` com dados estáticos fora do padrão FSD
- Sem `actions/index.ts` (apenas `actions/tarefas-actions.ts` sem barrel)

#### Critérios de Aceitação

1. THE Módulo_Alvo SHALL manter o uso correto de PageShell que já existe no `layout.tsx`
2. THE Módulo_Alvo SHALL manter o uso correto de DataShell/DataTableToolbar que já existe em `data-table.tsx`
3. THE Módulo_Alvo SHALL substituir headings manuais em `task-detail-sheet.tsx` por componentes Typography
4. THE Módulo_Alvo SHALL garantir que todos os badges utilizem getSemanticBadgeVariant em vez de cores hardcoded
5. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
6. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
7. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts`, mover `data/data.ts` para `domain.ts` ou `constants.ts`
8. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 10: Migração do Módulo Documentos para o Design System

**User Story:** Como desenvolvedor, quero que o módulo documentos siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx usa PageShell diretamente)
- Possui `services/` (pasta), `types.ts` separado do `domain.ts`
- Sem `actions/index.ts` (actions espalhadas sem barrel)

#### Critérios de Aceitação

1. WHEN a página de documentos é renderizada, THE Módulo_Alvo SHALL utilizar PageShell via `layout.tsx` centralizado (substituir o uso direto no page.tsx)
2. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
3. THE Módulo_Alvo SHALL garantir que todos os badges utilizem getSemanticBadgeVariant em vez de cores hardcoded
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts`, consolidar `services/` em `service.ts`, consolidar `types.ts` dentro de `domain.ts`
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 11: Migração do Módulo Peças Jurídicas para o Design System

**User Story:** Como desenvolvedor, quero que o módulo peças jurídicas siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx usa PageShell diretamente)
- Já usa DataShell/DataTableToolbar em `pecas-modelos-table-wrapper.tsx`
- Headings manuais em `peca-modelo-view-sheet.tsx` (`<h3 className>`) e `[id]/editar/client.tsx` (`<h2 className>`)

#### Critérios de Aceitação

1. WHEN a página de peças jurídicas é renderizada, THE Módulo_Alvo SHALL utilizar PageShell via `layout.tsx` centralizado (substituir o uso direto no page.tsx)
2. THE Módulo_Alvo SHALL manter o uso correto de DataShell/DataTableToolbar que já existe em `pecas-modelos-table-wrapper.tsx`
3. THE Módulo_Alvo SHALL substituir headings manuais em `peca-modelo-view-sheet.tsx` e `[id]/editar/client.tsx` por componentes Typography
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 12: Migração do Módulo Project Management para o Design System

**User Story:** Como desenvolvedor, quero que o módulo project-management siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- `layout.tsx` existe mas NÃO usa PageShell (usa `<div className="space-y-4">` manual)
- Estrutura FSD divergente: usa `lib/` com subpastas `actions/`, `repositories/`, `services/`, `domain.ts` — tudo aninhado em `lib/` em vez da raiz

#### Critérios de Aceitação

1. WHEN a página de project-management é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper via `layout.tsx` (substituir o `<div className="space-y-4">` atual)
2. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
3. THE Módulo_Alvo SHALL garantir que todos os badges utilizem getSemanticBadgeVariant em vez de cores hardcoded
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: mover `lib/domain.ts` para `domain.ts` na raiz, `lib/services/` para `service.ts`, `lib/repositories/` para `repository.ts`, `lib/actions/` para `actions/`
7. THE Módulo_Alvo SHALL criar RULES_MD documentando regras de negócio do módulo
8. THE Módulo_Alvo SHALL criar Barrel_Export (`index.ts`) com seções claras

### Requisito 13: Migração do Módulo Agenda/Calendar para o Design System

**User Story:** Como desenvolvedor, quero que o módulo agenda/calendar siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` em agenda (page.tsx renderiza `<AgendaApp>` direto)
- Calendar é apenas redirect para agenda
- Usa `oklch()` direto em `agenda/mock/page.tsx` (shadow com oklch)
- Headings manuais em `agenda/mock/page.tsx` (`<h1 className>`, `<h2 className>`, `<h3 className>`)
- Já usa Heading do Typography em `agenda/components/toolbar.tsx`
- Sem `actions/index.ts` em agenda (apenas `actions/agenda-eventos-actions.ts`)
- Calendar possui `types.ts` separado do `domain.ts`

#### Critérios de Aceitação

1. WHEN a página de agenda é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper (criar `layout.tsx` ou aplicar no `page.tsx`)
2. THE Módulo_Alvo SHALL substituir a ocorrência de `oklch()` direto em `agenda/mock/page.tsx` por variáveis CSS do tema
3. THE Módulo_Alvo SHALL substituir headings manuais em `agenda/mock/page.tsx` por componentes Typography
4. THE Módulo_Alvo SHALL manter o uso correto de Heading do Typography que já existe em `toolbar.tsx`
5. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
6. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
7. THE Módulo_Alvo SHALL consolidar a estrutura FSD: criar `actions/index.ts` em agenda, consolidar `types.ts` dentro de `domain.ts` em calendar
8. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras em ambos os módulos

### Requisito 14: Migração do Módulo Assistentes para o Design System

**User Story:** Como desenvolvedor, quero que o módulo assistentes siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx usa PageShell diretamente)
- Já usa DataShell/DataTableToolbar em `feature/components/shared/assistentes-list-wrapper.tsx`
- Possui `actions.ts` na raiz (arquivo único) em vez de pasta `actions/`
- Possui subpasta `feature/` com estrutura FSD própria (domain.ts, service.ts, repository.ts, actions/, components/)
- Estrutura duplicada: raiz tem domain.ts, service.ts, repository.ts E feature/ também tem

#### Critérios de Aceitação

1. WHEN a página de assistentes é renderizada, THE Módulo_Alvo SHALL utilizar PageShell via `layout.tsx` centralizado (substituir o uso direto no page.tsx)
2. THE Módulo_Alvo SHALL manter o uso correto de DataShell/DataTableToolbar que já existe
3. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: unificar a estrutura duplicada raiz/feature, migrar `actions.ts` (arquivo) para pasta `actions/` com `index.ts`
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 15: Migração do Módulo Notas para o Design System

**User Story:** Como desenvolvedor, quero que o módulo notas siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx renderiza `<NotesApp>` direto)
- Headings manuais em `note-list-item.tsx` (`<h3 className>`) e `note-content.tsx` (`<h3 className>`)
- Componentes na raiz do módulo em vez de pasta `components/` (note-app.tsx, note-content.tsx, note-list-item.tsx, note-sidebar.tsx, add-note-modal.tsx, edit-labels-modal.tsx)
- Possui `label-colors.ts` com cores potencialmente hardcoded
- Sem pasta `components/`, `hooks/`

#### Critérios de Aceitação

1. WHEN a página de notas é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper (criar `layout.tsx`)
2. THE Módulo_Alvo SHALL substituir headings manuais em `note-list-item.tsx` e `note-content.tsx` por componentes Typography
3. THE Módulo_Alvo SHALL verificar e migrar cores hardcoded em `label-colors.ts` para variáveis CSS do tema
4. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
5. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
6. THE Módulo_Alvo SHALL consolidar a estrutura FSD: mover componentes da raiz para pasta `components/`, criar `actions/index.ts`
7. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 16: Migração do Módulo Mail para o Design System

**User Story:** Como desenvolvedor, quero que o módulo mail siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- Sem `layout.tsx` (page.tsx renderiza `<Mail>` direto com `<div className="flex-1 min-h-0 overflow-hidden rounded-md border">`)
- Sem estrutura FSD: não possui `domain.ts`, `service.ts`, `repository.ts`, `actions/`, `index.ts`
- Possui `use-mail.ts` na raiz em vez de pasta `hooks/`
- Possui `lib/` com constantes e display utils

#### Critérios de Aceitação

1. WHEN a página de mail é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper (criar `layout.tsx`)
2. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
3. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
4. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
5. THE Módulo_Alvo SHALL consolidar a estrutura FSD: mover `use-mail.ts` para `hooks/`, mover `lib/` para `utils/`, criar `index.ts` com barrel export
6. THE Módulo_Alvo SHALL organizar o Barrel_Export (`index.ts`) com seções claras

### Requisito 17: Migração dos Módulos Leves — Grupo C (Configurações, Notificações, Perfil, Tipos-Expedientes, Repasses, Pangea)

**User Story:** Como desenvolvedor, quero que os módulos leves do Grupo C sigam o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- **configuracoes**: Sem `layout.tsx`, sem `index.ts`, sem `domain.ts`/`service.ts`/`repository.ts`. Já usa Heading do Typography em `configuracoes-settings-layout.tsx` e `settings-section-header.tsx`
- **notificacoes**: Sem `layout.tsx` (page.tsx renderiza `<NotificacoesList>` direto). Já usa DataShell/DataTableToolbar em `notificacoes-list.tsx`
- **perfil**: Sem `layout.tsx` (page.tsx usa PageShell direto). Heading manual em `perfil-view.tsx` (`<h1 className="text-3xl font-bold">`)
- **tipos-expedientes**: Sem `layout.tsx` (page.tsx usa PageShell direto). Sem `actions/index.ts`
- **repasses**: Sem `layout.tsx` (page.tsx usa PageShell direto). Sem `domain.ts`/`service.ts`/`repository.ts`
- **pangea**: Sem `layout.tsx` (page.tsx usa PageShell direto). Já usa Typography. Estrutura em `feature/` com FSD próprio

#### Critérios de Aceitação

1. WHEN qualquer página dos módulos do Grupo C é renderizada, THE Módulo_Alvo SHALL utilizar PageShell via `layout.tsx` centralizado (substituir o uso direto em page.tsx onde aplicável)
2. THE Módulo_Alvo SHALL substituir o heading manual em `perfil/components/perfil-view.tsx` (`<h1 className="text-3xl font-bold">`) por componente Typography
3. THE Módulo_Alvo SHALL manter o uso correto de Typography que já existe em configuracoes e pangea
4. THE Módulo_Alvo SHALL manter o uso correto de DataShell/DataTableToolbar que já existe em notificacoes
5. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
6. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
7. THE Módulo_Alvo SHALL garantir que cada módulo possua Barrel_Export (`index.ts`) organizado com seções claras
8. THE Módulo_Alvo SHALL garantir que cada módulo possua RULES_MD atualizado

### Requisito 18: Migração dos Módulos Leves — Grupo C (Entrevistas-Trabalhistas, Acervo, Admin, Calculadoras, Endereços, Cargos, Advogados)

**User Story:** Como desenvolvedor, quero que os módulos auxiliares do Grupo C sigam o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

**Diagnóstico Atual:**
- **entrevistas-trabalhistas**: Sem `layout.tsx`, sem `page.tsx` (módulo embarcado em contratos). Possui `queries.ts` fora do padrão FSD. Sem `actions/index.ts`
- **acervo**: Sem `layout.tsx`, sem `page.tsx` (módulo de serviço/biblioteca). Headings manuais em `acervo-filters.tsx` (`<h3 className>`)
- **admin**: Sem `layout.tsx`, sem `page.tsx` na raiz. Possui `repositories/` e `services/` em vez de `repository.ts`/`service.ts`. Sem `domain.ts`
- **calculadoras**: Módulo mínimo com apenas `components/horas-extras-calculator.tsx`. Sem estrutura FSD
- **enderecos**: Módulo de serviço sem `page.tsx`. Possui `types/` separado do `domain.ts`
- **cargos**: Módulo de serviço sem `page.tsx`. Possui `types.ts` separado do `domain.ts`. Sem `actions/index.ts`
- **advogados**: Módulo de serviço sem `page.tsx`. Sem `actions/index.ts`

#### Critérios de Aceitação

1. WHEN qualquer módulo do Grupo C possui páginas renderizáveis, THE Módulo_Alvo SHALL utilizar PageShell como wrapper
2. THE Módulo_Alvo SHALL substituir headings manuais em `acervo/components/list/acervo-filters.tsx` por componentes Typography
3. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
4. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
5. THE Módulo_Alvo SHALL consolidar a estrutura FSD onde aplicável: criar `actions/index.ts` em módulos que possuem actions, consolidar `types.ts`/`types/` dentro de `domain.ts`, consolidar `repositories/`/`services/` em admin
6. THE Módulo_Alvo SHALL garantir que cada módulo possua Barrel_Export (`index.ts`) organizado com seções claras
7. THE Módulo_Alvo SHALL garantir que cada módulo possua RULES_MD atualizado

### Requisito 19: Registro de Novas Categorias de Badge em variants.ts

**User Story:** Como desenvolvedor, quero que todas as novas categorias de badge necessárias para a Fase 2 sejam registradas centralmente em `variants.ts`, para eliminar funções locais de mapeamento de cor.

**Diagnóstico Atual:**
- Perícias: funções locais `getSituacaoVariant` e `getBadgeVariant` com mapeamentos F→success, A→info, C→destructive, R→warning, P→secondary
- Obrigações: funções locais `getTipoColorClass`, `getDirecaoColorClass`, `getStatusColorClass`, `getStatusBadge`, `getStatusRepasseBadge` com mapeamentos de parcela e repasse
- Chat: sem badges semânticos (usa cores hardcoded para status de chamada)
- RH: potenciais badges de status de folha de pagamento e salário
- Project Management: potenciais badges de status de projeto e tarefa

#### Critérios de Aceitação

1. THE Design_System SHALL registrar a categoria `pericia_situacao` em `variants.ts` com mapeamentos: `F → success`, `A → info`, `C → destructive`, `R → warning`, `P → secondary`
2. THE Design_System SHALL registrar a categoria `parcela_status` em `variants.ts` com mapeamentos: `pendente → warning`, `paga → success`, `vencida → destructive`, `cancelada → neutral`
3. THE Design_System SHALL registrar a categoria `repasse_status` em `variants.ts` com mapeamentos: `nao_aplicavel → neutral`, `pendente_declaracao → warning`, `pendente_transferencia → info`, `realizado → success`
4. IF um Módulo_Alvo necessitar de uma nova categoria de badge durante a migração, THEN THE Design_System SHALL registrar a nova categoria em `variants.ts` em vez de criar mapeamentos locais
5. THE Design_System SHALL garantir que cada nova categoria registrada cubra todos os valores de domínio possíveis sem cair no fallback `neutral`

### Requisito 20: Padronização da Estrutura FSD em Todos os Módulos da Fase 2

**User Story:** Como desenvolvedor, quero que todos os módulos da Fase 2 sigam a mesma estrutura FSD do módulo partes, para facilitar a manutenção e navegação do código.

#### Critérios de Aceitação

1. THE Design_System SHALL garantir que cada Módulo_Alvo contenha obrigatoriamente: `domain.ts`, `service.ts`, `repository.ts`, `actions/` (pasta com `index.ts`), `components/`, `index.ts` (barrel export) e `RULES.md`
2. WHEN um Módulo_Alvo possui `actions.ts` como arquivo único na raiz, THE Design_System SHALL migrar para uma pasta `actions/` com `index.ts` e arquivos separados por domínio
3. WHEN um Módulo_Alvo possui pastas `services/`, `repositories/`, `domain/`, `types/` em vez de arquivos únicos, THE Design_System SHALL consolidar em arquivos únicos na raiz (`service.ts`, `repository.ts`, `domain.ts`) com re-exports internos quando necessário
4. THE Design_System SHALL garantir que o Barrel_Export de cada Módulo_Alvo organize as exportações em seções claras: Components, Hooks, Actions, Types/Domain, Utils, Errors
5. THE Design_System SHALL garantir que nenhum módulo externo importe diretamente de subpastas de um Módulo_Alvo — toda importação cross-módulo deve passar pelo Barrel_Export
6. THE Design_System SHALL garantir que cada Módulo_Alvo possua um RULES_MD atualizado documentando entidades, regras de validação, regras de negócio, filtros, integrações e revalidação de cache

### Requisito 21: Eliminação de Violações do Design System em Todos os Módulos da Fase 2

**User Story:** Como desenvolvedor, quero que nenhum módulo da Fase 2 contenha violações das regras do Design System, para garantir consistência visual e facilitar a manutenção.

#### Critérios de Aceitação

1. THE Design_System SHALL garantir que nenhum componente de feature em qualquer Módulo_Alvo contenha classes de cor hardcoded do Tailwind (`bg-{cor}-{shade}`, `text-{cor}-{shade}`, `border-{cor}-{shade}`) — exceção para componentes de videochamada do chat que usam tema escuro fixo, onde as cores devem ser migradas para variáveis CSS semânticas
2. THE Design_System SHALL garantir que nenhum Módulo_Alvo contenha funções locais `getXXXColorClass()`, `getXXXBadgeVariant()`, `getXXXBadgeStyle()` ou similares para mapeamento de cores
3. THE Design_System SHALL garantir que nenhum Módulo_Alvo contenha `oklch()` direto em classes CSS ou estilos inline — substituir por variáveis CSS do tema ou `color-mix()` com variáveis CSS
4. THE Design_System SHALL garantir que todos os badges em todos os Módulos_Alvo utilizem getSemanticBadgeVariant com categorias registradas em `variants.ts`
5. THE Design_System SHALL garantir que todos os valores de espaçamento em todos os Módulos_Alvo pertençam ao conjunto permitido do Grid_4px
6. THE Design_System SHALL garantir que todos os headings em todos os Módulos_Alvo utilizem componentes Typography (Heading, Typography.H1, etc.) em vez de tags HTML com classes inline

### Requisito 22: Testes de Validação da Fase 2

**User Story:** Como desenvolvedor, quero testes automatizados que validem a conformidade de todos os módulos da Fase 2 com o Design System, para prevenir regressões.

#### Critérios de Aceitação

1. THE Design_System SHALL estender os property tests existentes da Fase 1 para cobrir as novas categorias de badge registradas (`pericia_situacao`, `parcela_status`, `repasse_status` e quaisquer outras adicionadas)
2. THE Design_System SHALL estender os smoke tests existentes da Fase 1 para verificar ausência de `oklch()` direto em todos os módulos da Fase 2
3. THE Design_System SHALL estender os smoke tests existentes para verificar existência de `layout.tsx` com PageShell em cada módulo da Fase 2 que possui páginas renderizáveis
4. THE Design_System SHALL estender os smoke tests existentes para verificar existência de `domain.ts`, `service.ts`, `repository.ts`, `actions/`, `index.ts`, `RULES.md` em cada módulo da Fase 2
5. THE Design_System SHALL estender os smoke tests existentes para verificar ausência de funções locais de badge/cor em todos os módulos da Fase 2
6. WHEN todos os testes passam, THE Design_System SHALL executar `npm run check:architecture`, `npm run validate:exports`, `npm test` e `npm run lint` com sucesso
