# Plano de Implementação: Refatoração de Consistência Visual (Design System)

## Visão Geral

Migração incremental de 5 módulos para o Design System Synthropic, usando o módulo **partes** como padrão ouro. A ordem de execução é: dependência compartilhada (variants.ts) → polimento do padrão ouro → migração módulo a módulo → testes de validação.

## Tarefas

- [x] 1. Registrar novas categorias de badge em variants.ts (dependência compartilhada)
  - [x] 1.1 Adicionar categoria `template_status` em `@/lib/design-system/variants.ts`
    - Criar `TEMPLATE_STATUS_VARIANTS` com mapeamentos: `ativo → success`, `inativo → danger`, `rascunho → neutral`
    - Adicionar case `template_status` no switch de `getSemanticBadgeVariant`
    - _Requisitos: 4.2, 4.3, 8.5, 8.6_

  - [x] 1.2 Adicionar categoria `ativo_status` em `@/lib/design-system/variants.ts`
    - Criar `ATIVO_STATUS_VARIANTS` com mapeamentos: `true → success`, `false → neutral`
    - Adicionar case `ativo_status` no switch de `getSemanticBadgeVariant`
    - _Requisitos: 4.2, 4.3, 8.5, 8.6_

  - [x] 1.3 Adicionar categoria `expediente_status` em `@/lib/design-system/variants.ts`
    - Criar `EXPEDIENTE_STATUS_VARIANTS` com mapeamentos: `pendente → warning`, `baixado → neutral`
    - Adicionar case `expediente_status` no switch de `getSemanticBadgeVariant`
    - _Requisitos: 6.3, 8.5, 8.6_

- [x] 2. Revisão e polimento do módulo partes (Padrão Ouro)
  - [x] 2.1 Auditar e corrigir o módulo partes
    - Verificar que `layout.tsx` usa PageShell como wrapper
    - Verificar que todas as tabelas usam DataShell com DataTableToolbar
    - Verificar que todos os badges usam `getSemanticBadgeVariant` (sem cores hardcoded)
    - Verificar que todos os headings usam componentes Typography/Heading
    - Verificar que espaçamentos seguem Grid 4px (sem valores arbitrários)
    - Verificar ausência de cores inline (`bg-{cor}-{shade}`), `shadow-xl` e `oklch()`
    - Corrigir qualquer violação encontrada
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 2.2 Validar e organizar barrel export do módulo partes
    - Verificar que `index.ts` exporta todos os componentes, hooks, types, actions e utils
    - Organizar exportações em seções claras: Components, Hooks, Actions, Types/Domain, Utils, Errors
    - _Requisitos: 1.8, 7.3_

- [x] 3. Checkpoint — Padrão ouro validado
  - Garantir que o módulo partes está 100% aderente. Perguntar ao usuário se há dúvidas antes de prosseguir.

- [x] 4. Migração do módulo processos
  - [x] 4.1 Criar `layout.tsx` com PageShell no módulo processos
    - Criar `src/app/(authenticated)/processos/layout.tsx` com PageShell envolvendo children
    - Remover wrapper manual (`<div className="space-y-5 py-6">`) de `page.tsx`
    - _Requisitos: 2.1_

  - [x] 4.2 Migrar tipografia do módulo processos
    - Verificar que `processos-client.tsx` já usa Heading do Typography (conforme design, já está OK)
    - Verificar demais componentes do módulo para headers manuais e migrar para Typography
    - _Requisitos: 2.2_

  - [x] 4.3 Migrar badges e paginação do módulo processos
    - Garantir que todos os badges de status, tribunal e grau usam `getSemanticBadgeVariant`
    - Substituir paginação manual (botões `‹` e `›` com classes inline) por `DataPagination` do DataShell
    - Garantir uso de DataShell com DataTableToolbar para a toolbar de filtros
    - _Requisitos: 2.3, 2.4, 2.5_

  - [x] 4.4 Eliminar cores inline e violações do módulo processos
    - Remover classes `bg-{cor}-{shade}`, `text-{cor}-{shade}`, `border-{cor}-{shade}` de componentes de feature
    - Verificar e corrigir espaçamentos para Grid 4px
    - Remover `shadow-xl` e `oklch()` se existirem
    - _Requisitos: 2.6, 2.7, 2.8, 8.1, 8.3, 8.4_

  - [x] 4.5 Validar estrutura FSD e barrel export do módulo processos
    - Verificar existência de `domain.ts`, `service.ts`, `repository.ts`, `actions/`, `components/`, `index.ts`, `RULES.md`
    - Organizar barrel export com seções claras
    - _Requisitos: 7.1, 7.3_

