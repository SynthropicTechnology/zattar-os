# Phase 1: Layout Shell & Sidebar - Research

**Researched:** 2026-04-09
**Domain:** React UI refactoring — 3-column layout, Glass Briefing design system, Tailwind CSS 4, Zustand state management
**Confidence:** HIGH

## Summary

Phase 1 is a visual refactoring of the chat module's layout and sidebar components. The current implementation uses a 2-column flex layout (`ChatLayout`) with a `Card`-based sidebar (`ChatSidebar`). The target is a 3-column layout (sidebar 360px + chat flex-1 + detail panel placeholder 320px) with Glass Briefing design system integration: `GlassPanel` container for sidebar, `TabPills` for filtering, `SearchInput` for conversation search, section labels for grouping (Fixadas/Recentes), and ambient glow radial gradients on the chat area.

All shared components required already exist in the codebase: `GlassPanel` (depth 1/2/3), `TabPills` (with counter support), `SearchInput` (controlled value/onChange), `Heading` (level="page"), and `EmptyState`. The Zustand store (`useChatStore`) already manages `selectedChat`, `salas`, and the mobile toggle pattern (`selectedChat ? "hidden md:block" : "block"`). The refactoring is additive — no new libraries needed, no breaking changes to the store interface.

**Primary recommendation:** Refactor the 4 target files (chat-layout, chat-sidebar, chat-list-item, chat-sidebar-wrapper) in a single coordinated commit, replacing Card-based sidebar with GlassPanel + TabPills + SearchInput, restructuring to 3-column layout, and adding ambient glow via CSS pseudo-elements. Add tab filtering logic and section grouping in ChatSidebarWrapper.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Filtrar conversas por `sala.tipo` existente no domain (geral, privado, grupo, documento). Tab "Processos" = salas com tipo='documento'.
- **D-02:** Contadores nas tabs sao computed do array filtrado: `salas.filter(s => s.tipo === x).length`. Reativos ao search.
- **D-03:** Tab "Todas" mostra todas as salas sem filtro. Default ativo.
- **D-04:** Adicionar campo `fixada` (boolean per-user) na tabela de salas do banco. Requer migracao SQL simples (ALTER TABLE + RLS policy).
- **D-05:** Ordenacao dentro de cada secao por data da ultima mensagem, mais recente primeiro.
- **D-06:** Secao "Fixadas" aparece apenas quando ha salas fixadas. "Recentes" e o label padrao para salas nao fixadas.
- **D-07:** Detail panel comeca ESCONDIDO por padrao. Nao renderiza a 3a coluna ate o usuario ativar.
- **D-08:** Toggle via clique no nome/avatar do contato no chat header. Nao ha botao dedicado separado.
- **D-09:** Nesta fase (Phase 1), o detail panel e apenas um placeholder slot no layout. A implementacao real e Phase 4.
- **D-10:** Substituicao big bang: ChatLayout + ChatSidebar + ChatListItem refatorados no mesmo commit. Sem estado intermediario.
- **D-11:** chat-window.tsx, chat-content.tsx, chat-bubbles.tsx e chat-footer.tsx NAO sao tocados na Phase 1.
- **D-12:** Container externo (chat-shell) usa border sutil (border-border) sem box-shadow. Fundo bg-surface-container-low.

