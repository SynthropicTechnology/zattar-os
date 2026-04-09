# CLAUDE.md

Este documento provê diretivas diretas e definitivas para ferramentas baseadas em CLI como o Claude Code ou Gemini.

## Visão Geral do Projeto

**ZattarOS** (desenvolvido pela Synthropic) — Sistema corporativo para firmas legais. A base inteira usa linguagem de negócios em PT-BR.
**Stack**: Next.js 16 (App Router + Turbopack), React 19, TypeScript 5, Supabase (RLS + pgvector), Redis, Tailwind CSS 4, shadcn/ui.

## Comandos Chave

```bash
npm run dev                          # Servidor local via Turbopack
npm run type-check                   # Verificação de tipagem rígida
npm run build:ci                     # Build CI com limite de RAM alto
npm test                             # Todos os testes de unidade
npm run test:e2e                     # Scrappers e fluxos end-to-end
npm run check:architecture             # Valida violações arquiteturais do FSD
npm run validate:exports             # Valida barreiras
```

## Arquitetura de Módulos (FSD + Colocation)

Todos os domínios funcionais do ZattarOS residem sob a hierarquia de rotas em `src/app/(authenticated)`.

```text
src/
├── app/
│   ├── (authenticated)/         # FSD Area
│   │   ├── processos/           # Módulo `processos`
│   │   │   ├── domain.ts        # Tipos/Schemas (Zod)
│   │   │   ├── service.ts       # Lógica e regras
│   │   │   ├── repository.ts    # Fetch de Dados
│   │   │   ├── actions/         # Actions que invocam services (+ safe-action)
│   │   │   ├── components/      # UI (React) 
│   │   │   ├── hooks/           # Interação UI/Logic
│   │   │   ├── RULES.md         # Documento de Contexto
│   │   │   ├── index.ts         # Exportação autorizada
│   │   │   └── page.tsx         # Página e Rota Front-End
├── components/                  # UI Shared, Shadcn, Shells, Layouts
├── lib/                         # Core infra (Supabase, MCP, redis, AI)
```

**Regras Absolutas**:
1. **Nada de Cross-Deep Imports**: Componentes de `processos` não podem importar de `financeiro/components/...`. Exija `import { x } from "@/app/(authenticated)/financeiro"`.
2. **Uso de Action-Wrapper**: Se for criar Server Actions, embrulhe o método sob `authenticatedAction` (`@/lib/safe-action`).
3. **Padrões de Shell UI**: Use componentes casca obrigatórios: `PageShell`, `DataShell`, `DialogFormShell` exportados em `@/components/shared`.

**Módulos Intencionalmente Minimais**:
Alguns módulos sob `(authenticated)/` são propositalmente embrionários (proxies, sistemas auto-descritivos, cálculos puros, FSD aninhado em `feature/`). **Não tente "consertá-los" criando arquivos vazios** — eles têm `README.md` próprio explicando o estado intencional. Consulte [docs/architecture/MINIMAL_MODULES.md](docs/architecture/MINIMAL_MODULES.md) para a lista completa e os critérios de promoção.

## Base de Dados (Supabase)

- Todas as tabelas têm **RLS**. 
- Os scripts SQL situam-se em `supabase/migrations/`. 
- `database.types.ts` é autogerado.

## RAG e Integração LLM Compartilhada

- Entidades cruciais ao negócio disparam hooks `after()` do backend que processam e invocam as bibliotecas internas contidas em `src/lib/ai/indexing`.
- Todas as **Server Actions publicadas** podem ser engajadas como *Ferramentas de IA* (Tools via Model Context Protocol), permitindo que agentes manipulem processos em CLI e na Web UI.

*(Para o manual estendido de comportamento do software, diagramas SSE/MCP e troubleshooting, leia `docs/architecture/AGENTS.md` e `docs/architecture/ARCHITECTURE.md` em profundidade).*

<!-- GSD:project-start source:PROJECT.md -->
## Project

**ZattarOS Chat Redesign**

Redesign completo do modulo de chat do ZattarOS para alinhar ao design system "Glass Briefing" ja implementado em Audiencias, Expedientes e Processos. Inclui refatoracao visual de todos os componentes (sidebar, bolhas, header, input, detail panel) e introducao de novas features como context bar de processo vinculado, audio waveform visual e empty state com suggestion cards.

**Core Value:** Comunicacao em tempo real entre advogados e equipe com coerencia visual total ao design system Glass Briefing, preservando todas as funcionalidades existentes (mensagens, chamadas, gravacao de audio, upload de arquivos).

### Constraints

- **Stack**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui — manter
- **Componentes shared**: Reutilizar GlassPanel, TabPills, SearchInput, IconContainer, Heading, SemanticBadge
- **FSD Architecture**: Manter modulo em `src/app/(authenticated)/chat/`
- **Tokens CSS existentes**: Usar os tokens `--chat-*` ja definidos em globals.css
- **Funcionalidade**: Zero regressao — todas as features atuais devem continuar funcionando
- **Performance**: Manter lazy loading do ChatWindow e Suspense boundaries
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
