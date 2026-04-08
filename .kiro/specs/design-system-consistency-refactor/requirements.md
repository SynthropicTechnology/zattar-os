# Documento de Requisitos — Refatoração de Consistência Visual (Design System)

## Introdução

Este documento define os requisitos para a refatoração de consistência visual dos módulos do Synthropic/Zattar OS. O módulo **partes** já foi refatorado e serve como padrão ouro (gold standard). O objetivo é revisar e polir o módulo partes, e em seguida alinhar os módulos **contratos**, **assinatura-digital**, **processos**, **audiências** e **expedientes** ao mesmo padrão visual e arquitetural definido pelo Design System Synthropic.

## Glossário

- **Design_System**: Conjunto de protocolos visuais e arquiteturais definidos em `design-system-protocols.md`, incluindo regras de layout, badges, tipografia, espaçamento e cores
- **PageShell**: Componente wrapper obrigatório para todas as páginas, localizado em `@/components/shared/page-shell`
- **DataShell**: Componente wrapper para tabelas de dados com toolbar integrada, localizado em `@/components/shared/data-shell`
- **getSemanticBadgeVariant**: Função centralizada em `@/lib/design-system` para obter variantes semânticas de badges sem hardcodear cores
- **Typography**: Componentes de tipografia semântica (`Heading`, `Typography.H1`, etc.) em `@/components/ui/typography`
- **FSD**: Feature-Sliced Design — arquitetura de módulos colocados com barrel exports obrigatórios via `index.ts`
- **Barrel_Export**: Arquivo `index.ts` que serve como API pública do módulo, centralizando todas as exportações
- **RULES_MD**: Arquivo `RULES.md` obrigatório em cada módulo, documentando regras de negócio para agentes de IA
- **Módulo_Alvo**: Qualquer um dos módulos a ser refatorado: contratos, assinatura-digital, processos, audiências, expedientes
- **Padrão_Ouro**: O módulo partes, que serve como referência de implementação correta do Design System
- **Grid_4px**: Sistema de espaçamento baseado em múltiplos de 4px, com valores permitidos: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24

## Requisitos

### Requisito 1: Revisão e Polimento do Módulo Partes (Padrão Ouro)

**User Story:** Como desenvolvedor, quero garantir que o módulo partes esteja 100% aderente ao Design System, para que sirva como referência confiável para a refatoração dos demais módulos.

#### Critérios de Aceitação

1. THE Design_System SHALL verificar que todas as páginas do módulo partes utilizam PageShell como wrapper via `layout.tsx`
2. THE Design_System SHALL verificar que todas as tabelas do módulo partes utilizam DataShell com DataTableToolbar integrado
3. THE Design_System SHALL verificar que todos os badges do módulo partes utilizam getSemanticBadgeVariant em vez de cores hardcoded
4. THE Design_System SHALL verificar que todos os headings do módulo partes utilizam componentes Typography (Heading) em vez de tags HTML com classes inline
5. THE Design_System SHALL verificar que todos os espaçamentos do módulo partes seguem o Grid_4px sem valores arbitrários
6. THE Design_System SHALL verificar que o módulo partes não contém cores inline (`bg-{cor}-{shade}`) em componentes de feature
7. THE Design_System SHALL verificar que o módulo partes não contém `shadow-xl` nem `oklch()` direto no código
8. THE Design_System SHALL verificar que o Barrel_Export (`index.ts`) do módulo partes exporta todos os componentes, hooks, types, actions e utils de forma organizada por seção

### Requisito 2: Migração do Módulo Processos para o Design System

**User Story:** Como desenvolvedor, quero que o módulo processos siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

#### Critérios de Aceitação

1. WHEN a página de processos é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper da página (atualmente usa `<div className="space-y-5 py-6">` diretamente)
2. WHEN o componente processos-client é renderizado, THE Módulo_Alvo SHALL utilizar Heading do Typography em vez de construir headers manualmente com classes inline
3. WHEN a listagem de processos é exibida em modo tabela, THE Módulo_Alvo SHALL utilizar DataShell com DataTableToolbar integrado para a toolbar de filtros e ações
4. THE Módulo_Alvo SHALL substituir toda paginação manual (botões `‹` e `›` com classes inline) pelo componente DataPagination do DataShell
5. THE Módulo_Alvo SHALL garantir que todos os badges de status, tribunal e grau utilizem getSemanticBadgeVariant em vez de funções locais de cor
6. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
7. THE Módulo_Alvo SHALL remover qualquer cor inline (`bg-{cor}-{shade}`, `text-{cor}-{shade}`) de componentes de feature, delegando ao Design System
8. IF o módulo processos contiver `shadow-xl` ou `oklch()` direto, THEN THE Módulo_Alvo SHALL substituir por variantes permitidas (`shadow-sm`, `shadow-md`, `shadow-lg`) ou variáveis CSS

