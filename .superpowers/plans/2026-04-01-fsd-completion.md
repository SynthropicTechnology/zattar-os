# FSD Completion — Refatorar Todos os Feature Modules

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar todos os 24 feature modules incompletos para conformidade FSD (domain.ts, service.ts, repository.ts, index.ts, actions/, components/)

**Architecture:** Estrutura adaptativa — módulos com persistência recebem stack completo (domain/service/repository), módulos UI-only recebem domain.ts + RULES.md. Normalização total de variações (repositories/ dir -> repository.ts facade). Template mínimo baseado em `notificacoes`.

**Tech Stack:** Next.js 16, TypeScript 5, Supabase, Zod, Result pattern (`@/types`)

**Spec:** `docs/superpowers/specs/2026-04-01-fsd-completion-design.md`

---

## Task 1: Wave 1 — Reclassificar Modulos Ja Completos (README)

**Files:**
- Modify: `README.md` (seção de classificação estrutural)
- Modify: `docs/architecture/STATUS.md` (se existir classificação lá)

- [ ] **Step 1: Atualizar README.md**

Mover estes módulos de "Parciais" e "Iniciais" para "Completos":
- `assistentes-tipos` (parcial → completo)
- `audiencias` (parcial → completo)
- `chatwoot` (parcial → completo)
- `expedientes` (parcial → completo)
- `entrevistas-trabalhistas` (inicial → completo)

A seção deve ficar:
```markdown
Classificacao estrutural (criterio: `domain.ts`, `service.ts`, `repository.ts`, `index.ts`, `actions/`, `components/`):

- **Completos (23)**: `acervo`, `advogados`, `ai`, `assistentes-tipos`, `audiencias`, `captura`, `chatwoot`, `config-atribuicao`, `contratos`, `dify`, `enderecos`, `entrevistas-trabalhistas`, `expedientes`, `integracoes`, `notificacoes`, `obrigacoes`, `pecas-juridicas`, `pericias`, `processos`, `rh`, `system-prompts`, `tipos-expedientes`, `usuarios`
- **Parciais (8)**: `calendar`, `cargos`, `chat`, `documentos`, `financeiro`, `partes`, `perfil`, `tags`
- **Iniciais (11)**: `admin`, `agenda-eventos`, `audit`, `busca`, `calculadoras`, `portal`, `profiles`, `repasses`, `tasks`, `twofauth`, `website`
```

- [ ] **Step 2: Atualizar docs/architecture/STATUS.md**

Ler o arquivo e atualizar a classificação para refletir os mesmos dados.

- [ ] **Step 3: Commit**

```bash
git add README.md docs/architecture/STATUS.md
git commit -m "docs: reclassify 5 feature modules as complete (FSD compliance verified)"
```

---

## Task 2: Wave 2A — Completar `cargos` (criar components/)

**Files:**
- Create: `src/features/cargos/components/index.ts`
- Modify: `src/features/cargos/index.ts` (adicionar export de components)

**Context:** O módulo `cargos` tem domain.ts, service.ts, repository.ts, actions/, hooks/ completos. Falta apenas o diretório components/. Verificar se existem componentes de cargos em outros lugares (ex: `src/app/app/`) que devem ser movidos para cá. Se não existirem componentes prontos, criar um placeholder `index.ts` vazio com comentário indicando que components serão adicionados conforme necessidade.

- [ ] **Step 1: Buscar componentes existentes de cargos**

```bash
grep -r "cargos" src/app/ --include="*.tsx" -l
grep -r "Cargo" src/components/ --include="*.tsx" -l
```

Verificar se existem componentes de cargos que podem ser movidos para `src/features/cargos/components/`.

- [ ] **Step 2: Criar components/index.ts**

Se encontrou componentes para mover, movê-los para `src/features/cargos/components/` e criar o barrel export. Se não, criar o arquivo mínimo:

```typescript
/**
 * CARGOS - Components
 *
 * Componentes de UI para o módulo de cargos.
 * Componentes serão adicionados conforme necessidade de UI dedicada.
 */

// Exportar componentes aqui conforme forem criados
export {};
```

- [ ] **Step 3: Atualizar index.ts**

