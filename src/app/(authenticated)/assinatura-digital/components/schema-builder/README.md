# Schema Builder

The Schema Builder is a comprehensive form schema editor built with React, TypeScript, and React DnD. It provides an intuitive drag-and-drop interface for creating and editing dynamic form schemas with advanced features like conditional logic, validation, and field management.

## Components

### FieldPalette

Draggable palette of form field types for creating new fields in the schema.

**Features:**
- Drag-and-drop field creation
- Field type categories (Text, Number, Select, etc.)
- Search and filter functionality

**Props:**
```typescript
interface FieldPaletteProps {
  onFieldAdd: (fieldType: string) => void;
}
```

**Usage:**
```typescript
import { FieldPalette } from '@/components/assinatura-digital/schema-builder';

<FieldPalette />
```

### SchemaCanvas

Interactive canvas that displays form sections and fields. Supports drag-and-drop reordering and field selection.

**Features:**
- Section and field display
- Drag-and-drop reordering
- Field selection and editing
- Section management (add/edit/delete)
- Field management (duplicate/delete)

**Props:**
```typescript
interface SchemaCanvasProps {
  schema: DynamicFormSchema;
  selectedFieldId: string | null;
  selectedSectionId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldDuplicate: (fieldId: string) => void;
  onSectionAdd: () => void;
  onSectionEdit: (sectionId: string) => void;
  onSectionDelete: (sectionId: string) => void;
}
```

**Usage:**
```typescript
import { SchemaCanvas } from '@/components/assinatura-digital/schema-builder';

<SchemaCanvas
  schema={schema}
  selectedFieldId={selectedFieldId}
  selectedSectionId={selectedSectionId}
  onFieldSelect={handleFieldSelect}
  onSectionSelect={handleSectionSelect}
  onFieldDelete={handleFieldDelete}
  onFieldDuplicate={handleFieldDuplicate}
  onSectionAdd={handleSectionAdd}
  onSectionEdit={handleSectionEdit}
  onSectionDelete={handleSectionDelete}
/>
```

### FieldPropertiesPanel

Complex properties editor for form fields with collapsible sections, validation, and options management.

**Features:**
- Collapsible sections: Básico, Validação, Condicional, Opções
- React Hook Form + Zod validation
- Options management (add/edit/delete/reorder)
- Custom validators dropdown (CPF, CNPJ, Telefone, CEP, Date)
- Conditional logic configuration
- Grid columns selection (1, 2, 3)
- Field type-specific UI
- Real-time validation

**Props:**
```typescript
interface FieldPropertiesPanelProps {
  field: FormFieldSchema | null;        // Selected field to edit
  allFieldIds: string[];                // All field IDs for conditional dropdown
  allFieldNames: string[];              // All field names for duplicate check
  onChange: (field: FormFieldSchema) => void;  // Update callback
  onDelete: () => void;                 // Delete callback
}
```

**Usage:**
```typescript
import { FieldPropertiesPanel } from '@/components/assinatura-digital/schema-builder';

<FieldPropertiesPanel
  field={selectedField}
  allFieldIds={getAllFieldIds()}
  allFieldNames={getAllFieldNames()}
  onChange={handleFieldUpdate}
  onDelete={handleFieldDelete}
/>
```

### FormSchemaBuilder

Main orchestrator component for building form schemas with drag-and-drop, preview, and JSON import/export.

**Features:**
- Three-panel layout: Palette | Canvas | Properties
- Drag-and-drop field creation and reordering
- Edit/Preview modes (uses DynamicFormRenderer)
- JSON import/export
- Section management (add/edit/delete)
- Field management (add/edit/delete/duplicate)
- Dirty state tracking with unsaved changes warning
- Schema validation before save and preview
- Circular dependency detection

**Props:**
```typescript
interface FormSchemaBuilderProps {
  initialSchema?: DynamicFormSchema;    // Initial schema (for editing)
  formularioNome: string;               // Formulario name for header
  onSave: (schema: DynamicFormSchema) => Promise<void>;  // Async save
  onCancel: () => void;                 // Cancel callback
}
```

**Usage:**
```typescript
import { FormSchemaBuilder } from '@/components/assinatura-digital/schema-builder';
import { validateFormSchema } from '@/features/assinatura-digital/utils';

const handleSave = async (schema: DynamicFormSchema) => {
  const validation = validateFormSchema(schema);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const response = await fetch(`/api/assinatura-digital/formularios/${id}/schema`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schema),
  });
  
  if (!response.ok) throw new Error('Failed to save schema');
};

<FormSchemaBuilder
  initialSchema={formulario.form_schema}
  formularioNome={formulario.nome}
  onSave={handleSave}
  onCancel={() => router.back()}
/>