- [x] 5. Migração do módulo contratos
  - [x] 5.1 Criar `layout.tsx` com PageShell no módulo contratos
    - Criar `src/app/(authenticated)/contratos/layout.tsx` com PageShell envolvendo children
    - Ajustar `page.tsx` para não renderizar `<ContratosClient />` sem shell
    - Manter PageShell existente nas sub-rotas (tipos, tipos-cobranca, kanban, pipelines)
    - _Requisitos: 3.1, 3.8_

  - [x] 5.2 Migrar tipografia do módulo contratos
    - Substituir headers manuais em `contratos-client.tsx` por Heading do Typography
    - Verificar demais componentes para headers inline
    - _Requisitos: 3.2_

  - [x] 5.3 Migrar badges do módulo contratos e eliminar funções locais
    - Substituir uso de `getStatusBadgeStyle`, `getTipoContratoBadgeStyle`, `getStatusVariant`, `getTipoContratoVariant` por `getSemanticBadgeVariant` com categorias `status_contrato`, `tipo_contrato`, `tipo_cobranca`
    - Remover as 4 funções locais de `utils/formatters.ts`
    - Migrar `getStatusBadgeVariant` local em `contrato-financeiro-card.tsx` para usar `payment_status`
    - Garantir uso de DataShell com DataTableToolbar
    - _Requisitos: 3.3, 3.4, 3.5, 8.2, 8.5_

  - [x] 5.4 Eliminar cores inline e violações do módulo contratos
    - Remover classes de cor hardcoded de componentes de feature
    - Verificar e corrigir espaçamentos para Grid 4px
    - Remover `shadow-xl` e `oklch()` se existirem
    - _Requisitos: 3.6, 3.7, 8.1, 8.3, 8.4_

  - [x] 5.5 Validar estrutura FSD e barrel export do módulo contratos
    - Verificar existência de todos os arquivos FSD obrigatórios
    - Organizar barrel export com seções claras
    - _Requisitos: 7.1, 7.3_

- [x] 6. Checkpoint — Processos e contratos migrados
  - Garantir que todos os testes passam. Perguntar ao usuário se há dúvidas.

- [x] 7. Migração do módulo assinatura-digital
  - [x] 7.1 Verificar cobertura de PageShell no módulo assinatura-digital
    - Verificar que sub-rotas (templates, formulários, documentos/lista) mantêm PageShell
    - Verificar se há páginas sem PageShell e corrigir
    - _Requisitos: 4.1_

  - [x] 7.2 Migrar tipografia do módulo assinatura-digital
    - Verificar e migrar headings para componentes Typography em todas as sub-páginas
    - _Requisitos: 4.4_

  - [x] 7.3 Migrar badges e eliminar funções locais do módulo assinatura-digital
    - Substituir `getStatusBadgeVariant`, `getAtivoBadgeVariant`, `getBooleanBadgeVariant` em `feature/utils` por `getSemanticBadgeVariant` com categorias `template_status` e `ativo_status`
    - Remover as 3 funções locais de variante de badge
    - _Requisitos: 4.2, 4.3, 8.2, 8.5_

  - [x] 7.4 Eliminar cores inline e violações do módulo assinatura-digital
    - Remover classes de cor hardcoded de componentes de feature
    - Verificar e corrigir espaçamentos para Grid 4px
    - _Requisitos: 4.5, 4.6, 8.1, 8.3, 8.4_

  - [x] 7.5 Padronizar estrutura FSD do módulo assinatura-digital
    - Migrar `feature/actions.ts` (arquivo único) para `feature/actions/` com `index.ts`
    - Reorganizar barrel export em `feature/index.ts` com seções claras (Components, Hooks, Actions, Types/Domain, Utils, Errors)
    - _Requisitos: 4.7, 7.1, 7.2, 7.3_

- [x] 8. Migração do módulo audiências
  - [x] 8.1 Verificar PageShell e tipografia do módulo audiências
    - Confirmar que `layout.tsx` já usa PageShell (conforme design, já está OK)
    - Substituir headers manuais em `audiencias-client.tsx` por Heading do Typography
    - _Requisitos: 5.1, 5.2_

  - [x] 8.2 Validar badges e DataShell do módulo audiências
    - Confirmar uso correto de `getSemanticBadgeVariant` em `audiencia-modalidade-badge.tsx`, `audiencias-calendar-month-view.tsx` e `audiencias-calendar-compact.tsx`
    - Confirmar uso correto de DataShell nos wrappers de tabela, lista, mês e ano
    - _Requisitos: 5.3, 5.4_

  - [x] 8.3 Eliminar cores inline e violações do módulo audiências
    - Remover classes de cor hardcoded de componentes de feature
    - Verificar e corrigir espaçamentos para Grid 4px
    - _Requisitos: 5.5, 5.6, 8.1, 8.3, 8.4_

  - [x] 8.4 Padronizar estrutura FSD do módulo audiências
    - Migrar `actions.ts` (arquivo único na raiz) para pasta `actions/` com `index.ts` e arquivos separados por domínio
    - Consolidar `services/` (com `ai-agent.service.ts`, `responsavel.service.ts`, `virtual.service.ts`) em `service.ts` na raiz ou manter `services/` com barrel export
    - _Requisitos: 5.7, 5.8, 7.1, 7.2_

