# Componentes de Assinatura Digital

## Select Components (Novos)

Componentes de selecao especializados para o modulo de assinatura digital.

### SegmentoSelect

```tsx
import { SegmentoSelect } from "@/features/assinatura-digital";

<SegmentoSelect
  value={segmentoId}
  onChange={(id) => setSegmentoId(id)}
  disabled={false}
  placeholder="Selecione um segmento"
  showInactive={false}
/>;
```

### TemplateSelect

```tsx
import { TemplateSelect } from "@/features/assinatura-digital";

<TemplateSelect
  value={templateId}
  onChange={(id) => setTemplateId(id)}
  segmentoId={segmentoId}
/>;
```

### FormularioSelect

```tsx
import { FormularioSelect } from "@/features/assinatura-digital";

<FormularioSelect
  value={formularioId}
  onChange={(id) => setFormularioId(id)}
  segmentoId={segmentoId}
/>;
```

### ClienteSelect

```tsx
import { ClienteSelect } from "@/features/assinatura-digital";

<ClienteSelect
  value={clienteId}
  onChange={(id) => setClienteId(id)}
  limit={50}
/>;
```

## Form Components (Novos)

### AssinaturaDigitalTabsContent

Navegacao com tabs para o modulo (Fluxo, Templates, Formularios).

```tsx
import { AssinaturaDigitalTabsContent } from "@/features/assinatura-digital";

<AssinaturaDigitalTabsContent
  templatesContent={<TemplatesClient />}
  formulariosContent={<FormulariosClient />}
  defaultTab="assinatura"
/>;
```

---

## Input Components (Existentes)

```tsx
import {
  InputCPF,
  InputTelefone,
  InputCEP,
} from "@/components/assinatura-digital/inputs";

function MyForm() {
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState({});

  return (
    <>
      <InputCPF
        label="CPF"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
        error={errors.cpf}
      />
      <InputCEP label="CEP" onAddressFound={(addr) => setAddress(addr)} />
    </>
  );
}
```

### Styling

All components use shadcn/ui styling conventions:

- Consistent with `components/ui/input.tsx`
- Support for label, error messages, aria-invalid
- Dark mode compatible
- Focus/hover states

### Integration

- **DynamicFormRenderer:** Used in `components/assinatura-digital/form/dynamic-form-renderer.tsx`
- **Form libraries:** Compatible with react-hook-form, Formik (forward ref support)
- **Validators:** Use with `lib/assinatura-digital/validators/`

## Signature Components (`signature/`)

Components for capturing and previewing handwritten signatures.

### CanvasAssinatura

Signature canvas component for capturing handwritten signatures with metrics tracking.

- **Purpose:** Capture handwritten signatures with metrics tracking
- **Dependencies:** `react-signature-canvas`
- **Ref API:** `getSignatureBase64()`, `isEmpty()`, `clear()`, `getMetrics()`
- **Metrics tracked:** points, strokes, drawing time, bounding box (width, height)
- **Responsive sizing:** max 600px width, 200-250px height

**Usage example with ref:**

```typescript
import { CanvasAssinatura } from '@/components/assinatura-digital/signature';

const canvasRef = useRef<CanvasAssinaturaRef>(null);

const handleSave = () => {
  if (!canvasRef.current?.isEmpty()) {
    const signature = canvasRef.current.getSignatureBase64();
    const metrics = canvasRef.current.getMetrics();
    // Save signature and metrics
  }
};

return <CanvasAssinatura ref={canvasRef} />;
```

### PreviewAssinatura

Signature and photo preview component for displaying captured signature and photo side-by-side for review.

- **Purpose:** Display captured signature and photo side-by-side for review
- **Props:** `assinaturaBase64`, `fotoBase64`, `onEdit`, `onConfirm`, `isLoading`
- **Features:** responsive grid, confirmation dialog, edit/confirm actions

**Usage example:**

```typescript
import { PreviewAssinatura } from '@/components/assinatura-digital/signature';

return (
  <PreviewAssinatura
    assinaturaBase64={signatureData}
    fotoBase64={photoData}
    onEdit={() => setStep('capture')}
    onConfirm={() => submitForm()}
    isLoading={isSubmitting}
  />
);
```

