# Auditoria de Tipos e Schemas - Zattar Advogados

**Data**: 2026-02-16  
**Projeto**: Zattar OS (Sinesys)  
**Banco**: Supabase (cxxdivtgeslrujpfpivs)

## 🔍 Resumo Executivo

### Problemas Identificados

1. ❌ **Tipos desatualizados**: `database.types.ts` está 121 linhas desatualizado em relação ao banco remoto
2. ❌ **Duplicação de arquivos**: 2 arquivos de tipos do Database (7648 vs 7687 linhas)
3. ⚠️ **Tabelas novas no banco não refletidas no código**:
   - `dify_apps` (nova)
   - `kanban_boards` (nova)
   - `graphql_public` schema (novo)
4. ⚠️ **Interfaces com tipos genéricos** (`unknown`, `any`, `object`)
5. ✅ **Imports consistentes**: Todos usam `@/lib/supabase` (barrel export)

---

## 📊 Análise Detalhada

### 1. Arquivos de Tipos

| Arquivo | Linhas | Status | Uso |
|---------|--------|--------|-----|
| `src/lib/supabase/database.types.ts` | 7648 | ✅ Ativo | Exportado via barrel (`@/lib/supabase`) |
| `src/types/database.types.ts` | 7687 | ❌ Duplicado | Não usado (0 imports) |
| `src/types/supabase-generated.ts.new` | 7769 | 🆕 Atualizado | Gerado do banco remoto |

**Diferenças**: 88 linhas entre os duplicados, 121 linhas entre local e remoto

### 2. Tabelas Novas no Banco Remoto

```typescript
// Tabelas que existem no banco mas não nos tipos locais:
- dify_apps (integração Dify AI)
- kanban_boards (quadros Kanban)
- graphql_public schema (GraphQL API)
```

### 3. Código Deprecado Encontrado

#### a) Aliases Desnecessários
```typescript
// src/hooks/use-infinite-query.ts
type DatabaseSchema = Database['public']  // ⚠️ Pode ser simplificado
```

#### b) Funções de Conversão (Adapters)
```typescript
// src/features/enderecos/utils.ts
export function converterParaEndereco(data: Record<string, unknown>): Endereco

// src/features/chat/repositories/shared/converters.ts
export function converterParaSalaChat(data: SalaChatRow): SalaChat
export function converterParaMensagemChat(data: MensagemChatRow): MensagemChat

// src/app/app/assistentes/feature/repository.ts
function converterParaAssistente(data: Record<string, unknown>): Assistente
```

**Análise**: Essas funções podem ser necessárias para transformação snake_case → camelCase. Manter por enquanto.

### 4. Interfaces com Tipos Genéricos

```typescript
// ⚠️ Tipos que precisam ser refinados:
src/features/documentos/domain.ts:
  - dados: unknown
  - details?: unknown

src/features/usuarios/domain.ts:
  - data?: unknown
  - itensDesatribuidos?: unknown

src/features/captura/domain.ts:
  - processos?: unknown[]
  - audiencias?: unknown[]
  - timeline?: unknown[]

src/features/pecas-juridicas/domain.ts:
  - conteudo: unknown[] // Plate.js Value - OK (dinâmico)

src/features/profiles/configs/types.ts:
  - format?: (value: unknown) => string  // OK (genérico intencional)
  - cell?: (value: unknown, row: Record<string, unknown>) => ReactNode
```

### 5. Imports Consistentes ✅

```
Imports de @/lib/supabase: 19 arquivos
Imports de @/types/database: 0 arquivos
```

**Conclusão**: Todos os arquivos usam o barrel export correto.

---

## 🎯 Plano de Ação

### Fase 1: Atualização de Tipos (CRÍTICO)

- [x] Gerar tipos atualizados do banco remoto
- [ ] Substituir `src/lib/supabase/database.types.ts` pelo arquivo atualizado
- [ ] Remover `src/types/database.types.ts` (duplicado não usado)
- [ ] Executar `npm run type-check` para validar

### Fase 2: Sincronização de Schema

- [ ] Executar `supabase db diff --linked` para ver todas as diferenças
- [ ] Decidir se precisa fazer `supabase db pull` para sincronizar migrações
- [ ] Atualizar documentação de schema

### Fase 3: Refinamento de Tipos (MÉDIO)

- [ ] Refinar tipos `unknown` em `src/features/documentos/domain.ts`
- [ ] Refinar tipos `unknown` em `src/features/usuarios/domain.ts`
- [ ] Refinar tipos `unknown` em `src/features/captura/domain.ts`
- [ ] Adicionar tipos específicos para Plate.js (se disponível)

### Fase 4: Limpeza de Código (BAIXO)

- [ ] Avaliar se adapters/converters são realmente necessários
- [ ] Simplificar alias `DatabaseSchema` em `use-infinite-query.ts`
- [ ] Documentar padrões de conversão snake_case ↔ camelCase

---

## 🚀 Comandos para Execução

```bash
# 1. Atualizar tipos do banco remoto
supabase gen types --lang=typescript --linked > src/lib/supabase/database.types.ts

# 2. Remover duplicado
rm src/types/database.types.ts

# 3. Validar tipos
npm run type-check

# 4. Ver diferenças de schema
supabase db diff --linked

# 5. Sincronizar migrações (se necessário)
supabase db pull --yes

# 6. Executar testes
npm test
```

---

## 📝 Notas Adicionais

### Tabelas Novas Detectadas

1. **dify_apps**: Integração com Dify AI (chatbots/workflows)
   - Campos: `api_key`, `api_url`, `app_type`, `name`, `is_active`
   - Precisa criar feature module em `src/features/dify/`?

2. **kanban_boards**: Quadros Kanban personalizados
   - Campos: `titulo`, `tipo`, `icone`, `ordem`, `source`, `usuario_id`
   - Já existe `src/features/kanban/` - verificar se está usando

3. **graphql_public**: Schema GraphQL
   - Função `graphql()` disponível
   - Verificar se está sendo usado

### Constraint Removida

```sql
-- ⚠️ Detectado no diff:
alter table "public"."arquivos" drop constraint "arquivos_tipo_media_check"
```

**Ação**: Verificar se isso é intencional ou precisa ser restaurado.

---

## ✅ Checklist de Validação

Após executar as correções:

- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem erros
- [ ] `npm test` passa todos os testes
- [ ] `npm run build` compila com sucesso
- [ ] Verificar se features `dify` e `kanban` estão funcionando
- [ ] Testar upload de arquivos (constraint removida)

---

**Próximos Passos**: Executar Fase 1 (atualização de tipos) imediatamente.
