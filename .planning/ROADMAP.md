# Roadmap: ZattarOS Chat Redesign

## Overview

Redesign completo do modulo de chat para alinhar ao design system Glass Briefing. O trabalho progride da estrutura (layout shell + sidebar) para o conteudo (bolhas e header), depois interacao (input, context bar, empty state) e finaliza com o detail panel e validacao de zero regressao.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Layout Shell & Sidebar** - Estrutura 3 colunas e sidebar com GlassPanel, TabPills e lista de conversas redesenhada
- [ ] **Phase 2: Header, Messages & Media** - Header glassmorphism, bolhas assimetricas, date separators e media bubbles (file, audio waveform, image, video)
- [ ] **Phase 3: Input, Context Bar & Empty State** - Textarea auto-resize, botoes de acao, context bar de processo vinculado e empty state com suggestion cards
- [ ] **Phase 4: Detail Panel & Preservation** - Painel lateral com perfil/processos/midia e validacao de zero regressao em todas as funcionalidades

## Phase Details

### Phase 1: Layout Shell & Sidebar
**Goal**: Users see the new 3-column layout structure and can browse conversations through a redesigned sidebar with Glass Briefing styling
**Depends on**: Nothing (first phase)
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, SIDE-01, SIDE-02, SIDE-03, SIDE-04, SIDE-05, SIDE-06, SIDE-07
**Success Criteria** (what must be TRUE):
  1. Chat page renders a 3-column layout (sidebar + chat area + detail placeholder) on desktop, and collapses appropriately on mobile
  2. Sidebar displays conversations grouped by section labels (Fixadas, Recentes) with GlassPanel background and functional tab filters (Todas, Privadas, Grupos, Processos)
  3. User can search conversations via SearchInput, create new conversations via styled button, and see hover/active states on conversation items
  4. Chat area shows ambient glow effects (radial gradients) consistent with Glass Briefing design system
  5. Mobile responsiveness preserved: sidebar hides when chat is selected, detail panel renders as Sheet on screens < 1280px
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Header, Messages & Media
**Goal**: Users experience the core chat conversation with glassmorphic header, redesigned message bubbles with asymmetric corners, and rich media rendering (files, audio waveform, images, video)
**Depends on**: Phase 1
**Requirements**: HEAD-01, HEAD-02, HEAD-03, HEAD-04, MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, MSG-07, MEDIA-01, MEDIA-02, MEDIA-03, MEDIA-04, MEDIA-05
**Success Criteria** (what must be TRUE):
  1. Chat header displays with backdrop-blur glassmorphism, contact avatar with online indicator, and ghost-styled action buttons
  2. Sent and received message bubbles render with asymmetric corners, appropriate colors (bg-primary for sent, bg-chat-bubble-received for received), sender avatars, names in group chats, timestamps, and delivery status icons
  3. Date separators appear between message groups with horizontal lines and centered label
  4. File attachments render with IconContainer and glass download button; audio messages show custom waveform with animated bars and adaptive play button; images and videos render with consistent border-radius
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Input, Context Bar & Empty State
**Goal**: Users can compose messages through a modern textarea with glass styling, see linked legal process context, and encounter helpful suggestion cards when no conversation is selected
**Depends on**: Phase 2
**Requirements**: INPUT-01, INPUT-02, INPUT-03, INPUT-04, INPUT-05, INPUT-06, INPUT-07, CTX-01, CTX-02, CTX-03, CTX-04, EMPTY-01, EMPTY-02, EMPTY-03, EMPTY-04, EMPTY-05
**Success Criteria** (what must be TRUE):
  1. Message input renders as auto-resizing textarea (1-6 lines) inside a glass container with proper focus ring, inline action buttons (emoji, attach, mic with destructive hover), and a styled send button
  2. Typing indicator shows redesigned bouncing dots animation below the input area
  3. Context bar appears below the header when a conversation has a linked legal process, showing tribunal badge, process number, and a clickable "Ver processo" link
  4. Empty state (no conversation selected) displays centered logo, description text, and a 2x2 grid of clickable suggestion cards with semantic color icons that populate the input
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Detail Panel & Preservation
**Goal**: Users can view contact/group details in a side panel and all existing chat functionality remains fully operational with zero regression
**Depends on**: Phase 3
**Requirements**: DETAIL-01, DETAIL-02, DETAIL-03, DETAIL-04, DETAIL-05, DETAIL-06, DETAIL-07, PRES-01, PRES-02, PRES-03, PRES-04, PRES-05, PRES-06, PRES-07
**Success Criteria** (what must be TRUE):
  1. Detail panel (320px) renders on the right with user/group profile (large avatar, name, role), information section (email, phone, member since), linked processes cards, and shared media grid with thumbnail previews
  2. Detail panel can be toggled via header button, and closed via its own close button
  3. All messaging features work end-to-end: text, file upload, image, video, and audio recording via MediaRecorder
  4. Dyte SDK calls (audio/video) remain functional, online/offline presence and typing indicators work, and mobile sidebar/chat toggle is preserved
  5. Lazy loading of ChatWindow and Suspense boundaries are maintained; Zustand store and existing hooks have no breaking changes
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Layout Shell & Sidebar | 0/0 | Not started | - |
| 2. Header, Messages & Media | 0/0 | Not started | - |
| 3. Input, Context Bar & Empty State | 0/0 | Not started | - |
| 4. Detail Panel & Preservation | 0/0 | Not started | - |