Adicionar export de components ao barrel:
```typescript
// Components
// export { ... } from "./components";
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

- [ ] **Step 5: Commit**

```bash
git add src/features/cargos/
git commit -m "feat(cargos): add components directory for FSD compliance"
```

---

## Task 3: Wave 2B — Completar `agenda-eventos` (criar components/)

**Files:**
- Create: `src/features/agenda-eventos/components/index.ts`
- Modify: `src/features/agenda-eventos/index.ts`

**Context:** Mesmo padrão do Task 2 — módulo quase completo, falta components/. Verificar se existem componentes de agenda-eventos em `src/app/app/` que devem ser movidos.

- [ ] **Step 1: Buscar componentes existentes**

```bash
grep -r "agenda.eventos\|AgendaEvento" src/app/ --include="*.tsx" -l
grep -r "agenda.eventos\|AgendaEvento" src/components/ --include="*.tsx" -l
```

- [ ] **Step 2: Criar ou mover components/**

Seguir mesmo padrão do Task 2.

- [ ] **Step 3: Atualizar index.ts**

- [ ] **Step 4: Type-check**

- [ ] **Step 5: Commit**

```bash
git add src/features/agenda-eventos/
git commit -m "feat(agenda-eventos): add components directory for FSD compliance"
```

---

## Task 4: Wave 2C — Completar `tags` (criar service.ts + components/)

**Files:**
- Create: `src/features/tags/service.ts`
- Create: `src/features/tags/components/index.ts`
- Modify: `src/features/tags/actions.ts` (remover lógica de negócio, delegar para service)
- Modify: `src/features/tags/index.ts` (adicionar exports)

**Context:** `tags/actions.ts` tem 516 linhas com lógica de negócio inline (validação de duplicatas, batch operations, etc.). Extrair para `service.ts` seguindo o padrão `notificacoes/service.ts`.

- [ ] **Step 1: Ler actions.ts e repository.ts completos**

```bash
cat src/features/tags/actions.ts
cat src/features/tags/repository.ts
cat src/features/tags/domain.ts
```

Identificar toda lógica de negócio que deve ser extraída para service.ts.

- [ ] **Step 2: Criar service.ts**

Extrair para `src/features/tags/service.ts` a lógica de negócio das actions:
- Validação de regras de negócio (duplicatas, limites)
- Orquestração de múltiplas operações de repositório
- Formatação de resultados

Template:
```typescript
"use server";

/**
 * TAGS SERVICE - Camada de Regras de Negocio (Casos de Uso)
 *
 * CONVENCOES:
 * - Funcoes nomeadas como acoes: listar, buscar, criar, atualizar, deletar
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositorio)
 * - NUNCA importar React/Next.js aqui
 */

import { Result, ok, err, appError } from "@/types";
import type { ... } from "./domain";
import { ... } from "./repository";

// Extrair funções de lógica de negócio das actions aqui
```

- [ ] **Step 3: Refatorar actions.ts para delegar ao service**

Cada action deve:
1. Autenticar (authenticatedAction)
2. Validar input (Zod)
3. Chamar service.ts
4. Retornar resultado

- [ ] **Step 4: Criar components/index.ts**

Buscar componentes de tags existentes no codebase e mover, ou criar placeholder.

- [ ] **Step 5: Atualizar index.ts**

Adicionar exports do service e components.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

- [ ] **Step 7: Commit**

```bash
git add src/features/tags/
git commit -m "refactor(tags): extract business logic to service.ts, add components dir"
```

---

## Task 5: Wave 2D — Completar `calendar` (criar repository.ts + components/)

**Files:**
- Create: `src/features/calendar/repository.ts`
- Create: `src/features/calendar/components/index.ts`
- Modify: `src/features/calendar/service.ts` (extrair queries para repository)
- Modify: `src/features/calendar/index.ts`

**Context:** `calendar/service.ts` tem 412 linhas com data fetching inline de 5 fontes (audiencias, expedientes, obrigacoes, pericias, agenda-eventos). Extrair as queries para `repository.ts`, manter a lógica de transformação/agregação no service.

- [ ] **Step 1: Ler service.ts completo**

```bash
cat src/features/calendar/service.ts
cat src/features/calendar/domain.ts
cat src/features/calendar/index.ts
```

Mapear todas as chamadas ao Supabase/serviços externos que devem ir para repository.ts.

- [ ] **Step 2: Criar repository.ts**

Extrair todas as funções de data fetching do service.ts:

```typescript
"use server";

/**
 * CALENDAR REPOSITORY - Camada de Persistencia
 *
 * Agrega dados de multiplas fontes (audiencias, expedientes, obrigacoes,
 * pericias, agenda-eventos) para alimentar o calendario unificado.
 *
 * CONVENCOES:
 * - Funcoes assincronas que retornam Result<T>
 * - NUNCA fazer validacao de negocio aqui (apenas persistencia)
 * - NUNCA importar React/Next.js aqui
 */

import { createClient } from "@/lib/supabase/server";
import type { ... } from "./domain";