## Capture Components (`capture/`)

Components for capturing photos and geolocation data.

### CapturaFoto

Webcam photo capture component for capturing photos using device camera.

- **Purpose:** Capture photos using device camera
- **Dependencies:** `react-webcam`
- **Ref API:** `getPhotoBase64()`, `hasPhoto()`
- **Props:** `initialPhoto`, `onWebcamErrorChange`, `onPhotoCaptured`
- **Features:** webcam preview, retake, error handling, size validation (max 5MB)
- **Camera settings:** 500x500px, JPEG quality 0.8, user-facing camera

**Usage example with ref:**

```typescript
import { CapturaFoto } from '@/components/assinatura-digital/capture';

const photoRef = useRef<CapturaFotoRef>(null);

const handleCapture = () => {
  if (photoRef.current?.hasPhoto()) {
    const photo = photoRef.current.getPhotoBase64();
    // Process photo
  }
};

return <CapturaFoto ref={photoRef} onPhotoCaptured={handleCapture} />;
```

### CapturaFotoStep

Photo capture step wrapper for integrating photo capture into multi-step form flow.

- **Purpose:** Integrate photo capture into multi-step form flow
- **Dependencies:** `CapturaFoto`, `formulario-store`, `FormStepLayout`
- **Store integration:** reads/writes `fotoBase64`, navigation methods
- **Validation:** uses `validatePhotoQuality()` from business.validations

**Usage example with store:**

```typescript
import { CapturaFotoStep } from '@/components/assinatura-digital/capture';

return <CapturaFotoStep />;
```

### GeolocationStep

Geolocation capture step for capturing GPS coordinates in multi-step form flow.

- **Purpose:** Capture GPS coordinates in multi-step form flow
- **Dependencies:** Browser Geolocation API, `formulario-store`, `FormStepLayout`
- **Store integration:** reads/writes `latitude`, `longitude`, `geolocationAccuracy`, `geolocationTimestamp`
- **Features:** auto-capture on mount, retry on error, detailed error messages, privacy notice
- **Validation:** uses `validateGeolocation()` from business.validations
- **GPS settings:** high accuracy, 10s timeout, no cache

**Usage example with store:**

```typescript
import { GeolocationStep } from '@/components/assinatura-digital/capture';

return <GeolocationStep />;
```

## Form Components

Dynamic form rendering system with JSON-schema-driven validation, conditional logic, and multi-step workflows.

### DynamicFormRenderer

Core form renderer using react-hook-form + Zod for schema-based validation.

**Features:**

- Supports 11 field types: text, email, textarea, number, date, CPF, CNPJ, phone, CEP, select, radio, checkbox
- Conditional field rendering (operators: =, !=, >, <, contains, empty, notEmpty)
- CEP auto-fill (populates logradouro, bairro, cidade, estado)
- Responsive grid layout (1-3 columns)
- Section-based organization with separators

**Usage:**

```tsx
import { DynamicFormRenderer } from "@/components/assinatura-digital/form";
import type {
  DynamicFormSchema,
  DynamicFormData,
} from "@/types/assinatura-digital";

const schema: DynamicFormSchema = {
  sections: [
    {
      id: "personal",
      title: "Dados Pessoais",
      fields: [
        { id: "nome", type: "text", label: "Nome Completo", required: true },
        { id: "cpf", type: "cpf", label: "CPF", required: true },
        { id: "email", type: "email", label: "E-mail", required: true },
      ],
    },
  ],
};

function MyForm() {
  const handleSubmit = (data: DynamicFormData) => {
    console.log("Form data:", data);
  };

  return (
    <DynamicFormRenderer
      schema={schema}
      onSubmit={handleSubmit}
      formId="my-form"
    />
  );
}
```

**Props:**

- `schema: DynamicFormSchema` - JSON schema defining form structure
- `onSubmit: (data: DynamicFormData) => void | Promise<void>` - Submit handler
- `defaultValues?: DynamicFormData` - Initial field values
- `isSubmitting?: boolean` - Disable form during submission
- `formId?: string` - HTML form ID for external submit button

