# Roadmap: ZattarOS

## Milestones

- [ ] **v1.0 Chat Redesign** - Phases 1-4 (not started)
- [ ] **v1.1 Revisao Completa — Audiencias** - Phases 5-8 (in progress)

## Phases

<details>
<summary>v1.0 Chat Redesign (Phases 1-4)</summary>

- [ ] **Phase 1: Layout Shell & Sidebar** - Estrutura 3 colunas e sidebar com GlassPanel, TabPills e lista de conversas redesenhada
- [ ] **Phase 2: Header, Messages & Media** - Header glassmorphism, bolhas assimetricas, date separators e media bubbles
- [ ] **Phase 3: Input, Context Bar & Empty State** - Textarea auto-resize, context bar de processo vinculado e empty state
- [ ] **Phase 4: Detail Panel & Preservation** - Painel lateral com perfil/processos/midia e zero regressao

</details>

### v1.1 Revisao Completa — Audiencias

- [ ] **Phase 5: Indicadores & Detail Dialog** - Badges semanticos compartilhados e dialog centrado com todas as secoes
- [ ] **Phase 6: Redesign Views** - Overhaul visual de Lista, Mes, Ano e Semana views com Glass Briefing
- [ ] **Phase 7: Wiring & Edicao** - Conexao de componentes existentes e edicao inline de dados
- [ ] **Phase 8: Filtros & Cleanup** - Filtros avancados e remocao de componentes legados

## Phase Details

<details>
<summary>v1.0 Chat Redesign (Phases 1-4)</summary>

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
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [ ] 01-01-PLAN.md — SQL migration fixada + domain type update
- [ ] 01-02-PLAN.md — Big-bang refactor: 3-column layout, sidebar Glass Briefing, conversation items redesign

### Phase 2: Header, Messages & Media
**Goal**: Users experience the core chat conversation with glassmorphic header, redesigned message bubbles with asymmetric corners, and rich media rendering
**Depends on**: Phase 1
**Requirements**: HEAD-01, HEAD-02, HEAD-03, HEAD-04, MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, MSG-07, MEDIA-01, MEDIA-02, MEDIA-03, MEDIA-04, MEDIA-05
**Success Criteria** (what must be TRUE):
  1. Chat header displays with backdrop-blur glassmorphism, contact avatar with online indicator, and ghost-styled action buttons
  2. Sent and received message bubbles render with asymmetric corners, appropriate colors, sender avatars, names in group chats, timestamps, and delivery status icons
  3. Date separators appear between message groups with horizontal lines and centered label
  4. File attachments render with IconContainer and glass download button; audio messages show custom waveform; images and videos render with consistent border-radius
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
  1. Message input renders as auto-resizing textarea inside a glass container with inline action buttons and styled send button
  2. Typing indicator shows redesigned bouncing dots animation below the input area
  3. Context bar appears below header when conversation has a linked legal process
  4. Empty state displays centered logo, description text, and clickable suggestion cards
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
  1. Detail panel renders with user/group profile, information section, linked processes cards, and shared media grid
  2. Detail panel can be toggled via header button and closed via its own close button
  3. All messaging features work end-to-end: text, file upload, image, video, and audio recording
  4. Dyte SDK calls remain functional, online/offline presence and typing indicators work, mobile toggle preserved
  5. Lazy loading of ChatWindow and Suspense boundaries maintained; Zustand store has no breaking changes
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

</details>