- [x] 9. Migração do módulo expedientes
  - [x] 9.1 Criar `layout.tsx` com PageShell no módulo expedientes
    - Criar `src/app/(authenticated)/expedientes/layout.tsx` com PageShell envolvendo children
    - Ajustar `page.tsx` para não renderizar `<ExpedientesContent>` em `<Suspense>` sem PageShell
    - _Requisitos: 6.1_

  - [x] 9.2 Migrar tipografia do módulo expedientes
    - Substituir headers manuais em `expedientes-content.tsx` por Heading do Typography
    - _Requisitos: 6.2_

  - [x] 9.3 Validar badges e eliminar funções locais do módulo expedientes
    - Confirmar uso correto de `getSemanticBadgeVariant` em `columns.tsx` para tipos de expediente
    - Migrar `getStatusBadgeStyle` local em `expediente-detalhes-dialog.tsx` para usar `getSemanticBadgeVariant` com categoria `expediente_status`
    - Remover a função local
    - Confirmar uso correto de DataShell nos wrappers de tabela e lista
    - _Requisitos: 6.3, 6.4, 8.2, 8.5_

  - [x] 9.4 Eliminar cores inline e violações do módulo expedientes
    - Remover classes de cor hardcoded de componentes de feature
    - Verificar e corrigir espaçamentos para Grid 4px
    - _Requisitos: 6.5, 6.6, 8.1, 8.3, 8.4_

  - [x] 9.5 Padronizar estrutura FSD do módulo expedientes
    - Migrar `actions.ts` + `actions-bulk.ts` para pasta `actions/` com `index.ts`
    - Organizar barrel export com seções claras
    - Garantir que novas views (quadro, controle) sigam o Design System desde o início conforme `BLUEPRINT-REFATORACAO.md`
    - _Requisitos: 6.7, 6.8, 7.1, 7.2, 7.3_

- [x] 10. Checkpoint — Todos os módulos migrados
  - Garantir que todos os testes passam. Perguntar ao usuário se há dúvidas.

- [x] 11. Validação cross-módulo de importações FSD
  - [x] 11.1 Verificar regras de importação cross-módulo
    - Garantir que nenhum módulo externo importa diretamente de subpastas de outro módulo
    - Toda importação cross-módulo deve passar pelo barrel export (`index.ts`)
    - Executar `npm run check:architecture` para validar
    - _Requisitos: 7.4_

  - [x] 11.2 Verificar RULES.md em todos os módulos
    - Garantir que cada módulo possui `RULES.md` atualizado com entidades, regras de validação, regras de negócio, filtros, integrações e revalidação de cache
    - _Requisitos: 7.5_

- [x] 12. Testes de validação
  - [x] 12.1 Escrever property test — Cobertura completa de variantes de badge
    - **Property 1: Cobertura completa de variantes de badge para todos os valores de domínio**
    - Para qualquer categoria registrada e qualquer valor válido do domínio, `getSemanticBadgeVariant(categoria, valor)` retorna variante diferente de `'neutral'`
    - Usar fast-check com mínimo 100 iterações
    - Gerar pares (categoria, valor) a partir dos enums de domínio registrados
    - **Valida: Requisitos 2.5, 3.4, 4.2, 8.5**

  - [x] 12.2 Escrever property test — Idempotência da normalização de badge variant
    - **Property 2: Idempotência da normalização de badge variant**
    - Para qualquer categoria e valor de entrada (incluindo variações de case/espaçamento), `getSemanticBadgeVariant(cat, val) === getSemanticBadgeVariant(cat, val)`
    - Usar fast-check com mínimo 100 iterações
    - **Valida: Requisitos 8.5**

  - [x] 12.3 Escrever smoke tests de análise estática
    - Verificar ausência de `bg-{cor}-{shade}` em componentes de feature (grep/regex)
    - Verificar ausência de funções `getXXXColorClass()` locais
    - Verificar ausência de `shadow-xl` e `oklch()` direto
    - Verificar existência de `layout.tsx` com PageShell em cada módulo
    - Verificar existência de `domain.ts`, `service.ts`, `repository.ts`, `actions/`, `index.ts`, `RULES.md` em cada módulo
    - Verificar que barrel exports estão organizados por seção
    - **Valida: Requisitos 8.1, 8.2, 8.3, 8.4, 7.1**

- [x] 13. Checkpoint final — Validação completa
  - Executar `npm run check:architecture`, `npm run validate:exports`, `npm test`, `npm run lint`
  - Garantir que todos os testes passam. Perguntar ao usuário se há dúvidas.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude da função `getSemanticBadgeVariant`
- Smoke tests validam regras estruturais do Design System via análise estática
