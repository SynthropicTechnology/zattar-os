# Migration Guide - Novo Fluxo de Upload (v2.0)

## Visão Geral

Esta migração refatora o fluxo de upload e configuração de documentos para assinatura digital, introduzindo novos componentes modulares e melhorando a experiência do usuário.

## Breaking Changes

### 1. Componente `AssinaturaFluxoForm` Removido

**Status**: ❌ REMOVIDO

**Arquivo**: `src/features/assinatura-digital/components/assinatura-fluxo-form.tsx`

**Motivo**: Componente monolítico substituído por componentes modulares (`DocumentUploadDropzone`, `SignatureWorkflowStepper`, `FloatingSidebar`).

**Migração**:

#### Antes

```tsx
import { AssinaturaFluxoForm } from "@/features/assinatura-digital";

function MyPage() {
  return (
    <AssinaturaFluxoForm
      segmentoId={1}
      formularioId={2}
      onComplete={(data) => console.log(data)}
    />
  );
}
```

#### Depois

```tsx
import {
  DocumentUploadDropzone,
  SignatureWorkflowStepper,
  FieldMappingEditor,
} from "@/features/assinatura-digital";
import { useFormularioStore } from "@/features/assinatura-digital/store";

function MyPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { etapaAtual, setContexto } = useFormularioStore();

  useEffect(() => {
    setContexto(1, 2); // segmentoId, formularioId
  }, []);

  return (
    <>
      <SignatureWorkflowStepper />

      {etapaAtual === 0 && (
        <DocumentUploadDropzone
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onUploadSuccess={(url, name) => {
            console.log("Uploaded:", url, name);
          }}
        />
      )}

      {etapaAtual === 1 && <FieldMappingEditor />}
    </>
  );
}
```

---

### 2. Store `formulario-store` Atualizado

**Novos campos**:

```typescript
interface FormularioState {
  // ... campos existentes

  // NOVOS
  documentoUrl?: string | null;
  documentoNome?: string | null;
}
```

**Novos métodos**:

```typescript
interface FormularioStore {
  // ... métodos existentes

  // NOVOS
  proximaEtapa: () => void;
  etapaAnterior: () => void;
  getTotalSteps: () => number;
  getCurrentStepConfig: () => StepConfig | undefined;
}
```

**Migração**:

#### Antes

```typescript
const { etapaAtual, setEtapaAtual } = useFormularioStore();

// Avançar manualmente
setEtapaAtual(etapaAtual + 1);
```

#### Depois

```typescript
const { etapaAtual, proximaEtapa, etapaAnterior } = useFormularioStore();

// Avançar com validação automática
proximaEtapa();

// Voltar
etapaAnterior();
```

---

### 3. Rotas Atualizadas

#### `/assinatura-digital/documentos/novo`

**Antes**: Renderizava `AssinaturaFluxoForm` diretamente

**Depois**: Usa `DocumentUploadDropzone` + `SignatureWorkflowStepper`

**Arquivo**: `src/app/app/assinatura-digital/documentos/novo/page.tsx`

```tsx
// ANTES
export default function NovoDocumentoPage() {
  return <AssinaturaFluxoForm segmentoId={1} formularioId={2} />;
}

// DEPOIS
export default function NovoDocumentoPage() {
  return (
    <PageShell title="Novo Documento">
      <SignatureWorkflowStepper />
      <DocumentUploadDropzone
        open={true}
        onOpenChange={() => {}}
        onUploadSuccess={(url, name) => {
          // Handle success
        }}
      />
    </PageShell>
  );
}
```

#### `/assinatura-digital/documentos/editar/[uuid]`

**Antes**: Usava editor antigo sem sidebar

**Depois**: Usa `FieldMappingEditor` refatorado com `FloatingSidebar`

---

### 4. Props Renomeadas

#### `DocumentUploadDropzone`

| Antes          | Depois            | Motivo                 |
| -------------- | ----------------- | ---------------------- |
| `onSuccess`    | `onUploadSuccess` | Clareza                |
| `maxSize`      | (removido)        | Hardcoded 10MB         |
| `allowedTypes` | (removido)        | Hardcoded PDF/DOCX/PNG |

---

### 5. Hooks Customizados

**Novos hooks**:

- `use-document-upload.ts` - Lógica de upload
- `use-workflow-navigation.ts` - Navegação entre etapas
- `use-signers.ts` - Gerenciamento de signatários

**Uso**:

```typescript
import { useDocumentUpload } from "@/features/assinatura-digital/components/upload/hooks";

const { isUploading, progress, uploadFile, resetUpload } = useDocumentUpload({
  onSuccess: () => console.log("Success"),
  onError: (err) => console.error(err),
});
```

---

## Checklist de Migração

- [ ] Substituir `AssinaturaFluxoForm` por novos componentes
- [ ] Atualizar imports de `formulario-store`
- [ ] Atualizar rotas (`novo`, `editar/[uuid]`)
- [ ] Atualizar testes (unit, integration, E2E)
- [ ] Validar acessibilidade (ARIA labels)
- [ ] Testar responsividade (mobile/desktop)
- [ ] Atualizar documentação interna

---

## Rollback

Se necessário reverter:

```bash
git revert <commit-hash>
```

**Nota**: O componente antigo `assinatura-fluxo-form.tsx` foi removido. Para rollback completo, restaurar de backup ou commit anterior.

---

## Suporte

Para dúvidas ou problemas:

- Consultar `README.md` dos componentes
- Abrir issue no repositório
- Contatar equipe de desenvolvimento
