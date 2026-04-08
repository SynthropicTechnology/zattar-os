# Implementation Plan: Melhoria de Layout da Página de Assistentes

## Overview

This implementation plan refactors the assistentes page to follow the PageShell/DataShell pattern used throughout Synthropic. The work is organized into discrete steps that build incrementally, with each step maintaining functionality while improving the design.

## Tasks

- [x] 1. Update AssistentesPage to use PageShell
  - Replace custom div wrapper with PageShell component
  - Add title "Assistentes" and description "Gerencie os assistentes de IA do sistema"
  - Remove manual padding classes (PageShell handles this)
  - Verify page renders correctly with new structure
  - _Requirements: 1.1_

- [x] 2. Refactor AssistentesListWrapper to use DataShell pattern
  - [x] 2.1 Replace custom search bar with DataTableToolbar
    - Import DataTableToolbar from `@/components/shared/data-shell`
    - Configure searchValue, onSearchValueChange, and searchPlaceholder props
    - Move "Novo Assistente" button to actionButton prop
    - Ensure actionButton only renders when canCreate is true
    - _Requirements: 2.1, 2.3, 3.1, 3.2_
  
  - [x] 2.2 Wrap GridView with DataShell
    - Import DataShell component
    - Pass DataTableToolbar as header prop
    - Move GridView into DataShell children
    - Remove custom spacing wrapper div
    - _Requirements: 1.2_
  
  - [ ]* 2.3 Write unit tests for toolbar integration
    - Test search placeholder text is correct
    - Test actionButton renders only when canCreate is true
    - Test search input triggers onSearchValueChange
    - _Requirements: 2.3, 3.2_

- [x] 3. Enhance AssistenteCard design
  - [x] 3.1 Update card styling for modern appearance
    - Add smooth transition classes (duration-200)
    - Implement hover effects (shadow-lg, scale-[1.02])
    - Ensure cursor-pointer is applied to clickable area
    - Add proper border and background color classes
    - Verify no layout shift occurs on hover
    - _Requirements: 4.1, 4.5, 4.6_
  
  - [x] 3.2 Verify responsive grid behavior
    - Test grid displays 1 column on mobile (<768px)
    - Test grid displays 2 columns on tablet (768-1024px)
    - Test grid displays 3 columns on desktop (1024-1280px)
    - Test grid displays 4 columns on large screens (1280-1536px)
    - Test grid displays 5 columns on xl screens (≥1536px)
    - _Requirements: 4.4_
  
  - [ ]* 3.3 Write unit tests for card styling
    - Test cursor-pointer class is applied
    - Test transition duration class is applied
    - Test hover classes are present
    - _Requirements: 4.5, 4.6_

- [x] 4. Verify action menu and permissions
  - [x] 4.1 Test action menu rendering
    - Verify menu button appears on each card
    - Verify menu contains View option (always)
    - Verify menu contains Edit option only when canEdit is true
    - Verify menu contains Delete option only when canDelete is true
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 4.2 Write property test for permission-based rendering
    - **Property 2: Permission-Based UI Rendering**
    - **Validates: Requirements 3.2, 5.3**
    - Generate random permission configurations
    - Verify UI elements match permissions
    - Run with 100 iterations

- [x] 5. Test search functionality
  - [x] 5.1 Verify search debounce behavior
    - Test rapid typing doesn't trigger immediate searches
    - Test search triggers after 500ms pause
    - Verify filtered results display correctly
    - _Requirements: 2.2_
  
  - [ ]* 5.2 Write property test for search debounce
    - **Property 1: Search Debounce Behavior**
    - **Validates: Requirements 2.2**
    - Generate random keystroke sequences
    - Verify search called only after 500ms pause
    - Run with 100 iterations

- [x] 6. Test dialog interactions and list updates
  - [x] 6.1 Verify create dialog flow
    - Test clicking "Novo Assistente" opens CreateDialog
    - Test successful creation closes dialog
    - Test list updates after creation
    - _Requirements: 3.3, 3.4_
  
  - [x] 6.2 Verify edit dialog flow
    - Test clicking Edit in menu opens EditDialog
    - Test successful edit closes dialog
    - Test list updates after edit
    - _Requirements: 3.4_
  
  - [x] 6.3 Verify delete dialog flow
    - Test clicking Delete in menu opens DeleteDialog
    - Test successful deletion closes dialog
    - Test list updates after deletion
    - _Requirements: 3.4_
  
  - [ ]* 6.4 Write property test for list synchronization
    - **Property 3: List Synchronization After Mutations**
    - **Validates: Requirements 3.4**
    - Generate random assistente data
    - Perform create/edit/delete operations
    - Verify list reflects changes
    - Run with 100 iterations

- [x] 7. Test empty state rendering
  - [x] 7.1 Verify empty state displays correctly
    - Test empty state shows when no assistentes
    - Test Bot icon is rendered
    - Test message "Nenhum assistente encontrado" displays
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 7.2 Write unit tests for empty state
    - Test Empty component renders with no data
    - Test icon is present
    - Test message text is correct
    - _Requirements: 6.1, 6.2_

- [x] 8. Checkpoint - Verify all functionality
  - Test page loads without errors
  - Test search works with debounce
  - Test create/edit/delete flows work
  - Test permissions are respected
  - Test responsive behavior at all breakpoints
  - Test empty state displays correctly
  - Ensure all tests pass
  - Ask user if questions arise

- [x] 9. Accessibility and visual polish
  - [x] 9.1 Verify accessibility compliance
    - Test keyboard navigation works for all interactive elements
    - Verify ARIA labels are present on buttons and inputs
    - Test focus states are visible
    - Verify color contrast meets WCAG AA in light and dark modes
    - _Requirements: RT-6_
  
  - [x] 9.2 Test light/dark mode consistency
    - Verify cards display correctly in both modes
    - Test hover states work in both modes
    - Verify text contrast is sufficient in both modes
    - Test borders are visible in both modes
  
  - [ ]* 9.3 Write property test for responsive grid
    - **Property 4: Responsive Grid Layout**
    - **Validates: Requirements 4.4**
    - Generate random viewport widths
    - Verify correct number of columns at each breakpoint
    - Run with 100 iterations
  
  - [ ]* 9.4 Write property test for action menu completeness
    - **Property 5: Action Menu Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Generate random permission configurations
    - Verify menu contains exactly permitted actions
    - Run with 100 iterations

- [x] 10. Final checkpoint - Complete verification
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Test page in multiple browsers (Chrome, Firefox, Safari)
  - Verify no console errors or warnings
  - Test with real data in development environment
  - Verify performance is acceptable (no lag on search/filter)
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based and unit tests
- Each task references specific requirements for traceability
- Implementation follows incremental approach - each step maintains functionality
- All existing business logic and actions remain unchanged
- No database migrations required
- Focus is purely on UI/UX improvements using design system components