// Funções de fetch por fonte extraídas do service.ts
export async function fetchAudiencias(dateRange: DateRange): Promise<Result<RawAudiencia[]>> { ... }
export async function fetchExpedientes(dateRange: DateRange): Promise<Result<RawExpediente[]>> { ... }
export async function fetchObrigacoes(dateRange: DateRange): Promise<Result<RawObrigacao[]>> { ... }
export async function fetchPericias(dateRange: DateRange): Promise<Result<RawPericia[]>> { ... }
export async function fetchAgendaEventos(dateRange: DateRange): Promise<Result<RawAgendaEvento[]>> { ... }
```

- [ ] **Step 3: Refatorar service.ts**

Manter no service.ts apenas:
- Orquestração (chamar repository para cada fonte em paralelo)
- Transformação (converter cada fonte para UnifiedCalendarEvent)
- Agregação (merge, sort, paginate)

- [ ] **Step 4: Criar components/index.ts**

Buscar componentes de calendar existentes em `src/app/` e mover ou criar placeholder.

- [ ] **Step 5: Atualizar index.ts**

- [ ] **Step 6: Type-check**

- [ ] **Step 7: Commit**

```bash
git add src/features/calendar/
git commit -m "refactor(calendar): extract data fetching to repository.ts, add components dir"
```

---

## Task 6: Wave 3A — Normalizar `chat` (repositories/ -> repository.ts)

**Files:**
- Create: `src/features/chat/repository.ts` (facade)
- Modify: `src/features/chat/service.ts` (atualizar imports)
- Modify: `src/features/chat/index.ts` (atualizar exports)
- Modify: `src/app/api/webhooks/dyte/recording/route.ts` (atualizar import)
- Delete: `src/features/chat/repositories/` (após migração)

**Context:** Chat usa repositórios class-based (RoomsRepository, MessagesRepository, CallsRepository, MembersRepository) com factory functions. Cada classe recebe um supabaseClient no construtor.

**Dependência externa:** `src/app/api/webhooks/dyte/recording/route.ts` importa `createCallsRepository` de `@/features/chat/repositories`.

- [ ] **Step 1: Ler todos os arquivos em repositories/**

```bash
cat src/features/chat/repositories/index.ts
cat src/features/chat/repositories/rooms-repository.ts
cat src/features/chat/repositories/messages-repository.ts
cat src/features/chat/repositories/calls-repository.ts
cat src/features/chat/repositories/members-repository.ts
cat src/features/chat/repositories/shared/converters.ts
```

- [ ] **Step 2: Criar repository.ts consolidado**

Criar `src/features/chat/repository.ts` que consolida todos os 4 repositórios e converters em um único arquivo. Manter as classes e factory functions, apenas mover para um arquivo:

```typescript
"use server";

/**
 * CHAT REPOSITORY - Camada de Persistencia
 *
 * Repositorios para salas, mensagens, chamadas e membros do chat.
 *
 * CONVENCOES:
 * - Classes com factory functions (createXxxRepository)
 * - Retornam Result<T, Error> via neverthrow
 * - NUNCA fazer validacao de negocio aqui
 */

import { createClient } from "@/lib/supabase/server";
// ... consolidar todo o código dos 4 repositórios + converters
```

- [ ] **Step 3: Atualizar imports internos**

Atualizar `src/features/chat/service.ts`:
```typescript
// ANTES: import { createRoomsRepository, ... } from "./repositories";
// DEPOIS: import { createRoomsRepository, ... } from "./repository";
```

- [ ] **Step 4: Atualizar imports externos**

Atualizar `src/app/api/webhooks/dyte/recording/route.ts`:
```typescript
// ANTES: import { createCallsRepository } from '@/features/chat/repositories';
// DEPOIS: import { createCallsRepository } from '@/features/chat';
```

- [ ] **Step 5: Atualizar index.ts**

Re-exportar do novo repository.ts em vez de repositories/.

- [ ] **Step 6: Deletar repositories/ diretório**

```bash
rm -rf src/features/chat/repositories/
```

- [ ] **Step 7: Type-check + buscar imports quebrados**

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
grep -r "chat/repositories" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 8: Commit**

```bash
git add src/features/chat/ src/app/api/webhooks/dyte/recording/route.ts
git commit -m "refactor(chat): consolidate repositories/ into single repository.ts"
```

---

## Task 7: Wave 3B — Normalizar `documentos` (repositories/ -> repository.ts)

**Files:**
- Create: `src/features/documentos/repository.ts` (facade)
- Modify: `src/features/documentos/service.ts` (atualizar imports)
- Modify: `src/features/documentos/index.ts`
- Delete: `src/features/documentos/repositories/`

**Context:** Documentos tem 7 repositórios function-based + 2 shared utils. Service.ts importa cada um via `import * as xxxRepo from "./repositories/xxx-repository"`. Também há testes que importam diretamente.

**ATENÇÃO:** Este módulo é grande (7 repository files). O `repository.ts` consolidado será extenso. Organizar com seções claras separadas por comentários `// =====`.

- [ ] **Step 1: Ler todos os arquivos em repositories/**

Ler cada arquivo para entender todas as funções exportadas e suas dependências.

- [ ] **Step 2: Criar repository.ts consolidado**

Consolidar todos os 7 repositórios + shared/ em um único `src/features/documentos/repository.ts`. Manter organização por seções:

```typescript
"use server";

/**
 * DOCUMENTOS REPOSITORY - Camada de Persistencia
 *
 * Repositorio consolidado para documentos, pastas, templates,
 * compartilhamento, versoes, uploads e arquivos.
 */

// =============================================================================
// SHARED - Query Builders & Validators
// =============================================================================