### Requisito 3: Migração do Módulo Contratos para o Design System

**User Story:** Como desenvolvedor, quero que o módulo contratos siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

#### Critérios de Aceitação

1. WHEN a página principal de contratos é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper (atualmente renderiza `<ContratosClient />` diretamente sem shell)
2. WHEN o componente contratos-client é renderizado, THE Módulo_Alvo SHALL utilizar Heading do Typography para títulos em vez de construir headers manualmente
3. WHEN a listagem de contratos é exibida, THE Módulo_Alvo SHALL utilizar DataShell com DataTableToolbar integrado para a toolbar de filtros e ações
4. THE Módulo_Alvo SHALL garantir que todos os badges de status de contrato, tipo de contrato e tipo de cobrança utilizem getSemanticBadgeVariant em vez de funções locais como `getStatusBadgeStyle` e `getTipoContratoBadgeStyle`
5. THE Módulo_Alvo SHALL remover as funções `getStatusBadgeStyle`, `getTipoContratoBadgeStyle`, `getStatusVariant` e `getTipoContratoVariant` de `utils/formatters.ts`, migrando para mapeamentos centralizados em `@/lib/design-system/variants.ts`
6. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
7. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
8. WHEN as sub-páginas tipos, tipos-cobranca, kanban e pipelines são renderizadas, THE Módulo_Alvo SHALL manter o uso correto de PageShell que já existe nessas rotas


### Requisito 4: Migração do Módulo Assinatura Digital para o Design System

**User Story:** Como desenvolvedor, quero que o módulo assinatura-digital siga o mesmo padrão visual e arquitetural do módulo partes, para manter consistência visual em todo o sistema.

#### Critérios de Aceitação

1. WHEN as páginas de templates, formulários e documentos/lista são renderizadas, THE Módulo_Alvo SHALL manter o uso correto de PageShell que já existe nessas rotas
2. THE Módulo_Alvo SHALL garantir que todos os badges de status de documento e template utilizem getSemanticBadgeVariant em vez de funções locais como `getStatusBadgeVariant` e `getAtivoBadgeVariant` definidas em `feature/utils`
3. THE Módulo_Alvo SHALL migrar as funções locais de variante de badge (`getStatusBadgeVariant`, `getAtivoBadgeVariant`, `getBooleanBadgeVariant`) para mapeamentos centralizados em `@/lib/design-system/variants.ts`
4. THE Módulo_Alvo SHALL garantir que todos os headings utilizem componentes Typography em vez de tags HTML com classes inline
5. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
6. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
7. THE Módulo_Alvo SHALL consolidar a estrutura FSD: o módulo possui uma subpasta `feature/` com domain.ts, service.ts, repository.ts, actions/, components/ — a estrutura de barrel export deve seguir o padrão do Padrão_Ouro com seções organizadas

### Requisito 5: Migração do Módulo Audiências para o Design System

**User Story:** Como desenvolvedor, quero que o módulo audiências siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

#### Critérios de Aceitação

1. WHEN a página principal de audiências é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper (atualmente renderiza `<AudienciasClient>` dentro de `<Suspense>` sem PageShell)
2. WHEN o componente audiencias-client é renderizado, THE Módulo_Alvo SHALL utilizar Heading do Typography para títulos em vez de construir headers manualmente
3. THE Módulo_Alvo SHALL manter o uso correto de getSemanticBadgeVariant que já existe nos componentes `audiencia-modalidade-badge.tsx`, `audiencias-calendar-month-view.tsx` e `audiencias-calendar-compact.tsx`
4. THE Módulo_Alvo SHALL manter o uso correto de DataShell que já existe nos wrappers de tabela, lista, mês e ano
5. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
6. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
7. THE Módulo_Alvo SHALL reorganizar a pasta `actions.ts` (arquivo único na raiz) para uma pasta `actions/` com arquivo `index.ts`, seguindo o padrão FSD do Padrão_Ouro
8. THE Módulo_Alvo SHALL reorganizar a pasta `services/` (com subserviços) para um único `service.ts` na raiz do módulo, seguindo o padrão FSD do Padrão_Ouro