### DynamicFormStep

Wrapper component managing schema loading, data enrichment, and API submission for multi-step workflows.

**Features:**

- Loads form schema from API with store caching
- Enriches form data (adds reclamada_nome, modalidade_nome, converts booleans to V/F)
- Calculates TRT based on UF (24 regions)
- Pre-submission validation (checks dadosPessoais, segmentoId, formularioId)
- Integrates with formulario store for state management

**Usage:**

```tsx
import { DynamicFormStep } from "@/components/assinatura-digital/form";

function FormularioFlow() {
  return <DynamicFormStep />;
}
```

**Store Integration:**
Requires `useFormularioStore` to be initialized with:

- `segmentoId: number`
- `formularioId: number`
- `dadosPessoais: { cliente_id, nome_completo, cpf, endereco_uf }`

**API Dependencies:**

- `GET /api/assinatura-digital/formularios/:id` - Fetch form schema
- `POST /api/salvar-acao` - Submit form data (TODO: not yet migrated)

### FormStepLayout

Reusable layout component for multi-step forms with progress bar and navigation.

**Features:**

- Progress bar (1-based step counting)
- Previous/Next navigation with icons
- Loading states
- Form submission support via formId prop
- Responsive card-based layout

**Usage:**

```tsx
import { FormStepLayout } from "@/components/assinatura-digital/form";

function MyStep() {
  return (
    <FormStepLayout
      title="Dados Pessoais"
      description="Informe seus dados"
      currentStep={1}
      totalSteps={5}
      onPrevious={() => console.log("Previous")}
      onNext={() => console.log("Next")}
      formId="my-form" // Optional: for form submission
    >
      {/* Step content */}
    </FormStepLayout>
  );
}
```

**Props:**

- `title: string` - Step title
- `description?: string` - Step description
- `currentStep: number` - Current step (1-based)
- `totalSteps: number` - Total steps
- `onPrevious?: () => void` - Previous button handler
- `onNext?: () => void` - Next button handler (ignored if formId provided)
- `formId?: string` - HTML form ID for submit button
- `isLoading?: boolean` - Show loading state
- `isNextDisabled?: boolean` - Disable next button
- `isPreviousDisabled?: boolean` - Disable previous button
- `hidePrevious?: boolean` - Hide previous button
- `hideNext?: boolean` - Hide next button

## Public Form Flow

### VerificarCPF

First step in public form flow. Validates CPF and checks if client exists in system.

**Usage:**

```tsx
import { VerificarCPF } from "@/components/assinatura-digital/form";

<VerificarCPF />;
```

**Dependencies:**

- Store: `formulario-store`
- Inputs: `input-cpf`
- Validation: `verificarCPF.schema`
- API: `/api/assinatura-digital/forms/verificar-cpf`

### DadosPessoais

Personal data form step (collects/updates client info).

**Usage:**

```tsx
import { DadosPessoais } from "@/components/assinatura-digital/form";

<DadosPessoais />;
```

**Dependencies:**

- Store: `formulario-store`
- Inputs: `input-cpf`, `input-telefone`, `input-cep`
- Validation: `dadosPessoais.schema`
- API: `/api/assinatura-digital/forms/save-client`
- Constants: `ESTADOS_CIVIS`, `NACIONALIDADES`

### VisualizacaoPdfStep

PDF preview step (generates and displays PDF).

**Usage:**

```tsx
import { VisualizacaoPdfStep } from "@/components/assinatura-digital/form";

<VisualizacaoPdfStep />;
```

**Dependencies:**

- Store: `formulario-store`
- Renderer: `PdfPreviewDynamic`
- API: `/api/assinatura-digital/signature/preview`

### VisualizacaoMarkdownStep

Markdown preview step (alternative to PDF).

**Usage:**

```tsx
import { VisualizacaoMarkdownStep } from "@/components/assinatura-digital/form";

<VisualizacaoMarkdownStep />;
```

