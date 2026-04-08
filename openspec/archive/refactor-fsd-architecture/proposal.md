# Change: Refatoracao Arquitetural FSD e Eliminacao de Codigo Legado

## Why

O projeto Synthropic esta em transicao para Feature-Sliced Design (FSD), mas apresenta **codigo legado critico** que viola os principios arquiteturais estabelecidos. Server Actions em `src/app/actions/` violam FSD, o arquivo monolitico `src/features/partes/repository.ts` com 2184 linhas compromete manutenibilidade, features duplicadas (`profiles` vs `perfil`) causam confusao, e o wrapper `safe-action` nao e utilizado consistentemente. Essas inconsistencias comprometem escalabilidade, manutenibilidade e qualidade do codigo.

## What Changes

### 1. Eliminacao de Codigo Legado em `src/app/actions/`
- **BREAKING**: Mover `src/app/actions/partes.ts` (762 linhas) para `src/features/partes/actions/`
- **BREAKING**: Mover `src/app/actions/expedientes.ts` (388 linhas) para `src/features/expedientes/actions/`
- Deletar actions vazias (`pje.ts`, `comunica-cnj.ts`)
- Refatorar todas as actions para usar wrapper `authenticatedAction` de `src/lib/safe-action.ts`

### 2. Decomposicao do Repository Monolitico de Partes
- **BREAKING**: Decompor `src/features/partes/repository.ts` (2184 linhas) em:
  - `repositories/clientes-repository.ts` (~700 linhas)
  - `repositories/partes-contrarias-repository.ts` (~500 linhas)
  - `repositories/terceiros-repository.ts` (~600 linhas)
  - `repositories/shared/converters.ts` (~300 linhas)
- Manter re-exports temporarios para retrocompatibilidade

### 3. Consolidacao de Features Duplicadas
- Renomear `profiles` para `profile-system` (sistema generico reutilizavel)
- Renomear `perfil` para `user-profile` (perfil do usuario autenticado)
- Deletar feature `repasses` - mover conteudo para `obrigacoes`

### 4. Completar Estrutura de Features Incompletas
- Completar feature `busca` com domain, service, repository, components, hooks
- Documentar features sem `components/` como features de dominio puro

### 5. Remover Codigo Nao Utilizado
- Deletar hooks nao utilizados (colaboracao YJS, realtime cursors)
- Deletar componentes calendar nao utilizados (se confirmado)

### 6. Reorganizacao de Tipos
- Mover tipos especificos de `src/types/` para features correspondentes
- Manter em `src/types/` apenas tipos verdadeiramente compartilhados
- Sincronizar tipos de domain com `database.types.ts`

### 7. Separacao de Camadas e Principios SOLID
- Extrair logica de negocios de componentes para hooks/services
- Padronizar retornos de actions usando `safe-action`
- Eliminar acoplamento direto ao Supabase em componentes

### 8. Refatoracao de Integracoes CopilotKit
- **BREAKING**: Mover `src/lib/copilotkit/actions/` para features correspondentes
- Criar estrutura `src/features/*/copilot/actions.ts`
- Manter em `lib/copilotkit/` apenas config global e system-prompt

### 9. Otimizacoes de Performance
- Adicionar paginacao em todas as listagens de repositories
- Implementar cache em queries frequentes (tribunais, usuarios, tipos-expedientes)
- Eliminar queries N+1 em repositories

### 10. Documentacao e Validacao
- Criar `RULES.md` em features sem documentacao
- Atualizar `ARCHITECTURE.md` refletindo mudancas
- Criar script `scripts/validate-architecture.ts` para CI/CD

## Impact

### Affected Specs
- `specs/clientes/spec.md` - mudanca de imports de actions
- `specs/partes-contrarias/spec.md` - mudanca de imports de actions
- `specs/terceiros/spec.md` - mudanca de imports de actions
- `specs/expedientes/spec.md` - mudanca de imports de actions
- `specs/frontend-partes/spec.md` - reorganizacao de componentes
- `specs/api-routes/spec.md` - padronizacao de actions

### Affected Code
- `src/app/actions/` - **DELETAR** todo o diretorio
- `src/features/partes/repository.ts` - **DECOMPOR** em 4 arquivos
- `src/features/partes/actions/` - **CRIAR** 3 novos arquivos
- `src/features/expedientes/actions/` - **MOVER** de `src/app/actions/`
- `src/lib/copilotkit/actions/` - **MOVER** para features
- `src/features/profiles/` - **RENOMEAR** para `profile-system`
- `src/features/perfil/` - **RENOMEAR** para `user-profile`
- `src/features/repasses/` - **DELETAR** (mover para obrigacoes)
- Multiplos arquivos de imports em toda a codebase

### Breaking Changes Summary
1. Todos os imports de `@/app/actions/partes` devem mudar para `@/features/partes/actions`
2. Todos os imports de `@/app/actions/expedientes` devem mudar para `@/features/expedientes/actions`
3. Imports de `@/features/partes/repository` devem usar repositories especificos
4. Imports de CopilotKit actions devem mudar para features
5. Paths de features `profiles` e `perfil` mudam

### Risk Assessment
| Area | Risco | Mitigacao |
|------|-------|-----------|
| Migration de Actions | Medio | Atualizar imports sistematicamente, testes de regressao |
| Decomposicao Repository | Alto | Manter re-exports temporarios, validar queries |
| Renomeacao Features | Baixo | Search and replace sistematico |
| Performance | Medio | Monitorar queries, rollback se necessario |

### Criteria de Sucesso
- Zero arquivos em `src/app/actions/` (exceto API routes)
- Nenhum arquivo com mais de 800 linhas
- 100% das actions usam `safe-action` wrapper
- Zero imports diretos de Supabase em componentes
- Script de validacao arquitetural passa no CI
