# Design Document - Melhoria de Layout da Página de Assistentes

## Overview

This design refactors the assistentes page to follow the established Synthropic design patterns, implementing PageShell and DataShell components for consistency with other pages in the system. The refactoring focuses on improving visual design, maintaining all existing functionality, and ensuring responsive behavior across all device sizes.

### Goals

1. **Consistency**: Align the assistentes page with the PageShell/DataShell pattern used throughout the system
2. **Modern Design**: Apply contemporary UI principles with smooth interactions and visual hierarchy
3. **Maintainability**: Use reusable components from the design system
4. **Functionality Preservation**: Maintain all existing features (search, create, edit, delete)

### Non-Goals

- Changing business logic or backend actions
- Modifying database schema
- Adding new features beyond layout improvements
- Altering the permission system

## Architecture

### Component Hierarchy

```
AssistentesPage (Server Component)
├── PageShell
│   ├── title: "Assistentes"
│   ├── description: "Gerencie os assistentes de IA do sistema"
│   └── children: AssistentesListWrapper
│
└── AssistentesListWrapper (Client Component)
    ├── DataShell
    │   ├── header: DataTableToolbar
    │   │   ├── searchValue
    │   │   ├── onSearchValueChange
    │   │   └── actionButton (Novo Assistente)
    │   └── children: GridView
    │       └── AssistenteCard[] (enhanced)
    │
    ├── CreateDialog
    ├── EditDialog
    └── DeleteDialog
```

### Data Flow

```
User Input → Search/Filter
    ↓
useAssistentes hook (debounced)
    ↓
Filter assistentes array
    ↓
GridView renders filtered cards
    ↓
User actions (view/edit/delete)
    ↓
Dialog opens → Action executes → refetch() → UI updates
```

## Components and Interfaces

### 1. AssistentesPage (Server Component)

**Location**: `src/app/app/assistentes/page.tsx`

**Responsibilities**:
- Fetch initial data server-side
- Check user permissions
- Render PageShell with AssistentesListWrapper

**Changes**:
```typescript
// BEFORE
<div className="flex-1 space-y-4 p-4 pt-4">
  <AssistentesListWrapper ... />
</div>

// AFTER
<PageShell
  title="Assistentes"
  description="Gerencie os assistentes de IA do sistema"
>
  <AssistentesListWrapper ... />
</PageShell>
```

**Interface**:
```typescript
// No interface changes - same props structure
export default async function AssistentesPage() {
  // ... existing logic
}
```

### 2. AssistentesListWrapper (Client Component)

**Location**: `src/app/app/assistentes/feature/components/shared/assistentes-list-wrapper.tsx`

**Responsibilities**:
- Manage search state with debounce
- Handle dialog states (create/edit/delete)
- Coordinate between toolbar and grid view
- Trigger refetch after mutations

**Changes**:
```typescript
// BEFORE
<div className="space-y-4">
  <div className="flex items-center justify-between gap-4">
    <div className="relative flex-1 max-w-sm">
      <Search className="..." />
      <Input ... />
    </div>
    {permissions.canCreate && <Button>...</Button>}
  </div>
  <GridView ... />
</div>

// AFTER
<DataShell
  header={
    <DataTableToolbar
      searchValue={busca}
      onSearchValueChange={setBusca}
      searchPlaceholder="Buscar assistentes..."
      actionButton={
        permissions.canCreate
          ? {
              label: 'Novo Assistente',
              onClick: () => setCreateOpen(true),
            }
          : undefined
      }
    />
  }
>
  <GridView ... />
</DataShell>
```

**Interface**:
```typescript
interface AssistentesListWrapperProps {
  initialData: Assistente[];
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}
```

### 3. DataTableToolbar (Existing Component)

**Location**: `src/components/shared/data-shell/data-table-toolbar.tsx`

**Usage**:
```typescript
<DataTableToolbar
  searchValue={busca}
  onSearchValueChange={setBusca}
  searchPlaceholder="Buscar assistentes..."
  actionButton={{
    label: 'Novo Assistente',
    onClick: () => setCreateOpen(true),
  }}
/>
```

**Props Used**:
- `searchValue`: Current search string
- `onSearchValueChange`: Callback for search input changes
- `searchPlaceholder`: Descriptive placeholder text
- `actionButton`: Primary action button configuration

### 4. GridView (Enhanced)

**Location**: `src/app/app/assistentes/feature/components/list/grid-view.tsx`

**Responsibilities**:
- Render assistentes in responsive grid
- Handle empty state
- Pass callbacks to cards

