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
│   ├── (authenticated)/         # FSD Area (admin)
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
│   └── (assinatura-digital)/    # Rota pública (wizard + assinatura por token)
│       ├── _wizard/             # Steps do wizard de formulário público
│       ├── formulario/          # Rota dinâmica pública
│       └── assinatura/[token]/  # Rota de assinatura por token
├── shared/                      # Domínios compartilhados entre rotas públicas e admin
│   └── assinatura-digital/      # Store, types, services, actions, inputs, pdf, signature
├── components/                  # UI Shared, Shadcn, Shells, Layouts
├── lib/                         # Core infra (Supabase, MCP, redis, AI)
```

**Convenção `shared/`**: quando um domínio é consumido por mais de uma rota (ex: público em `(assinatura-digital)/` + admin em `(authenticated)/...`) e/ou por API routes (`src/app/api/...`), o código compartilhado (store, types, services, actions, utils, validations, inputs genéricos) vive em `src/shared/<dominio>/`. Componentes exclusivos de uma rota ficam colocados naquela rota (`_wizard/`, `components/`, etc.). **Evita cross-group imports público↔authenticated**.

**Backlog arquitetural** — migrar as rotas admin de `src/app/(authenticated)/assinatura-digital/` (e outros módulos espelhados) para um sistema de permissões por perfil no painel. Objetivo: uma única rota por domínio, com visibilidade de ações (criar/editar/apagar template, etc.) condicionada a `user.role === 'admin'` em vez de segregação por path. Não iniciar antes de terminar o redesign do fluxo público + testes.

**Regras Absolutas**:
1. **Nada de Cross-Deep Imports**: Componentes de `processos` não podem importar de `financeiro/components/...`. Exija `import { x } from "@/app/(authenticated)/financeiro"`.
2. **Uso de Action-Wrapper**: Se for criar Server Actions, embrulhe o método sob `authenticatedAction` (`@/lib/safe-action`).
3. **Padrões de Shell UI**: Use componentes casca obrigatórios: `PageShell`, `DataShell`, `DialogFormShell` exportados em `@/components/shared`.

**Módulos Intencionalmente Minimais**:
Alguns módulos sob `(authenticated)/` são propositalmente embrionários (proxies, sistemas auto-descritivos, cálculos puros, FSD aninhado em `feature/`). **Não tente "consertá-los" criando arquivos vazios** — eles têm `README.md` próprio explicando o estado intencional. Consulte [docs/architecture/MINIMAL_MODULES.md](docs/architecture/MINIMAL_MODULES.md) para a lista completa e os critérios de promoção.

## Design System — "Glass Briefing"

O ZattarOS segue o Design System **Glass Briefing** — glassmorphism com hierarquia por profundidade, cores em OKLCH, e sistema de superfícies inspirado em Material Design 3. **Toda implementação de UI DEVE respeitar este sistema.**

### Fontes Canônicas

| Arquivo | O que contém |
|---------|-------------|
| `src/app/globals.css` | 145+ CSS custom properties (`:root` e `.dark`), classes `.glass-*` |
| `src/lib/design-system/tokens.ts` | Tokens TS exportados (spacing, typography, opacity, layout, z-index) |
| `tailwind.config.ts` | Mapeamento Tailwind → CSS variables |
| `src/components/shared/glass-panel.tsx` | `GlassPanel` (depth 1–3) e `WidgetContainer` |
| `src/components/ui/typography.tsx` | `Heading` (5 níveis) e `Text` (10+ variantes semânticas) |

### Regras Obrigatórias de UI

1. **Nunca hardcode cores** — Use CSS variables (`bg-primary`, `text-muted-foreground`, `border-outline-variant`) ou tokens de `tokens.ts`. Cores literais como `bg-blue-500` ou `#hex` são proibidas.
2. **Hierarquia por Glass Depth** — Containers usam `GlassPanel` com depth semântico:
   - **Depth 1** (`glass-widget`): containers transparentes, painéis grandes
   - **Depth 2** (`glass-kpi`): cards de métricas, KPIs, destaque médio
   - **Depth 3** (`primary tint`): ênfase máxima