**Dependencies:**

- Store: `formulario-store`
- Utils: `markdown-renderer`
- Types: `template.types`, `cliente-adapter.types`

### AssinaturaManuscritaStep

Signature step (captures signature, generates PDFs).

**Usage:**

```tsx
import { AssinaturaManuscritaStep } from "@/components/assinatura-digital/form";

<AssinaturaManuscritaStep />;
```

**Dependencies:**

- Store: `formulario-store`
- Signature: `canvas-assinatura`
- Capture: `captura-foto-step`, `geolocation-step`
- Validation: `business.validations`
- API: `/api/assinatura-digital/utils/get-client-ip`, `/api/assinatura-digital/signature/finalizar`

### Sucesso

Success page (displays PDFs, allows download).

**Usage:**

```tsx
import { Sucesso } from "@/components/assinatura-digital/form";

<Sucesso />;
```

**Dependencies:**

- Store: `formulario-store`
- Dependency: `jszip` (for ZIP downloads)

### FormularioContainer

Main orchestrator (manages steps, navigation).

**Usage:**

```tsx
import { FormularioContainer } from "@/components/assinatura-digital/form";

<FormularioContainer />;
```

**Dependencies:**

- Store: `formulario-store`
- All step components: `verificar-cpf`, `dados-pessoais`, `dynamic-form-step`, `captura-foto-step`, `geolocation-step`, `visualizacao-pdf-step`, `visualizacao-markdown-step`, `assinatura-manuscrita-step`, `sucesso`
- Form: `form-step-layout`

### FormularioPage

Top-level wrapper (initializes context).

**Usage:**

```tsx
import { FormularioPage } from "@/components/assinatura-digital/form";

<FormularioPage />;
```

**Dependencies:**

- Container: `formulario-container`
- Store: `formulario-store`
- Types: `form-schema.types`, `template.types`

**Notes on Dependencies:**

- Store: `formulario-store` - Manages form state, navigation, and data persistence
- Inputs: `input-cpf`, `input-telefone`, `input-cep` - Specialized input components
- Capture: `captura-foto-step`, `geolocation-step` - Photo and location capture
- Renderer: `PdfPreviewDynamic` - PDF rendering component
- Signature: `canvas-assinatura` - Signature capture canvas
- Utils: `markdown-renderer` - Markdown processing utilities
- Form: `form-step-layout`, `dynamic-form-step` - Form layout and dynamic rendering

**Notes on API Routes:**

- `/api/assinatura-digital/forms/verificar-cpf` - CPF verification
- `/api/assinatura-digital/forms/save-client` - Client data save/update
- `/api/assinatura-digital/utils/get-client-ip` - Client IP retrieval
- `/api/assinatura-digital/signature/preview` - PDF preview generation
- `/api/assinatura-digital/signature/finalizar` - Final PDF generation and signature

**Notes on Constants:**

- `API_ROUTES` - Centralized API endpoint paths
- `ESTADOS_CIVIS` - Brazilian marital status options
- `NACIONALIDADES` - Nationality options

**Notes on Validation Schemas:**

- `verificarCPF.schema` - CPF validation schema
- `dadosPessoais.schema` - Personal data validation schema

## Editor de Templates (`editor/`)

Componentes base para o editor visual de templates PDF.

### CreateTemplateForm

Formulário para criar novos templates com informações básicas.

**Props:**

- `pdfFile: File` - Arquivo PDF a ser usado como template
- `onSubmit: (data) => Promise<void>` - Callback ao criar template
- `onCancel?: () => void` - Callback ao cancelar

**Features:**

- Campos: nome (obrigatório), descrição, conteúdo markdown
- Validação de markdown (máximo 100KB, deve conter variáveis)
- Preview de markdown com ReactMarkdown
- Documentação inline de variáveis disponíveis
- Integração com MarkdownRichTextEditorDialog

### PdfCanvasArea

Área principal do editor onde o PDF é exibido e os campos são posicionados.

**Props:**

