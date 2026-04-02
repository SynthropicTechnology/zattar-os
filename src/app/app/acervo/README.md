# Feature: Acervo

Feature para gerenciamento de acervo de processos judiciais, seguindo a arquitetura Feature-Sliced Design (FSD).

## Onde aparece no app

- Endpoints de API relacionados:
  - `src/app/api/acervo/cliente/cpf/[cpf]/route.ts` (consulta de processos por CPF)
  - `src/app/api/captura/trt/acervo-geral/route.ts` (captura automatizada do acervo geral)

## Entrypoints

- Barrel exports: `src/features/acervo/index.ts`
- Domínio: `src/features/acervo/domain.ts`
- Service: `src/features/acervo/service.ts`
- Repository: `src/features/acervo/repository.ts`

## Testes

- Unit/Integration: `npm test` (quando houver testes no módulo)

## Links

- Arquitetura do projeto: `ARCHITECTURE.md`
- Padrões e comandos do repo: `AGENTS.md`

## 📁 Estrutura

```
src/features/acervo/
├── actions/
│   └── acervo-actions.ts      # Server Actions (substitui REST APIs)
├── components/
│   └── list/
│       ├── acervo-table.tsx   # Tabela de processos
│       └── acervo-filters.tsx # Filtros de busca
├── hooks/
│   └── use-acervo.ts          # React hooks customizados
├── domain.ts                   # Lógica de domínio e regras de negócio
├── repository.ts               # Camada de acesso a dados
├── service.ts                  # Camada de serviço (orquestração)
├── types.ts                    # Tipos TypeScript e schemas Zod
├── utils.ts                    # Funções utilitárias
└── index.ts                    # Barrel exports (API pública)
```

## 🎯 Funcionalidades

### Listagem de Acervo

- **Paginação**: Suporte a paginação com limite configurável (máx 2000)
- **Filtros**: Busca textual, origem, TRT, grau, responsável, classe judicial, etc.
- **Ordenação**: Por data de autuação, número, partes, etc.
- **Agrupamento**: Por TRT, grau, origem, responsável, classe judicial, etc.
- **Unificação**: Agrupa processos com mesmo número em diferentes graus
- **Cache**: Redis com TTL de 15 minutos

### Busca por CPF

- Busca processos de um cliente por CPF
- Persistência de timeline em `public.acervo.timeline_jsonb` (PostgreSQL JSONB)
- Formatação otimizada para consumo por Agente IA (WhatsApp)
- Suporte a sincronização lazy de timelines

### Atribuição de Responsável

- Atribui responsável a um ou múltiplos processos
- Propaga atribuição para todas as instâncias do mesmo processo
- Validação de permissões
- Invalidação automática de cache

### Exportação

- Exportação para CSV com todos os campos relevantes

## 📊 Tipos Principais

### `Acervo`

Representa um processo no acervo (uma instância).

### `ProcessoUnificado`

Representa um processo com todas suas instâncias agrupadas.

### `ListarAcervoParams`

Parâmetros para listagem com filtros, paginação e ordenação.

### `ProcessosClienteCpfResponse`

Resposta formatada para busca por CPF (otimizada para IA).

## 🔧 Server Actions

### `actionListarAcervo(params)`

Lista processos com filtros e paginação.

**Permissão necessária**: `acervo:visualizar`

```typescript
const result = await actionListarAcervo({
  pagina: 1,
  limite: 50,
  origem: "acervo_geral",
  trt: "TRT3",
  grau: "primeiro_grau",
});
```

### `actionBuscarProcesso(id)`

Busca um processo específico por ID.

**Permissão necessária**: `acervo:visualizar`

### `actionAtribuirResponsavel(processoIds, responsavelId)`

Atribui responsável a processos.

**Permissão necessária**: `acervo:editar`

```typescript
await actionAtribuirResponsavel([1, 2, 3], 42);
```

### `actionBuscarProcessosClientePorCpf(cpf)`

Busca processos de um cliente por CPF.

**Permissão necessária**: `acervo:visualizar`

