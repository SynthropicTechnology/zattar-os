# CLAUDE.md

Este documento provê diretivas diretas e definitivas para ferramentas baseadas em CLI como o Claude Code ou Gemini.

## Visão Geral do Projeto

**Sinesys (Zattar OS)** — Sistema corporativo para firmas legais. A base inteira usa linguagem de negócios em PT-BR.
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

Todos os domínios funcionais do Sinesys residem sob a hierarquia de rotas em `src/app/(authenticated)`.

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
