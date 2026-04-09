# ZattarOS Chat Redesign

## What This Is

Redesign completo do modulo de chat do ZattarOS para alinhar ao design system "Glass Briefing" ja implementado em Audiencias, Expedientes e Processos. Inclui refatoracao visual de todos os componentes (sidebar, bolhas, header, input, detail panel) e introducao de novas features como context bar de processo vinculado, audio waveform visual e empty state com suggestion cards.

## Core Value

Comunicacao em tempo real entre advogados e equipe com coerencia visual total ao design system Glass Briefing, preservando todas as funcionalidades existentes (mensagens, chamadas, gravacao de audio, upload de arquivos).

## Requirements

### Validated

- ✓ Mensagens de texto em tempo real com Supabase Realtime — existente
- ✓ Chamadas de audio e video via Dyte SDK — existente
- ✓ Upload de arquivos (imagem, video, audio, documento) — existente
- ✓ Gravacao de audio inline com MediaRecorder — existente
- ✓ Presenca online/offline — existente
- ✓ Indicador de digitacao — existente
- ✓ Salas privadas, grupos e sala geral — existente
- ✓ Status de entrega de mensagem (enviando, enviado, lido) — existente
- ✓ Busca de conversas — existente
- ✓ Responsividade mobile (sidebar/chat toggle) — existente

### Active

- [ ] Redesign do sidebar com GlassPanel, TabPills e SearchInput do design system
- [ ] Redesign das bolhas de mensagem com cantos assimetricos e glow sutil
- [ ] Redesign do header com glassmorfismo (backdrop-blur + transparencia)
- [ ] Context bar mostrando processo vinculado a conversa
- [ ] Redesign do input area com textarea auto-resize e container glass
- [ ] Detail panel lateral (perfil, processos vinculados, midia compartilhada)
- [ ] Audio waveform visual customizado substituindo player nativo
- [ ] Empty state com suggestion cards para dominio juridico
- [ ] File bubble redesenhada com IconContainer e layout glass
- [ ] Image/video bubbles com cantos arredondados consistentes
- [ ] Section labels na lista de conversas (Fixadas, Recentes)
- [ ] Tab filters na sidebar (Todas, Privadas, Grupos, Processos)
- [ ] Ambient glow no chat area (radial gradients sutis como MissionCard)
- [ ] Typing indicator redesenhado com dots animados

### Out of Scope

- Mudancas na logica de negocio (service.ts, repository.ts) — apenas visual
- Alteracoes no sistema de chamadas (Dyte SDK) — manter funcional
- Migracao de banco de dados — nenhuma mudanca no schema
- Novas funcionalidades de backend — foco exclusivo em frontend
- Threads/respostas em mensagens — complexidade excessiva para v1 do redesign

## Context

O ZattarOS e um sistema corporativo para firmas legais. O chat e usado internamente entre advogados e equipe. As paginas de Audiencias, Expedientes e Processos ja foram refatoradas para o design system "Glass Briefing" que usa:

- **GlassPanel** (3 niveis de depth) como primitiva visual principal
- **TabPills**, **SearchInput**, **ViewToggle** como controles padrao
- **IconContainer** com backgrounds de 8% opacity
- **Heading** com niveis (page, card, widget)
- Tipografia: Inter (corpo), Montserrat (titulos), Geist Mono (codigo)
- Cores OKLCH com primary purple (#8b5cf6), semantic colors (success, warning, destructive, info)
- Tokens CSS: `--chat-thread-bg`, `--chat-bubble-received`, `--chat-bubble-sent`, `--chat-sidebar-active`
- Ambient glow effects com `bg-primary/5 blur-3xl`
- Text scales: `text-[10px]` labels, `text-[9px]` badges, `text-xs` conteudo
- Rounded: `rounded-2xl` cards, `rounded-xl` botoes, `rounded-lg` inputs

O MOC de referencia esta em `docs/mocs/chat-redesign-moc.html`.

Componentes existentes do chat que serao refatorados:
- `chat-layout.tsx` — Container principal (flex 2-colunas → 3-colunas)
- `chat-sidebar.tsx` — Lista de conversas (Card → GlassPanel + TabPills)
- `chat-header.tsx` — Header da conversa (bg-card → backdrop-blur glass)
- `chat-content.tsx` — Area de mensagens (adicionar ambient glow)
- `chat-bubbles.tsx` — Bolhas de mensagem (redesign completo)
- `chat-footer.tsx` — Input de mensagem (Input → textarea glass)
- `chat-list-item.tsx` — Item da lista de conversas (redesign)
- `user-detail-sheet.tsx` — Sheet → Panel fixo lateral

## Constraints

- **Stack**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui — manter
- **Componentes shared**: Reutilizar GlassPanel, TabPills, SearchInput, IconContainer, Heading, SemanticBadge
- **FSD Architecture**: Manter modulo em `src/app/(authenticated)/chat/`
- **Tokens CSS existentes**: Usar os tokens `--chat-*` ja definidos em globals.css
- **Funcionalidade**: Zero regressao — todas as features atuais devem continuar funcionando
- **Performance**: Manter lazy loading do ChatWindow e Suspense boundaries

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Layout 3 colunas (sidebar + chat + detail) | Segue padrao moderno (Telegram, Slack) e permite ver processos vinculados | — Pending |
| Detail panel fixo em vez de Sheet | Mais acessivel que slide-over, info sempre visivel | — Pending |
| Textarea auto-resize em vez de Input | Padrao moderno (ChatGPT, Claude), suporta mensagens longas | — Pending |
| Audio waveform visual customizado | Player nativo quebra consistencia visual | — Pending |
| Context bar de processo vinculado | Inovacao especifica para dominio legal, nenhum chat tem isso | — Pending |
| Cantos assimetricos nas bolhas | Indica direcao do remetente (padrao universal de chat) | — Pending |
| Ambient glow no chat area | Consistencia com MissionCard das audiencias | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 after initialization*