// =============================================================================
// DOCUMENTOS
// =============================================================================

// =============================================================================
// PASTAS
// =============================================================================

// ... etc para cada seção
```

- [ ] **Step 3: Atualizar service.ts**

Trocar os namespace imports:
```typescript
// ANTES: import * as documentosRepo from "./repositories/documentos-repository";
// DEPOIS: import { criarDocumento, buscarDocumentoPorId, ... } from "./repository";
```

Ou manter namespace pattern:
```typescript
import * as repository from "./repository";
// Uso: repository.criarDocumento(...)
```

- [ ] **Step 4: Atualizar testes**

Atualizar imports nos testes em `__tests__/` para apontar para `./repository` em vez de `./repositories/xxx`.

- [ ] **Step 5: Atualizar index.ts e deletar repositories/**

- [ ] **Step 6: Type-check + verificar imports**

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
grep -r "documentos/repositories" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 7: Commit**

```bash
git add src/features/documentos/
git commit -m "refactor(documentos): consolidate repositories/ into single repository.ts"
```

---

## Task 8: Wave 3C — Normalizar `partes` (repositories/ -> repository.ts)

**Files:**
- Create: `src/features/partes/repository.ts` (facade)
- Modify: `src/features/partes/service.ts`
- Modify: `src/features/partes/index.ts`
- Modify: `src/features/obrigacoes/service.ts` (import externo)
- Modify: `src/features/processos/service.ts` (dynamic import)
- Modify: `src/features/captura/services/partes/services/linking.service.ts` (import externo)
- Modify: `src/lib/mcp/registries/chatwoot-tools.ts` (import direto de arquivos)
- Delete: `src/features/partes/repositories/`
- Delete: `src/features/partes/repository-compat.ts`

**Context:** Partes tem 7 repositórios + converters + repository-compat.ts. **CRITICO**: Há 4 imports EXTERNOS que apontam diretamente para `@/features/partes/repositories` ou arquivos internos. Todos devem ser migrados para importar de `@/features/partes` (barrel).

- [ ] **Step 1: Mapear TODOS os imports externos**

```bash
grep -r "partes/repositories\|partes/repository" src/ --include="*.ts" --include="*.tsx" -n
```

Listar cada arquivo e linha que importa de repositories.

- [ ] **Step 2: Ler todos os arquivos em repositories/**

Ler cada repositório para entender exports.

- [ ] **Step 3: Criar repository.ts consolidado**

Consolidar tudo em `src/features/partes/repository.ts`. Seções: Clientes, Partes Contrárias, Terceiros, Representantes, Processo-Partes, Cadastros PJE, Converters.

- [ ] **Step 4: Atualizar service.ts (interno)**

- [ ] **Step 5: Atualizar imports externos**

Cada arquivo externo deve importar de `@/features/partes` (barrel) ou `@/features/partes/repository`:

```typescript
// obrigacoes/service.ts
// ANTES: import { findClienteByCPF, findClienteByCNPJ } from "@/features/partes/repositories";
// DEPOIS: import { findClienteByCPF, findClienteByCNPJ } from "@/features/partes";

// processos/service.ts (dynamic import)
// ANTES: const { findClienteByCPF } = await import("@/features/partes/repositories");
// DEPOIS: const { findClienteByCPF } = await import("@/features/partes");

// captura linking.service.ts
// ANTES: import { vincularParteProcesso } from "@/features/partes/repositories";
// DEPOIS: import { vincularParteProcesso } from "@/features/partes";

// chatwoot-tools.ts
// ANTES: import { findClienteById } from '@/features/partes/repositories/clientes-repository';
// DEPOIS: import { findClienteById } from '@/features/partes';
```

- [ ] **Step 6: Atualizar index.ts**

Exportar tudo de `./repository` no barrel.

- [ ] **Step 7: Deletar repositories/ e repository-compat.ts**

```bash
rm -rf src/features/partes/repositories/
rm src/features/partes/repository-compat.ts
```

- [ ] **Step 8: Atualizar testes**

```bash
grep -r "partes/repositories" src/features/partes/__tests__/ -n
```

Atualizar imports nos testes.

- [ ] **Step 9: Type-check + verificar imports residuais**

```bash
npx tsc --noEmit --pretty 2>&1 | head -80
grep -r "partes/repositories\|partes/repository-compat" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 10: Commit**

```bash
git add src/features/partes/ src/features/obrigacoes/ src/features/processos/ src/features/captura/ src/lib/mcp/
git commit -m "refactor(partes): consolidate repositories/ into single repository.ts, update external imports"
```

---

## Task 9: Wave 3D — Normalizar `financeiro` (domain/ -> domain.ts, criar service.ts + repository.ts)

