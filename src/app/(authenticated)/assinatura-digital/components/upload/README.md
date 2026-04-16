# DocumentUploadDropzone

Componente de upload de documentos para assinatura digital, inspirado no protótipo SignFlow e adaptado à identidade visual Zattar.

## Features

- ✅ Layout split responsivo (painel de contexto + dropzone)
- ✅ Drag & drop com validação de tipo e tamanho
- ✅ Suporte para PDF, DOCX, PNG (até 10MB)
- ✅ Progress bar durante upload
- ✅ Integração com Supabase Storage
- ✅ Feedback visual completo (loading, success, error)
- ✅ Integração com formulário multi-step (Zustand)

## Uso Básico

```tsx
import { DocumentUploadDropzone } from "@/features/assinatura-digital/components/upload";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DocumentUploadDropzone
      open={isOpen}
      onOpenChange={setIsOpen}
      onUploadSuccess={(url, name) => {
        console.log("Uploaded:", url, name);
      }}
    />
  );
}
```

## Props

| Prop              | Tipo                                  | Obrigatório | Descrição                         |
| ----------------- | ------------------------------------- | ----------- | --------------------------------- |
| `open`            | `boolean`                             | ✅          | Controla visibilidade do modal    |
| `onOpenChange`    | `(open: boolean) => void`             | ✅          | Callback ao abrir/fechar          |
| `onUploadSuccess` | `(url: string, name: string) => void` | ❌          | Callback após upload bem-sucedido |

## Validações

### Tipos de arquivo permitidos

- PDF (`.pdf`)
- DOCX (`.docx`)
- PNG (`.png`)

### Tamanho máximo

- 10MB por arquivo

### Mensagens de erro

- **Tipo inválido**: "Tipo de arquivo não suportado. Use PDF, DOCX ou PNG."
- **Tamanho excedido**: "Arquivo muito grande. O limite é 10MB."
- **Erro genérico**: "Erro ao processar o arquivo."

## Integração com Store

O componente integra automaticamente com `formulario-store` (Zustand):

```typescript
// Salva URL e nome do documento
setDadosContrato({
  documentoUrl: url,
  documentoNome: name,
});

// Avança para próxima etapa
proximaEtapa();
```

## Customização

### Cores (Identidade Zattar)

- Primary: `bg-primary` (roxo Zattar)
- Hover: `hover:bg-primary/90`
- Border: `border-primary`

### Layout Responsivo

- **Desktop (lg+)**: Layout split 5/7 (contexto/dropzone)
- **Mobile (< lg)**: Stack vertical

## Testes

```bash
# Testes unitários
npm test -- document-upload-dropzone.test.tsx

# Testes E2E
npm run test:e2e -- new-workflow.spec.ts
```

## Acessibilidade

- ✅ ARIA labels para screen readers
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus management
- ✅ Contraste WCAG AA

## Troubleshooting

### Upload falha silenciosamente

- Verificar permissões do Supabase Storage
- Validar variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)

### Progress bar não aparece

- Verificar que `isUploading` está sendo atualizado no hook `use-document-upload`

### Modal não fecha após upload

- Verificar que `onOpenChange(false)` está sendo chamado em `saveAndAdvance`
