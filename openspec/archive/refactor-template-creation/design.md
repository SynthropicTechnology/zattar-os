# Design: Refatorar Sistema de Criação de Templates

## Context

O sistema de criação de templates de assinatura digital apresenta problemas de manutenibilidade devido a:
- Código monolítico (466 linhas em um arquivo)
- Duplicação de componentes (3 implementações diferentes)
- Não conformidade com padrões do projeto (FSD, DialogFormShell)
- Lógica de upload inline sem reutilização

A refatoração visa alinhar o código com os padrões estabelecidos no projeto Synthropic.

## Goals / Non-Goals

### Goals
- Consolidar componentes duplicados em solução única
- Seguir arquitetura Feature-Sliced Design (FSD)
- Usar `DialogFormShell` conforme padrão de outros módulos
- Separar componentes de apresentação e lógica de negócio
- Melhorar testabilidade e manutenibilidade
- Manter compatibilidade com fluxos existentes

### Non-Goals
- Adicionar novas funcionalidades de templates
- Modificar lógica de negócio do backend
- Alterar estrutura de banco de dados
- Refatorar outros módulos de assinatura digital

## Decisions

### Decision 1: Usar DialogFormShell para Criação de Templates

**O que**: Substituir página de criação por diálogo modal usando `DialogFormShell`.

**Por que**:
- Padrão já estabelecido em outros módulos (Partes, Processos, Contratos)
- Melhor UX - usuário permanece na listagem
- Reduz código de navegação e breadcrumbs
- Consistência visual com resto do sistema

**Alternativas consideradas**:
- Manter página separada: Rejeitado - inconsistente com padrões do projeto
- Drawer lateral: Rejeitado - formulário extenso demais para drawer

### Decision 2: Estrutura de Componentes em 3 Níveis

**O que**: Separar em `TemplateCreateDialog`, `TemplateFormFields`, e `PdfUploadField`.

**Por que**:
- Single Responsibility Principle
- `PdfUploadField` pode ser reutilizado em outros contextos
- `TemplateFormFields` isolado facilita testes
- `TemplateCreateDialog` orquestra sem conhecer detalhes de campos

**Estrutura de dependências**:
```
TemplateCreateDialog
  └── TemplateFormFields
        ├── MarkdownRichTextEditor (existente)
        └── PdfUploadField (novo)
```

### Decision 3: Validação Centralizada com Zod

**O que**: Consolidar schemas de validação em `types/domain.ts`.

**Por que**:
- Schema único para frontend e backend
- Inferência de tipos TypeScript automática
- Mensagens de erro consistentes
- Facilita manutenção

**Schemas**:
```typescript
// Validação base de template
export const createTemplateSchema = z.object({...});

// Validação específica para upload PDF
export const uploadPdfSchema = z.object({
  arquivo: z.instanceof(File)
    .refine(f => f.type === 'application/pdf', 'Apenas PDF')
    .refine(f => f.size <= 10 * 1024 * 1024, 'Máximo 10MB'),
});

// Wrapper para UI (adiciona campos de estado)
export const templateFormSchema = createTemplateSchema.extend({
  tipoTemplate: z.enum(['pdf', 'markdown']),
});
```

### Decision 4: Props Interface Explícita

**O que**: Definir interfaces TypeScript explícitas para todos os componentes.

**Por que**:
- Documentação inline
- Facilita IntelliSense
- Garante contrato entre componentes

**Interfaces principais**:
```typescript
interface PdfUploadFieldProps {
  value?: { url: string; nome: string; tamanho: number };
  onChange: (file: { url: string; nome: string; tamanho: number } | null) => void;
  disabled?: boolean;
  error?: string;
}

interface TemplateFormFieldsProps {
  form: UseFormReturn<CreateTemplateInput>;
  tipoTemplate: 'pdf' | 'markdown';
  segmentos: Segmento[];
  isSubmitting: boolean;
}

interface TemplateCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
```

## Risks / Trade-offs

### Risk: Breaking Change nas Rotas
- **Risco**: URLs antigos deixam de funcionar
- **Mitigação**: Redirecionar `/templates/new/*` para listagem por período de transição