**Files:**
- Create: `src/features/financeiro/domain.ts` (facade consolidando domain/)
- Create: `src/features/financeiro/service.ts` (facade consolidando services/)
- Create: `src/features/financeiro/repository.ts` (facade consolidando repository/)
- Modify: `src/features/financeiro/index.ts`
- Modify: Todos os arquivos que importam de `domain/`, `services/`, `repository/`
- Delete: `src/features/financeiro/domain/` (após migração)
- Delete: `src/features/financeiro/services/` (após migração)
- Delete: `src/features/financeiro/repository/` (após migração)

**Context:** Financeiro é o módulo mais complexo para normalizar:
- `domain/` tem 7 arquivos com tipos + lógica de validação (38+ tipos, funções de cálculo)
- `services/` tem 12 arquivos com lógica de negócio
- `repository/` tem 3 arquivos (dre, conciliacao, fluxo-caixa)
- `actions/` tem 14 arquivos

**ESTRATEGIA:** Dado o volume, domain.ts, service.ts e repository.ts serão facades que re-exportam de sub-arquivos internos renomeados. Mover os diretórios para `_internal/` ou simplesmente consolidar com seções.

- [ ] **Step 1: Inventariar todos os arquivos e exports**

```bash
find src/features/financeiro/ -name "*.ts" -o -name "*.tsx" | sort
```

Ler index.ts de domain/, services/, repository/ para mapear todos os exports.

- [ ] **Step 2: Criar domain.ts (facade)**

Criar `src/features/financeiro/domain.ts` que consolida todos os 7 arquivos de domain/. O arquivo pode ser grande, mas é o padrão FSD. Organizar por seções:

```typescript
/**
 * FINANCEIRO DOMAIN - Entidades e Schemas de Validacao
 *
 * Consolida todos os tipos e regras de dominio financeiro:
 * lancamentos, conciliacao, plano de contas, fluxo de caixa,
 * orcamentos, DRE e relatorios.
 */

import { z } from "zod";

// =============================================================================
// LANCAMENTOS
// =============================================================================
// ... (conteúdo de domain/lancamentos.ts)

// =============================================================================
// CONCILIACAO
// =============================================================================
// ... (conteúdo de domain/conciliacao.ts)

// ... etc
```

- [ ] **Step 3: Criar service.ts (facade)**

Consolidar services/ em `src/features/financeiro/service.ts`.

- [ ] **Step 4: Criar repository.ts (facade)**

Consolidar repository/ em `src/features/financeiro/repository.ts`.

- [ ] **Step 5: Atualizar TODOS os imports internos**

```bash
grep -r "financeiro/domain/" src/ --include="*.ts" --include="*.tsx" -n
grep -r "financeiro/services/" src/ --include="*.ts" --include="*.tsx" -n
grep -r "financeiro/repository/" src/ --include="*.ts" --include="*.tsx" -n
```

Atualizar cada import para apontar para os novos arquivos.

- [ ] **Step 6: Atualizar imports externos**

Verificar e atualizar imports de outros módulos:
```bash
grep -r "@/features/financeiro/domain" src/ --include="*.ts" --include="*.tsx" --exclude-dir="financeiro" -n
```

- [ ] **Step 7: Atualizar index.ts**

- [ ] **Step 8: Deletar diretórios antigos**

```bash
rm -rf src/features/financeiro/domain/
rm -rf src/features/financeiro/services/
rm -rf src/features/financeiro/repository/
```

- [ ] **Step 9: Type-check completo**

```bash
npx tsc --noEmit --pretty 2>&1 | head -100
grep -r "financeiro/domain/\|financeiro/services/\|financeiro/repository/" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 10: Commit**

```bash
git add src/features/financeiro/ src/app/ src/lib/
git commit -m "refactor(financeiro): normalize domain/, services/, repository/ into single FSD files"
```

---

## Task 10: Wave 3E — Normalizar `admin` (services/ + repositories/ -> FSD)

**Files:**
- Create: `src/features/admin/domain.ts`
- Create: `src/features/admin/service.ts` (de services/upgrade-advisor.ts)
- Create: `src/features/admin/repository.ts` (de repositories/metricas-db-repository.ts)
- Modify: `src/features/admin/index.ts`
- Delete: `src/features/admin/services/`
- Delete: `src/features/admin/repositories/`

**Context:** Admin é simples — só 2 arquivos (upgrade-advisor.ts e metricas-db-repository.ts). Módulo parece isolado (sem imports externos encontrados).

- [ ] **Step 1: Ler os 2 arquivos existentes**

```bash
cat src/features/admin/services/upgrade-advisor.ts
cat src/features/admin/repositories/metricas-db-repository.ts
cat src/features/admin/index.ts
```

- [ ] **Step 2: Criar domain.ts**

Extrair tipos/interfaces dos 2 arquivos para domain.ts:

```typescript
/**
 * ADMIN DOMAIN - Entidades e Tipos
 *
 * Tipos para metricas de banco de dados e recomendacoes de upgrade.
 */