### Phase 5: Indicadores & Detail Dialog
**Goal**: Users can see all indicator badges across the module and access a complete detail dialog for any audiencia with full data visibility including change history
**Depends on**: Phase 4 (previous milestone)
**Requirements**: INDIC-01, INDIC-02, INDIC-03, INDIC-04, INDIC-05, INDIC-06, DIALOG-01, DIALOG-02, DIALOG-03, DIALOG-04, DIALOG-05, DIALOG-06, DIALOG-07, DIALOG-08, DIALOG-09, DIALOG-10
**Success Criteria** (what must be TRUE):
  1. User sees badge indicators for segredo de justica, juizo digital, designada, documento ativo, litisconsorcio, and presenca hibrida in the detail dialog and (where applicable) in cards and rows
  2. User clicks an audiencia and a centered dialog (max-w-3xl) opens with meta strip, processo info, local/acesso, indicadores, preparo ring, observacoes, historico timeline, and ata link
  3. User can view the full change history (dados_anteriores) as a vertical timeline inside the dialog
  4. User can click through to the ata de audiencia when url_ata_audiencia is present
  5. User can open the edit form from the dialog (respecting PJE whitelist for captured audiencias)
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Redesign Views
**Goal**: Users experience all four secondary views (Lista, Mes, Ano, Semana) fully redesigned with Glass Briefing styling, shared navigation, and the new indicator badges
**Depends on**: Phase 5
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05, VIEW-06, VIEW-07, VIEW-08, VIEW-09
**Success Criteria** (what must be TRUE):
  1. Lista view renders rows inside GlassPanel with status dots, prep ring SVG, semantic badges (including segredo, litisconsorcio, designada), and a styled empty state
  2. Mes view displays a GlassPanel calendar with colored status dots, day counter badges for 3+ audiencias, and a popover with mini-list on day click
  3. Ano view renders a 12-month heatmap with 4 intensity levels, GitHub-style legend, and sidebar stats (total, busiest month, weekly avg, completion rate)
  4. Semana view uses SemanticBadge consistently (no hardcoded badges) and ViewNavigator replaces duplicated navigation code across Semana/Mes/Ano
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Wiring & Edicao
**Goal**: Users interact with fully connected components — conflict alerts appear when relevant, post-hearing flow guides next steps, mission card actions work, and inline editing of virtual links and addresses is functional
**Depends on**: Phase 5, Phase 6
**Requirements**: WIRE-01, WIRE-02, WIRE-03, WIRE-04, EDIT-01, EDIT-02, EDIT-03
**Success Criteria** (what must be TRUE):
  1. ConflictAlert renders after the KPI strip when time conflicts exist between audiencias
  2. PostHearingFlow renders for finalized/past audiencias in Quadro view with functional callbacks (mark result, upload ata, notify client)
  3. MissionCard quick actions are connected: user can enter virtual room, view processo, open PJe, and view checklist directly from the card
  4. User can edit the virtual URL and presencial address inline (using existing server actions) and sees dados de origem for 2nd-degree audiencias
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Filtros & Cleanup
**Goal**: Users can filter audiencias by advanced criteria and the codebase is clean of legacy components
**Depends on**: Phase 7
**Requirements**: FILT-01, FILT-02, FILT-03, FILT-04, FILT-05
**Success Criteria** (what must be TRUE):
  1. User can filter audiencias by segredo de justica (sigilosas / nao sigilosas)
  2. User can filter by preparo level (baixo < 40%, medio 40-70%, alto > 70%), by URL virtual presence (com/sem link), and by ata presence (com/sem ata)
  3. Legacy components (audiencias-content, list-wrapper, table-wrapper, month-wrapper) are removed from the codebase with no remaining imports or references
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7 -> 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Layout Shell & Sidebar | v1.0 | 0/0 | Not started | - |
| 2. Header, Messages & Media | v1.0 | 0/0 | Not started | - |
| 3. Input, Context Bar & Empty State | v1.0 | 0/0 | Not started | - |
| 4. Detail Panel & Preservation | v1.0 | 0/0 | Not started | - |
| 5. Indicadores & Detail Dialog | v1.1 | 0/0 | Not started | - |
| 6. Redesign Views | v1.1 | 0/0 | Not started | - |
| 7. Wiring & Edicao | v1.1 | 0/0 | Not started | - |
| 8. Filtros & Cleanup | v1.1 | 0/0 | Not started | - |