**Changes**:
- Wrap in proper container with spacing
- Ensure responsive grid classes are correct
- Maintain empty state with Empty component

**Interface** (unchanged):
```typescript
interface GridViewProps {
  assistentes: Assistente[];
  onView: (assistente: Assistente) => void;
  onEdit: (assistente: Assistente) => void;
  onDelete: (assistente: Assistente) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}
```

### 5. AssistenteCard (Enhanced)

**Location**: `src/app/app/assistentes/feature/components/list/assistente-card.tsx`

**Responsibilities**:
- Display assistente information
- Provide hover effects
- Show action menu

**Design Enhancements**:
```typescript
// Enhanced card styling
<Card className={cn(
  "relative flex flex-col h-[140px]",
  "transition-all duration-200",
  "hover:shadow-lg hover:scale-[1.02]",
  "cursor-pointer",
  "border border-border",
  "bg-card"
)}>
```

**Key Improvements**:
1. Smooth transitions (200ms)
2. Subtle scale on hover (1.02x)
3. Enhanced shadow on hover
4. Proper cursor pointer
5. Consistent border and background colors

**Interface** (unchanged):
```typescript
interface AssistenteCardProps {
  assistente: Assistente;
  onView: (assistente: Assistente) => void;
  onEdit: (assistente: Assistente) => void;
  onDelete: (assistente: Assistente) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}
```

## Data Models

### Assistente (Existing)

```typescript
interface Assistente {
  id: string;
  nome: string;
  descricao: string | null;
  instrucoes: string;
  modelo: string;
  temperatura: number;
  max_tokens: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}
```

**No changes to data model** - this is purely a UI refactoring.

### Permissions Model (Existing)

```typescript
interface Permissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the prework, I identified the following testable properties:

**Testable Properties**:
1. Search debounce behavior (2.2)
2. Permission-based button visibility (3.2)
3. List updates after creation (3.4)
4. Responsive grid layout (4.4)
5. Action menu presence (5.1)
6. Menu options based on permissions (5.2, 5.3)

**Redundancy Analysis**:
- Properties 5.2 and 5.3 can be combined into a single property about permission-based menu rendering
- Property 3.2 is a specific case of permission-based rendering that applies to the action button

**Consolidated Properties**:

### Property 1: Search Debounce Behavior

*For any* sequence of search input changes, the search function should only be called after the user stops typing for at least 500ms, preventing excessive filtering operations.

**Validates: Requirements 2.2**

### Property 2: Permission-Based UI Rendering

*For any* permission configuration (canCreate, canEdit, canDelete), the UI should only display interactive elements (buttons, menu items) that the user has permission to use.

**Validates: Requirements 3.2, 5.3**

### Property 3: List Synchronization After Mutations

*For any* create, edit, or delete operation that succeeds, the displayed list of assistentes should reflect the changes immediately after the operation completes.

**Validates: Requirements 3.4**

### Property 4: Responsive Grid Layout

*For any* viewport width, the grid should display the appropriate number of columns: 1 (mobile <768px), 2 (tablet 768-1024px), 3 (desktop 1024-1280px), 4 (large 1280-1536px), or 5 (xl ≥1536px).

**Validates: Requirements 4.4**

### Property 5: Action Menu Completeness

*For any* assistente card and permission configuration, the action menu should contain exactly the actions the user is permitted to perform (View always, Edit if canEdit, Delete if canDelete).

**Validates: Requirements 5.1, 5.2, 5.3**

## Error Handling

### Search Errors

**Scenario**: Search input causes filtering errors

**Handling**:
- Debounce prevents rapid error accumulation
- Invalid search strings are handled gracefully
- Empty results show appropriate empty state

### Permission Errors

**Scenario**: User attempts action without permission

**Handling**:
- UI prevents unauthorized actions (buttons/menu items hidden)
- Server-side validation provides final security layer
- Error messages displayed via toast notifications

### Data Loading Errors

**Scenario**: Initial data fetch fails

**Handling**:
```typescript
if (!result.success || !result.data) {
  return (
    <div className="p-4 text-red-500">
      Erro ao carregar dados: {result.error}
    </div>
  );
}
```

### Dialog Errors

**Scenario**: Create/Edit/Delete operations fail

**Handling**:
- Error messages displayed in dialog
- Dialog remains open for user to retry
- refetch() not called on failure

## Testing Strategy

### Unit Tests

**Focus Areas**:
1. Component rendering with different props
2. Permission-based conditional rendering
3. Empty state rendering
4. Event handler callbacks

**Example Tests**:
```typescript
describe('AssistentesListWrapper', () => {
  it('renders search field with correct placeholder', () => {
    // Test 2.3
  });

  it('shows create button only when canCreate is true', () => {
    // Test 3.2
  });

  it('renders empty state when no assistentes', () => {
    // Test 6.1, 6.2
  });
});