// Tipos de CacheHitRate, QueryLenta, TabelaSequentialScan, etc.
// Tipos de UpgradeRecommendation
```

- [ ] **Step 3: Criar repository.ts**

Mover conteúdo de `repositories/metricas-db-repository.ts` para `repository.ts`. Importar tipos de `./domain`.

- [ ] **Step 4: Criar service.ts**

Mover conteúdo de `services/upgrade-advisor.ts` para `service.ts`. Importar tipos de `./domain`.

- [ ] **Step 5: Atualizar index.ts e deletar diretórios antigos**

```bash
rm -rf src/features/admin/services/
rm -rf src/features/admin/repositories/
```

- [ ] **Step 6: Verificar imports e type-check**

```bash
grep -r "admin/services\|admin/repositories" src/ --include="*.ts" --include="*.tsx" -n
npx tsc --noEmit --pretty 2>&1 | head -50
```

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/
git commit -m "refactor(admin): normalize to FSD structure (domain.ts, service.ts, repository.ts)"
```

---

## Task 11: Wave 4 — Completar `profiles` e `perfil`

**Files:**
- Create: `src/features/profiles/domain.ts`
- Create: `src/features/profiles/service.ts`
- Create: `src/features/profiles/repository.ts`
- Modify: `src/features/profiles/index.ts`
- Create: `src/features/perfil/service.ts` (re-export de usuarios)
- Create: `src/features/perfil/repository.ts` (re-export de usuarios)
- Modify: `src/features/perfil/index.ts`

**Context:**
- `profiles` é um sistema genérico de visualização de perfil para qualquer entidade (clientes, partes_contrarias, etc.). Tem configs/, components/, hooks/, types/, actions/, utils/ mas falta domain/service/repository.
- `perfil` é o self-service do usuário logado. Já re-exporta `Usuario` de `@/features/usuarios`. Falta service.ts e repository.ts.
- `usuarios/` já existe completo com domain/service/repository.

- [ ] **Step 1: Criar profiles/domain.ts**

Extrair tipos de `configs/types.ts` e `types/index.ts`:

```typescript
/**
 * PROFILES DOMAIN - Entidades e Tipos
 *
 * Sistema generico de visualizacao de perfil para qualquer entidade.
 * Suporta: cliente, parte_contraria, terceiro, representante, usuario.
 */

import { z } from "zod";

// Re-exportar tipos existentes de configs/types.ts
export type { ProfileConfig, FieldConfig, SectionConfig, HeaderConfig, TabConfig } from "./configs/types";
export type { ProcessoVinculo } from "./types/processo-vinculo";

// Schema para buscar perfil
export const buscarPerfilSchema = z.object({
  entityType: z.enum(["cliente", "parte_contraria", "terceiro", "representante", "usuario"]),
  entityId: z.number().int().positive(),
});

export type BuscarPerfilInput = z.infer<typeof buscarPerfilSchema>;
```

- [ ] **Step 2: Criar profiles/service.ts**

```typescript
"use server";

/**
 * PROFILES SERVICE - Camada de Regras de Negocio
 *
 * Orquestra busca de dados de perfil para qualquer tipo de entidade,
 * aplicando o adapter correto para normalizar os dados.
 */

import type { BuscarPerfilInput } from "./domain";
import { buscarEntidadePorTipo } from "./repository";
// ... lógica de orquestração
```

- [ ] **Step 3: Criar profiles/repository.ts**

```typescript
"use server";

/**
 * PROFILES REPOSITORY - Camada de Persistencia
 *
 * Busca dados de entidades por tipo para o sistema de perfil generico.
 * Delega para os repositorios especificos de cada feature.
 */

import { createClient } from "@/lib/supabase/server";
// ... funções de fetch por entity type
```

- [ ] **Step 4: Atualizar profiles/index.ts**

Adicionar exports de domain, service, repository.

- [ ] **Step 5: Criar perfil/service.ts e perfil/repository.ts**

Re-exports do módulo `usuarios`:

```typescript
// src/features/perfil/service.ts
"use server";
/**
 * PERFIL SERVICE - Re-exporta servicos de usuarios para self-service
 */
export { buscarUsuario, atualizarUsuario } from "@/features/usuarios/service";
```

```typescript
// src/features/perfil/repository.ts
"use server";
/**
 * PERFIL REPOSITORY - Re-exporta repositorio de usuarios para self-service
 */
export { findById, update } from "@/features/usuarios/repository";
```

- [ ] **Step 6: Atualizar perfil/index.ts**

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

- [ ] **Step 8: Commit**

```bash
git add src/features/profiles/ src/features/perfil/
git commit -m "feat(profiles, perfil): add domain/service/repository for FSD compliance"
```

---

## Task 12: Wave 5 — Completar `busca` (criar domain.ts + service.ts + repository.ts)

**Files:**
- Create: `src/features/busca/domain.ts`
- Create: `src/features/busca/service.ts`
- Create: `src/features/busca/repository.ts`
- Modify: `src/features/busca/actions/busca-actions.ts` (delegar para service)
- Modify: `src/features/busca/index.ts`