### Requisito 6: Migração do Módulo Expedientes para o Design System

**User Story:** Como desenvolvedor, quero que o módulo expedientes siga o mesmo padrão visual do módulo partes, para manter consistência visual em todo o sistema.

#### Critérios de Aceitação

1. WHEN a página principal de expedientes é renderizada, THE Módulo_Alvo SHALL utilizar PageShell como wrapper (atualmente renderiza `<ExpedientesContent>` dentro de `<Suspense>` sem PageShell)
2. WHEN o componente expedientes-content é renderizado, THE Módulo_Alvo SHALL utilizar Heading do Typography para títulos em vez de construir headers manualmente
3. THE Módulo_Alvo SHALL manter o uso correto de getSemanticBadgeVariant que já existe em `columns.tsx` para tipos de expediente
4. THE Módulo_Alvo SHALL manter o uso correto de DataShell que já existe nos wrappers de tabela e lista
5. THE Módulo_Alvo SHALL garantir que todos os espaçamentos seguem o Grid_4px sem valores arbitrários
6. THE Módulo_Alvo SHALL remover qualquer cor inline de componentes de feature, delegando ao Design System
7. THE Módulo_Alvo SHALL reorganizar os arquivos `actions.ts` e `actions-bulk.ts` (arquivos na raiz) para uma pasta `actions/` com arquivo `index.ts`, seguindo o padrão FSD do Padrão_Ouro
8. THE Módulo_Alvo SHALL continuar a refatoração já iniciada conforme o `BLUEPRINT-REFATORACAO.md`, garantindo que as novas views (quadro, controle) sigam o Design System desde o início

### Requisito 7: Padronização da Estrutura FSD em Todos os Módulos

**User Story:** Como desenvolvedor, quero que todos os módulos sigam a mesma estrutura FSD do módulo partes, para facilitar a manutenção e navegação do código.

#### Critérios de Aceitação

1. THE Design_System SHALL garantir que cada Módulo_Alvo contenha obrigatoriamente: `domain.ts`, `service.ts`, `repository.ts`, `actions/` (pasta), `components/`, `index.ts` (barrel export) e `RULES.md`
2. WHEN um Módulo_Alvo possui `actions.ts` como arquivo único na raiz, THE Design_System SHALL migrar para uma pasta `actions/` com `index.ts` e arquivos separados por domínio
3. THE Design_System SHALL garantir que o Barrel_Export de cada Módulo_Alvo organize as exportações em seções claras: Components, Hooks, Actions, Types/Domain, Utils, Errors
4. THE Design_System SHALL garantir que nenhum módulo externo importe diretamente de subpastas de um Módulo_Alvo — toda importação cross-módulo deve passar pelo Barrel_Export
5. THE Design_System SHALL garantir que cada Módulo_Alvo possua um RULES_MD atualizado documentando entidades, regras de validação, regras de negócio, filtros, integrações e revalidação de cache

### Requisito 8: Eliminação de Violações do Design System em Todos os Módulos

**User Story:** Como desenvolvedor, quero que nenhum módulo contenha violações das regras do Design System, para garantir consistência visual e facilitar a manutenção.

#### Critérios de Aceitação

1. THE Design_System SHALL garantir que nenhum componente de feature em qualquer Módulo_Alvo contenha classes de cor hardcoded do Tailwind (`bg-{cor}-{shade}`, `text-{cor}-{shade}`, `border-{cor}-{shade}`)
2. THE Design_System SHALL garantir que nenhum Módulo_Alvo contenha funções locais `getXXXColorClass()` ou similares para mapeamento de cores
3. THE Design_System SHALL garantir que nenhum Módulo_Alvo contenha `shadow-xl` em componentes
4. THE Design_System SHALL garantir que nenhum Módulo_Alvo contenha `oklch()` direto em classes CSS
5. THE Design_System SHALL garantir que todos os badges em todos os Módulos_Alvo utilizem getSemanticBadgeVariant com categorias registradas em `variants.ts`
6. IF um Módulo_Alvo necessitar de uma nova categoria de badge, THEN THE Design_System SHALL registrar a nova categoria em `@/lib/design-system/variants.ts` em vez de criar mapeamentos locais
7. THE Design_System SHALL garantir que todos os valores de espaçamento em todos os Módulos_Alvo pertençam ao conjunto permitido do Grid_4px
