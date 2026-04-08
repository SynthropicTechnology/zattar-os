# Design: Refatoracao Arquitetural FSD

## Context

O projeto Synthropic adotou Feature-Sliced Design (FSD) como arquitetura principal, mas ainda contem codigo legado que viola os principios estabelecidos. Esta refatoracao visa eliminar dividas tecnicas acumuladas e estabelecer conformidade arquitetural completa.

### Stakeholders
- Equipe de desenvolvimento (manutenibilidade)
- Operacoes (estabilidade e performance)
- Novos desenvolvedores (onboarding simplificado)

### Constraints
- Zero downtime durante migracao
- Retrocompatibilidade temporaria durante transicao
- Testes de regressao obrigatorios para cada fase

## Goals / Non-Goals

### Goals
- Eliminar 100% do codigo em `src/app/actions/`
- Decompor arquivos monoliticos (>800 linhas) em modulos especializados
- Padronizar uso de `safe-action` em todas as Server Actions
- Estabelecer script de validacao arquitetural no CI/CD
- Documentar todas as features com `RULES.md`

### Non-Goals
- Refatorar logica de negocios existente (apenas reorganizar)
- Adicionar novas funcionalidades
- Migrar para outro framework ou biblioteca
- Alterar estrutura do banco de dados

## Decisions

### D1: Padrao de Migracao de Actions

**Decisao**: Migrar actions de `src/app/actions/` para `src/features/*/actions/` usando wrapper `authenticatedAction`.

**Padrao Antes (Legado)**:
```typescript
// src/app/actions/partes.ts
export async function actionCriarCliente(prevState, formData) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nao autenticado' };
  // ... logica
}
```

**Padrao Depois (FSD + safe-action)**:
```typescript
// src/features/partes/actions/clientes-actions.ts
import { authenticatedFormAction } from '@/lib/safe-action';
import { createClienteSchema } from '../domain';
import { criarCliente } from '../service';

export const actionCriarCliente = authenticatedFormAction(
  createClienteSchema,
  async (data, { user }) => {
    const result = await criarCliente(data);
    revalidatePath('/partes/clientes');
    return result.data;
  }
);
```

**Razoes**:
- Autenticacao tratada automaticamente pelo wrapper
- Validacao com Zod integrada
- Tipagem forte para inputs e outputs
- Error handling consistente

### D2: Estrutura de Decomposicao do Repository de Partes

**Decisao**: Decompor `repository.ts` em 4 modulos especializados.

**Estrutura Proposta**:
```
src/features/partes/
├── repositories/
│   ├── clientes-repository.ts      # Operacoes CRUD de clientes
│   ├── partes-contrarias-repository.ts  # Operacoes de partes contrarias
│   ├── terceiros-repository.ts     # Operacoes de terceiros
│   ├── shared/
│   │   ├── converters.ts           # Funcoes converterPara*
│   │   └── types.ts                # Tipos compartilhados internos
│   └── index.ts                    # Barrel export
└── repository.ts                   # DEPRECATED - re-exports temporarios
```

**Responsabilidades**:

| Modulo | Linhas Estimadas | Responsabilidades |
|--------|------------------|-------------------|
| `clientes-repository.ts` | ~700 | findById, findByCPF, findByCNPJ, findByNome, findAll, save, update, upsert, softDelete |
| `partes-contrarias-repository.ts` | ~500 | Mesmas operacoes para partes contrarias |
| `terceiros-repository.ts` | ~600 | Mesmas operacoes para terceiros |
| `shared/converters.ts` | ~300 | converterParaCliente, converterParaParteContraria, converterParaTerceiro, converterParaEndereco |

**Razoes**:
- Single Responsibility Principle (SRP)
- Facilita testes unitarios isolados
- Permite desenvolvimento paralelo
- Reduz conflitos de merge

### D3: Estrategia de Renomeacao de Features

**Decisao**: Renomear features para clarificar proposito.

| De | Para | Razao |
|----|------|-------|
| `profiles` | `profile-system` | Sistema generico de perfis reutilizavel (ProfileShell, ProfileHeader) |
| `perfil` | `user-profile` | Perfil especifico do usuario autenticado (PerfilView, AlterarSenhaDialog) |

**Alternativas Consideradas**:
1. Manter nomes originais com documentacao - **Rejeitado**: confusao persiste
2. Consolidar em uma unica feature - **Rejeitado**: responsabilidades diferentes
3. Renomear conforme proposto - **Aceito**: clareza semantica

### D4: Estrutura de CopilotKit Actions por Feature

**Decisao**: Mover CopilotKit actions de `src/lib/copilotkit/actions/` para cada feature.

**Antes**:
```
src/lib/copilotkit/
├── actions/
│   ├── processos.actions.ts
│   ├── audiencias.actions.ts
│   ├── expedientes.actions.ts
│   └── navegacao.actions.ts
└── ...
```

**Depois**:
```
src/features/processos/
├── copilot/
│   └── actions.ts              # Actions especificas de processos
├── ...

src/features/audiencias/
├── copilot/
│   └── actions.ts              # Actions especificas de audiencias
├── ...

src/lib/copilotkit/
├── config.ts                   # Configuracao global
├── system-prompt.ts            # Prompt do sistema
└── components/                 # Wrappers genericos
```