describe('AssistenteCard', () => {
  it('applies cursor-pointer class', () => {
    // Test 4.6
  });

  it('applies transition duration class', () => {
    // Test 4.5
  });

  it('shows action menu with correct items based on permissions', () => {
    // Test 5.2, 5.3
  });
});
```

### Property-Based Tests

**Configuration**: Minimum 100 iterations per test

**Property 1: Search Debounce**
```typescript
// Feature: assistentes-layout-improvement, Property 1: Search Debounce Behavior
test('search is debounced for any input sequence', async () => {
  // Generate random sequences of keystrokes
  // Verify search function called only after 500ms pause
});
```

**Property 2: Permission-Based Rendering**
```typescript
// Feature: assistentes-layout-improvement, Property 2: Permission-Based UI Rendering
test('UI elements match permissions for any permission configuration', () => {
  // Generate random permission combinations
  // Verify only permitted elements are rendered
});
```

**Property 3: List Synchronization**
```typescript
// Feature: assistentes-layout-improvement, Property 3: List Synchronization After Mutations
test('list reflects changes after any successful mutation', async () => {
  // Generate random assistente data
  // Perform create/edit/delete
  // Verify list contains expected items
});
```

**Property 4: Responsive Grid**
```typescript
// Feature: assistentes-layout-improvement, Property 4: Responsive Grid Layout
test('grid columns match viewport width for any screen size', () => {
  // Generate random viewport widths
  // Verify correct number of columns
});
```

**Property 5: Action Menu Completeness**
```typescript
// Feature: assistentes-layout-improvement, Property 5: Action Menu Completeness
test('action menu contains exactly permitted actions for any permission set', () => {
  // Generate random permission configurations
  // Verify menu items match permissions
});
```

### Integration Tests

**Focus Areas**:
1. Full page rendering with PageShell
2. Search → filter → render flow
3. Dialog open → action → refetch → update flow
4. Permission checks across components

### Visual Regression Tests

**Focus Areas**:
1. Card hover states
2. Responsive breakpoints
3. Empty state appearance
4. Light/dark mode consistency

## Implementation Notes

### Design System Compliance

**From design-system-protocols.md**:
- Use PageShell for page structure ✓
- Use DataShell for data containers ✓
- Use Typography components for text (if needed)
- Follow 4px spacing grid ✓
- No hardcoded colors in feature components ✓

**From ui-ux-pro-max**:
- Use SVG icons (Lucide) not emojis ✓
- Add cursor-pointer to clickable elements ✓
- Smooth transitions (200-300ms) ✓
- No layout shift on hover ✓
- Proper light/dark mode contrast ✓

### Responsive Breakpoints

```typescript
// Tailwind breakpoints used
const gridClasses = cn(
  "grid gap-3",
  "grid-cols-1",           // mobile: < 768px
  "md:grid-cols-2",        // tablet: 768px - 1024px
  "lg:grid-cols-3",        // desktop: 1024px - 1280px
  "xl:grid-cols-4",        // large: 1280px - 1536px
  "2xl:grid-cols-5"        // xl: ≥ 1536px
);
```

### Accessibility Considerations

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **ARIA Labels**: Descriptive labels on buttons and inputs
3. **Focus States**: Visible focus indicators on all interactive elements
4. **Screen Readers**: Proper semantic HTML and ARIA attributes
5. **Color Contrast**: WCAG AA compliance in both light and dark modes

### Performance Considerations

1. **Debounce**: 500ms debounce on search prevents excessive re-renders
2. **Memoization**: Use React.useCallback for event handlers
3. **Lazy Loading**: Dialogs only render when open
4. **Efficient Filtering**: Client-side filtering for small datasets

### Migration Path

1. Update AssistentesPage to use PageShell
2. Refactor AssistentesListWrapper to use DataShell + DataTableToolbar
3. Enhance AssistenteCard styling
4. Test all functionality
5. Verify responsive behavior
6. Check accessibility
7. Deploy

### Rollback Plan

If issues arise:
1. Revert to previous component structure
2. All business logic unchanged, so no data impact
3. No database migrations to rollback
4. Simple git revert of UI changes