- `canvasRef`, `canvasSize`, `zoom` - Controle do canvas
- `pdfUrl`, `currentPage`, `totalPages` - Controle do PDF
- `fields` - Array de campos a renderizar
- `onFieldClick`, `onFieldMouseDown`, `onResizeMouseDown` - Handlers de interação
- `onOpenProperties`, `onDuplicateField`, `onDeleteField` - Ações de campo
- `onAddTextField`, `onAddImageField`, `onAddRichTextField` - Adicionar campos

**Features:**

- Renderização de PDF como fundo usando PdfPreview
- Overlay de campos com drag-and-drop
- 8 resize handles por campo (4 cantos + 4 bordas)
- Context menu com ações (editar, duplicar, deletar, zoom)
- Suporte a 3 tipos de campo: texto, imagem, texto composto
- Avisos visuais para campos com altura insuficiente
- Filtro automático de campos por página

### PropertiesPopover

Popover lateral para editar propriedades de campos selecionados.

**Props:**

- `trigger: React.ReactNode` - Elemento que abre o popover
- `open`, `onOpenChange` - Controle de estado
- `selectedField` - Campo selecionado
- `onUpdateField`, `onDeleteField` - Callbacks de ação

**Features:**

- Seletor de variável com autocomplete (Command component)
- Variáveis agrupadas por categoria (Cliente, Ação, Sistema, Assinatura)
- Seções colapsáveis: Informações gerais, Posicionamento, Estilo
- Campos de posição (X, Y, width, height)
- Campos de estilo (tamanho_fonte, fonte) para texto
- Atualização automática do nome ao selecionar variável

### TemplateInfoPopover

Popover lateral para editar metadados do template.

**Props:**

- `trigger: React.ReactNode` - Elemento que abre o popover
- `open`, `onOpenChange` - Controle de estado
- `template?: Template` - Template a editar (opcional para criação)
- `onUpdate: (updates) => Promise<void>` - Callback de atualização
- `isCreating?: boolean` - Modo criação
- `pdfFile?: File` - Arquivo PDF (modo criação)

**Features:**

- Campos: nome, descrição, status, conteúdo markdown
- Suporte a dois modos: criação e edição
- Preview de markdown em dialog separado
- Salvamento direto de markdown no backend
- Validação de markdown
- Integração com API `/api/assinatura-digital/templates`

### ReplacePdfDialog

Dialog para substituir o arquivo PDF de um template.

**Props:**

- `open`, `onOpenChange` - Controle de estado
- `templateId: string | number` - ID do template
- `onSuccess: () => void` - Callback após sucesso

**Features:**

- Drag-and-drop usando react-dropzone
- Validação de arquivo (tipo PDF, 10KB-10MB)
- Preview do novo PDF antes de confirmar
- Upload via FormData
- Cleanup automático de blob URLs
- Integração com API `/api/assinatura-digital/templates/:id/replace-pdf`

## Preview de PDF (`pdf/`)

Componentes para renderizar PDFs no editor.

### PdfPreview

Componente base para renderizar PDFs usando react-pdf.

**Props:** Ver `PdfPreviewProps` em `@/types/assinatura-digital/pdf-preview.types`

**Features:**

- Dois modos: `default` (com controles) e `background` (apenas PDF)
- Controles de zoom (0.5x a 3.0x)
- Navegação de páginas
- Estados de loading e erro
- Suporte a dimensões fixas
- Renderização opcional de text layer e annotation layer

### PdfPreviewDynamic

Wrapper dinâmico do PdfPreview para evitar problemas de SSR.

**Props:** Mesmas do PdfPreview

**Uso:** Sempre use este componente ao invés do PdfPreview diretamente.

## Validação (`lib/assinatura-digital/validation/`)

### markdown.ts

Utilitários para validar conteúdo Markdown de templates.

**Funções:**

- `validateMarkdownContent(content)` - Validação completa com XSS
- `normalizeMarkdownContent(content)` - Normalização (CRLF→LF)
- `validateMarkdownForForm(content)` - Validação simplificada

**Constantes:**

- `MAX_MARKDOWN_CHARS = 100000` - Limite de 100KB

