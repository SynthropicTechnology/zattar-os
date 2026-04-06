# Refatoração FSD — Completar Todos os Módulos

**Data**: 2026-04-01
**Escopo**: Completar 24 feature modules para conformidade FSD completa
**Abordagem**: Estrutura adaptativa + normalização total

## Decisões de Design

| Decisão | Escolha |
|---------|---------|
| Escopo | Todos os 24 módulos incompletos |
| Estrutura | Adaptativa — módulos UI-only não forçam `repository.ts`/`service.ts` vazios |
| Variações | Normalizar tudo (`repositories/` → `repository.ts`, `domain/` → `domain.ts`) |
| profiles/perfil | Backend unificado em `usuarios`, frontend separado |
| Testes | Fora do escopo desta refatoração |

## Template Mínimo (baseado em `notificacoes`)

### `domain.ts`
```typescript
/**
 * {MÓDULO} DOMAIN - Entidades e Schemas de Validação
 *
 * CONVENÇÕES:
 * - Prefixar schemas de criação com "create" (ex: createXxxSchema)
 * - Prefixar schemas de atualização com "update" (ex: updateXxxSchema)
 * - Interfaces espelham estrutura do banco em camelCase
 * - NUNCA importar React/Next.js aqui
 */
import { z } from "zod";

// Tipos, schemas Zod, constantes, labels
```

### `service.ts`
```typescript
"use server";
/**
 * {MÓDULO} SERVICE - Camada de Regras de Negócio (Casos de Uso)
 *
 * CONVENÇÕES:
 * - Funções nomeadas como ações: listar, buscar, criar, atualizar, deletar
 * - Sempre validar input antes de processar
 * - Retornar Result<T> para permitir tratamento de erros
 * - NUNCA acessar banco diretamente (usar repositório)
 * - NUNCA importar React/Next.js aqui
 */
import { Result, ok, err, appError } from "@/types";
import { ... } from "./domain";
import { ... } from "./repository";
```

### `repository.ts`
```typescript
"use server";
/**
 * {MÓDULO} REPOSITORY - Camada de Persistência
 *
 * CONVENÇÕES:
 * - Funções assíncronas que retornam Result<T>
 * - Nomes descritivos: findById, findAll, save, update
 * - NUNCA fazer validação de negócio aqui (apenas persistência)
 * - NUNCA importar React/Next.js aqui
 */
import { createClient } from "@/lib/supabase/server";
import type { ... } from "./domain";
```

### `index.ts`
```typescript
/**
 * {MÓDULO} - Barrel Exports
 */
// Domain
export type { ... } from "./domain";
export { ... } from "./domain";

// Service (se existir)
export { ... } from "./service";

// Actions
export { ... } from "./actions/xxx-actions";

// Components
export { ... } from "./components/xxx";

// Hooks (se existir)
export { ... } from "./hooks/use-xxx";
```

## Waves de Execução

### Wave 1 — Reclassificar (README only)

Módulos que já estão completos mas classificados errado:
- `assistentes-tipos` ✅ → Completo
- `audiencias` ✅ → Completo
- `chatwoot` ✅ → Completo
- `expedientes` ✅ → Completo
- `entrevistas-trabalhistas` ✅ → Completo

**Ação**: Atualizar `README.md` e `docs/architecture/STATUS.md`

### Wave 2 — Quase completos (1-2 arquivos)

| Módulo | Criar |
|--------|-------|
| `cargos` | `components/` (placeholder mínimo ou mover UI existente) |
| `agenda-eventos` | `components/` |
| `tags` | `service.ts`, `components/` |
| `calendar` | `repository.ts`, `components/` |

**Critério**: Esses módulos já têm domain/service/repo parcial. Criar os arquivos faltantes baseando-se na lógica que já existe nas actions.

### Wave 3 — Normalizar estrutura existente

| Módulo | Trabalho |
|--------|----------|
| `chat` | `repositories/` → `repository.ts` (consolidar) |
| `documentos` | `repositories/` → `repository.ts` (consolidar) |
| `partes` | `repositories/` → `repository.ts` (consolidar, remover `repository-compat.ts`) |
| `financeiro` | `domain/` → `domain.ts` (consolidar), criar `service.ts`, `repository.ts` |
| `admin` | `services/` → `service.ts`, `repositories/` → `repository.ts`, criar `domain.ts` |