**Context:** `busca/actions/busca-actions.ts` tem 198 linhas com 4 handlers (busca semântica, híbrida, RAG context, similares). Schemas Zod embutidos nas actions devem ir para domain.ts. Lógica de embedding/retrieval deve ir para repository.ts. Orquestração vai para service.ts.

- [ ] **Step 1: Ler actions e RULES.md**

```bash
cat src/features/busca/actions/busca-actions.ts
cat src/features/busca/RULES.md
cat src/features/busca/index.ts
```

- [ ] **Step 2: Criar domain.ts**

Extrair schemas Zod e tipos das actions:

```typescript
/**
 * BUSCA DOMAIN - Entidades e Schemas de Validacao
 *
 * Schemas para busca semantica, hibrida, RAG context e similares.
 * Regras de negocio em RULES.md.
 */

import { z } from "zod";

export const buscaSemanticaSchema = z.object({
  query: z.string().min(3),
  tipo: z.string().optional(),
  limite: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
});

// ... demais schemas extraídos das actions
```

- [ ] **Step 3: Criar repository.ts**

Wrapper em torno de `@/lib/ai/retrieval`:

```typescript
"use server";

/**
 * BUSCA REPOSITORY - Camada de Persistencia
 *
 * Interface com o sistema de retrieval (embeddings + pgvector).
 */

import { createClient } from "@/lib/supabase/server";
// ... funções de busca por embedding, cache Redis
```

- [ ] **Step 4: Criar service.ts**

Orquestração dos diferentes tipos de busca:

```typescript
"use server";

/**
 * BUSCA SERVICE - Camada de Regras de Negocio
 *
 * Orquestra buscas semanticas, hibridas, RAG context e similares.
 */

import { Result, ok, err } from "@/types";
import type { ... } from "./domain";
import { ... } from "./repository";
```

- [ ] **Step 5: Refatorar actions para delegar ao service**

- [ ] **Step 6: Atualizar index.ts**

- [ ] **Step 7: Type-check**

- [ ] **Step 8: Commit**

```bash
git add src/features/busca/
git commit -m "refactor(busca): extract domain/service/repository from actions for FSD compliance"
```

---

## Task 13: Wave 6 — Modulos Adaptativos (UI-only)

**Files (criar em cada módulo):**

| Módulo | Criar |
|--------|-------|
| `calculadoras` | `domain.ts`, `RULES.md` |
| `portal` | `domain.ts`, `RULES.md` |
| `website` | `domain.ts`, `RULES.md` |
| `twofauth` | `domain.ts`, `RULES.md` |
| `repasses` | `domain.ts`, `RULES.md` |

- [ ] **Step 1: Criar domain.ts e RULES.md para `calculadoras`**

```typescript
// src/features/calculadoras/domain.ts
/**
 * CALCULADORAS DOMAIN - Tipos e Constantes
 *
 * Modulo adaptativo (UI-only): sem service.ts nem repository.ts.
 * Logica puramente de calculo client-side.
 */

// Tipos para cálculos de horas extras, etc.
export type TipoCalculo = "horas_extras" | "rescisao" | "ferias";
```

```markdown
<!-- src/features/calculadoras/RULES.md -->
# Calculadoras - Regras de Negocio

## Classificacao FSD: Adaptativo (UI-only)

Este modulo nao possui `service.ts` nem `repository.ts` porque:
- Nao tem persistencia propria no banco de dados
- A logica e puramente de calculo client-side
- Resultados nao sao salvos

## Regras
- Calculos trabalhistas seguem CLT vigente
- Valores monetarios com 2 casas decimais
- Datas no fuso de Brasilia (UTC-3)
```

- [ ] **Step 2: Criar domain.ts e RULES.md para `portal`**

Seguir mesmo padrão. Domain.ts com tipos de sessão do portal (CPF-based auth).

- [ ] **Step 3: Criar domain.ts e RULES.md para `website`**

Domain.ts com tipos de conteúdo do site público.

- [ ] **Step 4: Criar domain.ts e RULES.md para `twofauth`**

Domain.ts com tipos de configuração 2FA.

- [ ] **Step 5: Criar domain.ts e RULES.md para `repasses`**

Domain.ts com tipos de repasses (provavelmente re-exporta de obrigacoes).

- [ ] **Step 6: Atualizar index.ts de cada módulo**

Adicionar export de domain.ts.

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

- [ ] **Step 8: Commit**

```bash
git add src/features/calculadoras/ src/features/portal/ src/features/website/ src/features/twofauth/ src/features/repasses/
git commit -m "feat: add domain.ts and RULES.md for adaptive UI-only modules"
```

---

## Task 14: Wave 7A — Completar `audit`

**Files:**
- Create: `src/features/audit/domain.ts`
- Create: `src/features/audit/repository.ts`
- Create: `src/features/audit/index.ts`
- Create: `src/features/audit/actions/audit-actions.ts`
- Rename: `src/features/audit/services/audit-log.service.ts` -> conteúdo movido para `service.ts`
- Create: `src/features/audit/service.ts`
- Delete: `src/features/audit/services/`

