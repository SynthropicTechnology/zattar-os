---
phase: 01-layout-shell-sidebar
plan: 02
subsystem: ui
tags: [react, tailwind-v4, glass-briefing, chat, sidebar, layout, tab-pills, search-input]

# Dependency graph
requires:
  - phase: 01-layout-shell-sidebar/01
    provides: fixada field on SalaChat domain type
provides:
  - 3-column layout shell for chat module (sidebar 360px + chat flex-1 + detail 320px placeholder)
  - Glass Briefing sidebar with TabPills filtering, SearchInput, section grouping
  - Redesigned conversation items with rounded-xl avatars and bg-primary unread badges
  - Ambient glow radial gradients on chat area
affects: [02-chat-header-input, 03-message-bubbles, 04-detail-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: [tailwind-v4-variable-syntax, glass-briefing-sidebar, 3-column-chat-layout, tab-pill-filtering]

key-files:
  created: []
  modified:
    - src/app/(authenticated)/chat/components/chat-layout.tsx
    - src/app/(authenticated)/chat/components/chat-sidebar-wrapper.tsx
    - src/app/(authenticated)/chat/components/chat-sidebar.tsx
    - src/app/(authenticated)/chat/components/chat-list-item.tsx
    - src/app/(authenticated)/chat/domain.ts

key-decisions:
  - "Tailwind v4 syntax bg-(--variable) used throughout instead of bg-[var(--variable)]"
  - "fixada field added to SalaChat in this plan (Rule 3 deviation) since Plan 01-01 runs in parallel"
  - "Detail panel placeholder uses showProfileSheet from existing Zustand store"

patterns-established:
  - "Glass Briefing sidebar: Heading + subtitle + CTA button + SearchInput + TabPills + section labels"
  - "Section grouping: fixadas/recentes pattern with memoized sorting"
  - "Ambient glow: two positioned divs with radial-gradient and pointer-events-none"

requirements-completed: [LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, SIDE-01, SIDE-02, SIDE-03, SIDE-04, SIDE-05, SIDE-06, SIDE-07]

# Metrics
duration: 4min
completed: 2026-04-09
---

# Phase 1 Plan 2: Layout Shell & Sidebar Summary

**3-column Glass Briefing chat shell with TabPills-filtered sidebar, section grouping (Fixadas/Recentes), rounded-xl avatars, and ambient glow**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T17:44:49Z
- **Completed:** 2026-04-09T17:49:00Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint)
- **Files modified:** 5

## Accomplishments
- 3-column layout shell replacing 2-column Card-based layout (sidebar 360px + chat flex-1 + detail 320px placeholder)
- Sidebar redesigned with Heading "Mensagens", SearchInput, TabPills (Todas/Privadas/Grupos/Processos with reactive counters), section labels (Fixadas/Recentes)
- Conversation items redesigned: rounded-xl avatars, bg-primary unread badges, active border-primary outline
- Ambient glow radial gradients on chat area (top-right 0.04 opacity, bottom-left 0.02 opacity)
- Mobile responsiveness preserved (sidebar hides when chat selected on < md)

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor ChatSidebarWrapper with tab filtering, search, and section grouping** - `8ec68f39` (feat)
2. **Task 2: Refactor ChatSidebar, ChatListItem, and ChatLayout for Glass Briefing redesign** - `3a7981a1` (feat)
3. **Task 3: Visual verification** - checkpoint:human-verify (pending)

## Files Created/Modified
- `src/app/(authenticated)/chat/components/chat-layout.tsx` - 3-column shell with ambient glow, detail panel placeholder
- `src/app/(authenticated)/chat/components/chat-sidebar-wrapper.tsx` - Tab filtering, search, section grouping state container
- `src/app/(authenticated)/chat/components/chat-sidebar.tsx` - Glass Briefing sidebar UI with TabPills, SearchInput, section labels
- `src/app/(authenticated)/chat/components/chat-list-item.tsx` - Redesigned conversation item with rounded-xl avatar, bg-primary badge
- `src/app/(authenticated)/chat/domain.ts` - Added fixada field to SalaChat interface

## Decisions Made
- Used Tailwind v4 syntax `bg-(--variable)` throughout (not `bg-[var(--variable)]`)
- Added `fixada` field to SalaChat directly since Plan 01-01 (which adds it via migration) runs in parallel
- Detail panel placeholder reuses `showProfileSheet` from existing Zustand store (no new state)
- Replaced Avatar/AvatarFallback/AvatarImage components with plain img + div for rounded-xl control

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added fixada field to SalaChat domain type**
- **Found during:** Task 1 (ChatSidebarWrapper refactor)
- **Issue:** Plan 01-01 (which adds the fixada field) runs in parallel and hasn't completed yet. The section grouping code requires `s.fixada` to compile.
- **Fix:** Added `fixada?: boolean` directly to SalaChat interface in domain.ts
- **Files modified:** src/app/(authenticated)/chat/domain.ts
- **Verification:** npm run type-check passes
- **Committed in:** 8ec68f39 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for compilation since dependent Plan 01-01 runs in parallel. No scope creep.

## Issues Encountered
- `npm run validate:exports` crashes with pre-existing TypeError in the script itself (not related to chat changes). Documented as out-of-scope.
- `npm run type-check` shows 2 pre-existing errors (jest/node type definitions missing). No new errors from plan changes.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are fully wired with real data sources from the Zustand store.

## Next Phase Readiness
- Layout shell and sidebar complete, ready for Phase 2 (chat header and input redesign)
- Detail panel is placeholder only (Phase 4 content)
- Visual verification pending (Task 3 checkpoint)

---
*Phase: 01-layout-shell-sidebar*
*Completed: 2026-04-09*