```typescript
const result = await actionBuscarProcessosClientePorCpf("12345678901");
```

### `actionExportarAcervoCSV(params)`

Exporta acervo para CSV.

**Permissão necessária**: `acervo:visualizar`

## 🪝 Hooks

### `useAcervo(initialParams)`

Hook principal para listagem de acervo.

```typescript
const { data, loading, error, params, updateParams, refetch } = useAcervo({
  pagina: 1,
  limite: 50,
});
```

### `useProcesso(id)`

Hook para buscar um processo específico.

```typescript
const { processo, loading, error, refetch } = useProcesso(123);
```

### `useAtribuirResponsavel()`

Hook para atribuir responsável.

```typescript
const { atribuir, loading } = useAtribuirResponsavel();
await atribuir([1, 2, 3], 42);
```

### `useProcessosClienteCpf()`

Hook para busca por CPF.

```typescript
const { data, loading, error, buscar } = useProcessosClienteCpf();
await buscar("12345678901");
```

### `useAcervoFilters(initialFilters)`

Hook para gerenciar estado de filtros.

```typescript
const { filters, updateFilter, resetFilters, clearFilter } = useAcervoFilters();
```

## 🎨 Componentes

### `<AcervoTable />`

Tabela de processos com suporte a seleção múltipla.

```tsx
<AcervoTable
  processos={processos}
  onSelectProcesso={handleSelect}
  selectedIds={selectedIds}
  onSelectionChange={setSelectedIds}
  showSelection
/>
```

### `<AcervoFilters />`

Componente de filtros com todos os campos disponíveis.

```tsx
<AcervoFilters
  filters={filters}
  onFilterChange={updateFilter}
  onReset={resetFilters}
/>
```

## 🔄 Migração de Código Legado

Esta feature consolida código de:

- ✅ `backend/acervo/services/` → `service.ts` + `repository.ts`
- ✅ `backend/types/acervo/` → `types.ts`
- ✅ `backend/acervo/utils/` → `utils.ts`
- ✅ `src/app/api/acervo/*` → `actions/acervo-actions.ts`
- ✅ `src/app/_lib/hooks/use-acervo.ts` → `hooks/use-acervo.ts`

## 📝 Uso em Páginas

```tsx
// src/app/(dashboard)/acervo/page.tsx
import {
  AcervoTable,
  AcervoFilters,
  useAcervo,
  useAcervoFilters,
} from "@/features/acervo";

export default function AcervoPage() {
  const { filters, updateFilter, resetFilters } = useAcervoFilters();
  const { data, loading, error } = useAcervo(filters);

  return (
    <div>
      <AcervoFilters
        filters={filters}
        onFilterChange={updateFilter}
        onReset={resetFilters}
      />
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <AcervoTable processos={data?.processos || []} />
      )}
    </div>
  );
}
```

## 🔐 Permissões

- `acervo:visualizar` - Visualizar acervo
- `acervo:editar` - Atribuir responsável e editar processos

## 🗄️ Banco de Dados

### Tabelas

- `acervo` - Tabela principal de processos
- `acervo_unificado` - VIEW materializada para processos unificados
- `processos_cliente_por_cpf` - VIEW para busca por CPF

### Cache

- Redis com chaves: `acervo:list:*`, `acervo:group:*`, `acervo:id:*`
- TTL: 15 minutos

## 🧪 Validação

Todos os inputs são validados com Zod schemas:

- `listarAcervoParamsSchema`
- `atribuirResponsavelSchema`

## 📚 Dependências

- `@/lib/supabase/service-client` - Cliente Supabase
- `@/lib/redis/cache-utils` - Utilitários de cache
- `@/lib/auth` - Autenticação e autorização
- `@/features/captura/services/timeline/timeline-persistence.service` - Persistência de timeline (Supabase/JSONB)
- `@/lib/redis/invalidation` - Invalidação de cache

## 🚀 Próximos Passos

1. Migrar componentes de timeline para `components/timeline/`
2. Criar componentes de detalhes do processo
3. Adicionar testes unitários e de integração
4. Documentar casos de uso específicos