**Context:** Audit tem apenas `hooks/use-audit-logs.ts` e `services/audit-log.service.ts`. Sem index.ts, sem domain.ts, sem actions.

- [ ] **Step 1: Ler arquivos existentes**

```bash
cat src/features/audit/services/audit-log.service.ts
cat src/features/audit/hooks/use-audit-logs.ts
```

- [ ] **Step 2: Criar domain.ts**

Extrair tipos de audit-log.service.ts:

```typescript
/**
 * AUDIT DOMAIN - Entidades e Schemas
 *
 * Tipos para logs de auditoria do sistema.
 */

import { z } from "zod";

// Tipos: AuditLog, AuditAction, etc.
```

- [ ] **Step 3: Criar repository.ts**

Extrair queries de audit-log.service.ts para repository.ts.

- [ ] **Step 4: Criar service.ts**

Mover lógica de negócio de audit-log.service.ts, importar de repository.

- [ ] **Step 5: Criar actions/audit-actions.ts**

Criar server actions com authenticatedAction wrapper.

- [ ] **Step 6: Criar index.ts**

Barrel export completo.

- [ ] **Step 7: Deletar services/ antigo**

```bash
rm -rf src/features/audit/services/
```

- [ ] **Step 8: Atualizar hooks se necessário**

Verificar se hooks importam de services/ e atualizar.

- [ ] **Step 9: Type-check**

- [ ] **Step 10: Commit**

```bash
git add src/features/audit/
git commit -m "refactor(audit): restructure to FSD pattern (domain/service/repository/actions)"
```

---

## Task 15: Wave 7B — Completar `tasks`

**Files:**
- Create: `src/features/tasks/domain.ts`
- Create: `src/features/tasks/RULES.md`
- Modify: `src/features/tasks/index.ts`

**Context:** Tasks é um stub vazio (`export {}`). Verificar se existe alguma tabela "tasks" ou "tarefas" no banco antes de criar service/repository. Se não houver dados, tratar como módulo adaptativo.

- [ ] **Step 1: Verificar se existe tabela no banco**

```bash
grep -i "tasks\|tarefas" src/types/database.types.ts | head -20
```

- [ ] **Step 2: Criar domain.ts**

Se houver tabela: criar tipos baseados no schema do banco.
Se não houver: criar como módulo adaptativo com RULES.md.

- [ ] **Step 3: Criar demais arquivos conforme necessidade**

Se adaptativo: apenas domain.ts + RULES.md.
Se com persistência: domain.ts + service.ts + repository.ts + actions/.

- [ ] **Step 4: Atualizar index.ts**

- [ ] **Step 5: Type-check**

- [ ] **Step 6: Commit**

```bash
git add src/features/tasks/
git commit -m "feat(tasks): add FSD structure"
```

---

## Task 16: Validacao Final e Atualizacao de Documentacao

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture/STATUS.md`

- [ ] **Step 1: Type-check completo**

```bash
npx tsc --noEmit --pretty
```

Deve ter ZERO erros.

- [ ] **Step 2: Validação de arquitetura FSD**

```bash
npm run check:architecture
```

- [ ] **Step 3: Lint**

```bash
npm run lint 2>&1 | tail -20
```

- [ ] **Step 4: Verificar imports residuais**

```bash
grep -r "/repositories/" src/features/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__
grep -r "/services/" src/features/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__
```

Nenhum import deve apontar para diretórios `repositories/` ou `services/` antigos.

- [ ] **Step 5: Inventário final — verificar todos os módulos**

```bash
for dir in src/features/*/; do
  module=$(basename "$dir")
  has_domain=$([[ -f "$dir/domain.ts" ]] && echo "Y" || echo "N")
  has_service=$([[ -f "$dir/service.ts" ]] && echo "Y" || echo "N")
  has_repo=$([[ -f "$dir/repository.ts" ]] && echo "Y" || echo "N")
  has_index=$([[ -f "$dir/index.ts" ]] && echo "Y" || echo "N")
  has_actions=$([[ -d "$dir/actions" || -f "$dir/actions.ts" ]] && echo "Y" || echo "N")
  has_components=$([[ -d "$dir/components" ]] && echo "Y" || echo "N")
  has_rules=$([[ -f "$dir/RULES.md" ]] && echo "Y" || echo "N")
  echo "$module: D=$has_domain S=$has_service R=$has_repo I=$has_index A=$has_actions C=$has_components RULES=$has_rules"
done
```

- [ ] **Step 6: Atualizar README.md**

Atualizar classificação final. Todos os módulos devem estar em "Completos" ou "Adaptativos" (com justificativa no RULES.md).

- [ ] **Step 7: Atualizar STATUS.md**

- [ ] **Step 8: Commit final**

```bash
git add README.md docs/architecture/STATUS.md
git commit -m "docs: update module classification — all features now FSD compliant"
```