## Template Editor Components

### FieldMappingEditor

Main visual PDF template editor with drag-and-drop field placement, zoom controls, autosave, and test preview generation.

**Location:** `components/assinatura-digital/editor/FieldMappingEditor.tsx`

**Features:**

- Visual PDF template editing with overlay canvas
- Drag-and-drop field placement (text, image, signature, rich text)
- Field resize with 8 handles (corners + edges)
- Zoom controls (50%-200%, responsive defaults)
- Multi-page PDF navigation
- Autosave every 5 seconds
- Test preview generation with mock data
- Toggle between original template and filled preview
- Navigation guards for unsaved changes
- Create mode with PDF upload dropzone
- Keyboard shortcuts (Delete, Escape, Arrow keys)
- Floating draggable toolbar (desktop) and horizontal toolbar (mobile)

**Props:**

```typescript
interface FieldMappingEditorProps {
  template: Template; // Template to edit (from API or new)
  onCancel?: () => void; // Callback when user cancels editing
  mode?: "edit" | "create"; // Edit existing or create new template
}
```

**Usage Example:**

```typescript
import { FieldMappingEditor } from '@/components/assinatura-digital/editor';
import { useRouter } from 'next/navigation';

function TemplateEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);

  useEffect(() => {
    // Fetch template from API
    fetch(`/api/assinatura-digital/templates/${params.id}`)
      .then(res => res.json())
      .then(data => setTemplate(data.data));
  }, [params.id]);

  if (!template) return <div>Carregando...</div>;

  return (
    <FieldMappingEditor
      template={template}
      mode="edit"
      onCancel={() => router.push('/assinatura-digital/templates')}
    />
  );
}
```

**Create Mode Example:**

```typescript
// For new template creation
const emptyTemplate: Template = {
  id: '',
  template_uuid: '',
  nome: '',
  descricao: null,
  arquivo_original: '',
  arquivo_nome: '',
  arquivo_tamanho: 0,
  status: 'rascunho',
  versao: 1,
  ativo: true,
  campos: [],
  conteudo_markdown: null,
  criado_por: null,
  criado_em: new Date().toISOString(),
  atualizado_em: new Date().toISOString(),
};

return (
  <FieldMappingEditor
    template={emptyTemplate}
    mode="create"
    onCancel={() => router.back()}
  />
);
```

**API Integration:**

- **GET** `/api/assinatura-digital/templates/[id]` - Load template
- **PUT** `/api/assinatura-digital/templates/[id]` - Save changes (autosave)
- **PUT** `/api/assinatura-digital/templates/[id]/replace-pdf` - Replace PDF
- **POST** `/api/assinatura-digital/templates/[id]/preview-test` - Generate test PDF
- **POST** `/api/assinatura-digital/templates` - Create new template (create mode)

**Keyboard Shortcuts:**

- `Delete` - Delete selected field
- `Escape` - Deselect field / cancel drag
- `Arrow Keys` - Move selected field (1px increments)
- `Shift + Arrow Keys` - Move selected field (10px increments)

**Field Types Supported:**

- `texto` - Single-line text field
- `assinatura` - Signature image field
- `foto` - Photo image field
- `texto_composto` - Rich text field with variables

**Dependencies:**

- `react-dropzone` (v14.3.8) - PDF upload in create mode
- `react-pdf` (v9.2.1) - PDF rendering
- `pdfjs-dist` (v4.9.155) - PDF.js worker
- All editor subcomponents from ASSINATURA-DIGITAL-007/008

---

### ToolbarButtons & ToolbarButtonsMobile

Toolbar components for FieldMappingEditor (desktop vertical and mobile horizontal layouts).

**Location:**

- `components/assinatura-digital/editor/ToolbarButtons.tsx` (desktop)
- `components/assinatura-digital/editor/ToolbarButtonsMobile.tsx` (mobile)

**Features:**

- Editor mode selection (select, add text, add image, add rich text)
- Zoom controls with percentage display
- Page navigation for multi-page PDFs
- Properties/template info/PDF replacement dialogs
- Save/cancel actions
- Test preview generation
- Preview toggle (original vs filled)

