# Phase 1: Layout Shell & Sidebar - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Estrutura 3-colunas (sidebar 360px + chat flex-1 + detail panel 320px placeholder) e redesign completo do sidebar com GlassPanel, TabPills, SearchInput e lista de conversas redesenhada. Ambient glow no chat area. Nenhuma mudanca no chat-window.tsx, chat-content.tsx, chat-bubbles.tsx ou chat-footer.tsx.

</domain>

<decisions>
## Implementation Decisions

### Tab Filtering
- **D-01:** Filtrar conversas por `sala.tipo` existente no domain (geral, privado, grupo, documento). Tab "Processos" = salas com tipo='documento'.
- **D-02:** Contadores nas tabs sao computed do array filtrado: `salas.filter(s => s.tipo === x).length`. Reativos ao search.
- **D-03:** Tab "Todas" mostra todas as salas sem filtro. Default ativo.

### Fixadas vs Recentes
- **D-04:** Adicionar campo `fixada` (boolean per-user) na tabela de salas do banco. Requer migracao SQL simples (ALTER TABLE + RLS policy).
- **D-05:** Ordenacao dentro de cada secao por data da ultima mensagem, mais recente primeiro.
- **D-06:** Secao "Fixadas" aparece apenas quando ha salas fixadas. "Recentes" e o label padrao para salas nao fixadas.

### Detail Panel Toggle
- **D-07:** Detail panel comeca ESCONDIDO por padrao. Nao renderiza a 3a coluna ate o usuario ativar.
- **D-08:** Toggle via clique no nome/avatar do contato no chat header. Nao ha botao dedicado separado.
- **D-09:** Nesta fase (Phase 1), o detail panel e apenas um placeholder slot no layout. A implementacao real e Phase 4.

### Migration Strategy
- **D-10:** Substituicao big bang: ChatLayout + ChatSidebar + ChatListItem refatorados no mesmo commit. Sem estado intermediario.
- **D-11:** chat-window.tsx, chat-content.tsx, chat-bubbles.tsx e chat-footer.tsx NAO sao tocados na Phase 1.
- **D-12:** Container externo (chat-shell) usa border sutil (border-border) sem box-shadow. Fundo bg-surface-container-low.

### Claude's Discretion
- Detalhes de implementacao da migracao SQL para o campo `fixada`
- Logica exata do toggle state para o detail panel (useState vs zustand)
- Abordagem CSS para ambient glow (pseudo-elements vs divs)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `docs/mocs/chat-redesign-moc.html` — MOC aprovado com todas as decisoes visuais
- `.planning/phases/01-layout-shell-sidebar/01-UI-SPEC.md` — Contrato de design UI (spacing, typography, color, copywriting)
- `src/app/globals.css` — Tokens CSS (--chat-thread-bg, --chat-sidebar-active, glass-widget, etc.)

### Componentes a Reutilizar
- `src/components/shared/glass-panel.tsx` — GlassPanel (depth 1/2/3)
- `src/components/dashboard/tab-pills.tsx` — TabPills component
- `src/components/dashboard/search-input.tsx` — SearchInput component
- `src/components/ui/icon-container.tsx` — IconContainer (xs/sm/md/lg)
- `src/components/ui/typography.tsx` — Heading, Text components

### Componentes a Refatorar
- `src/app/(authenticated)/chat/components/chat-layout.tsx` — Container principal (2-col -> 3-col)
- `src/app/(authenticated)/chat/components/chat-sidebar.tsx` — Lista de conversas (Card -> GlassPanel)
- `src/app/(authenticated)/chat/components/chat-list-item.tsx` — Item da lista (redesign)
- `src/app/(authenticated)/chat/components/chat-sidebar-wrapper.tsx` — State container

### Paginas Referencia (Design System Glass Briefing)
- `src/app/(authenticated)/audiencias/audiencias-client.tsx` — Referencia de uso de GlassPanel + TabPills + SearchInput
- `src/app/(authenticated)/processos/processos-client.tsx` — Referencia de padroes de lista

### Domain e State
- `src/app/(authenticated)/chat/domain.ts` — Tipos (ChatItem, TipoSalaChat)
- `src/app/(authenticated)/chat/hooks/use-chat-store.ts` — Zustand store

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **GlassPanel**: Container glass com depth 1/2/3. Usar depth-1 para sidebar container.
- **TabPills**: Aceita `tabs: {id, label, count?}[]`, `active`, `onChange`. Reutilizar direto.
- **SearchInput**: Aceita `value`, `onChange`, `placeholder`. Reutilizar direto.
- **IconContainer**: Para avatares e icones. Sizes: xs(20px), sm(24px), md(32px), lg(40px).
- **EmptyState**: Para estado vazio de busca. Aceita `icon`, `title`, `description`.

### Established Patterns
- **Zustand store**: `useChatStore` gerencia selectedChat, mensagens, salas. Manter interface.
- **Responsive toggle**: `selectedChat ? "hidden md:block" : "block"` — padrao existente.
- **Avatar fallback**: `generateAvatarFallback(name)` de `@/lib/utils`.
- **Online indicator**: `AvatarIndicator variant={onlineStatus}` — componente existente.

### Integration Points
- `ChatLayout` recebe `salas`, `currentUserId`, `currentUserName`, `initialSelectedChat` do server component page.tsx
- `ChatSidebarWrapper` conecta store ao sidebar. Filtragem pode ser adicionada aqui.
- `useChatPresence` hook ativado no ChatLayout — manter.

</code_context>

<specifics>
## Specific Ideas

- MOC HTML em `docs/mocs/chat-redesign-moc.html` e a referencia visual definitiva
- Section labels "Fixadas" e "Recentes" com style: `text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground/35`
- Conversation items com avatar `rounded-xl` (nao circular) — alinhado ao IconContainer
- Unread badge em `bg-primary` em vez de `bg-success` (consistencia cromatica)
- Ambient glow com dois radial-gradients: top-right `rgba(139,92,246,0.04)` e bottom-left `rgba(139,92,246,0.02)`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-layout-shell-sidebar*
*Context gathered: 2026-04-09*
