# AGENTS.md

Este documento provê diretrizes cruciais para agentes de inteligência artificial que vão iterar ou escrever código neste projeto.

## Dados do Projeto

**Synthropic (Zattar OS)** — Sistema corporativo de gestão jurídica.
A base de banco de dados e termos de negócio está em Português.

**Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 (estrito), Supabase (PostgreSQL + RLS + pgvector), Tailwind CSS 4, shadcn/ui.

**Ambiente Operacional**: Node.js >= 22.0.0, npm >= 10.

## Comandos Críticos

```bash
# Execução
npm run dev                    # Servidor local via Turbopack

# Integração e Code Quality
npm run type-check             # Verificação severa de TS (sem emissão)
npm run lint                   # ESLint
npm run check:architecture     # Validação rígida FSD de importações
npm run validate:exports       # Validação das exportações em Barrel files

# Build e Testes
npm run build                  # Build otimizado 
npm run build:ci               # Build via CI (Evita out of memory em runners pesados)
npm test                       # Bateria principal do Jest 30
npm run test:e2e               # E2E test via Playwright
```

## Arquitetura (FSD + Colocation)

Nós aplicamos **Feature-Sliced Design (FSD)**, porém de modo *Colocated* com as páginas na pasta `src/app`.
Todos os módulos devem se encontrar em `src/app/(authenticated)/{nome-do-modulo}`.

### Estrutura do Módulo

Todo e qualquer módulo sob `/app/(authenticated)/` deve conter impreterivelmente estes componentes:

```
src/app/(authenticated)/{modulo}/
  domain.ts       # Zod schemas, Tipos typescript TypeScript, regras de estado puro 
  service.ts      # Casos de uso e orquestração da regra de negócio
  repository.ts   # Código isolado manipulador de Supabase queries
  actions/        # Server Actions exportáveis
  components/     # UI localizda em React atrelada às entidades
  index.ts        # Barrel - a API Pública obrigatória!
  RULES.md        # Documentação exclusiva p/ instruir os agentes de IA
```

### Regras Imprescindíveis (Quebre e você falhará no FSD):
1. **Regra de Importação**: Nenhuma entidade fora de um módulo pode acessar o conteúdo das subpastas dele. Toda interação cross-modulo deve importar diretamente através do export agrupado (`import { X } from "@/app/(authenticated)/{modulo}"`).
2. **Lógica UI-Safe**: As Server Actions precisam ser empacotadas obrigatoriamente usando `authenticatedAction` (`import { authenticatedAction } from "@/lib/safe-action"`). Nomenclatura das actions sempre com `actionX` (ex: `actionCriar`).
3. **Cascas UI**: Sempre envelopar as páginas com os Shells da aplicação localizados em `@/components/shared/` (`PageShell`, `DataShell`, `DialogFormShell`).
4. **Sem cores hardcoded**: Cores de bagdes e afins não podem ter classes hardcoded do tailwind no React. Deve ser dinâmico através do `getSemanticBadgeVariant()` (`@/lib/design-system`).
5. **Nomes base**: Pastas e Arquivos devem ser em formato `kebab-case`. Funções devem usar `camelCase`. Componentes e Tipos usando padrão `PascalCase`. Constantes de código global usam `UPPER_SNAKE_CASE`. Tabelas e campos na database usam `snake_case`.

## Environment

Variáveis determinantes (sem elas as actions não executam):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SERVICE_API_KEY`, `CRON_SECRET`

## Referência Estendida

- Leia [`CLAUDE.md`](./CLAUDE.md) para regras de comandos CLI e fluxos internos de trabalho adaptados para a IA.
- Leia [`docs/architecture/AGENTS.md`](./docs/architecture/AGENTS.md) para acesso em profundidade ao fluxo das APIs.