### Claude's Discretion
- Detalhes de implementacao da migracao SQL para o campo `fixada`
- Logica exata do toggle state para o detail panel (useState vs zustand)
- Abordagem CSS para ambient glow (pseudo-elements vs divs)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAYOUT-01 | Layout principal suporta 3 colunas (sidebar + chat + detail panel) com responsividade | ChatLayout refactor: flex container with sidebar 360px + chat flex-1 + detail conditional 320px |
| LAYOUT-02 | Sidebar esconde em mobile quando chat selecionado (manter comportamento existente) | Existing pattern in ChatLayout via `selectedChat` state + cn() — preserve and adapt |
| LAYOUT-03 | Detail panel aparece como terceira coluna em telas >= 1280px e como Sheet em telas menores | Phase 1: placeholder slot only (D-07/D-09). Reserve w-[320px] behind conditional, Sheet deferred to Phase 4 |
| LAYOUT-04 | Chat area ocupa flex-1 com ambient glow (radial gradients sutis nos cantos) | CSS ::before/::after pseudo-elements on chat area div with pointer-events-none |
| SIDE-01 | Container da sidebar usa background transparente com borda sutil (padrao GlassPanel) | Replace Card with GlassPanel depth=1, add border-r border-border/6 |
| SIDE-02 | TabPills com filtros (Todas, Privadas, Grupos, Processos) com contadores | Reuse existing TabPills component, compute counts from filtered salas array |
| SIDE-03 | SearchInput do design system com icone, focus ring primary e placeholder | Replace current Input+Search icon with SearchInput component |
| SIDE-04 | Section labels ("Fixadas", "Recentes") agrupando conversas por relevancia | New field `fixada` in DB + grouping logic in ChatSidebarWrapper |
| SIDE-05 | Conversation items redesenhados com avatar rounded-xl, preview truncada, badge unread em primary | Refactor ChatListItem: rounded-xl avatar, bg-primary unread badge, new spacing |
| SIDE-06 | Hover state em items com bg-foreground/[0.04] e item ativo com bg-chat-sidebar-active | Update ChatListItem hover/active classes per UI spec |
| SIDE-07 | Botao "Nova" conversa com estilo primary (bg-primary, shadow, rounded-xl) | New styled button in sidebar header triggering existing novo-chat-dialog.tsx |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16 | App Router, server/client components | Project stack — locked |
| React | 19 | UI rendering | Project stack — locked |
| Tailwind CSS | 4 | Styling (v4 syntax with CSS variables) | Project stack — locked |
| Zustand | 5.x | Client state (useChatStore) | Already used for chat state |
| shadcn/ui | latest | Base UI primitives (Skeleton, Sheet) | Project stack — locked |
| Zod | 3.x | Schema validation (domain.ts) | Already used in chat module |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | latest | Icons (Plus, Search, MessageCircle, Pin) | All icon needs |
| class-variance-authority | latest | Component variants (if needed) | Complex variant patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS pseudo-elements for glow | Separate div elements | Divs are simpler but add DOM nodes; pseudo-elements are cleaner — use pseudo-elements (Claude's discretion) |
| useState for detail toggle | Zustand store (showProfileSheet already exists) | Store already has `showProfileSheet` + `toggleProfileSheet` — reuse it for detail panel toggle |

**Installation:** No new packages needed. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure (no changes to file tree)
```
src/app/(authenticated)/chat/
  components/
    chat-layout.tsx          # REFACTOR: 2-col -> 3-col + ambient glow
    chat-sidebar.tsx         # REFACTOR: Card -> GlassPanel + TabPills + sections
    chat-list-item.tsx       # REFACTOR: new visual design
    chat-sidebar-wrapper.tsx # REFACTOR: add tab filter + section grouping logic
    action-dropdown.tsx      # UNTOUCHED
    novo-chat-dialog.tsx     # UNTOUCHED (triggered by new button)
    chat-window.tsx          # UNTOUCHED (D-11)
    chat-content.tsx         # UNTOUCHED (D-11)
    chat-bubbles.tsx         # UNTOUCHED (D-11)
    chat-footer.tsx          # UNTOUCHED (D-11)
    chat-header.tsx          # UNTOUCHED (D-11)
  domain.ts                  # MINOR: ChatItem may need `fixada` field
  hooks/use-chat-store.ts    # UNTOUCHED (interface preserved)
  page.tsx                   # UNTOUCHED (server component)
  index.ts                   # UNTOUCHED (exports preserved)
```

### Pattern 1: Tab Filtering in ChatSidebarWrapper
**What:** ChatSidebarWrapper manages tab state and computes filtered + grouped conversations
**When to use:** The wrapper already connects store to sidebar. Add filtering here.
**Example:**
```typescript
// Source: CONTEXT.md D-01, D-02, D-03
const [activeTab, setActiveTab] = useState('todas');
const [searchTerm, setSearchTerm] = useState('');

const filteredSalas = useMemo(() => {
  let result = salasParaExibir;
  
  // Search filter
  if (searchTerm) {
    result = result.filter(s => 
      (s.name || s.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Tab filter
  if (activeTab !== 'todas') {
    const tipoMap: Record<string, TipoSalaChat> = {
      privadas: TipoSalaChat.Privado,
      grupos: TipoSalaChat.Grupo,
      processos: TipoSalaChat.Documento,
    };
    result = result.filter(s => s.tipo === tipoMap[activeTab]);
  }
  
  return result;
}, [salasParaExibir, activeTab, searchTerm]);

// Tab counts (reactive to search per D-02)
const tabCounts = useMemo(() => {
  const base = searchTerm 
    ? salasParaExibir.filter(s => (s.name || s.nome || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : salasParaExibir;
  return {
    todas: base.length,
    privadas: base.filter(s => s.tipo === TipoSalaChat.Privado).length,
    grupos: base.filter(s => s.tipo === TipoSalaChat.Grupo).length,
    processos: base.filter(s => s.tipo === TipoSalaChat.Documento).length,
  };
}, [salasParaExibir, searchTerm]);
```

### Pattern 2: Section Grouping (Fixadas/Recentes)
**What:** Split filtered salas into pinned and unpinned, sorted by last message date
**When to use:** After filtering, before rendering
**Example:**
```typescript
// Source: CONTEXT.md D-04, D-05, D-06
const { fixadas, recentes } = useMemo(() => {
  const sorted = [...filteredSalas].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
  return {
    fixadas: sorted.filter(s => s.fixada),
    recentes: sorted.filter(s => !s.fixada),
  };
}, [filteredSalas]);
```

### Pattern 3: Ambient Glow via CSS
**What:** Two radial gradients on chat area using Tailwind arbitrary CSS
**When to use:** ChatLayout chat area container
**Example:**
```typescript
// Source: UI-SPEC.md — Ambient Glow section
// Use a wrapper div with relative positioning and overflow-hidden
// Then add two absolutely-positioned glow divs with pointer-events-none
<div className="flex-1 min-w-0 flex flex-col relative bg-(--chat-thread-bg) overflow-hidden">
  {/* Ambient glow - top right */}
  <div 
    className="absolute top-0 right-0 w-[300px] h-[300px] pointer-events-none z-0"
    style={{
      background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)',
    }}
  />
  {/* Ambient glow - bottom left */}
  <div 
    className="absolute bottom-0 left-0 w-[250px] h-[250px] pointer-events-none z-0"
    style={{
      background: 'radial-gradient(circle, rgba(139,92,246,0.02) 0%, transparent 70%)',
    }}
  />
  {/* Content at z-10 */}
  <div className="relative z-10 flex-1 flex flex-col">
    {children}
  </div>
</div>
```

### Pattern 4: Tailwind v4 CSS Variable Syntax
**What:** Project uses Tailwind v4 which requires parentheses syntax for CSS variables
**Critical:** Per the tailwind-v4-expert skill, ALWAYS use `bg-(--variable)` NOT `bg-[var(--variable)]`
**Example:**
```typescript
// CORRECT (v4)
className="bg-(--surface-container-low)"
className="bg-(--chat-thread-bg)"
className="bg-(--chat-sidebar-active)"

// WRONG (v3 — do not use)
className="bg-[var(--surface-container-low)]"
```
**Exception:** Calc expressions still use bracket syntax with explicit `var()`:
```typescript
className="h-[calc(100vh-var(--header-height))]"
```

### Anti-Patterns to Avoid
- **Cross-deep imports:** Do NOT import from other modules' internal components. Use barrel exports via `index.ts`.
- **Breaking store interface:** Do NOT change the `useChatStore` interface. The `showProfileSheet` / `toggleProfileSheet` actions already exist and can be reused for detail panel toggle.
- **Touching untouchable files:** D-11 explicitly forbids changes to chat-window, chat-content, chat-bubbles, chat-footer.
- **Creating new files unnecessarily:** All changes are refactors of existing files. The only potentially new thing is the SQL migration file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Glass panel container | Custom div with glass styles | `GlassPanel depth={1}` from `@/components/shared/glass-panel` | Already handles depth variants, border, backdrop |
| Tab filtering UI | Custom tab buttons | `TabPills` from `@/components/dashboard/tab-pills` | Already has counter support, active states, styling |
| Search input with icon | Custom Input + Search icon | `SearchInput` from `@/components/dashboard/search-input` | Already has icon, focus ring, placeholder styling |
| Page heading | Custom h1/h2 | `Heading level="page"` from `@/components/ui/typography` | Consistent with Glass Briefing design system |
| Empty state | Custom placeholder | `EmptyState` from `@/components/shared/empty-state` | Already accepts icon, title, description |
| Avatar with fallback | Custom avatar logic | `Avatar + AvatarFallback + AvatarIndicator` from `@/components/ui/avatar` | Already used in ChatListItem, keep pattern |

**Key insight:** The entire Glass Briefing design system is already implemented in the codebase. Phase 1 is about replacing older Card-based components with the existing glass components, not building new primitives.

## Common Pitfalls

### Pitfall 1: Tailwind v4 CSS Variable Syntax
**What goes wrong:** Using v3 syntax `bg-[var(--token)]` instead of v4 `bg-(--token)` causes classes to not apply.
**Why it happens:** Training data and muscle memory default to v3 bracket syntax.
**How to avoid:** Always use parentheses for CSS variables: `bg-(--surface-container-low)`. Only use `var()` inside `calc()` expressions.
**Warning signs:** Styles not applying, unexpected transparent backgrounds.

### Pitfall 2: SearchInput API Mismatch
**What goes wrong:** The existing `ChatSidebar` uses an uncontrolled `Input` with `onChange` receiving an event. `SearchInput` expects controlled `value` + `onChange(string)`.
**Why it happens:** Different API signatures between native Input and SearchInput component.
**How to avoid:** Lift search state to `ChatSidebarWrapper` as `useState<string>('')`, pass `value` and `onChange` to SearchInput.
**Warning signs:** Type errors on onChange handler.

### Pitfall 3: Mobile Responsive Toggle Regression
**What goes wrong:** Changing the layout structure breaks the existing mobile toggle where sidebar hides when chat is selected.
**Why it happens:** The toggle relies on specific CSS class patterns tied to the flex container structure.
**How to avoid:** Preserve the `cn("...", selectedChat ? "hidden md:flex" : "flex")` pattern on both sidebar and chat area. Test at mobile breakpoint.
**Warning signs:** Both sidebar and chat visible simultaneously on mobile, or neither visible.

### Pitfall 4: GlassPanel Rounded Corners vs Shell
**What goes wrong:** GlassPanel defaults to `rounded-2xl` but sidebar should be flush with the shell edges (no rounded corners on inner components).
**Why it happens:** GlassPanel always adds rounded corners.
**How to avoid:** Override with `className="rounded-none"` or don't use GlassPanel for the sidebar container — instead apply only the glass-widget styles directly. Alternative: use GlassPanel with `className="rounded-none border-0 border-r border-border/6"`.
**Warning signs:** Double rounded corners creating visual artifacts.

### Pitfall 5: fixada Field Not Yet in Database
**What goes wrong:** Rendering section labels for "Fixadas" requires the `fixada` boolean field on `ChatItem`, but it doesn't exist in the database yet.
**Why it happens:** D-04 requires a SQL migration, which must be created and applied before the UI can use it.
**How to avoid:** Create the migration early in the implementation. Make the UI gracefully handle `fixada` being undefined (treat as false). Add `fixada?: boolean` to ChatItem and SalaChat interfaces.
**Warning signs:** "Fixadas" section never appearing despite UI code being correct.

### Pitfall 6: Surface Container Low Token
**What goes wrong:** Using `bg-surface-container-low` as a Tailwind class when the token is actually `--surface-container-low` as a CSS variable.
**Why it happens:** The CSS defines `--surface-container-low` as a custom property but the utility class mapping may differ.
**How to avoid:** Check globals.css — the token is mapped as `--color-surface-container-low: var(--surface-container-low)`. Use `bg-(--surface-container-low)` or check if there's a mapped utility. The globals.css maps it via `--color-surface-container-low` so Tailwind should recognize `bg-surface-container-low`.
**Warning signs:** Background color not applying correctly.

## Code Examples

### ChatLayout Refactored Shell Structure
```typescript
// Source: UI-SPEC.md Layout Specification
// Key changes: 2-col -> 3-col, border/rounded-2xl shell, ambient glow, bg-surface-container-low
<div className="flex h-[calc(100vh-2rem)] m-4 rounded-2xl border border-border overflow-hidden bg-(--surface-container-low)">
  {/* Sidebar */}
  <div className={cn(
    "h-full flex flex-col border-r border-white/[0.06] bg-(--surface-container-low)",
    "w-full md:w-[360px] md:min-w-[360px] shrink-0",
    selectedChat ? "hidden md:flex" : "flex"
  )}>
    <ChatSidebarWrapper salas={salas} currentUserId={currentUserId} />
  </div>

  {/* Chat Area with ambient glow */}
  <div className={cn(
    "h-full flex-1 min-w-0 flex flex-col relative bg-(--chat-thread-bg) overflow-hidden",
    !selectedChat ? "hidden md:flex" : "flex"
  )}>
    {/* Glow elements */}
    {/* Content */}
  </div>

  {/* Detail Panel Placeholder (Phase 4) — hidden by default per D-07 */}
  {showDetailPanel && (
    <div className="hidden xl:flex w-[320px] shrink-0 border-l border-white/[0.06]">
      {/* Phase 4 content */}
    </div>
  )}
</div>
```

### ChatSidebar with GlassPanel + TabPills
```typescript
// Source: UI-SPEC.md Sidebar Specification
// Replace Card with GlassPanel styling, add header section
<div className="flex flex-col h-full">
  {/* Header */}
  <div className="px-6 pt-6 space-y-4">
    {/* Title row */}
    <div className="flex items-center justify-between">
      <div>
        <Heading level="page">Mensagens</Heading>
        <p className="text-[0.6rem] uppercase tracking-[0.08em] text-muted-foreground/50 font-normal">
          Comunicacao da equipe
        </p>
      </div>
      <button className="flex items-center gap-1.5 px-4 py-1 rounded-xl bg-primary text-white text-[0.7rem] font-semibold shadow-[0_2px_8px_rgba(139,92,246,0.25)] hover:bg-[#7c4ddb] hover:-translate-y-px transition-all cursor-pointer">
        <Plus className="size-3.5" />
        Nova Conversa
      </button>
    </div>

    {/* Search */}
    <SearchInput value={search} onChange={setSearch} placeholder="Buscar conversas..." />

    {/* Tab pills */}
    <TabPills tabs={tabs} active={activeTab} onChange={setActiveTab} />
  </div>

  {/* Conversation list */}
  <div className="flex-1 overflow-y-auto px-2">
    {fixadas.length > 0 && (
      <>
        <SectionLabel text="Fixadas" />
        {fixadas.map(sala => <ChatListItem key={sala.id} ... />)}
      </>
    )}
    <SectionLabel text="Recentes" />
    {recentes.map(sala => <ChatListItem key={sala.id} ... />)}
  </div>
</div>
```

### ChatListItem Redesigned
```typescript
// Source: UI-SPEC.md Conversation Item
<div className={cn(
  "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200",
  "border border-transparent",
  active ? "bg-(--chat-sidebar-active) border-primary/[0.08]" : "hover:bg-foreground/[0.03]"
)} onClick={onClick}>
  {/* Avatar 40px rounded-xl */}
  <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
    {chat.image ? (
      <img src={chat.image} alt={chat.name} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-primary/12 text-primary text-xs font-semibold">
        {generateAvatarFallback(chat.name || chat.nome)}
      </div>
    )}
    {/* Online indicator */}
    <div className={cn(
      "absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full border-2 border-(--surface-container-low) z-10",
      chat.usuario?.onlineStatus === 'online' ? "bg-success" : "bg-muted-foreground/30"
    )} />
  </div>

  {/* Info */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[0.8rem] font-semibold text-foreground truncate">{chat.name || chat.nome}</span>
      <span className="text-[0.6rem] text-muted-foreground/40 tabular-nums shrink-0">
        {formatTimestamp(chat.date)}
      </span>
    </div>
    <div className="flex items-center justify-between gap-2 mt-1">
      <span className="text-[0.7rem] text-muted-foreground/50 truncate flex-1">{chat.lastMessage}</span>
      {unreadCount > 0 && (
        <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[0.6rem] font-semibold flex items-center justify-center px-1 shrink-0">
          {unreadCount}
        </span>
      )}
    </div>
  </div>
</div>
```

### SQL Migration for `fixada` field
```sql
-- Source: D-04 decision
-- supabase/migrations/XXXXXXXX_add_fixada_to_salas_chat.sql
ALTER TABLE salas_chat_participantes ADD COLUMN fixada BOOLEAN NOT NULL DEFAULT FALSE;

-- RLS: users can only pin their own conversations
-- The existing RLS on salas_chat_participantes already restricts by user
-- No additional policy needed if the update is done through an authenticated action
```

Note: The `fixada` field should be per-user, so it belongs on the junction table `salas_chat_participantes` (not on `salas_chat` directly). This way each user can pin different conversations. The repository query joins this table already.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Card + CardHeader + CardContent | GlassPanel (depth system) | Project design system adoption | Replace Card wrapper in ChatSidebar |
| Input + manual Search icon | SearchInput component | Project design system | Replace manual search implementation |
| No tab filtering | TabPills component | Project design system | Add filtering capability |
| bg-success unread badge | bg-primary unread badge | UI spec decision | Chromatic consistency with design system |
| Circular avatar (rounded-full) | Rounded-xl avatar | Glass Briefing standard | Align with IconContainer aesthetic |
| bg-[var(--token)] | bg-(--token) | Tailwind v4 | Must use new syntax throughout |

## Open Questions

1. **`fixada` column placement**
   - What we know: D-04 says "campo fixada na tabela de salas do banco". The decision says it is per-user.
   - What's unclear: Whether it goes on `salas_chat` (global pin) or `salas_chat_participantes` (per-user pin). Per-user is more correct.
   - Recommendation: Place on `salas_chat_participantes` junction table. The repository already joins this table. Claude's discretion area.

2. **Detail panel toggle state location**
   - What we know: Store already has `showProfileSheet` + `toggleProfileSheet`. D-07/D-08 say detail starts hidden, toggles via header click.
   - What's unclear: Whether to reuse `showProfileSheet` (semantic mismatch) or add new state.
   - Recommendation: Reuse `showProfileSheet` for now — it already serves the same purpose (showing user detail). Rename can happen in Phase 4 if needed.

3. **SearchInput width constraint**
   - What we know: The existing SearchInput has a hardcoded `w-56`. In the sidebar context, it needs to be full-width.
   - What's unclear: Whether to modify SearchInput globally or override via className.
   - Recommendation: Pass `className="w-full"` to SearchInput. The component accepts className prop and it should override the default width.

## Project Constraints (from CLAUDE.md)

- **FSD Architecture:** Module stays in `src/app/(authenticated)/chat/`. No cross-deep imports.
- **Action-Wrapper:** Any new server actions must use `authenticatedAction` from `@/lib/safe-action`.
- **Shell UI patterns:** Use `PageShell`, `DataShell`, `DialogFormShell` from `@/components/shared` where applicable. Chat uses its own shell pattern (ChatLayout is the shell).
- **Tailwind v4 syntax:** Use parentheses for CSS variables: `bg-(--token)`, NOT `bg-[var(--token)]`.
- **PT-BR language:** All business text in Portuguese. UI copy defined in UI-SPEC.md copywriting contract.
- **Zero regression:** All existing features must continue working (PRES-* requirements).
- **Lazy loading preserved:** ChatWindow remains lazy-loaded with Suspense boundary.
- **Validate commands:** `npm run type-check`, `npm run check:architecture`, `npm run validate:exports` must pass.

## Sources

### Primary (HIGH confidence)
- Codebase files read directly: chat-layout.tsx, chat-sidebar.tsx, chat-list-item.tsx, chat-sidebar-wrapper.tsx, domain.ts, use-chat-store.ts, page.tsx, glass-panel.tsx, tab-pills.tsx, search-input.tsx, audiencias-client.tsx, globals.css, index.ts
- `.planning/phases/01-layout-shell-sidebar/01-CONTEXT.md` — All implementation decisions
- `.planning/phases/01-layout-shell-sidebar/01-UI-SPEC.md` — Complete visual contract
- `.claude/skills/tailwind-v4-expert/SKILL.md` — Tailwind v4 syntax rules

### Secondary (MEDIUM confidence)
- SQL migration approach for `fixada` field — inferred from project patterns (supabase/migrations/ directory exists, RLS standard)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, verified by reading actual files
- Architecture: HIGH — refactoring existing components with clear UI spec and decisions
- Pitfalls: HIGH — identified from actual code analysis (API mismatches, syntax differences, DB field)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable — no external dependencies, all internal refactoring)
