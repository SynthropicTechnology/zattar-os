# Editor Components

This directory contains the PDF template field mapping editor and associated components.

## Architecture

The FieldMappingEditor is a complex component (~2200 lines) that has been refactored to use extracted hooks and utilities for better maintainability.

### Directory Structure

```
editor/
├── FieldMappingEditor.tsx     # Main orchestrator component
├── hooks/                     # Extracted custom hooks
│   ├── use-field-drag.ts      # Field drag & drop logic
│   ├── use-field-selection.ts # Field selection & keyboard handling
│   ├── use-field-validation.ts # Rich text height validation
│   ├── use-toolbar-drag.ts    # Floating toolbar drag
│   ├── use-zoom-pan.ts        # Zoom and viewport management
│   ├── use-save-operations.ts # Save operations (autosave + manual save)
│   ├── use-unsaved-changes.ts # Navigation blocking
│   └── index.ts
├── utils/                     # Utility functions
│   ├── validate-pdf-file.ts   # PDF file validation
│   └── index.ts
├── types.ts                   # Editor-specific types
├── PdfCanvasArea.tsx          # PDF canvas with fields overlay
├── ToolbarButtons.tsx         # Desktop toolbar
├── ToolbarButtonsMobile.tsx   # Mobile toolbar
├── PropertiesPopover.tsx      # Field properties editor
├── TemplateInfoPopover.tsx    # Template metadata editor
├── ReplacePdfDialog.tsx       # PDF replacement dialog
├── CreateTemplateForm.tsx     # Template creation form
├── RichTextEditor.tsx         # Rich text editor (Tiptap)
├── RichTextEditorPopover.tsx  # Rich text editor dialog
└── extensions/
    └── Variable.ts            # Tiptap variable extension
```

### Hooks

| Hook | Purpose |
|------|---------|
| `useFieldDrag` | Handles field drag & resize with mouse events |
| `useFieldSelection` | Field selection, deletion, duplication, keyboard |
| `useFieldValidation` | Rich text height estimation and warnings |
| `useToolbarDrag` | Floating toolbar positioning (mouse + touch) |
| `useZoomPan` | Zoom control with responsive auto-fit |
| `useSaveOperations` | Autosave (every 5s) + manual save with error handling |
| `useUnsavedChanges` | Navigation blocking with confirmation dialog |

### Types

```typescript
// Editor-specific types (./types.ts)
EditorField       // TemplateCampo + UI state (isSelected, isDragging, etc)
EditorMode        // 'select' | 'add_text' | 'add_image' | 'add_rich_text'
DragState         // Drag operation state
ResizeHandle      // Resize handle positions
ToolbarPosition   // Floating toolbar coordinates
```

---

## Rich Text Editors

Tiptap-based editors for template content with variable support.

### RichTextEditor

WYSIWYG editor for composite content fields (`texto_composto`).

**Features:**
- Formatting: bold, italic, strike, code, headings (h1-h3), text alignment
- Lists: bullet, ordered
- Blockquotes, horizontal rules
- Variable insertion via combobox (filtered by form type)
- Outputs `ConteudoComposto` (Tiptap JSON + template string)

**Usage:**
```tsx
import { RichTextEditor } from '@/components/assinatura-digital/editor';

<RichTextEditor
  value={conteudoComposto}
  onChange={(value) => setConteudoComposto(value)}
  formularios={['apps', 'trabalhista']}
/>
```

### RichTextEditorPopover

Dialog wrapper for `RichTextEditor` with height estimation.

**Features:**
- Real-time height estimation (±10-15% accuracy)
- Overflow warnings with line count
- Auto-adjust button to resize field
- Field metadata display (width, height, font size)

**Usage:**
```tsx
import { RichTextEditorPopover } from '@/components/assinatura-digital/editor';

<RichTextEditorPopover
  open={isOpen}
  onOpenChange={setIsOpen}
  value={conteudoComposto}
  onChange={(value) => setConteudoComposto(value)}
  fieldName="Campo Composto"
  formularios={['apps']}
  fieldWidth={400}
  fieldHeight={80}
  fontSize={12}
  onHeightAdjust={(newHeight) => updateFieldHeight(newHeight)}
/>
```

### MarkdownRichTextEditor

WYSIWYG editor for Markdown content (`conteudo_markdown`).

**Features:**
- All RichTextEditor features plus:
- Link insertion/editing
- Bidirectional Markdown ↔ Tiptap JSON conversion
- Outputs Markdown string

**Usage:**
```tsx
import { MarkdownRichTextEditor } from '@/components/assinatura-digital/editor';

<MarkdownRichTextEditor
  value={markdownString}
  onChange={(markdown) => setMarkdownString(markdown)}
  formularios={['apps']}
/>
```

### MarkdownRichTextEditorDialog

Dialog wrapper for `MarkdownRichTextEditor` with tabbed Editor/Preview.

**Features:**
- Tabs: Editor (Tiptap) and Preview (rendered Markdown)
- Character counter (0-100,000 limit)
- Optional direct backend save via `onSaveToBackend`
- Preview uses react-markdown with GFM, HTML support, XSS sanitization

**Usage:**
```tsx
import { MarkdownRichTextEditorDialog } from '@/components/assinatura-digital/editor';

<MarkdownRichTextEditorDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  value={markdownString}
  onChange={(markdown) => setMarkdownString(markdown)}
  formularios={['apps']}
  title="Editar Conteúdo"
  onSaveToBackend={async (markdown) => {
    await fetch('/api/save', { method: 'POST', body: JSON.stringify({ markdown }) });
  }}
/>
```

### Variable Extension

Custom Tiptap extension for template variables.

**Features:**
- Inline atomic nodes (non-editable)
- Renders as `<span data-variable-key="..." class="variable">...</span>`
- Command: `editor.chain().focus().insertVariable({ key: 'cliente.nome' }).run()`
- Text serialization: `{{key}}` for copy/paste

**Styling:** Add CSS for `.variable` class:
```css
.variable {
  background: #fef3c7;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}
```

**Note:** All editors require Tiptap v3.6.6+ (installed via package.json).