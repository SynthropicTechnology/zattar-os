# Aplicação da Migration de Embeddings

**Data:** 2025-12-16  
**Status:** ✅ Migration criada e pronta para aplicação

## Migration Criada

- **Arquivo:** `supabase/migrations/aplicadas/20251216132616_create_embeddings_system.sql`
- **Origem:** `supabase/migrations/nao-aplicadas/2025-12-12-create-embeddings-system.sql`
- **Schema Declarativo:** `supabase/schemas/38_embeddings.sql`

## Próximos Passos

### 1. Aplicar Migration no Supabase

A migration precisa ser aplicada no banco de dados Supabase. Opções:

#### Opção A: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/migrations/aplicadas/20251216132616_create_embeddings_system.sql`
4. Execute o SQL

#### Opção B: Via CLI (quando Docker estiver disponível)
```bash
npx supabase db push
```

#### Opção C: Via MCP Tool (se disponível)
Use a ferramenta MCP do Supabase para aplicar a migration.

### 2. Gerar Tipos TypeScript

Após aplicar a migration, gere os tipos TypeScript:

```bash
# Usando project ID
npx supabase gen types typescript --project-id cxxdivtgeslrujpfpivs > src/lib/supabase/database.types.ts

# OU usando URL e anon key
npx supabase gen types typescript \
  --url https://cxxdivtgeslrujpfpivs.supabase.co \
  --anon-key <sua-anon-key> \
  > src/lib/supabase/database.types.ts
```

### 3. Verificar Tipos Gerados

Após gerar os tipos, verifique se a tabela `embeddings` e a função `match_embeddings` estão presentes:

```typescript
// Deve conter:
export type Database = {
  public: {
    Tables: {
      embeddings: {
        Row: {
          id: number;
          content: string;
          embedding: number[]; // vector(1536)
          entity_type: string;
          entity_id: number;
          parent_id: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          indexed_by: number | null;
        };
        // ...
      };
    };
    Functions: {
      match_embeddings: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_entity_type?: string;
          filter_parent_id?: number;
          filter_metadata?: Json;
        };
        Returns: {
          id: number;
          content: string;
          entity_type: string;
          entity_id: number;
          parent_id: number | null;
          metadata: Json;
          similarity: number;
        }[];
      };
    };
  };
};
```

## Schema Declarativo

O schema declarativo foi criado em `supabase/schemas/38_embeddings.sql` seguindo o padrão dos outros schemas do projeto.

## Verificação

Após aplicar a migration, verifique:

1. ✅ Extensão `vector` habilitada
2. ✅ Tabela `public.embeddings` criada
3. ✅ Índices criados (HNSW, entity_type_id, parent_id, metadata, created_at)
4. ✅ RLS habilitado
5. ✅ Função `match_embeddings` criada
6. ✅ Tipos TypeScript atualizados

## Notas

- A migration usa `if not exists` para ser idempotente
- A função `match_embeddings` usa `security definer` e `set search_path = ''` para segurança
- Os índices HNSW são otimizados para busca vetorial de alta performance