3. **Dialogs/Modals** — Usar classes `glass-dialog` e `glass-dialog-overlay` para manter consistência com blur/transparência.
4. **Tipografia via componentes** — Usar `Heading` e `Text` de `@/components/ui/typography` com as variantes semânticas (page, section, card, kpi-value, label, caption, meta-label, micro-caption, overline). Não inventar tamanhos avulsos.
5. **Espaçamento via tokens** — Seguir o grid de 4px definido em `SPACING` e os layouts semânticos (`PAGE_LAYOUT`, `SEMANTIC_SPACING`) de `tokens.ts`.
6. **Componentes shared obrigatórios** — Antes de criar componentes novos, verificar se já existe em `@/components/shared/` ou `@/components/ui/`:
   - Layout: `PageShell`, `FormShell`, `TemporalViewShell`, `DetailSheet`
   - Glass: `GlassPanel`, `WidgetContainer`, `AmbientBackdrop`
   - Navegação: `TabPills`, `ViewSwitcher`, `DateNavigation`, `WeekNavigator`
   - Dados: `DataTable`, `TablePagination`, `EmptyState`
   - Tipografia: `Heading`, `Text`, `BrandMark`
7. **Cores semânticas por namespace** — Usar os namespaces corretos:
   - Status: `--success`, `--warning`, `--info`, `--destructive`
   - Superfícies: `--surface-*` (9 variantes de container)
   - Chart/dados: `--chart-1` a `--chart-8`
   - Eventos: `--event-audiencia`, `--event-expediente`, `--event-prazo`, etc.
   - Portal: `--portal-*` (11 tokens dedicados)
   - Chat: `--chat-thread-bg`, `--chat-bubble-received`, `--chat-bubble-sent`, `--chat-sidebar-active`
   - Widgets: `--widget-*` (radius, padding, gap, transition)
8. **Opacidade via escala definida** — Usar os níveis de `OPACITY_SCALE` de `tokens.ts` (subtle, whisper, tint, soft, medium, strong, emphasis) em vez de valores arbitrários.
9. **Dark mode** — Toda UI deve funcionar em light e dark. As CSS variables já têm override em `.dark` — não criar lógica condicional manual.

### Referência Rápida de Validação Visual

Consulte `docs/architecture/VISUAL-REVIEW-CHECKLIST.md` para o checklist completo de auditoria visual (11 widgets, mapeamento semântico de tons, portal dashboard).

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

- **Framework**: Next.js 16 (App Router, Turbopack, Server Actions, React 19)
- **Linguagem**: TypeScript 5 (strict mode)
- **Estilização**: Tailwind CSS 4 + CSS variables OKLCH em `globals.css`
- **Componentes**: shadcn/ui + Design System "Glass Briefing" (`GlassPanel`, `Heading`, `Text`, `TabPills`)
- **Backend**: Supabase (PostgreSQL + RLS + pgvector), Redis
- **Design Tokens**: `src/lib/design-system/tokens.ts` (spacing, typography, opacity, layout)
- **Fonts**: Inter (body), Montserrat (heading), Manrope (headline/display), Geist Mono (mono)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- **Cores**: Sempre via CSS variables (`bg-primary`, `text-muted-foreground`) — nunca `bg-blue-500` ou `#hex`
- **Glass Depth**: `GlassPanel depth={1}` (containers) → `depth={2}` (KPIs) → `depth={3}` (ênfase)
- **Tipografia**: `Heading level="page|section|card"` e `Text variant="label|caption|kpi-value"` — sem tamanhos avulsos
- **Espaçamento**: Grid 4px via `SPACING`/`SEMANTIC_SPACING` de `tokens.ts`
- **Opacidade**: Escala semântica de `OPACITY_SCALE` (subtle → emphasis) — sem valores arbitrários
- **Componentes**: Verificar `@/components/shared/` e `@/components/ui/` antes de criar novos
- **Dialogs**: Classes `glass-dialog` + `glass-dialog-overlay` para consistência visual
- **Dark mode**: Obrigatório — CSS variables já têm override `.dark`, não criar lógica manual
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## Workflow

Edit directly. Não é necessário invocar GSD antes de Edit/Write.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