**Razoes**:
- Conformidade com FSD (codigo de feature na feature)
- Facilita manutencao de actions especificas
- Permite delecao de features sem impactar lib global

### D5: Script de Validacao Arquitetural

**Decisao**: Criar `scripts/validate-architecture.ts` com validacoes automaticas.

**Validacoes**:
```typescript
const validations = [
  // 1. Nenhum arquivo em src/app/actions/ (exceto API routes)
  {
    name: 'no-legacy-actions',
    pattern: 'src/app/actions/**/*.ts',
    allowed: [],
    message: 'Server Actions devem estar em src/features/*/actions/'
  },

  // 2. Limite de linhas por arquivo
  {
    name: 'max-file-lines',
    maxLines: 800,
    exclude: ['*.generated.ts', 'database.types.ts'],
    message: 'Arquivos nao devem exceder 800 linhas'
  },

  // 3. Nenhum import direto de Supabase em componentes
  {
    name: 'no-supabase-in-components',
    pattern: 'src/features/*/components/**/*.tsx',
    forbiddenImports: ['@/lib/supabase/client', 'createClient'],
    message: 'Componentes nao devem importar Supabase diretamente'
  },

  // 4. Actions devem usar safe-action
  {
    name: 'actions-use-safe-action',
    pattern: 'src/features/*/actions/**/*.ts',
    requiredImports: ['@/lib/safe-action'],
    message: 'Actions devem usar wrapper safe-action'
  },

  // 5. Features devem ter estrutura minima
  {
    name: 'feature-structure',
    pattern: 'src/features/*',
    requiredFiles: ['index.ts'],
    optionalFiles: ['domain.ts', 'service.ts', 'repository.ts', 'actions.ts'],
    message: 'Features devem ter pelo menos index.ts'
  }
];
```

**Integracao CI/CD**:
```yaml
# .github/workflows/ci.yml
- name: Validate Architecture
  run: npx tsx scripts/validate-architecture.ts
```

## Risks / Trade-offs

### R1: Quebra de Imports Durante Migracao
- **Risco**: Imports quebrados causam build failures
- **Mitigacao**:
  1. Usar re-exports temporarios no arquivo original
  2. Atualizar imports em PRs separados por area
  3. Manter CI verde a cada passo

### R2: Performance de Queries Apos Decomposicao
- **Risco**: Queries podem ficar menos eficientes se mal decompostas
- **Mitigacao**:
  1. Manter JOINs existentes nos repositories especificos
  2. Monitorar query times antes/depois
  3. Rollback se degradacao >10%

### R3: Curva de Aprendizado para Equipe
- **Risco**: Desenvolvedores podem nao seguir novos padroes
- **Mitigacao**:
  1. Documentar padroes em `RULES.md`
  2. Script de validacao no pre-commit
  3. Code review focado em conformidade

### R4: Tempo de Migracao Estendido
- **Risco**: Migracao pode levar mais tempo que o esperado
- **Trade-off**: Aceitar migracao incremental vs big-bang
- **Decisao**: Migracao incremental com re-exports temporarios

## Migration Plan

### Fase 1: Preparacao (Sem Breaking Changes)
1. Criar estrutura de diretorios novos
2. Criar re-exports temporarios
3. Criar script de validacao (modo warning)

### Fase 2: Migracao de Actions
1. Criar novos arquivos de actions em features
2. Refatorar para usar `safe-action`
3. Atualizar imports em componentes
4. Deprecar arquivos antigos (comentarios)
5. Deletar arquivos antigos apos validacao

### Fase 3: Decomposicao de Repository
1. Criar estrutura `repositories/`
2. Extrair modulos um a um
3. Atualizar imports em services
4. Validar queries funcionando
5. Deprecar e deletar arquivo monolitico

### Fase 4: Consolidacao de Features
1. Renomear features com `git mv`
2. Atualizar todos os imports
3. Deletar feature `repasses`

### Fase 5: Limpeza e Documentacao
1. Remover codigo nao utilizado
2. Criar `RULES.md` em features
3. Atualizar `ARCHITECTURE.md`
4. Ativar script de validacao (modo error)

### Rollback Strategy
- Cada fase pode ser revertida independentemente
- Git tags marcam pontos de rollback
- Re-exports permitem voltar atras rapidamente

## Open Questions

### Q1: Manter ou Deletar Hooks de Colaboracao?
- `use-yjs-collaboration.ts`
- `use-realtime-presence-room.ts`
- `use-realtime-cursors.ts`
- `use-realtime-collaboration.ts`

**Status**: Pendente verificacao de uso futuro

### Q2: Estrutura de Cache para Queries Frequentes
- Usar Redis via `src/lib/redis/`?
- Usar cache do Next.js (`unstable_cache`)?
- Implementar cache em memoria simples?

**Status**: Decisao necessaria antes de otimizacoes de performance

### Q3: Granularidade de Paginacao
- Padrao de 20 items por pagina?
- Configuravel por endpoint?
- Cursor-based vs offset-based?

**Status**: Definir padrao antes de implementar