**Props:** Both components share identical props interface (23 props total) - see FieldMappingEditor source for full list.

**Usage:** Automatically used by FieldMappingEditor - not intended for standalone use.

---

## Schema Builder Components (`schema-builder/`)

Base components for building dynamic form schemas with drag-and-drop interface.

### FieldPalette

Draggable palette of form field types organized by categories.

**Location:** `components/assinatura-digital/schema-builder/FieldPalette.tsx`

**Features:**

- 11 field types across 5 categories:
  - **Texto:** text, email, textarea
  - **Números:** number
  - **Datas:** date
  - **Seleção:** select, radio, checkbox
  - **Formatados BR:** CPF, CNPJ, phone, CEP (with BR badges)
- Search filtering across all fields
- Collapsible categories with expand/collapse state
- Tooltips with field descriptions
- Drag-and-drop using @dnd-kit/core
- Empty state when no fields match search

**Usage:**

```typescript
import { FieldPalette } from '@/components/assinatura-digital/schema-builder';

function FormBuilder() {
  return (
    <div className="grid grid-cols-[300px_1fr] gap-4">
      <FieldPalette />
      {/* SchemaCanvas goes here */}
    </div>
  );
}
```

**Props:** None - component is self-contained.

**Drag Data Format:**

```typescript
{
  id: `palette-${fieldType}`,
  data: { type: FormFieldType, label: string }
}
```

---

### SchemaCanvas

Droppable canvas where fields are organized into sections with drag-and-drop reordering.

**Location:** `components/assinatura-digital/schema-builder/SchemaCanvas.tsx`

**Features:**

- Droppable sections using @dnd-kit/core
- Sortable fields within sections using @dnd-kit/sortable
- Field selection states with visual feedback
- Drag-over states for sections
- Edit/duplicate/delete actions with tooltips
- Empty states for no sections and no fields
- Badge indicators (Obrigatório, Condicional, N opções)
- Grip handle for drag-and-drop
- Section management (add, edit, delete)

**Usage:**

```typescript
import { SchemaCanvas } from '@/components/assinatura-digital/schema-builder';
import type { DynamicFormSchema } from '@/types/assinatura-digital';

function FormBuilder() {
  const [schema, setSchema] = useState<DynamicFormSchema>({
    sections: []
  });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  return (
    <SchemaCanvas
      schema={schema}
      selectedFieldId={selectedFieldId}
      selectedSectionId={selectedSectionId}
      onFieldSelect={setSelectedFieldId}
      onSectionSelect={setSelectedSectionId}
      onFieldDelete={(id) => {/* delete field */}}
      onFieldDuplicate={(id) => {/* duplicate field */}}
      onSectionAdd={() => {/* add section */}}
      onSectionEdit={(id) => {/* edit section */}}
      onSectionDelete={(id) => {/* delete section */}}
    />
  );
}
```

**Props:**

- `schema: DynamicFormSchema` - Current form schema
- `selectedFieldId: string | null` - ID of selected field
- `selectedSectionId: string | null` - ID of selected section
- `onFieldSelect: (fieldId: string) => void` - Field selection handler
- `onSectionSelect: (sectionId: string) => void` - Section selection handler
- `onFieldDelete: (fieldId: string) => void` - Field deletion handler
- `onFieldDuplicate: (fieldId: string) => void` - Field duplication handler
- `onSectionAdd: () => void` - Section addition handler
- `onSectionEdit: (sectionId: string) => void` - Section edit handler
- `onSectionDelete: (sectionId: string) => void` - Section deletion handler

**Drag Data Format:**

```typescript
// For fields
{
  id: fieldId,
  data: { type: 'field', sectionId: string, fieldId: string }
}

// For sections
{
  id: sectionId,
  data: { type: 'section', sectionId: string }
}
```

**Helper Function:**

```typescript
import { getFieldIcon } from "@/components/assinatura-digital/schema-builder";

const Icon = getFieldIcon(FormFieldType.CPF); // Returns CreditCard icon
```