**Regra de normalização**:
1. Ler todos os arquivos no diretório (`repositories/*.ts`)
2. Consolidar em um único `repository.ts` com seções separadas por comentários
3. Atualizar TODOS os imports que apontavam para os arquivos antigos
4. Deletar o diretório antigo
5. Atualizar `index.ts`

### Wave 4 — Unificação profiles/perfil

**Contexto**: São duas features com perspectivas diferentes do mesmo dado:
- `perfil` = Usuário vendo/editando SEUS dados (self-service)
- `profiles` = Admin gerenciando TODOS os usuários (será renomeado para `usuarios`)

**Plano**:
1. Renomear `profiles/` → `usuarios/` (já é o nome na UI)
2. Criar backend unificado em `usuarios/`: `domain.ts`, `service.ts`, `repository.ts`
3. `perfil/` referencia `usuarios/` para domain/service/repository (re-exporta)
4. Cada módulo mantém seus próprios `actions/` e `components/` (permissões diferentes)
5. Atualizar todos os imports de `@/features/profiles` → `@/features/usuarios`

### Wave 5 — Completar incompletos

| Módulo | Criar |
|--------|-------|
| `busca` | `domain.ts` (schemas de busca), `service.ts` (lógica de busca), `repository.ts` (queries) |
| `perfil` | `service.ts` → re-exporta de `usuarios`, `repository.ts` → re-exporta de `usuarios` |

### Wave 6 — Módulos adaptativos (UI-only)

Estes módulos não têm persistência própria significativa. Recebem estrutura adaptativa:

| Módulo | Criar | Não criar (justificado em RULES.md) |
|--------|-------|--------------------------------------|
| `calculadoras` | `domain.ts` (schemas/tipos), `RULES.md` | `service.ts`, `repository.ts`, `actions/` |
| `portal` | `domain.ts`, `RULES.md` | `service.ts`, `repository.ts`, `actions/` |
| `website` | `domain.ts`, `RULES.md` | `service.ts`, `repository.ts`, `actions/` |
| `twofauth` | `domain.ts`, `actions/`, `RULES.md` | `service.ts`, `repository.ts` |
| `repasses` | `domain.ts`, `service.ts`, `repository.ts`, `actions/` | — (módulo completo, tem dados) |

**`RULES.md` para módulos adaptativos**:
```markdown
# {MÓDULO} - Regras de Negócio

## Classificação FSD: Adaptativo (UI-only)

Este módulo não possui `service.ts` nem `repository.ts` porque:
- Não tem persistência própria no banco de dados
- A lógica é puramente de apresentação/cálculo client-side
- Dados consumidos vêm de outros módulos via suas APIs públicas

## Regras
- ...
```

### Wave 7 — Módulos stub

| Módulo | Trabalho |
|--------|----------|
| `tasks` | Criar estrutura completa: `domain.ts`, `service.ts`, `repository.ts`, `actions/`, `components/` |
| `audit` | Normalizar `services/` → `service.ts`, criar `domain.ts`, `index.ts`, `repository.ts`, `actions/` |

## Regras Gerais de Execução

1. **Conteúdo real**: Cada arquivo criado deve conter lógica extraída das actions/components existentes, não stubs vazios
2. **Imports**: Atualizar TODOS os imports quebrados após cada normalização
3. **Barrel exports**: `index.ts` deve exportar tudo que é público no módulo
4. **Type-check**: `npm run type-check` deve passar após cada wave
5. **Sem testes novos**: Não criar testes neste escopo (futura wave dedicada)
6. **Commits atômicos**: Um commit por wave (ou por módulo em waves complexas)

## Validação Final

Após todas as waves:
1. `npm run type-check` — zero erros
2. `npm run check:architecture` — validação FSD passa
3. `npm run lint` — sem novos warnings
4. Atualizar `README.md` — todos os módulos como ✅ Completos
5. Atualizar `docs/architecture/STATUS.md` — refletir nova classificação