### Risk: Complexidade de Estado
- **Risco**: Estado de upload e formulário podem conflitar
- **Mitigação**: Upload gerencia próprio estado, comunica via onChange

### Trade-off: Modal vs Página
- **Prós**: Melhor UX, consistência com projeto
- **Contras**: Menos espaço para editor Markdown grande
- **Decisão**: Usar `maxWidth="2xl"` no DialogFormShell para acomodar editor

## Migration Plan

### Fase 1: Criar Novos Componentes (sem remover antigos)
1. Criar `PdfUploadField`
2. Criar `TemplateFormFields`
3. Criar `TemplateCreateDialog`
4. Integrar na listagem em paralelo ao botão atual

### Fase 2: Validação
5. Testar fluxo completo com novos componentes
6. Validar responsividade
7. Coletar feedback

### Fase 3: Remoção
8. Remover páginas antigas em `/templates/new/`
9. Remover componentes duplicados
10. Atualizar barrel exports

### Rollback
- Se problemas críticos: reverter para páginas antigas (ainda disponíveis até Fase 3)
- Componentes novos podem coexistir com antigos durante transição

## Open Questions

1. **Editor Markdown**: Manter `MarkdownRichTextEditor` atual ou oportunidade de simplificar?
   - **Decisão preliminar**: Manter atual, refatoração do editor é escopo separado

2. **Cache de Segmentos**: Buscar segmentos a cada abertura do diálogo ou cachear?
   - **Decisão preliminar**: Buscar a cada abertura (dados podem mudar), usar SWR se performance for problema

3. **Preview de PDF**: Mostrar thumbnail do PDF após upload?
   - **Decisão preliminar**: Mostrar apenas nome e tamanho inicialmente, preview é escopo futuro

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     Templates Page (Server)                      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 client-page.tsx (Client)                     │ │
│  │                                                               │ │
│  │  ┌─────────────┐    ┌──────────────────────────────────────┐ │ │
│  │  │   Table     │    │    TemplateCreateDialog              │ │ │
│  │  │  (lista)    │    │    ┌──────────────────────────────┐  │ │ │
│  │  │             │    │    │   DialogFormShell             │  │ │ │
│  │  │ [+ Novo]────┼────┼───▶│   ┌────────────────────────┐  │  │ │ │
│  │  │             │    │    │   │ TemplateFormFields     │  │  │ │ │
│  │  └─────────────┘    │    │   │  ┌──────┐  ┌────────┐  │  │  │ │ │
│  │                     │    │   │  │Editor│  │PdfUpload│  │  │  │ │ │
│  │                     │    │   │  └──────┘  └────────┘  │  │  │ │ │
│  │                     │    │   └────────────────────────┘  │  │ │ │
│  │                     │    └──────────────────────────────┘  │ │ │
│  │                     └──────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Server Actions                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │listarSegmentos  │  │ criarTemplate   │  │ uploadArquivo   │  │
│  │     Action      │  │     Action      │  │     Action      │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼───────────────────┼───────────────────┼─────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AssinaturaDigitalService                       │
└─────────────────────────────────────────────────────────────────┘
```

## Estrutura de Arquivos Final

```
src/features/assinatura-digital/
├── components/
│   ├── templates/
│   │   ├── template-create-dialog.tsx    # Novo
│   │   ├── template-form-fields.tsx      # Novo
│   │   └── __tests__/
│   │       ├── template-create-dialog.test.tsx
│   │       └── template-form-fields.test.tsx
│   └── editor/
│       ├── pdf-upload-field.tsx          # Novo
│       ├── MarkdownRichTextEditor.tsx    # Existente
│       └── __tests__/
│           └── pdf-upload-field.test.tsx
├── types/
│   └── domain.ts                         # Atualizar schemas
├── actions.ts                            # Existente
├── service.ts                            # Existente
└── index.ts                              # Atualizar exports

src/app/(dashboard)/assinatura-digital/templates/
├── page.tsx                              # Mantém
├── client-page.tsx                       # Atualizar
├── client-loader.tsx                     # Mantém
└── new/                                  # REMOVER
```
